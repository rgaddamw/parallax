#!/usr/bin/env node
/**
 * Quick local verification for Nemotron + NemoClaw before a screen recording.
 * Usage: npm run dev   (separate terminal)
 *        npm run verify
 *
 * Auto-picks localhost:3001 if 3000 is a stale server missing /api/nemoclaw/runtime-status.
 * Override: PARALLAX_URL=http://localhost:3001 npm run verify
 */

const CANDIDATE_BASES = [
  process.env.PARALLAX_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
].filter(Boolean);

async function get(base, path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

/** Prefer the dev server that exposes the real runtime-status route. */
async function resolveBase() {
  if (process.env.PARALLAX_URL) {
    return { base: process.env.PARALLAX_URL.replace(/\/$/, ""), note: null };
  }

  const seen = new Set();
  const bases = CANDIDATE_BASES.filter((b) => {
    const n = b.replace(/\/$/, "");
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });

  let fallback = null;

  for (const base of bases) {
    try {
      const runtime = await get(base, "/api/nemoclaw/runtime");
      if (runtime.ok && runtime.json?.cliInstalled !== undefined) {
        const note =
          base !== "http://localhost:3000" && bases.includes("http://localhost:3000")
            ? "Using this port because :3000 is an older server (missing runtime-status). Kill PID on 3000 or open this URL in the browser."
            : null;
        return { base, note };
      }
      const status = await get(base, "/api/nemotron/status");
      if (status.ok && !fallback) {
        fallback = base;
      }
    } catch {
      /* port not listening */
    }
  }

  if (fallback) {
    return {
      base: fallback,
      note: "No server with /api/nemoclaw/runtime-status found. Restart dev on one port only.",
    };
  }

  return { base: "http://localhost:3000", note: null };
}

async function main() {
  const { base: BASE, note } = await resolveBase();

  console.log(`\nParallax stack check → ${BASE}`);
  if (note) {
    console.log(`  ℹ ${note}`);
  }
  console.log("");

  const getPath = (path) => get(BASE, path);

  const status = await getPath("/api/nemotron/status");
  if (!status.ok) {
    console.error("FAIL /api/nemotron/status", status.status, status.json);
    console.error(
      "\nIs npm run dev running? If it said port 3001, use:\n  PARALLAX_URL=http://localhost:3001 npm run verify\n",
    );
    process.exit(1);
  }
  const s = status.json;
  const nc = s.nemoclaw ?? {};

  console.log("✓ /api/nemotron/status");
  console.log(
    `  Nemotron: ${s.configured ? "CONFIGURED ✓" : "offline — add NVIDIA_API_KEY to .env.local"}`,
  );
  console.log(`  Model: ${s.model}`);
  console.log(
    `  NemoClaw: ${nc.policyName} v${nc.policyVersion} — export_behavioral ${nc.exportBehavioralBlocked ? "BLOCKED ✓" : "NOT BLOCKED ✗"}`,
  );
  console.log(
    `  Policy: Nemotron chat ${nc.chatCompletionsAllowed ? "ALLOWED ✓" : "denied"}`,
  );
  console.log(
    `  Policy: outbound untrusted ${nc.outboundUntrustedBlocked ? "BLOCKED ✓" : "NOT BLOCKED ✗"}`,
  );

  const policy = await getPath("/api/nemoclaw/policy");
  console.log(
    policy.ok
      ? `✓ /api/nemoclaw/policy (${policy.json.registeredTools?.length ?? "?"} tools)`
      : "FAIL /api/nemoclaw/policy",
  );

  let runtime = await getPath("/api/nemoclaw/runtime");
  if (!runtime.ok) {
    runtime = await getPath("/api/nemoclaw/runtime-status");
  }
  if (runtime.ok) {
    const r = runtime.json;
    console.log("✓ /api/nemoclaw/runtime-status");
    console.log(
      `  Real NemoClaw: CLI ${r.cliInstalled ? "✓" : "✗"} · Docker ${r.dockerActive ? "✓" : "✗"} · OpenShell ${r.openshellGatewayStarted ? "✓" : "✗"}`,
    );
    console.log(
      `  Sandbox: ${r.sandboxRunning ? "RUNNING" : "NOT RUNNING"} (attempted: ${r.sandboxBuildAttempted})`,
    );
  } else {
    console.log(
      `FAIL /api/nemoclaw/runtime-status (HTTP ${runtime.status})`,
    );
    console.log("  → Open the same URL as dev: " + BASE);
    console.log(
      "  → If port 3000 was in use, Next started on 3001 — kill the old process:",
    );
    console.log("       lsof -ti :3000 | xargs kill -9");
    console.log("       npm run dev");
  }

  const brev = await getPath("/api/brev/status");
  console.log(brev.ok ? "✓ /api/brev/status (optional deploy)" : "FAIL /api/brev/status");

  if (!nc.exportBehavioralBlocked) {
    console.error("\nFAIL: export_behavioral_profile must be blocked");
    process.exit(1);
  }
  if (!nc.outboundUntrustedBlocked) {
    console.error("\nFAIL: outbound_untrusted_domain must be blocked");
    process.exit(1);
  }

  const chat = await fetch(`${BASE}/api/nemotron/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
  });
  if (!s.configured && chat.status === 503) {
    console.log("✓ /api/nemotron/chat returns 503 when key missing (expected)");
  } else if (s.configured && chat.ok) {
    console.log("✓ /api/nemotron/chat reachable with API key");
  } else {
    console.log(`  /api/nemotron/chat → HTTP ${chat.status}`);
  }

  console.log("\n── Screen recording checklist ──");
  console.log(`  Open app at: ${BASE}`);
  console.log("  Real runtime panel: landing or /nemoclaw → Real NemoClaw Runtime Status");
  console.log("  Demo: /app → Run Secure Agent Run → OpenShell audit + YAML policy");
  console.log("  In-app policy layer runs even when sandbox onboarding is blocked\n");

  if (!s.configured) {
    console.log(
      "Tip: cp .env.example .env.local && add NVIDIA_API_KEY, then npm run dev\n",
    );
  }
}

main().catch((e) => {
  console.error(
    e.message?.includes("fetch")
      ? "Cannot reach localhost — is npm run dev running?"
      : e,
  );
  process.exit(1);
});
