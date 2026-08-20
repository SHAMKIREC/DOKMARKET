import { ensureSession, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseRest";

const BUCKET = "evidence-files";
const edgeUrl = `${SUPABASE_URL}/functions/v1/evidence-file`;

function safeFileName(name = "file") {
  const normalized = String(name).normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized.slice(-120) || "file";
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function authenticatedStorageRequest(path, { method = "POST", body, headers = {} } = {}) {
  const session = await ensureSession();
  if (!session?.access_token || !session?.user?.id) throw new Error("AUTH_REQUIRED");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...headers,
    },
    body,
  });
  return { data: await parseResponse(response), session };
}

async function uploadAuthenticated(file, context = {}) {
  const session = await ensureSession();
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED");
  const scope = context.roomId ? `room-${String(context.roomId).toUpperCase()}` : "solo";
  const path = `users/${session.user.id}/${scope}/${randomId()}-${safeFileName(file.name)}`;
  const { data } = await authenticatedStorageRequest(`object/${BUCKET}/${path}`, {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
  });
  return {
    storageBucket: BUCKET,
    storagePath: path,
    storageKey: data?.Key || `${BUCKET}/${path}`,
  };
}

async function edgeJson(action, body = {}) {
  const response = await fetch(edgeUrl, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return parseResponse(response);
}

async function uploadGuestParticipant(file, context) {
  const form = new FormData();
  form.append("action", "upload");
  form.append("roomCode", String(context.roomId || "").toUpperCase());
  form.append("participantToken", String(context.participantToken || ""));
  form.append("file", file, file.name);
  const response = await fetch(edgeUrl, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY },
    body: form,
  });
  return parseResponse(response);
}

export async function uploadEvidenceFile(file, claimData = {}) {
  if (!file) throw new Error("FILE_REQUIRED");
  if (file.size > 10 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  if (claimData.isJoiner) {
    return uploadGuestParticipant(file, {
      roomId: claimData.roomId,
      participantToken: claimData.collectiveParticipantId,
    });
  }
  return uploadAuthenticated(file, { roomId: claimData.roomId });
}

export async function getEvidenceFileUrl(file, claimData = {}, expiresIn = 300) {
  if (!file?.storagePath) return file?.url || "";
  if (claimData.isJoiner) {
    const data = await edgeJson("sign", {
      roomCode: String(claimData.roomId || "").toUpperCase(),
      participantToken: String(claimData.collectiveParticipantId || ""),
      storagePath: file.storagePath,
      expiresIn,
    });
    return data?.signedUrl || "";
  }
  const { data } = await authenticatedStorageRequest(`object/sign/${BUCKET}/${file.storagePath}`, {
    method: "POST",
    body: JSON.stringify({ expiresIn }),
    headers: { "Content-Type": "application/json" },
  });
  const signed = data?.signedURL || data?.signedUrl || "";
  return signed ? `${SUPABASE_URL}/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}` : "";
}

export async function deleteEvidenceFile(file, claimData = {}) {
  if (!file?.storagePath) return true;
  if (claimData.isJoiner) {
    await edgeJson("delete", {
      roomCode: String(claimData.roomId || "").toUpperCase(),
      participantToken: String(claimData.collectiveParticipantId || ""),
      storagePath: file.storagePath,
    });
    return true;
  }
  await authenticatedStorageRequest(`object/${BUCKET}/${file.storagePath}`, { method: "DELETE" });
  return true;
}
