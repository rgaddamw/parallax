import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

const execFileAsync = promisify(execFile);

function stripAnsi(text) {
  return text
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\[[0-9;]*m/g, "")
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
}

function parse(stdout) {
  const s = stripAnsi(stdout);
  const phase = s.match(/Phase:\s*([A-Za-z0-9_-]+)/i)?.[1] ?? null;
  const inferenceHealthy = /Inference:\s*healthy/i.test(s);
  const phaseReady = phase?.toLowerCase() === "ready";
  const model = s.match(/^\s*Model:\s+(\S+)/im)?.[1] ?? null;
  const openclaw = s.match(/Agent:\s*OpenClaw\s+v([\d.]+)/i)?.[1] ?? null;
  const healthy = Boolean(phaseReady && inferenceHealthy && model && openclaw);
  return { phase, phaseReady, inferenceHealthy, model, openclaw, healthy };
}

const { stdout } = await execFileAsync("nemoclaw", ["parallax-demo", "status"], {
  maxBuffer: 4 * 1024 * 1024,
});
const result = parse(stdout);
console.log(JSON.stringify(result, null, 2));
