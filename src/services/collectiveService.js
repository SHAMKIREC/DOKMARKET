import { getStoredSession, restRequest, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseRest";

const edgeUrl = `${SUPABASE_URL}/functions/v1/collective-room`;
const objectValue = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

async function guestRequest(action, roomCode, extra = {}) {
  const response = await fetch(edgeUrl, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ action, roomCode, ...extra }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function normalizeParticipant(row = {}) {
  return {
    ...row,
    id: row.id,
    participantId: row.participant_token || row.participantId || row.id,
    participantToken: row.participant_token || row.participantToken || "",
    role: row.role || "participant",
    slotIndex: Number(row.slot_index || row.slotIndex || 0),
    status: row.status || "invited",
    claimantData: objectValue(row.claimant_data || row.claimantData),
    circumstancesData: objectValue(row.circumstances || row.circumstancesData),
    selectedLegalOptions: Array.isArray(row.legal_options) ? row.legal_options : Array.isArray(row.selectedLegalOptions) ? row.selectedLegalOptions : [],
    evidenceData: {
      selected: Array.isArray(row.evidence) ? row.evidence : Array.isArray(row.evidenceData?.selected) ? row.evidenceData.selected : [],
      files: objectValue(row.evidence_files || row.evidenceData?.files),
    },
    completedAt: row.completed_at || row.completedAt || null,
  };
}

export function normalizeRoom(row) {
  if (!row) return null;
  const participants = Array.isArray(row.collective_participants)
    ? row.collective_participants.map(normalizeParticipant).sort((a, b) => a.slotIndex - b.slotIndex)
    : Array.isArray(row.members)
      ? row.members.map(normalizeParticipant).sort((a, b) => a.slotIndex - b.slotIndex)
      : row.participant ? [normalizeParticipant(row.participant)] : [];
  const commonData = objectValue(row.common_data || row.commonData);
  return {
    ...row,
    id: row.id,
    room_id: row.room_code || row.room_id,
    roomCode: row.room_code || row.roomCode || row.room_id,
    mode: "collective",
    type: row.type || row.claim_type || "",
    subtype: row.subtype || row.claim_subtype || "",
    claim_type: row.type || row.claim_type || "",
    claim_subtype: row.subtype || row.claim_subtype || "",
    employer: objectValue(row.respondent || row.employer || commonData.employer),
    commonData,
    totalParticipants: Number(row.total_participants || row.totalParticipants || row.max_members || 0),
    max_members: Number(row.total_participants || row.totalParticipants || row.max_members || 0),
    collectiveFinalized: row.status === "finalized" || Boolean(row.collectiveFinalized),
    finalizedAt: row.finalized_at || row.finalizedAt || null,
    members: participants,
    ownerParticipantId: participants.find(item => item.role === "owner")?.participantId || null,
  };
}

export function getTotalParticipants(room) { return Math.max(0, Number(room?.totalParticipants || room?.total_participants || room?.max_members || 0)); }
export function isCompletedParticipant(participant) { return participant?.status === "completed"; }
export function getRoomParticipants(room) { return normalizeRoom(room)?.members || []; }
export function getCompletedParticipants(room) { return getRoomParticipants(room).filter(isCompletedParticipant); }
export function getParticipant(room, participantId) {
  if (!participantId) return null;
  return getRoomParticipants(room).find(member => member.participantId === participantId || member.participantToken === participantId || member.id === participantId) || null;
}

export async function listRooms() {
  const rows = await restRequest("collective_rooms?select=*,collective_participants(*)&order=created_at.desc");
  return (Array.isArray(rows) ? rows : []).map(normalizeRoom);
}

export async function getRoom(roomCode) {
  const code = String(roomCode || "").trim().toUpperCase();
  if (!code) return null;
  const session = getStoredSession();
  if (!session?.access_token) {
    const data = await guestRequest("peek", code);
    return normalizeRoom({ ...data.room, members: [] });
  }
  const rows = await restRequest(`collective_rooms?room_code=eq.${encodeURIComponent(code)}&select=*,collective_participants(*)&limit=1`);
  return normalizeRoom(Array.isArray(rows) ? rows[0] || null : null);
}

export async function createRoom(data) {
  const session = getStoredSession();
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED");
  const roomCode = String(data.room_id || data.roomCode || "").trim().toUpperCase();
  if (!roomCode) throw new Error("ROOM_CODE_REQUIRED");
  const total = Number(data.totalParticipants || data.max_members || 0);
  if (!Number.isInteger(total) || total < 2 || total > 100) throw new Error("INVALID_PARTICIPANT_COUNT");
  const rooms = await restRequest("collective_rooms", {
    method: "POST",
    prefer: "return=representation",
    body: {
      room_code: roomCode,
      owner_id: session.user.id,
      type: data.type || data.claim_type,
      subtype: data.subtype || data.claim_subtype || "",
      respondent: objectValue(data.employer || data.respondent),
      common_data: objectValue(data.commonData),
      status: "open",
      total_participants: total,
    },
  });
  const room = Array.isArray(rooms) ? rooms[0] : null;
  if (!room?.id) throw new Error("ROOM_SAVE_FAILED");
  const slots = Array.from({ length: total }, (_, index) => ({
    room_id: room.id,
    user_id: index === 0 ? session.user.id : null,
    slot_index: index + 1,
    role: index === 0 ? "owner" : "participant",
    status: index === 0 ? "in_progress" : "invited",
  }));
  await restRequest("collective_participants", { method: "POST", body: slots });
  return getRoom(roomCode);
}

export async function updateRoom(idOrRoomCode, updates = {}) {
  const current = await getRoom(idOrRoomCode);
  if (!current?.id) throw new Error("ROOM_NOT_FOUND");
  const patch = {};
  if (updates.employer || updates.respondent) patch.respondent = objectValue(updates.employer || updates.respondent);
  if (updates.commonData || updates.common_data) patch.common_data = objectValue(updates.commonData || updates.common_data);
  if (updates.collectiveFinalized === true || updates.status === "finalized") {
    patch.status = "finalized";
    patch.finalized_at = updates.finalizedAt || new Date().toISOString();
  }
  if (updates.status === "closed") patch.status = "closed";
  if (!Object.keys(patch).length) return current;
  await restRequest(`collective_rooms?id=eq.${encodeURIComponent(current.id)}`, { method: "PATCH", body: patch });
  return getRoom(current.roomCode);
}

export async function claimParticipantSlot(roomCode, participantToken) {
  const data = await guestRequest("claim", String(roomCode || "").trim().toUpperCase(), participantToken ? { participantToken } : {});
  return { room: normalizeRoom({ ...data.room, participant: data.participant }), participant: normalizeParticipant(data.participant) };
}

export async function getGuestParticipant(roomCode, participantToken) {
  const data = await guestRequest("get", String(roomCode || "").trim().toUpperCase(), { participantToken });
  return { room: normalizeRoom({ ...data.room, participant: data.participant }), participant: normalizeParticipant(data.participant) };
}

export async function saveParticipant(roomCode, participantToken, payload = {}) {
  const data = await guestRequest("save", String(roomCode || "").trim().toUpperCase(), {
    participantToken,
    claimantData: objectValue(payload.claimantData),
    circumstances: objectValue(payload.circumstancesData || payload.circumstances),
    evidence: Array.isArray(payload.evidenceData?.selected) ? payload.evidenceData.selected : Array.isArray(payload.evidence) ? payload.evidence : [],
    evidenceFiles: objectValue(payload.evidenceData?.files || payload.evidenceFiles),
    selectedLegalOptions: Array.isArray(payload.selectedLegalOptions) ? payload.selectedLegalOptions : [],
    completed: payload.status === "completed" || Boolean(payload.completed),
  });
  return normalizeParticipant(data.participant);
}

export async function saveOwnerParticipant(roomCode, payload = {}) {
  const room = await getRoom(roomCode);
  const owner = getRoomParticipants(room).find(member => member.role === "owner");
  if (!owner?.id) throw new Error("OWNER_SLOT_NOT_FOUND");
  const rows = await restRequest(`collective_participants?id=eq.${encodeURIComponent(owner.id)}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: {
      claimant_data: objectValue(payload.claimantData),
      circumstances: objectValue(payload.circumstancesData || payload.circumstances),
      evidence: Array.isArray(payload.evidenceData?.selected) ? payload.evidenceData.selected : Array.isArray(payload.evidence) ? payload.evidence : [],
      evidence_files: objectValue(payload.evidenceData?.files || payload.evidenceFiles),
      legal_options: Array.isArray(payload.selectedLegalOptions) ? payload.selectedLegalOptions : [],
      status: payload.status === "completed" ? "completed" : "in_progress",
      completed_at: payload.status === "completed" ? (payload.completedAt || new Date().toISOString()) : null,
    },
  });
  return normalizeParticipant(Array.isArray(rows) ? rows[0] : rows);
}

export async function addParticipant(roomCode, participant) {
  if (participant?.role === "owner" || participant?.isOwner) return saveOwnerParticipant(roomCode, participant);
  const token = participant?.participantToken || participant?.participantId;
  if (!token) throw new Error("PARTICIPANT_TOKEN_REQUIRED");
  return saveParticipant(roomCode, token, participant);
}
