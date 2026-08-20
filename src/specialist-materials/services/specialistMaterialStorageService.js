import { deleteStorageObjects, downloadStorageObject, restRequest, uploadStorageObject } from "@/lib/supabaseRest";

const BUCKET = "seller-materials";

export const MATERIAL_TYPES = Object.freeze({ READY_FILE:"ready_file", ONLINE_FORM:"online_form", SERVICE:"service", GUIDE:"guide", BUNDLE:"bundle" });
export const MATERIAL_TYPE_LABELS = Object.freeze({ ready_file:"Готовый файл", online_form:"Онлайн-форма", service:"Услуга специалиста", guide:"Инструкция / чек-лист", bundle:"Пакет документов" });

function rowToMaterial(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: row.id,
    ownerId: row.provider_id,
    type: meta.material_type || MATERIAL_TYPES.READY_FILE,
    title: row.title || "",
    description: row.short_description || row.description || "",
    directionSlug: meta.direction_slug || row.category || "",
    sectionSlug: meta.section_slug || row.subcategory || "",
    categorySlug: meta.category_slug || "",
    situationSlug: meta.situation_slug || "",
    fileName: meta.file_name || "",
    fileMimeType: meta.file_mime_type || "application/octet-stream",
    fileSize: Number(meta.file_size || 0),
    storagePath: meta.storage_path || "",
    formats: Array.isArray(row.formats) ? row.formats : [],
    price: Number(row.price_rub || 0),
    isFree: row.price_type === "free",
    status: row.status || "draft",
    moderationStatus: row.status || "draft",
    whatIncluded: meta.what_included || "",
    suitableFor: meta.suitable_for || "",
    fillInstructions: meta.fill_instructions || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeName(name = "file") {
  return String(name).replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "file";
}

function slugFor(ownerId) {
  return `seller-${String(ownerId).slice(0,8)}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

export async function listSpecialistMaterials(ownerId) {
  if (!ownerId) return [];
  const rows = await restRequest(`catalog_items?provider_id=eq.${encodeURIComponent(ownerId)}&provider_type=eq.specialist&select=*&order=updated_at.desc`);
  return (Array.isArray(rows) ? rows : []).map(rowToMaterial).filter(item => item.type === MATERIAL_TYPES.READY_FILE);
}

export async function getSpecialistMaterial(materialId, ownerId) {
  if (!materialId || !ownerId) return null;
  const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(materialId)}&provider_id=eq.${encodeURIComponent(ownerId)}&select=*`);
  return rowToMaterial(Array.isArray(rows) ? rows[0] : null);
}

export async function getSpecialistMaterialFile(materialId, ownerId) {
  const material = await getSpecialistMaterial(materialId, ownerId);
  if (!material?.storagePath) return null;
  const blob = await downloadStorageObject(BUCKET, material.storagePath);
  return { materialId, ownerId, blob, name: material.fileName, mimeType: material.fileMimeType, size: material.fileSize };
}

export async function saveReadyFileMaterial({ ownerId, material, file }) {
  if (!ownerId) throw new Error("OWNER_REQUIRED");
  const existing = material.id ? await getSpecialistMaterial(material.id, ownerId) : null;
  if (!existing && !file) throw new Error("FILE_REQUIRED");

  const baseMetadata = {
    material_type: MATERIAL_TYPES.READY_FILE,
    direction_slug: material.directionSlug || "",
    section_slug: material.sectionSlug || "",
    category_slug: material.categorySlug || "",
    situation_slug: material.situationSlug || "",
    what_included: String(material.whatIncluded || "").trim(),
    suitable_for: String(material.suitableFor || "").trim(),
    fill_instructions: String(material.fillInstructions || "").trim(),
    storage_path: existing?.storagePath || null,
    file_name: existing?.fileName || null,
    file_mime_type: existing?.fileMimeType || null,
    file_size: existing?.fileSize || 0,
  };

  const rowBody = {
    title: String(material.title || "").trim(),
    short_description: String(material.description || "").trim(),
    description: String(material.description || "").trim(),
    category: material.directionSlug || null,
    subcategory: material.sectionSlug || null,
    item_type: "document",
    provider_type: "specialist",
    provider_id: ownerId,
    price_rub: material.isFree ? 0 : Math.max(0, Number(material.price || 0)),
    price_type: material.isFree ? "free" : "fixed",
    formats: existing?.formats || [],
    status: "draft",
    metadata: baseMetadata,
  };

  let row;
  if (existing) {
    const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(existing.id)}&provider_id=eq.${encodeURIComponent(ownerId)}`, { method:"PATCH", body:rowBody, prefer:"return=representation" });
    row = Array.isArray(rows) ? rows[0] : null;
  } else {
    const rows = await restRequest("catalog_items", { method:"POST", body:{ ...rowBody, slug:slugFor(ownerId) }, prefer:"return=representation" });
    row = Array.isArray(rows) ? rows[0] : null;
  }
  if (!row?.id) throw new Error("MATERIAL_SAVE_FAILED");

  if (file) {
    const path = `${ownerId}/${row.id}/${safeName(file.name)}`;
    await uploadStorageObject(BUCKET, path, file, { contentType:file.type || "application/octet-stream", upsert:true });
    if (existing?.storagePath && existing.storagePath !== path) await deleteStorageObjects(BUCKET, [existing.storagePath]).catch(()=>{});
    const extension = String(file.name).split(".").pop()?.toUpperCase();
    const metadata = { ...baseMetadata, storage_path:path, file_name:file.name, file_mime_type:file.type || "application/octet-stream", file_size:file.size };
    const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(row.id)}&provider_id=eq.${encodeURIComponent(ownerId)}`, { method:"PATCH", body:{ formats:extension ? [extension] : [], metadata }, prefer:"return=representation" });
    row = Array.isArray(rows) ? rows[0] : row;
  }

  return rowToMaterial(row);
}

export async function deleteDraftMaterial(materialId, ownerId) {
  const material = await getSpecialistMaterial(materialId, ownerId);
  if (!material || !["draft","rejected"].includes(material.status)) return false;
  if (material.storagePath) await deleteStorageObjects(BUCKET, [material.storagePath]).catch(()=>{});
  await restRequest(`catalog_items?id=eq.${encodeURIComponent(materialId)}&provider_id=eq.${encodeURIComponent(ownerId)}`, { method:"DELETE", prefer:"return=minimal" });
  return true;
}

export function materialToMarketplaceOffer(material, providerName = "Специалист") {
  if (!material || material.type !== MATERIAL_TYPES.READY_FILE) return null;
  return { id:material.id, type:"template", sourceMaterialType:MATERIAL_TYPES.READY_FILE, title:material.title, description:material.description, providerType:"specialist", providerName, price:material.price, priceType:material.isFree ? "free" : "fixed", formats:material.formats, cta:"Открыть карточку" };
}
