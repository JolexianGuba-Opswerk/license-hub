"use server";

import { createClient } from "@/lib/supabase/supabase-server";

export async function licenseAccessVerification(password: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { error: "Unauthorized" };
    }
    // Try to sign in temporarily
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      // Invalid credentials
      return { success: false, message: error || "Invalid password." };
    }

    return { success: true };
  } catch (err) {
    console.error("Password verification error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}
