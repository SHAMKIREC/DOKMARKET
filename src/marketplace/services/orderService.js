import { restRequest } from "@/lib/supabaseRest";

function totalOf(items = []) {
  return items.reduce((sum, item) => sum + Number(item.price || 0), 0);
}

export async function createDraftOrder(userId, items = []) {
  if (!userId) throw new Error("AUTH_REQUIRED");
  if (!items.length) throw new Error("EMPTY_ORDER");
  const total = totalOf(items);
  const hasServices = items.some(item => item.type === "service");
  const hasDocuments = items.some(item => item.type !== "service");
  const rows = await restRequest("orders", {
    method: "POST",
    body: {
      user_id: userId,
      status: "draft",
      currency: "RUB",
      subtotal: total,
      discount: 0,
      total,
      metadata: {
        source: "web_cart",
        marketplace: true,
        has_services: hasServices,
        has_documents: hasDocuments,
        payment_status: "not_connected",
        fulfillment_status: "awaiting_checkout",
        customer_confirmation_required: hasServices,
      },
    },
    prefer: "return=representation",
  });
  const order = Array.isArray(rows) ? rows[0] : null;
  if (!order?.id) throw new Error("ORDER_CREATE_FAILED");

  const payload = items.map(item => ({
    order_id: order.id,
    item_type: item.type || "document",
    title_snapshot: item.title || "Позиция ДокМаркет",
    provider_snapshot: item.providerName || "ДокМаркет",
    unit_price: Number(item.price || 0),
    quantity: 1,
    line_total: Number(item.price || 0),
    configuration: {
      offerId: item.offerId || item.id || null,
      serviceId: item.serviceId || null,
      specialistId: item.specialistId || null,
      providerType: item.providerType || "platform",
      formats: item.formats || [],
      actionUrl: item.actionUrl || null,
      priceType: item.priceType || "fixed",
      fulfillment: item.type === "service" ? "specialist_order" : "digital_delivery",
      customer_confirmation_required: item.type === "service",
    },
  }));
  await restRequest("order_items", { method: "POST", body: payload, prefer: "return=minimal" });
  return order;
}

export async function listOrders(userId) {
  if (!userId) return [];
  const rows = await restRequest(`orders?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`);
  return Array.isArray(rows) ? rows : [];
}
