# Parallax

Parallax is a secure multi-agent AI interview simulator powered by NVIDIA NemoClaw.

The platform uses coordinated agents for behavioral analysis, memory, perception, adaptive questioning, and interview decision-making to simulate realistic technical interview pressure in real time.

---

## Inspiration

Parallax started from my own experience struggling through engineering internship interviews as a first-year student. I got rejected after one of my first major interviews, and honestly it hit hard. I realized interviews are not just about technical knowledge — they are about pressure, confidence, communication, and adapting in real time.

After that rejection, I completely changed how I prepared. I started recreating intense interview environments at home with rapid-fire technical and behavioral questions until answering under pressure started feeling natural. Eventually, that preparation paid off. On my second major attempt, I secured an internship at NVIDIA as a first-year undergraduate student, becoming one of the youngest interns at NVIDIA. That experience inspired me to build the interview platform I wish I had during that process.

---

## What it does

Parallax is a multi-agent AI interview simulator designed to create realistic interview experiences instead of static question banks. Different agents handle memory, behavioral analysis, decision-making, and adaptive follow-up questioning to simulate how real interviewers react under pressure. The system also uses NVIDIA NemoClaw to securely sandbox and govern agent behavior.

---

## How we built it

I built Parallax using TypeScript, Next.js, React, Node.js, and NVIDIA’s agentic AI stack, including NemoClaw for sandboxing and policy enforcement. The platform runs a coordinated multi-agent workflow where specialized agents evaluate responses, track interview context, and dynamically generate follow-up questions and feedback in real time.

---

## Challenges we ran into

One of the biggest challenges was balancing responsiveness with deeper agent reasoning. Coordinating multiple agents while keeping the experience smooth and understandable required a lot of iteration. Another challenge was designing secure autonomous behavior while still allowing agents to act dynamically inside the system.

---

## Accomplishments that we're proud of

I’m most proud of building a real multi-agent workflow instead of a simple AI wrapper. Integrating policy-governed sandboxed agents into a live interactive system and creating adaptive interview behavior in real time made the project feel much closer to a real-world autonomous AI application.

---

## What we learned

One of the biggest things I learned from building Parallax is that realistic AI systems are not just about generating good responses. The difficult part is designing systems that can reason, adapt, remember context, and still operate safely in real time. I also learned how important architecture and orchestration become once multiple autonomous agents are interacting together inside one workflow.

---

## What's next for Parallax

The next step for Parallax is making the interview experience even more adaptive and immersive through voice interaction, more advanced behavioral reasoning, and fully dynamic interview flows. Long-term, I want it to become a secure AI platform that genuinely helps students prepare for high-pressure technical interviews.

---

## Tech Stack

- TypeScript
- Next.js 16
- React 19
- Node.js
- Tailwind CSS 4
- NVIDIA NemoClaw
- NVIDIA OpenShell
- NVIDIA NIM APIs
- OpenClaw-inspired multi-agent orchestration
- YAML policy manifests
- Docker

---

## Running Locally

```bash
npm install
npm run dev
