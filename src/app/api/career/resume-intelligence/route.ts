import { NextResponse } from "next/server";
import { runCareerPolicyBatch } from "@/lib/career/policyAudit";
import { buildResumeProfile } from "@/lib/resume/extractProfile";
import { analyzeResumeIntelligence } from "@/lib/resumeIntelligence/analyze";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resumeText?: string;
      resumeName?: string;
      company?: string;
      role?: string;
      approvedTools?: string[];
    };

    if (!body.company?.trim() || !body.role?.trim()) {
      return NextResponse.json(
        { error: "company and role required" },
        { status: 400 },
      );
    }

    const approved = new Set(body.approvedTools ?? []);
    const { openShell, security } = runCareerPolicyBatch([
      {
        tool: "read_resume_file",
        agent: "resume_intel",
        approvedTools: approved,
      },
      { tool: "analyze_resume_intelligence", agent: "resume_intel" },
      { tool: "generate_resume_recommendations", agent: "resume_intel" },
    ]);

    const blocked = openShell.some((e) => e.decision === "BLOCK");
    if (blocked) {
      return NextResponse.json(
        {
          error: "Denied by NemoClaw policy layer.",
          openShell,
          security,
        },
        { status: 403 },
      );
    }

    const readPending = openShell.find(
      (e) =>
        e.tool === "read_resume_file" && e.decision === "REQUIRE_APPROVAL",
    );
    if (readPending && !approved.has("read_resume_file")) {
      return NextResponse.json(
        { pendingApproval: true, openShell, security },
        { status: 202 },
      );
    }

    const profile = buildResumeProfile(
      body.resumeText ?? "",
      body.resumeName ?? "resume.pdf",
      body.role,
    );
    const report = analyzeResumeIntelligence({
      profile,
      company: body.company,
      role: body.role,
    });

    return NextResponse.json({ report, openShell, security });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resume intelligence error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
