// app/api/notifications/[id]/read/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return Response.json({ success: true });
}
