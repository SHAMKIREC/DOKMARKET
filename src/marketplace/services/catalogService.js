import { publicRestRequest } from "@/lib/supabaseRest";

const STOREFRONT_TYPE = { document:"ready_file", bundle:"bundle", smart_service:"platform_generator", specialist_service:"service", guide:"guide", online_form:"online_form" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, slug: row.slug,
    type: STOREFRONT_TYPE[row.item_type] || row.metadata?.material_type || row.item_type,
    databaseType: row.item_type,
    title: row.title,
    description: row.short_description || row.description || "",
    longDescription: row.description || row.short_description || "",
    category: row.category || "", subcategory: row.subcategory || "",
    providerType: row.provider_type || "platform", providerId: row.provider_id || null,
    providerName: row.metadata?.provider_name || (row.provider_type === "platform" ? "ДокМаркет" : "Селлер ДокМаркета"),
    price: Number(row.price_rub || 0), priceType: row.price_type || "fixed",
    formats: Array.isArray(row.formats) ? row.formats : [], tags: Array.isArray(row.tags) ? row.tags : [],
    featured: Boolean(row.featured), badge: row.metadata?.badge || "",
    whatIncluded: row.metadata?.what_included || "", suitableFor: row.metadata?.suitable_for || "", usage: row.metadata?.fill_instructions || "",
    materialType: row.metadata?.material_type || "", route: row.metadata?.route || `/market/offer/${row.id}`,
    actionUrl: row.metadata?.action_route || row.metadata?.route || `/market/offer/${row.id}`, createdAt: row.created_at,
  };
}

export async function loadPublishedCatalog() {
  const rows = await publicRestRequest("catalog_items?status=eq.published&select=*&order=featured.desc,sort_order.asc,created_at.desc");
  return (Array.isArray(rows) ? rows : []).map(mapRow);
}

export async function loadPublishedCatalogItem(idOrSlug) {
  if (!idOrSlug) return null;
  const raw = String(idOrSlug);
  const q = encodeURIComponent(raw);
  const path = UUID_RE.test(raw)
    ? `catalog_items?status=eq.published&id=eq.${q}&select=*`
    : `catalog_items?status=eq.published&slug=eq.${q}&select=*`;
  const rows = await publicRestRequest(path);
  const item = mapRow(Array.isArray(rows) ? rows[0] : null);
  if (!item?.providerId || item.providerType !== "specialist") return item;
  try {
    const sellers = await publicRestRequest(`seller_profiles?user_id=eq.${encodeURIComponent(item.providerId)}&verification_status=eq.approved&is_public=eq.true&select=display_name,headline,rating,reviews_count,user_id`);
    const seller = Array.isArray(sellers) ? sellers[0] : null;
    if (seller) { item.seller = seller; item.providerName = seller.display_name || item.providerName; }
  } catch {}
  return item;
}
