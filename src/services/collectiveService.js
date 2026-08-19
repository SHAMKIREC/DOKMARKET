import { createLocalId, readLocal, writeLocal } from "./localStorageService";

const ROOMS_KEY = "collective-rooms";

export function getTotalParticipants(room) {
  return Math.max(0, Number(room?.totalParticipants || room?.max_members || 0));
}

export function isCompletedParticipant(participant) {
  return participant?.status === "completed";
}

function getParticipantRole(participant) {
  return participant?.role === "owner" || participant?.isOwner ? "owner" : "participant";
}

function slotId(roomId, slotIndex) {
  return `${roomId}:slot:${slotIndex}`;
}

function createSlot(room, slotIndex) {
  const isOwner = slotIndex === 1;
  return {
    id: slotId(room.room_id, slotIndex),
    participantId: isOwner ? room.ownerParticipantId : null,
    role: isOwner ? "owner" : "participant",
    slotIndex,
    label: isOwner ? "Вы (организатор)" : `Участник ${slotIndex}`,
    status: "pending",
    claimantData: {},
    circumstancesData: {},
    evidenceData: {},
    completedAt: null,
  };
}

function participantIdentity(member) {
  const phone = String(member?.phone || member?.claimantData?.phone || "").replace(/\D/g, "");
  const email = String(member?.email || member?.claimantData?.email || "").trim().toLowerCase();
  return member?.participantId || (phone ? `phone:${phone}` : "") || (email ? `email:${email}` : "");
}

function deduplicateLegacyMembers(members = []) {
  const result = [];
  for (const member of members.filter(Boolean)) {
    const role = getParticipantRole(member);
    const identity = participantIdentity(member);
    const index = result.findIndex(candidate => {
      if (role === "owner" || getParticipantRole(candidate) === "owner") {
        return role === "owner" && getParticipantRole(candidate) === "owner";
      }
      return Boolean(identity && participantIdentity(candidate) === identity);
    });
    if (index < 0) result.push(member);
    else if (isCompletedParticipant(member) || !isCompletedParticipant(result[index])) {
      result[index] = { ...result[index], ...member };
    }
  }
  return result;
}

export function normalizeRoom(inputRoom) {
  if (!inputRoom) return null;
  const totalParticipants = getTotalParticipants(inputRoom);
  if (!totalParticipants) return { ...inputRoom, members: [] };

  const room = {
    ...inputRoom,
    mode: "collective",
    type: inputRoom.type || inputRoom.claim_type || "",
    subtype: inputRoom.subtype || inputRoom.claim_subtype || "",
    totalParticipants,
    max_members: totalParticipants,
    ownerParticipantId: inputRoom.ownerParticipantId || `owner:${inputRoom.room_id}`,
  };
  const legacy = deduplicateLegacyMembers(inputRoom.members);
  const owner = legacy.find(member => getParticipantRole(member) === "owner");
  const participants = legacy
    .filter(member => getParticipantRole(member) !== "owner")
    .sort((a, b) => Number(a.slotIndex || Infinity) - Number(b.slotIndex || Infinity));

  room.members = Array.from({ length: totalParticipants }, (_, offset) => {
    const slotIndex = offset + 1;
    const existing = slotIndex === 1 ? owner : participants[offset - 1];
    const base = createSlot(room, slotIndex);
    if (!existing) return base;
    return {
      ...base,
      ...existing,
      id: base.id,
      role: base.role,
      slotIndex,
      label: base.label,
      participantId: slotIndex === 1
        ? room.ownerParticipantId
        : (existing.participantId || null),
      status: isCompletedParticipant(existing) ? "completed" : "pending",
      completedAt: isCompletedParticipant(existing) ? (existing.completedAt || null) : null,
      claimantData: existing.claimantData || {},
      circumstancesData: existing.circumstancesData || {},
      evidenceData: existing.evidenceData || {},
    };
  });
  room.current_members = room.members.filter(isCompletedParticipant).length;
  return room;
}

