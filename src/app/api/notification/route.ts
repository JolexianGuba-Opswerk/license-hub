// app/api/notifications/route.ts
import { prisma } from "@/lib/prisma";
// or your auth system
import { createClient } from "@/lib/supabase/supabase-server";
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    notifications: notifications,
    userId: user.id,
  });
}
