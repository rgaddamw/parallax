/** Scripted copy for the 3-minute judge demo (deterministic, no API keys). */

export const JUDGE_DEMO_JD = `Robotics & AI Internship — NVIDIA-adjacent lab.
Stack: ROS2, perception pipelines, on-device inference, PyTorch.
Looking for hands-on ownership of a technical subsystem, not slide-deck leadership.`;

export const JUDGE_DEMO_QUESTION =
  "Tell me about your strongest technical project.";

export const JUDGE_DEMO_VAGUE_ANSWER =
  "I worked on a pretty big AI project with my team. We used machine learning and it went well. I helped a lot and learned a ton — it was probably my strongest experience.";

export const JUDGE_DEMO_THEY_HEARD =
  "Candidate referenced a large team project without naming their personal subsystem, metrics, or failure modes. Leadership claim is unverified.";

export const JUDGE_DEMO_INTERRUPT =
  "You said you led the project, but I still don't know what you personally built. Be specific.";

export const JUDGE_DEMO_CONTRADICTION = {
  turnIndex: 0,
  description:
    "Earlier in session prep you claimed solo ownership; this answer describes team-level outcomes only.",
  evidence: [
    "Resume bullet: 'Led end-to-end perception stack'",
    "Live answer: 'we used machine learning and it went well'",
  ],
};

export const JUDGE_DEMO_IMPROVED_ANSWER = `I owned the on-robot perception slice: YOLOv8 fine-tuned on 12k labeled frames, deployed via TensorRT on Jetson at 28 FPS. Latency dropped 34% after INT8 calibration; I personally wrote the ROS2 node and the evaluation harness. Tradeoff: we sacrificed 2% mAP for real-time stability — I would add active-learning loops next.`;

export const JUDGE_DEMO_TRUST_DROP =
  "Trust fell 24 points when specificity collapsed — interviewer model treated 'helped a lot' as unverifiable scope inflation.";

export const JUDGE_DEMO_HIRING_SIGNAL =
  "Borderline → Hire if improved: signal is coachable, but panel would not advance without a concrete personal artifact on the next probe.";

/** Target wall-clock duration for the scripted demo (~3 minutes). */
export const JUDGE_DEMO_DURATION_MS = 180_000;

export const JUDGE_DEMO_STORAGE_KEY = "parallax:startJudgeDemo";
