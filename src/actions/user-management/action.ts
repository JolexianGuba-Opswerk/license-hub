"use server";
import {
  createUser,
  getManagers,
  updateUser,
} from "@/data/user-management/user";

import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/schemas/user-management/user";
import { revalidatePath, revalidateTag } from "next/cache";
import { UserManagementPermission } from "@/lib/permissions/admin/permission";

type CreateUserState = {
  success: boolean;
  error?: string;
};

export async function createUserAction(
  prevState: CreateUserState,
  formData: FormData
) {
  // Permission Check section
  const isPermitted = await UserManagementPermission();
  if (!isPermitted.success || !isPermitted.data) {
    return { success: false, error: isPermitted.error ?? "Unathorized" };
  }

  // ZOD validation check
  const userData = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!userData.success) {
    return {
      success: false,
      error: userData.error.issues[0].message,
    };
  }

  // DAL User Creation
  const response = await createUser(userData.data, isPermitted.data.id);
  if (response.error || !response.data)
    return { success: false, error: response.error ?? "Something went wrong!" };

  //Todo: Add push notification to account owners/managers

  revalidateTag("user-management-table");
  revalidatePath("/user-management");
  return { success: true };
}

// Update user in database and Supabase Auth
export async function updateUserAction(
  prevState: CreateUserState,
  formData: FormData
) {
  // Update User Permission Check
  const isPermitted = await UserManagementPermission();
  if (!isPermitted.success || !isPermitted.data) {
    return { success: false, error: isPermitted.error ?? "Unathorized" };
  }

  // Validate form data using Zod
  const userData = updateUserSchema.safeParse(Object.fromEntries(formData));

  if (!userData.success) {
    console.log(userData.error);
    return {
      success: false,
      error: userData.error.issues[0].message,
    };
  }

  // Update DAL
  const response = await updateUser(userData.data);
  if (response.error || !response.data) {
    return { success: false, error: response.error ?? "Something went wrong!" };
  }

  // Revalidate cache
  revalidateTag("user-management-table");
  revalidatePath("/user-management");
  return { success: true };
}

export async function getManagersAction() {
  return await getManagers();
}
