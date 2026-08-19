import { createLocalId, readLocal, writeLocal } from "./localStorageService";
import { getCurrentUser } from "./authService";

const DOCUMENTS_KEY = "documents";
const GUEST_DOCUMENTS_KEY = "guest-documents";
const ownerOf = document => document.ownerUserId || document.created_by_id || null;

export function listAllDocuments() {
  return readLocal(DOCUMENTS_KEY, []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
}

export function listDocuments({ userId, limit } = {}) {
  const ownerId = userId || getCurrentUser()?.id;
  if (!ownerId) return [];
  const documents = readLocal(DOCUMENTS_KEY, [])
    .filter(document => ownerOf(document) === ownerId)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  return limit ? documents.slice(0, limit) : documents;
}

export function createDocument(data, user = getCurrentUser()) {
  const now = new Date().toISOString();
  if (!user) {
    const drafts = readLocal(GUEST_DOCUMENTS_KEY, []);
    const draft = { ...data, id: createLocalId("guest-document"), status: "draft", isGuestDraft: true, created_date: now };
    if (writeLocal(GUEST_DOCUMENTS_KEY, [...drafts, draft]) === null) throw new Error("DOCUMENT_SAVE_FAILED");
    return draft;
  }
  const documents = readLocal(DOCUMENTS_KEY, []);
  const document = {
    ...data,
    id: createLocalId("document"),
    ownerUserId: user.id,
    created_by_id: user.id,
    created_by: user.email,
    created_date: now,
  };
  if (writeLocal(DOCUMENTS_KEY, [...documents, document]) === null) throw new Error("DOCUMENT_SAVE_FAILED");
  return document;
}

export function updateDocument(id, updates) {
  const user = getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  const forbidden = new Set(["ownerUserId", "created_by_id", "created_by"]);
  const safeUpdates = Object.fromEntries(Object.entries(updates || {}).filter(([key]) => !forbidden.has(key)));
  let updated = null;
  let found = false;
  const documents = readLocal(DOCUMENTS_KEY, []).map(document => {
    if (document.id !== id) return document;
    found = true;
    if (ownerOf(document) !== user.id) throw new Error("DOCUMENT_FORBIDDEN");
    updated = { ...document, ...safeUpdates, updated_date: new Date().toISOString() };
    return updated;
  });
  if (!found) throw new Error("DOCUMENT_NOT_FOUND");
  if (writeLocal(DOCUMENTS_KEY, documents) === null) throw new Error("DOCUMENT_UPDATE_FAILED");
  return updated;
}

export function deleteDocument(id) {
  const user = getCurrentUser();
  if (!user) {
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
  if (writeLocal(DOCUMENTS_KEY, documents.filter(item => item.id !== id)) === null) throw new Error("DOCUMENT_DELETE_FAILED");
  return document;
}
