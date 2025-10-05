import "server-only";
import { prisma } from "@/lib/prisma";
import {
  UpdateUserType,
  UserType,
} from "@/lib/schemas/user-management/createUserSchema";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { GetUsersParams, Manager } from "@/lib/types/user";
import { unstable_cache } from "next/cache";

// Create user in database and Supabase Auth
export async function createUser(userData: UserType, currentUser: string) {
  // If manager is not Account Owner and Manager.
  const roleWithoutManager = ["MANAGER", "ACCOUNT_OWNER"];

  if (!roleWithoutManager.includes(userData.role) && !userData.managerId) {
    return { error: "Employee must have a manager assigned" };
  } else if (roleWithoutManager.includes(userData.role)) {
    // Check if there is a manager already for certain department
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
        error: "This department already has a manager/account owner  assigned",
      };
  }

  // Check if Manager ID exist and if they are in same department
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

  // Auth User Creation in SUPABASE AUTH
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

  // User Creation in Actual Database
  const supabaseUserId = user.user.id;
  try {
    const newUser = await prisma.userDetails.create({
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

    return { data: newUser };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong in creating" };
  }
}

// Update user in database and Supabase Auth
export async function updateUser(userData: UpdateUserType) {
  // Role validation
  const roleWithoutManager = ["MANAGER", "ACCOUNT_OWNER"];
  if (!roleWithoutManager.includes(userData.role) && !userData.managerId) {
    return { error: "Employee must have a manager assigned" };
  } else if (roleWithoutManager.includes(userData.role)) {
    // Check if there is a manager already for certain department
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
        error: "This department already has a manager/account owner assigned",
      };
  }

  // Validate manager if provided
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

  // Update Supabase Auth metadata
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userData.id,
    {
      user_metadata: {
        role: userData.role,
        department: userData.department,
        position: userData.position,
      },
    }
  );

  if (authError) return { error: authError.message ?? "Failed to update user" };

  // Update in Prisma
  try {
    const updatedUser = await prisma.userDetails.update({
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

    return { data: updatedUser };
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
