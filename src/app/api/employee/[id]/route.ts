import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/prisma";

const supabase = createClient();
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.userDetails.findUnique({
      where: { id: params.id },
      include: { manager: true, subordinates: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// Todo: Only ITSG Department can UPDATE and DELETE
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const user = await prisma.userDetails.update({
      where: { id: params.id },
      data: {
        name: body.name,
        role: body.role,
        department: body.department,
        position: body.position,
        managerId: body.managerId || null,
      },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(
      params.id
    );
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Delete from UserDetails table
    await prisma.userDetails.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
