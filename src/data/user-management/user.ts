import "server-only";
import { prisma } from "@/lib/prisma";
import { UpdateUserType, UserType } from "@/lib/schemas/user-management/user";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { GetUsersParams, Manager } from "@/lib/types/user";

import { sendNotification } from "@/lib/services/notification/notificationService";
import { NotificationType } from "@prisma/client";

// Create user in database and Supabase Auth
export async function createUser(userData: UserType, currentUser: string) {
  let createdAuthUserId: string | null = null;
  const roleWithoutManager = ["MANAGER", "ACCOUNT_OWNER"];

  try {
    // 🧭 1. Validate manager requirements
    if (!roleWithoutManager.includes(userData.role) && !userData.managerId) {
      return { error: "Employee must have a manager assigned" };
    }

    if (roleWithoutManager.includes(userData.role)) {
      const hasManagerAlready = await prisma.userDetails.findFirst({
        where: {
          department: userData.department,
          role: userData.role,
        },
        select: { id: true },
      });

      if (hasManagerAlready) {
        return {
          error: "This department already has a manager/account owner assigned",
        };
      }
    }

    // 🧭 2. Validate manager existence and department
    if (userData.managerId && userData.managerId !== "none") {
      const isValidManager = await prisma.userDetails.findFirst({
        where: {
          id: userData.managerId,
          department: userData.department,
          role: "MANAGER",
        },
        select: { id: true },
      });

      if (!isValidManager)
        return {
          error: "Please select a valid manager in the same department",
        };
    }

    // 🧭 3. Create Supabase Auth user
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        role: userData.role,
        department: userData.department,
        position: userData.position,
      },
      email_confirm: true,
    });

    if (error) return { error: error.message ?? "Failed to create auth user" };

    createdAuthUserId = user.user?.id;
    if (!createdAuthUserId)
      return { error: "Auth user creation returned no ID" };

    // 🧭 4. Create database user and send notifications (transaction)
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.userDetails.create({
        data: {
          id: createdAuthUserId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          addedById: currentUser,
          managerId: userData.managerId === "none" ? null : userData.managerId,
        },
      });

      // Notify admins in department
      const departmentAdmins = await tx.userDetails.findMany({
        where: {
          department: userData.department,
          role: { in: ["ADMIN", "ACCOUNT_OWNER", "MANAGER"] },
        },
      });

      await Promise.all(
        departmentAdmins.map((admin) =>
          sendNotification(
            {
              userId: admin.id,
              type: NotificationType.USER_ADDED,
              payload: {
                userName: newUser.name,
                department: newUser.department,
              },
              url: `/user-management/${newUser.id}`,
            },
            tx
          )
        )
      );

      // Notify employee
      await sendNotification(
        {
          userId: newUser.id,
          type: NotificationType.USER_ADDED,
          payload: {
            forUser: true,
            department: newUser.department,
          },
          url: `/`,
        },
        tx
      );

      return newUser;
    });

    return { data: result };
  } catch (error) {
    console.warn("Create user failed:", error);

    // 🧹 Clean up Supabase user if something failed
    if (createdAuthUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      } catch (deleteError) {
        console.error("Failed to delete auth user:", deleteError);
      }
    }

    return { error: "Something went wrong in creating user" };
  }
}

export async function updateUser(userData: UpdateUserType) {
  // MANAGER ROLE VALIDATION
  const roleWithoutManager = ["MANAGER", "ACCOUNT_OWNER"];
  if (!roleWithoutManager.includes(userData.role) && !userData.managerId) {
    return { error: "Employee must have a manager assigned" };
  } else if (roleWithoutManager.includes(userData.role)) {
    // CHECK IF THERE IS A MANAGER ALREADY FOR CERTAIN DEPARTMENT
    const hasManagerAlready = await prisma.userDetails.findFirst({
      where: {
        department: userData.department,
        role: userData.role,
        NOT: {
          id: userData.id,
        },
      },
      select: {
        id: true,
      },
    });
    if (hasManagerAlready)
      return {
        error: "This department already has a manager/account owner assigned",
      };
  }

  if (userData.role === "TEAM_LEAD") {
    const existingTeamLead = await prisma.userDetails.findFirst({
      where: {
        department: userData.department,
        role: "TEAM_LEAD",
        NOT: { id: userData.id },
      },
      select: { id: true },
    });

    if (existingTeamLead) {
      return {
        error: "This department already has a team lead assigned.",
      };
    }
  }

  // VALIDATE MANAGER IF PROVIDED
  if (userData.managerId && userData.managerId !== "none") {
    const isValidManager = await prisma.userDetails.findFirst({
      where: {
        id: userData.managerId,
        department: userData.department,
        role: "MANAGER",
      },
      select: { id: true },
    });
    if (!isValidManager) {
      return {
        error: "Please select a valid manager from the same department",
      };
    }
  }

  try {
    // UPDATE SUPABASE AUTH USER
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      {
        email: userData.email,
        user_metadata: {
          role: userData.role,
          department: userData.department,
          position: userData.position,
        },
      }
    );

    if (authError)
      return { error: authError.message ?? "Failed to update user" };
    // UPDATE ACTUAL DATABASE
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.userDetails.update({
        where: { id: userData.id },
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          managerId: userData.managerId === "none" ? null : userData.managerId,
        },
      });

      return updatedUser;
    });
    console.log("updated data result", result);
    return { data: result };
  } catch (err) {
    console.log("error message", err);
    return { error: "Something went wrong updating user" };
  }
}

export async function getUsers(params: GetUsersParams) {
  try {
    const page = params.page ?? 1;
    const limit = params.limit ?? 5;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { position: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.role && params.role !== "ALL") {
      where.role = params.role;
    }
    if (params.department && params.department !== "ALL") {
      where.department = params.department;
    }

    const [users, total] = await Promise.all([
      prisma.userDetails.findMany({
        where,
        include: {
          manager: { select: { id: true, name: true } },
          addedBy: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.userDetails.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch {
    return { error: "Something went wrong in saving" };
  }
}

export async function deleteUser(id: string) {
  try {
    const hasAssignedLicense = await prisma.licenseAssignment.count({
      where: { status: "ACTIVE", userId: id },
    });

    if (hasAssignedLicense) {
      return {
        error:
          "Unable to delete this user because they still have active license assignments.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete related notifications (to avoid FK constraint)
      await tx.notification.deleteMany({ where: { userId: id } });

      // Delete user record
      await tx.userDetails.delete({ where: { id } });
    });

    // Delete from Supabase Auth (after successful DB transaction)
    const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(
      id
    );

    if (supabaseError) {
      // Optional rollback if Supabase deletion fails
      console.error("Supabase delete error:", supabaseError);
      return {
        error: `User deleted in DB, but failed to delete in Supabase: ${supabaseError.message}`,
      };
    }

    return { data: result };
  } catch (error: any) {
    console.error("Delete user failed:", error);

    // Handle specific Prisma error codes
    if (error.code === "P2003") {
      return {
        error:
          "Cannot delete this user because there are still related records (e.g. notifications).",
      };
    }

    return { error: "Something went wrong while deleting the user." };
  }
}

export async function getUserById(id: string) {
  return prisma.userDetails.findUnique({
    where: { id },
    include: {
      manager: true,
      addedBy: true,
    },
  });
}

export async function getManagers(): Promise<Manager[]> {
  return prisma.userDetails.findMany({
    where: { role: "MANAGER" },
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });
}
