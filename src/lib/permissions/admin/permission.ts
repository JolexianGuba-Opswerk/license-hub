// todo : add all the permission check for admin's in here

import { createClient } from "@/lib/supabase/supabase-server";

export async function UserManagementPermission() {
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

  return { success: true, data: user.id };
}
