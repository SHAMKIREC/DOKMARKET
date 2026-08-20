import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`);
  return data;
}

async function getRoom(roomCode: string) {
  const rows = await rest(`collective_rooms?room_code=eq.${encodeURIComponent(roomCode.toUpperCase())}&select=id,room_code,type,subtype,respondent,common_data,status,total_participants,created_at`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function getParticipantByToken(roomId: string, token: string) {
  const rows = await rest(`collective_participants?room_id=eq.${encodeURIComponent(roomId)}&participant_token=eq.${encodeURIComponent(token)}&select=id,participant_token,slot_index,role,status,claimant_data,circumstances,evidence,completed_at`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const body = await req.json();
    const action = String(body?.action || "");
    const roomCode = String(body?.roomCode || "").trim().toUpperCase();
    if (!roomCode) return json({ error: "ROOM_REQUIRED" }, 400);
    const room = await getRoom(roomCode);
    if (!room || room.status !== "open") return json({ error: "ROOM_NOT_FOUND" }, 404);

    if (action === "peek") {
      const completed = await rest(`collective_participants?room_id=eq.${room.id}&status=eq.completed&select=id`);
      return json({ room, completedCount: Array.isArray(completed) ? completed.length : 0 });
    }

    if (action === "claim") {
      const existingToken = String(body?.participantToken || "").trim();
      if (existingToken) {
        const existing = await getParticipantByToken(room.id, existingToken);
        if (existing) return json({ room, participant: existing });
      }
      const claimed = await rest("rpc/claim_collective_slot", { method: "POST", body: JSON.stringify({ p_room_code: roomCode }) });
      const slot = Array.isArray(claimed) ? claimed[0] : null;
      if (!slot?.participant_token) return json({ error: "ROOM_FULL" }, 409);
      const participant = await getParticipantByToken(room.id, slot.participant_token);
      return json({ room, participant });
    }

    const participantToken = String(body?.participantToken || "").trim();
    if (!participantToken) return json({ error: "PARTICIPANT_TOKEN_REQUIRED" }, 400);
    const participant = await getParticipantByToken(room.id, participantToken);
    if (!participant || participant.role !== "participant") return json({ error: "PARTICIPANT_NOT_FOUND" }, 404);
    if (action === "get") return json({ room, participant });

    if (action === "save") {
      const claimantData = body?.claimantData && typeof body.claimantData === "object" ? body.claimantData : {};
      const circumstances = body?.circumstances && typeof body.circumstances === "object" ? body.circumstances : {};
      const evidence = Array.isArray(body?.evidence) ? body.evidence : [];
      const completed = Boolean(body?.completed);
      const rows = await rest(`collective_participants?id=eq.${participant.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ claimant_data: claimantData, circumstances, evidence, status: completed ? "completed" : "in_progress", completed_at: completed ? new Date().toISOString() : null }),
      });
      return json({ room, participant: Array.isArray(rows) ? rows[0] : rows });
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "SERVER_ERROR" }, 500);
  }
});
