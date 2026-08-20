import { publicRestRequest, restRequest } from "@/lib/supabaseRest";

export async function getOwnSellerProfile(userId) {
  if (!userId) return null;
  const rows = await restRequest(`seller_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function updateOwnSellerProfile(userId, updates = {}) {
  if (!userId) throw new Error("AUTH_REQUIRED");
  const allowed = {};
  if (updates.displayName !== undefined) allowed.display_name = String(updates.displayName).trim();
  if (updates.headline !== undefined) allowed.headline = String(updates.headline).trim();
  if (updates.bio !== undefined) allowed.bio = String(updates.bio).trim();
  if (updates.specializations !== undefined) allowed.specializations = Array.isArray(updates.specializations) ? updates.specializations.map(x => String(x).trim()).filter(Boolean).slice(0, 12) : [];
  if (updates.avatarUrl !== undefined) allowed.avatar_url = updates.avatarUrl ? String(updates.avatarUrl).trim() : null;
  if (updates.priceFrom !== undefined) allowed.price_from = updates.priceFrom === "" || updates.priceFrom == null ? null : Math.max(0, Number(updates.priceFrom) || 0);
  const rows = await restRequest(`seller_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: allowed, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function getPublicSellerProfile(userId) {
  if (!userId) return null;
  const rows = await publicRestRequest(`seller_profiles?user_id=eq.${encodeURIComponent(userId)}&verification_status=eq.approved&is_public=eq.true&select=user_id,display_name,headline,bio,specializations,avatar_url,rating,reviews_count,completed_orders,price_from,created_at`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function listPublicSellers(limit = 24) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 24));
  const rows = await publicRestRequest(`seller_profiles?verification_status=eq.approved&is_public=eq.true&select=user_id,display_name,headline,bio,specializations,avatar_url,rating,reviews_count,completed_orders,price_from&order=rating.desc,reviews_count.desc&limit=${safeLimit}`);
  return Array.isArray(rows) ? rows : [];
}

export async function listPublicSellerItems(userId) {
  if (!userId) return [];
  const rows = await publicRestRequest(`catalog_items?provider_id=eq.${encodeURIComponent(userId)}&provider_type=eq.specialist&status=eq.published&select=*&order=featured.desc,sort_order.asc,created_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

export async function listOwnCatalogItems(userId) {
  if (!userId) return [];
  const rows = await restRequest(`catalog_items?provider_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

export async function createSellerServiceDraft(userId, service = {}) {
  if (!userId) throw new Error("AUTH_REQUIRED");
  const title = String(service.title || "").trim();
  const description = String(service.description || "").trim();
  const price = Math.max(0, Number(service.price || 0));
  if (title.length < 5 || description.length < 15 || price <= 0) throw new Error("INVALID_SERVICE");
  const slug = `service-${String(userId).slice(0,8)}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const rows = await restRequest("catalog_items", {
    method: "POST",
    body: {
      slug,
      item_type: "service",
      title,
      short_description: description,
      description,
      category: service.directionSlug || "other",
      provider_type: "specialist",
      provider_id: userId,
      price_rub: price,
      price_type: "from",
      formats: [],
      tags: [],
      status: "draft",
      featured: false,
      metadata: {
        material_type: "service",
        delivery_time: String(service.deliveryTime || "").trim(),
        what_included: String(service.whatIncluded || "").trim(),
        requirements: String(service.requirements || "").trim(),
        customer_confirmation_required: true,
      },
    },
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function submitCatalogItemForReview(itemId, userId) {
  if (!itemId || !userId) throw new Error("REQUIRED_FIELDS");
  const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(itemId)}&provider_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: { status: "pending_review" }, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function returnCatalogItemToDraft(itemId, userId) {
  if (!itemId || !userId) throw new Error("REQUIRED_FIELDS");
  const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(itemId)}&provider_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: { status: "draft" }, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] || null : null;
}
