import { ensureSession } from "@/lib/supabaseRest";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yjmfnjulpqpkndcfcuet.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function askDocMarketAssistant({ message, history = [], catalog = [] }) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("ASSISTANT_BACKEND_UNAVAILABLE");

  const session = await ensureSession();
  if (!session?.access_token) throw new Error("ASSISTANT_AUTH_REQUIRED");

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/dokmarket-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      history: history.slice(-8),
      catalog: catalog.slice(0, 40),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "ASSISTANT_REQUEST_FAILED");
  }

  return response.json();
}
