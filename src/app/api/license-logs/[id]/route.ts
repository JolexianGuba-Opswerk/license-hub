import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) return { error: "License ID is required" };
    const logPath = path.join(process.cwd(), "logs", "licenseAudit.log");
    if (!fs.existsSync(logPath)) {
      return NextResponse.json([], { status: 200 });
    }

    const logs = fs
      .readFileSync(logPath, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((log) => log.licenseId === id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ); // newest first

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to read logs:", error);
    return NextResponse.json({ error: "Failed to read logs" }, { status: 500 });
  }
}
