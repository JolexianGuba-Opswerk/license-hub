import "server-only";
import { prisma } from "@/lib/prisma";
import { UpdateUserType, UserType } from "@/lib/schemas/user-management/user";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { GetUsersParams, Manager } from "@/lib/types/user";
import { unstable_cache } from "next/cache";
import { sendNotification } from "@/lib/services/notification/notificationService";
import { NotificationType } from "@prisma/client";

// Create user in database and Supabase Auth
export async function createUser(userData: UserType, currentUser: string) {
  // IF MANAGER IS NOT ACCOUNT OWNER AND MANAGER
  const roleWithoutManager = ["MANAGER", "ACCOUNT_OWNER"];
  try {
    if (!roleWithoutManager.includes(userData.role) && !userData.managerId) {
      return { error: "Employee must have a manager assigned" };
    } else if (roleWithoutManager.includes(userData.role)) {
      // CHECK IF THERE IS MANAGER ALREADY FOR A CURRENT DEPARTMENT
      const hasManagerAlready = await prisma.userDetails.findFirst({
        where: {
          department: userData.department,
          role: userData.role,
        },
        select: {
          id: true,
        },
      });
      if (hasManagerAlready)
        return {
          error:
            "This department already has a manager/account owner and team lead  assigned",
        };
    }

    // CHECK IF MANAGER EXIST AND IF THEY ARE IN SAME DEPARTMENT
    if (userData?.managerId && userData.managerId !== "none") {
      const isValidManager = await prisma.userDetails.findFirst({
        where: {
          id: userData.managerId,
          department: userData.department,
          role: "MANAGER",
        },
        select: {
          id: true,
        },
      });

      if (!isValidManager)
        return {
          error: "Please select a valid manager from the same department",
        };
    }

    // SUPABASE AUTH USER CREATION
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

    if (error) {
      return { error: error?.message ?? "Something went wrong!" };
    }

    // ACTUAL DATABASE USER CREATION WITH TRANSACTION WRAP
    const supabaseUserId = user.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.userDetails.create({
        data: {
          id: supabaseUserId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          addedById: currentUser,
          managerId: userData.managerId === "none" ? null : userData.managerId,
        },
      });

      // Notify each department's Admin (ADMIN, ACCOUNT_OWNERS, MANAGER)
      const departmentAdmins = await tx.userDetails.findMany({
        where: {
          department: userData.department,
          role: {
            in: ["ADMIN", "ACCOUNT_OWNER", "MANAGER"],
          },
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

      // Notification for employee side
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
    });

    return { data: result };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong in creating" };
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

  if (authError) return { error: authError.message ?? "Failed to update user" };

  // UPDATE ACTUAL DATABASE
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.userDetails.update({
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
    });

    return { data: result };
  } catch (err) {
    console.error(err);
    return { error: "Something went wrong updating user" };
  }
}

export function getUsers(params: GetUsersParams) {
  return unstable_cache(
    async () => {
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
    },

    [`user-management-table-${JSON.stringify(params)}`],
    { tags: ["user-management-table"] }
  )();
}

export async function deleteUser(id: string) {
  try {
    // CHECKING IF THERE IS ANY ACTIVE ASSGINED LICENSE
    const hasAssignedLicense = await prisma.licenseAssignment.count({
      where: {
        status: "ACTIVE",
        userId: id,
      },
    });
    if (hasAssignedLicense) {
      return {
        error:
          "Unable to delete this user because they still have active license assignments",
      };
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
    await prisma.userDetails.delete({
      where: { id: id },
    });

    return { data: "" };
  } catch (e) {
    console.log(e);
    return { error: "Something went wrong in deleting." };
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
