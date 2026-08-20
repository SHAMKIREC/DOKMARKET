import { publicRestRequest } from "@/lib/supabaseRest";

export async function loadPublishedCatalog() {
  const rows = await publicRestRequest("catalog_items?status=eq.published&select=*&order=featured.desc,sort_order.asc,created_at.desc");
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    type: row.item_type,
    title: row.title,
    description: row.short_description || row.description || "",
    category: row.category || "",
    subcategory: row.subcategory || "",
    providerType: row.provider_type || "platform",
    providerName: row.metadata?.provider_name || (row.provider_type === "platform" ? "ДокМаркет" : "Специалист"),
    price: Number(row.price_rub || 0),
    priceType: row.price_type || "fixed",
    formats: Array.isArray(row.formats) ? row.formats : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    featured: Boolean(row.featured),
    badge: row.metadata?.badge || "",
    route: row.metadata?.route || `/market/offer/${row.slug}`,
    actionUrl: row.metadata?.action_route || row.metadata?.route || `/market/offer/${row.slug}`,
  }));
}
