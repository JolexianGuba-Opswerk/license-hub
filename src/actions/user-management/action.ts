"use server";
import { createUser } from "@/data/user-management/user";
import { createClient } from "@/lib/supabase-server";
import { createUserSchema } from "@/schemas/user-management/createUserSchema";
import { revalidatePath, revalidateTag } from "next/cache";

type CreateUserState = {
  success: boolean;
  error?: string;
};

export async function createUserAction(
  prevState: CreateUserState,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // Allowing all the ITSG only to create user
  if (user.user_metadata.department !== "ITSG") {
    return { success: false, error: "Forbidden: ITSG Only" };
  }

  // ZOD validation check
  const userData = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!userData.success) {
    return {
      success: false,
      error: "Bad Request",
    };
  }

  // DAL User Creation
  const response = await createUser(userData.data);
  if (response.error || !response.data)
    return { success: false, error: response.error ?? "Something went wrong!" };

  revalidateTag("users-management-table");
  return { success: true };
}
