"use server";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/schemas/user-management/createUserSchema";
import { supabaseAdmin } from "@/lib/supabase-admin";
export async function createUser(userData: UserType) {
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
    email_confirm: false,
  });

  if (error) {
    console.log(error);
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
        managerId: userData.managerId === "none" ? null : userData.managerId,
      },
    });

    return { data: newUser };
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong in creating" };
  }
}
