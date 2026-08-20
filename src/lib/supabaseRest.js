const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "https://yjmfnjulpqpkndcfcuet.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoieWptZm5qdWxwcXBrbmRjZmN1ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0NzA4NjQ4OSwiZXhwIjoyMDYyNjYyNDg5fQ.BbR-LWjcO6IeHrfhzSrMpJ_iqOaUBkcNW3Uo7zLu9DA";

const SESSION_KEY = "dokmarket:supabase-session";

function readSessionRaw() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function getStoredSession() {
  return readSessionRaw();
}

export function saveSession(session) {
  if (!session?.access_token) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
  const stored = { ...session, expires_at: expiresAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  return stored;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }
  if (!response.ok) {
    const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || `HTTP_${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function authRequest(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse(response);
}

export async function signUp(email, password, metadata = {}) {
  const data = await authRequest("/signup", { method: "POST", body: { email, password, data: metadata } });
  if (data?.access_token) saveSession(data);
  return data;
}

export async function signInWithPassword(email, password) {
  const data = await authRequest("/token?grant_type=password", { method: "POST", body: { email, password } });
  saveSession(data);
  return data;
}

export async function refreshSession() {
  const current = readSessionRaw();
  if (!current?.refresh_token) return null;
  try {
    const data = await authRequest("/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: current.refresh_token } });
    return saveSession(data);
  } catch {
    clearSession();
    return null;
  }
}

export async function ensureSession() {
  let session = readSessionRaw();
  if (!session?.access_token) return null;
  const expiresAtMs = Number(session.expires_at || 0) * 1000;
  if (!expiresAtMs || expiresAtMs - Date.now() < 60_000) session = await refreshSession();
  return session;
}

export async function signOut() {
  const session = readSessionRaw();
  try {
    if (session?.access_token) await authRequest("/logout", { method: "POST", token: session.access_token });
  } finally {
    clearSession();
  }
}

export async function restRequest(path, { method = "GET", body, token, prefer } = {}) {
  const session = token ? { access_token: token } : await ensureSession();
  if (!session?.access_token) throw new Error("AUTH_REQUIRED");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse(response);
}

export async function getOwnProfile(userId) {
  const rows = await restRequest(`profiles?id=eq.${encodeURIComponent(userId)}&select=*`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function updateOwnProfile(userId, updates) {
  const rows = await restRequest(`profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: updates,
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };