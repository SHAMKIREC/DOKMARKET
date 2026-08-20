import { createLocalId, readLocal, writeLocal } from "./localStorageService";
import { getCurrentUser } from "./authService";
import { restRequest } from "@/lib/supabaseRest";

const GUEST_DOCUMENTS_KEY = "guest-documents";

function hydrateDocument(row = {}) {
  return {
    ...row,
    ownerUserId: row.owner_id,
    created_by_id: row.owner_id,
    created_date: row.created_at,
    createdAt: row.created_at,
    updated_date: row.updated_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    sent_date: row.sent_at,
    sentMethod: row.sent_method,
    responseDueAt: row.response_due_at,
    claimData: row.claim_data,
  };
}

function normalizeType(type) {
  if (type === "infoproduct") return "course";
  if (type === "civil") return "debt";
  return type;
}

function dbUpdates(updates = {}) {
  const mapped = {};
  if (updates.type !== undefined) mapped.type = normalizeType(updates.type);
  if (updates.subtype !== undefined) mapped.subtype = updates.subtype || "";
  if (updates.mode !== undefined) mapped.mode = updates.mode === "individual" ? "solo" : updates.mode;
  if (updates.respondent_name !== undefined) mapped.respondent_name = updates.respondent_name || "";
  if (updates.claim_data !== undefined) mapped.claim_data = updates.claim_data || {};
  if (updates.claimData !== undefined) mapped.claim_data = updates.claimData || {};
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.expires_at !== undefined) mapped.expires_at = updates.expires_at;
  if (updates.sentAt !== undefined) mapped.sent_at = updates.sentAt;
  if (updates.sent_date !== undefined) mapped.sent_at = updates.sent_date;
  if (updates.sentMethod !== undefined) mapped.sent_method = updates.sentMethod || "";
  if (updates.responseDueAt !== undefined) mapped.response_due_at = updates.responseDueAt;
  return mapped;
}

export async function listAllDocuments() {
  const user = getCurrentUser();
  if (!user?.id) return [];
  return listDocuments({ userId: user.id });
}

export async function listDocuments({ userId, limit } = {}) {
  const ownerId = userId || getCurrentUser()?.id;
  if (!ownerId) return [];
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const rows = await restRequest(`documents?owner_id=eq.${encodeURIComponent(ownerId)}&select=*&order=created_at.desc&limit=${safeLimit}`);
  return Array.isArray(rows) ? rows.map(hydrateDocument) : [];
}

export async function createDocument(data, user = getCurrentUser()) {
  const now = new Date().toISOString();
  if (!user?.id) {
    const drafts = readLocal(GUEST_DOCUMENTS_KEY, []);
    const draft = { ...data, id: createLocalId("guest-document"), status: "draft", isGuestDraft: true, created_date: now };
    if (writeLocal(GUEST_DOCUMENTS_KEY, [...drafts, draft]) === null) throw new Error("DOCUMENT_SAVE_FAILED");
    return draft;
  }

  const claimData = data.claim_data || data.claimData || {};
  const mode = data.mode || claimData.mode || "solo";
  const payload = {
    owner_id: user.id,
    type: normalizeType(data.type || claimData.type),
    subtype: data.subtype || claimData.subtype || "",
    mode: mode === "individual" ? "solo" : mode,
    respondent_name: data.respondent_name || claimData.employer?.name || claimData.respondent?.name || "",
    claim_data: claimData,
    status: data.status || "ready",
  };

  const rows = await restRequest("documents", { method: "POST", body: payload, prefer: "return=representation" });
  if (!Array.isArray(rows) || !rows[0]) throw new Error("DOCUMENT_SAVE_FAILED");
  return hydrateDocument(rows[0]);
}

export async function updateDocument(id, updates) {
  const user = getCurrentUser();
  if (!user?.id) throw new Error("AUTH_REQUIRED");
  const payload = dbUpdates(updates);
  const rows = await restRequest(`documents?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    body: payload,
    prefer: "return=representation",
  });
  if (!Array.isArray(rows) || !rows[0]) throw new Error("DOCUMENT_NOT_FOUND");
  return hydrateDocument(rows[0]);
}

export async function deleteDocument(id) {
  const user = getCurrentUser();
  if (!user?.id) {
    const guestDocuments = readLocal(GUEST_DOCUMENTS_KEY, []);
    const guestDocument = guestDocuments.find(item => item.id === id);
    if (!guestDocument || !guestDocument.isGuestDraft) throw new Error("DOCUMENT_NOT_FOUND");
    if (writeLocal(GUEST_DOCUMENTS_KEY, guestDocuments.filter(item => item.id !== id)) === null) throw new Error("DOCUMENT_DELETE_FAILED");
    return guestDocument;
  }
  const rows = await restRequest(`documents?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(user.id)}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
  if (!Array.isArray(rows) || !rows[0]) throw new Error("DOCUMENT_NOT_FOUND");
  return hydrateDocument(rows[0]);
}
