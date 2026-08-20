import { restRequest } from "@/lib/supabaseRest";

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
  const rows = await restRequest(`seller_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: allowed,
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function listOwnCatalogItems(userId) {
  if (!userId) return [];
  const rows = await restRequest(`catalog_items?provider_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

export async function submitCatalogItemForReview(itemId, userId) {
  if (!itemId || !userId) throw new Error("REQUIRED_FIELDS");
  const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(itemId)}&provider_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: { status: "pending_review" },
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function returnCatalogItemToDraft(itemId, userId) {
  if (!itemId || !userId) throw new Error("REQUIRED_FIELDS");
  const rows = await restRequest(`catalog_items?id=eq.${encodeURIComponent(itemId)}&provider_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: { status: "draft" },
    prefer: "return=representation",
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}
