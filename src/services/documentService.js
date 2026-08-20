import { readLocal, writeLocal } from "./localStorageService";
import { getCurrentUser } from "./authService";
import { restRequest } from "@/lib/supabaseRest";

const DOCUMENTS_KEY = "documents";
const GUEST_DOCUMENTS_KEY = "guest-documents";
const ownerOf = document => document.ownerUserId || document.owner_id || document.created_by_id || null;

function localUuid(prefix = "document") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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
    platformServiceId: row.platform_service_id || "dosudebka",
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
  if (updates.platformServiceId !== undefined) mapped.platform_service_id = updates.platformServiceId || "dosudebka";
  if (updates.platform_service_id !== undefined) mapped.platform_service_id = updates.platform_service_id || "dosudebka";
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.expires_at !== undefined) mapped.expires_at = updates.expires_at;
  if (updates.sentAt !== undefined) mapped.sent_at = updates.sentAt;
  if (updates.sent_date !== undefined) mapped.sent_at = updates.sent_date;
  if (updates.sentMethod !== undefined) mapped.sent_method = updates.sentMethod || "";
  if (updates.responseDueAt !== undefined) mapped.response_due_at = updates.responseDueAt;
  return mapped;
}

function saveDocuments(documents) {
  if (writeLocal(DOCUMENTS_KEY, documents) === null) throw new Error("DOCUMENT_SAVE_FAILED");
  return documents;
}

export async function syncDocumentsFromServer(userId = getCurrentUser()?.id) {
  if (!userId) return [];
  const rows = await restRequest(`documents?owner_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=500`);
  const remote = Array.isArray(rows) ? rows.map(hydrateDocument) : [];
  const existing = readLocal(DOCUMENTS_KEY, []).filter(document => ownerOf(document) !== userId);
  saveDocuments([...existing, ...remote]);
  return remote;
}

export function listAllDocuments() {
  return readLocal(DOCUMENTS_KEY, []).sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0));
}

export function listDocuments({ userId, limit, platformServiceId } = {}) {
  const ownerId = userId || getCurrentUser()?.id;
  if (!ownerId) return [];
  const documents = readLocal(DOCUMENTS_KEY, [])
    .filter(document => ownerOf(document) === ownerId)
    .filter(document => !platformServiceId || (document.platformServiceId || document.platform_service_id || "dosudebka") === platformServiceId)
    .sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0));
  return limit ? documents.slice(0, limit) : documents;
}

export function createDocument(data, user = getCurrentUser()) {
  const now = new Date().toISOString();
  const platformServiceId = data.platformServiceId || data.platform_service_id || "dosudebka";
  if (!user?.id) {
    const drafts = readLocal(GUEST_DOCUMENTS_KEY, []);
    const draft = { ...data, platformServiceId, platform_service_id: platformServiceId, id: localUuid("guest-document"), status: "draft", isGuestDraft: true, created_date: now };
    if (writeLocal(GUEST_DOCUMENTS_KEY, [...drafts, draft]) === null) throw new Error("DOCUMENT_SAVE_FAILED");
    return draft;
  }

  const claimData = data.claim_data || data.claimData || {};
  const modeRaw = data.mode || claimData.mode || "solo";
  const id = localUuid();
  const document = {
    ...data,
    id,
    owner_id: user.id,
    ownerUserId: user.id,
    created_by_id: user.id,
    created_by: user.email,
    platformServiceId,
    platform_service_id: platformServiceId,
    type: normalizeType(data.type || claimData.type),
    subtype: data.subtype || claimData.subtype || "",
    mode: modeRaw === "individual" ? "solo" : modeRaw,
    respondent_name: data.respondent_name || claimData.employer?.name || claimData.respondent?.name || "",
    claim_data: claimData,
    claimData,
    status: data.status || "ready",
    created_at: now,
    created_date: now,
    createdAt: now,
    updated_at: now,
  };
  saveDocuments([...readLocal(DOCUMENTS_KEY, []), document]);

  restRequest("documents", {
    method: "POST",
    body: {
      id,
      owner_id: user.id,
      platform_service_id: platformServiceId,
      type: document.type,
      subtype: document.subtype,
      mode: document.mode,
      respondent_name: document.respondent_name,
      claim_data: claimData,
      status: document.status,
    },
    prefer: "return=minimal",
  }).catch(error => console.error("Supabase document insert failed", error));

  return document;
}

export function updateDocument(id, updates) {
  const user = getCurrentUser();
  if (!user?.id) throw new Error("AUTH_REQUIRED");
  let updated = null;
  let found = false;
  const documents = readLocal(DOCUMENTS_KEY, []).map(document => {
    if (document.id !== id) return document;
    found = true;
    if (ownerOf(document) !== user.id) throw new Error("DOCUMENT_FORBIDDEN");
    updated = { ...document, ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
    return updated;
  });
  if (!found) throw new Error("DOCUMENT_NOT_FOUND");
  saveDocuments(documents);

  restRequest(`documents?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    body: dbUpdates(updates),
    prefer: "return=minimal",
  }).catch(error => console.error("Supabase document update failed", error));
  return updated;
}

export function deleteDocument(id) {
  const user = getCurrentUser();
  if (!user?.id) {
    const guestDocuments = readLocal(GUEST_DOCUMENTS_KEY, []);
    const guestDocument = guestDocuments.find(item => item.id === id);
    if (!guestDocument || !guestDocument.isGuestDraft) throw new Error("DOCUMENT_NOT_FOUND");
    if (writeLocal(GUEST_DOCUMENTS_KEY, guestDocuments.filter(item => item.id !== id)) === null) throw new Error("DOCUMENT_DELETE_FAILED");
    return guestDocument;
  }
  const documents = readLocal(DOCUMENTS_KEY, []);
  const document = documents.find(item => item.id === id);
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  if (ownerOf(document) !== user.id) throw new Error("DOCUMENT_FORBIDDEN");
  saveDocuments(documents.filter(item => item.id !== id));

  restRequest(`documents?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(user.id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  }).catch(error => console.error("Supabase document delete failed", error));
  return document;
}
