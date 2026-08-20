import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const bucket = "evidence-files";
const serviceHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const allowed = new Set([
  "image/jpeg","image/png","image/webp","application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

function safeName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(-120) || "file";
}
async function rest(path: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: { ...serviceHeaders, "Content-Type": "application/json" } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`);
  return data;
}
async function roomAndParticipant(roomCode: string, token: string) {
  const rooms = await rest(`collective_rooms?room_code=eq.${encodeURIComponent(roomCode.toUpperCase())}&select=id,status`);
  const room = Array.isArray(rooms) ? rooms[0] : null;
  if (!room) throw new Error("ROOM_NOT_FOUND");
  const rows = await rest(`collective_participants?room_id=eq.${room.id}&participant_token=eq.${encodeURIComponent(token)}&role=eq.participant&select=id,participant_token,status`);
  const participant = Array.isArray(rows) ? rows[0] : null;
  if (!participant) throw new Error("PARTICIPANT_NOT_FOUND");
  return { room, participant };
}
async function storageFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/storage/v1/${path}`, { ...init, headers: { ...serviceHeaders, ...(init.headers || {}) } });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error || `STORAGE_${response.status}`);
  return data;
}
function assertOwnedPath(path: string, roomId: string, participantId: string) {
  const prefix = `collective/${roomId}/${participantId}/`;
  if (!path.startsWith(prefix)) throw new Error("FILE_FORBIDDEN");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const action = String(form.get("action") || "");
      const roomCode = String(form.get("roomCode") || "").trim().toUpperCase();
      const participantToken = String(form.get("participantToken") || "").trim();
      const file = form.get("file");
      if (action !== "upload" || !roomCode || !participantToken || !(file instanceof File)) return json({ error: "INVALID_UPLOAD" }, 400);
      if (file.size > 10 * 1024 * 1024) return json({ error: "FILE_TOO_LARGE" }, 413);
      const mime = file.type || "application/octet-stream";
      if (!allowed.has(mime)) return json({ error: "FILE_TYPE_NOT_ALLOWED" }, 415);
      const { room, participant } = await roomAndParticipant(roomCode, participantToken);
      if (room.status !== "open") return json({ error: "ROOM_CLOSED" }, 409);
      const storagePath = `collective/${room.id}/${participant.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
      await storageFetch(`object/${bucket}/${storagePath}`, {
        method: "POST",
        headers: { "Content-Type": mime, "x-upsert": "false" },
        body: file,
      });
      return json({ storageBucket: bucket, storagePath, name: file.name, size: file.size, type: mime });
    }

    const body = await req.json();
    const action = String(body?.action || "");
    const roomCode = String(body?.roomCode || "").trim().toUpperCase();
    const participantToken = String(body?.participantToken || "").trim();
    const storagePath = String(body?.storagePath || "");
    if (!roomCode || !participantToken || !storagePath) return json({ error: "INVALID_REQUEST" }, 400);
    const { room, participant } = await roomAndParticipant(roomCode, participantToken);
    assertOwnedPath(storagePath, room.id, participant.id);

    if (action === "sign") {
      const expiresIn = Math.min(900, Math.max(60, Number(body?.expiresIn || 300)));
      const signed = await storageFetch(`object/sign/${bucket}/${storagePath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn }),
      });
      const relative = signed?.signedURL || signed?.signedUrl || "";
      const signedUrl = relative ? `${supabaseUrl}/storage/v1${relative.startsWith("/") ? relative : `/${relative}`}` : "";
      return json({ signedUrl });
    }
    if (action === "delete") {
      if (room.status !== "open") return json({ error: "ROOM_CLOSED" }, 409);
      await storageFetch(`object/${bucket}/${storagePath}`, { method: "DELETE" });
      return json({ deleted: true });
    }
    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    const status = message.includes("NOT_FOUND") ? 404 : message.includes("FORBIDDEN") ? 403 : 500;
    return json({ error: message }, status);
  }
});