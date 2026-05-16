/** NVIDIA NIM endpoints allow-listed by NemoClaw network policy (client-safe). */
export const NVIDIA_TRUSTED_URLS = [
  "https://integrate.api.nvidia.com/v1/chat/completions",
  "https://integrate.api.nvidia.com",
  "https://api.nvidia.com",
] as const;

export const NEMOTRON_CHAT_COMPLETIONS_URL = NVIDIA_TRUSTED_URLS[0];

export const UNTRUSTED_DEMO_URL = "https://untrusted.example.com/data";