function readRooms() {
  return readLocal(ROOMS_KEY, []);
}

export function listRooms() {
  return readRooms().map(normalizeRoom);
}

export function getRoom(roomId) {
  return listRooms().find(room => room.room_id === roomId) || null;
}

export function createRoom(data) {
  const roomId = data.room_id || createLocalId("room");
  const now = new Date().toISOString();
  const room = normalizeRoom({
    ...data,
    room_id: roomId,
    id: data.id || createLocalId("room"),
    ownerParticipantId: data.ownerParticipantId || `owner:${roomId}`,
    totalParticipants: Number(data.totalParticipants || data.max_members),
    members: data.members || [],
    createdAt: data.createdAt || now,
    created_date: data.created_date || now,
    updatedAt: now,
  });
  if (writeLocal(ROOMS_KEY, [...readRooms(), room]) === null) throw new Error("ROOM_SAVE_FAILED");
  return room;
}

export function updateRoom(idOrRoomId, updates) {
  let updated = null;
  const now = new Date().toISOString();
  const rooms = readRooms().map(rawRoom => {
    if (rawRoom.id !== idOrRoomId && rawRoom.room_id !== idOrRoomId) return rawRoom;
    updated = normalizeRoom({ ...rawRoom, ...updates, updatedAt: now, updated_date: now });
    return updated;
  });
  if (writeLocal(ROOMS_KEY, rooms) === null) throw new Error("ROOM_UPDATE_FAILED");
  return updated;
}

export function getRoomParticipants(room) {
  return normalizeRoom(room)?.members || [];
}

export function getCompletedParticipants(room) {
  return getRoomParticipants(room).filter(isCompletedParticipant);
}

export function getParticipant(room, participantId) {
  if (!participantId) return null;
  return getRoomParticipants(room).find(member => member.participantId === participantId || member.id === participantId) || null;
}

export function claimParticipantSlot(roomId, participantId) {
  const room = getRoom(roomId);
  if (!room || !participantId) return null;
  const existing = getParticipant(room, participantId);
  if (existing) return existing;

  const members = getRoomParticipants(room);
  const slot = members.find(member => member.role === "participant" && !member.participantId && member.status === "pending");
  if (!slot) return null;
  const nextMembers = members.map(member => member.id === slot.id ? { ...member, participantId } : member);
  const updated = updateRoom(roomId, { members: nextMembers });
  return getParticipant(updated, participantId);
}

export function addParticipant(roomId, participant) {
  const room = getRoom(roomId);
  if (!room) return null;
  const members = getRoomParticipants(room);
  const role = getParticipantRole(participant);
  let existingIndex = role === "owner"
    ? members.findIndex(member => member.role === "owner")
    : members.findIndex(member => member.role === "participant" && (
      member.participantId === participant.participantId || member.id === participant.participantId
    ));

  if (existingIndex < 0 && role === "participant" && participant.participantId) {
    const freeIndex = members.findIndex(member => member.role === "participant" && !member.participantId && member.status === "pending");
    if (freeIndex >= 0) {
      members[freeIndex] = { ...members[freeIndex], participantId: participant.participantId };
      existingIndex = freeIndex;
    }
  }
  if (existingIndex < 0) return room;

  const existing = members[existingIndex];
  const status = participant.status === "completed" ? "completed" : existing.status;
  members[existingIndex] = {
    ...existing,
    ...participant,
    id: existing.id,
    participantId: existing.participantId || participant.participantId,
    role: existing.role,
    slotIndex: existing.slotIndex,
    label: existing.label,
    status,
    claimantData: participant.claimantData || existing.claimantData || {},
    circumstancesData: participant.circumstancesData || existing.circumstancesData || {},
    evidenceData: participant.evidenceData || existing.evidenceData || {},
    completedAt: status === "completed" ? (participant.completedAt || existing.completedAt || new Date().toISOString()) : null,
  };
  return updateRoom(roomId, { members });
}
