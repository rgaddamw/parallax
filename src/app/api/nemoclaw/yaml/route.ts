import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "policies",
      "nemoclaw.default.yaml",
    );
    const yaml = await readFile(filePath, "utf8");
    return new NextResponse(yaml, {
      headers: { "Content-Type": "text/yaml; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      { error: "Policy file not found" },
      { status: 404 },
    );
  }
}
