import { NextResponse } from "next/server";
import { z } from "zod";
import { getUsers } from "@/data/user-management/user";

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse(Object.fromEntries(searchParams));

    const page = parsed.page ? Number(parsed.page) : 1;
    const limit = parsed.limit ? Number(parsed.limit) : 5;

    const result = await getUsers({
      page,
      limit,
      search: parsed.search,
      role: parsed.role,
      department: parsed.department,
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
