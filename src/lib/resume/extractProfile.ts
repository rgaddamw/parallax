import type { ResumeProfile } from "@/types/career";

const SKILL_LEXICON = [
  "python",
  "java",
  "c++",
  "cuda",
  "ros",
  "ros2",
  "linux",
  "kubernetes",
  "docker",
  "aws",
  "gcp",
  "react",
  "typescript",
  "javascript",
  "machine learning",
  "deep learning",
  "pytorch",
  "tensorflow",
  "embedded",
  "firmware",
  "networking",
  "distributed systems",
  "system design",
  "robotics",
  "computer vision",
  "nlp",
  "sql",
  "postgresql",
  "mongodb",
  "git",
  "ci/cd",
  "verilog",
  "fpga",
  "nvidia",
  "gpu",
];

/** Demo-safe resume understanding from pasted text or filename hints. */
export function buildResumeProfile(
  rawText: string,
  resumeName: string,
  role: string,
): ResumeProfile {
  const lower = `${rawText} ${resumeName} ${role}`.toLowerCase();
  const detectedSkills = SKILL_LEXICON.filter((s) => lower.includes(s));
  const projects: string[] = [];
  const projectMatches = rawText.match(
    /(?:project|built|developed|designed)[^.!?\n]{10,120}/gi,
  );
  if (projectMatches) {
    for (const m of projectMatches.slice(0, 4)) {
      projects.push(m.trim().slice(0, 100));
    }
  }
  if (projects.length === 0) {
    if (lower.includes("robot")) projects.push("Robotics / perception work mentioned");
    if (lower.includes("intern")) projects.push("Internship experience");
    if (lower.includes("team")) projects.push("Team-based delivery");
  }

  const themes: string[] = [];
  if (lower.includes("lead") || lower.includes("managed")) themes.push("leadership");
  if (lower.includes("research")) themes.push("research");
  if (lower.includes("deploy") || lower.includes("production"))
    themes.push("production engineering");
  if (lower.includes("hardware") || lower.includes("embedded"))
    themes.push("hardware / embedded");

  return {
    rawText: rawText.trim(),
    detectedSkills,
    projects,
    themes,
  };
}

export function mockResumeTextFromFile(name: string, role: string, company: string) {
  const base = name.toLowerCase();
  const chunks: string[] = [
    `Candidate targeting ${role} at ${company}.`,
    "Experience includes collaborative projects with teammates on robotics and software systems.",
    "Worked on perception pipelines, model integration, and deployment.",
    "Used Python, Git, and Linux environments.",
  ];
  if (base.includes("robot")) {
    chunks.push(
      "Robotics internship: helped integrate sensors and improve latency on edge deployment.",
    );
  }
  if (role.toLowerCase().includes("hardware") || company.toLowerCase().includes("nvidia")) {
    chunks.push(
      "Exposure to CUDA and GPU workflows; interested in embedded and systems programming.",
    );
  }
  return chunks.join("\n\n");
}
