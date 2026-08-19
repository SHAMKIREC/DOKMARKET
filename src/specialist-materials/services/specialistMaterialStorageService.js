import { createLocalId, readLocal, writeLocal } from "@/services/localStorageService";

const ITEMS_KEY = "specialistMaterials:items";
const FILES_KEY = "specialistMaterials:files";

export const MATERIAL_TYPES = Object.freeze({
  READY_FILE: "ready_file",
  ONLINE_FORM: "online_form",
  SERVICE: "service",
  GUIDE: "guide",
  BUNDLE: "bundle",
});

export const MATERIAL_TYPE_LABELS = Object.freeze({
  ready_file: "Готовый файл",
  online_form: "Онлайн-форма",
  service: "Услуга специалиста",
  guide: "Инструкция / чек-лист",
  bundle: "Пакет документов",
});

export function listSpecialistMaterials(ownerId) {
  return readLocal(ITEMS_KEY, [])
    .filter(item => !ownerId || item.ownerId === ownerId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getSpecialistMaterial(materialId, ownerId) {
  return listSpecialistMaterials(ownerId).find(item => item.id === materialId) || null;
}

export function getSpecialistMaterialFile(materialId, ownerId) {
  if (!getSpecialistMaterial(materialId, ownerId)) return null;
  return readLocal(FILES_KEY, []).find(file => file.materialId === materialId) || null;
}

export function saveReadyFileMaterial({ ownerId, material, file }) {
  if (!ownerId) throw new Error("OWNER_REQUIRED");
  if (!file?.base64) throw new Error("FILE_REQUIRED");
  const now = new Date().toISOString();
  const existing = material.id ? getSpecialistMaterial(material.id, ownerId) : null;
  const id = existing?.id || createLocalId("specialist-material");
  const item = {
    ...existing,
    ...material,
    id,
    ownerId,
    type: MATERIAL_TYPES.READY_FILE,
    fileName: file.name,
    fileMimeType: file.mimeType,
    fileSize: file.size,
    formats: [file.name.split(".").pop()?.toUpperCase()].filter(Boolean),
    price: material.isFree ? 0 : Number(material.price || 0),
    status: "draft",
    moderationStatus: "draft",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const items = readLocal(ITEMS_KEY, []);
  const files = readLocal(FILES_KEY, []);
  const nextItems = existing ? items.map(entry => entry.id === id ? item : entry) : [...items, item];
  const fileRecord = { materialId: id, ownerId, base64: file.base64, updatedAt: now };
  const nextFiles = files.some(entry => entry.materialId === id)
    ? files.map(entry => entry.materialId === id ? fileRecord : entry)
    : [...files, fileRecord];
  if (writeLocal(FILES_KEY, nextFiles) === null) throw new Error("MATERIAL_FILE_SAVE_FAILED");
  if (writeLocal(ITEMS_KEY, nextItems) === null) throw new Error("MATERIAL_SAVE_FAILED");
  return item;
}

export function deleteDraftMaterial(materialId, ownerId) {
  const material = getSpecialistMaterial(materialId, ownerId);
  if (!material || material.status !== "draft") return false;
  const items = readLocal(ITEMS_KEY, []).filter(item => item.id !== materialId);
  const files = readLocal(FILES_KEY, []).filter(file => file.materialId !== materialId);
  if (writeLocal(ITEMS_KEY, items) === null || writeLocal(FILES_KEY, files) === null) throw new Error("MATERIAL_DELETE_FAILED");
  return true;
}

export function materialToMarketplaceOffer(material, providerName = "Специалист") {
  if (!material || material.type !== MATERIAL_TYPES.READY_FILE) return null;
  return {
    id: material.id,
    type: "template",
    sourceMaterialType: MATERIAL_TYPES.READY_FILE,
    title: material.title,
    description: material.description,
    providerType: "specialist",
    providerName,
    price: material.price,
    priceType: material.isFree ? "free" : "fixed",
    formats: material.formats,
    cta: "Открыть карточку",
  };
}
