import type {
  ResumeIntelligenceReport,
  ResumeIssue,
  ResumeProfile,
  RewrittenBullet,
  SkillRecommendation,
} from "@/types/career";

function issue(
  category: ResumeIssue["category"],
  severity: ResumeIssue["severity"],
  title: string,
  detail: string,
  example?: string,
): ResumeIssue {
  return {
    id: `${category}-${title.slice(0, 12)}`,
    category,
    severity,
    title,
    detail,
    example,
  };
}

export function analyzeResumeIntelligence(input: {
  profile: ResumeProfile;
  company: string;
  role: string;
}): ResumeIntelligenceReport {
  const { profile, company, role } = input;
  const issues: ResumeIssue[] = [];
  const roleLower = role.toLowerCase();
  const companyLower = company.toLowerCase();

  if (!/\d+%|\d+x|\$\d|increased|reduced|saved/i.test(profile.rawText)) {
    issues.push(
      issue(
        "impact",
        "high",
        "Missing quantified impact",
        "Add more quantified impact metrics (latency %, users, revenue, cost, throughput).",
        "“Improved system performance” → “Reduced inference latency 38% on Jetson Orin.”",
      ),
    );
  }

  if (
    profile.rawText.toLowerCase().includes("helped") ||
    profile.rawText.toLowerCase().includes("we ")
  ) {
    issues.push(
      issue(
        "bullet_quality",
        "high",
        "Weak ownership language",
        "Your robotics section lacks ownership specificity — use I-built verbs and name your contribution.",
        "“We improved the pipeline” → “I owned the perception module and cut frame drops 22%.”",
      ),
    );
  }

  if (profile.detectedSkills.length < 4) {
    issues.push(
      issue(
        "technical_depth",
        "medium",
        "Thin technical signal",
        "Surface more concrete technologies aligned with the target role.",
      ),
    );
  }

  if (profile.rawText.length > 0 && profile.rawText.split("\n").some((l) => l.length > 110)) {
    issues.push(
      issue(
        "formatting",
        "medium",
        "ATS readability risk",
        "Your formatting may reduce ATS readability — shorten lines and use consistent section headers.",
      ),
    );
  }

  if (
    (roleLower.includes("embedded") || roleLower.includes("systems")) &&
    !profile.detectedSkills.some((s) =>
      ["linux", "embedded", "c++", "cuda", "firmware"].includes(s),
    )
  ) {
    issues.push(
      issue(
        "role_fit",
        "high",
        "Role skill gap",
        `For ${company}-level ${role} roles, Linux and embedded systems should be emphasized earlier.`,
      ),
    );
  }

  if (companyLower.includes("nvidia") && !profile.detectedSkills.includes("cuda")) {
    issues.push(
      issue(
        "role_fit",
        "medium",
        "NVIDIA alignment",
        "Highlight CUDA, GPU optimization, or parallel computing if targeting NVIDIA.",
      ),
    );
  }

  issues.push(
    issue(
      "vague_language",
      "low",
      "Generic adjectives",
      "Replace vague terms like “various” or “multiple” with named tools and scopes.",
    ),
  );

  const skillRecommendations: SkillRecommendation[] = [];
  const addSkill = (rec: SkillRecommendation) => {
    if (!skillRecommendations.some((s) => s.name === rec.name)) skillRecommendations.push(rec);
  };

  if (roleLower.includes("robot") || profile.themes.includes("hardware / embedded")) {
    addSkill({
      name: "ROS2",
      kind: "technology",
      rationale: "Standard stack for modern robotics interviews and autonomy teams.",
    });
    addSkill({
      name: "CUDA",
      kind: "course",
      rationale: "GPU acceleration is critical for perception at scale.",
    });
  }
  if (companyLower.includes("nvidia") || roleLower.includes("ml")) {
    addSkill({
      name: "CUDA",
      kind: "certification",
      rationale: "NVIDIA-aligned signal for hardware / ML systems roles.",
    });
  }
  addSkill({
    name: "Linux systems",
    kind: "technology",
    rationale: "Baseline for systems and embedded hiring loops.",
  });
  addSkill({
    name: "System design",
    kind: "course",
    rationale: "Supports senior-scope answers in mixed interviews.",
  });
  addSkill({
    name: "Distributed systems",
    kind: "project",
    rationale: "Demonstrates scale thinking beyond single-repo internships.",
  });
  addSkill({
    name: "Networking fundamentals",
    kind: "course",
    rationale: "Fills gaps for infrastructure-heavy roles.",
  });

  const rewrittenBullets: RewrittenBullet[] = [
    {
      section: "Experience",
      before: "Worked on a team project to improve robot performance.",
      after: `Built and deployed a perception module for ${role} scope; reduced end-to-end latency 32% using optimized inference on edge hardware.`,
    },
    {
      section: "Projects",
      before: "Helped integrate models into the pipeline.",
      after: "Owned model integration and benchmarking; documented tradeoffs for accuracy vs. FPS for production review.",
    },
  ];

  const recommendations = [
    "Add more quantified impact metrics.",
    "Lead with ownership verbs (Designed, Implemented, Shipped).",
    "Move role-critical skills (Linux, CUDA, ROS2) into the top third of page one.",
    "Add a Projects section with 2–3 bullets each naming stack, constraint, and outcome.",
    `Tailor summary line to ${company} — ${role}.`,
  ];

  const roadmap = [
    "Week 1–2: Rewrite top 3 bullets with metrics and I-owned language.",
    "Week 3: Add one portfolio project demonstrating target stack depth.",
    "Week 4: Run mock interviews with Parallax Live Interview mode.",
    "Ongoing: Maintain ATS-friendly single-column export (PDF).",
  ];

  const overallScore = Math.max(
    35,
    Math.min(92, 78 - issues.filter((i) => i.severity === "high").length * 8),
  );

  return {
    generatedAt: Date.now(),
    company,
    role,
    overallScore,
    summary: `Autonomous resume intelligence for ${role} at ${company}. Detected ${profile.detectedSkills.length} skills and ${profile.projects.length} project signals. Primary gaps: impact quantification, ownership clarity, and role-specific depth.`,
    issues,
    recommendations,
    skillRecommendations,
    rewrittenBullets,
    roadmap,
  };
}
