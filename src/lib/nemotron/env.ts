/**
 * Server-only Nemotron / NVIDIA NIM configuration.
 * Set NVIDIA_API_KEY (or NEMOTRON_API_KEY) in .env.local — never expose to the client.
 */
export function getNemotronApiKey(): string | undefined {
  return process.env.NVIDIA_API_KEY ?? process.env.NEMOTRON_API_KEY;
}

export function getNemotronBaseUrl(): string {
  const u =
    process.env.NEMOTRON_BASE_URL?.replace(/\/$/, "") ??
    "https://integrate.api.nvidia.com/v1";
  return u;
}

export function getNemotronModel(): string {
  return (
    process.env.NEMOTRON_MODEL ?? "nvidia/nvidia-nemotron-nano-9b-v2"
  );
}

export function isNemotronConfigured(): boolean {
  return Boolean(getNemotronApiKey());
}
