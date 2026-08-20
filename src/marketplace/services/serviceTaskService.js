import { restRequest } from "@/lib/supabaseRest";

export async function createServiceTasks(order, items = []) {
  const serviceItems = items.filter(item => item.type === "service" && isUuid(item.sellerId || item.specialistUserId));
  if (!order?.id || !order?.user_id || !serviceItems.length) return [];
  const rows = serviceItems.map(item => ({
    order_id: order.id,
    buyer_id: order.user_id,
    seller_id: item.sellerId || item.specialistUserId,
    title: item.title || "Услуга специалиста",
    customer_note: item.customerNote || null,
    status: "new",
  }));
  const result = await restRequest("service_order_tasks", { method: "POST", body: rows, prefer: "return=representation" });
  return Array.isArray(result) ? result : [];
}

export async function listBuyerServiceTasks(userId) {
  if (!userId) return [];
  const rows = await restRequest(`service_order_tasks?buyer_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

export async function listSellerServiceTasks(userId) {
  if (!userId) return [];
  const rows = await restRequest(`service_order_tasks?seller_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`);
  return Array.isArray(rows) ? rows : [];
}

export async function updateSellerServiceTask(taskId, patch = {}) {
  const allowed = {};
  if (["accepted","in_progress","delivered","revision","cancelled"].includes(patch.status)) allowed.status = patch.status;
  if (typeof patch.seller_note === "string") allowed.seller_note = patch.seller_note.slice(0, 4000);
  if (typeof patch.result_text === "string") allowed.result_text = patch.result_text.slice(0, 12000);
  if (typeof patch.result_url === "string") allowed.result_url = patch.result_url.slice(0, 2000);
  const now = new Date().toISOString();
  if (patch.status === "accepted") allowed.accepted_at = now;
  if (patch.status === "in_progress") allowed.started_at = now;
  if (patch.status === "delivered") allowed.delivered_at = now;
  allowed.updated_at = now;
  const rows = await restRequest(`service_order_tasks?id=eq.${encodeURIComponent(taskId)}`, { method: "PATCH", body: allowed, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] : null;
}

export async function confirmServiceTask(taskId, action) {
  const rows = await restRequest("rpc/confirm_service_task", { method: "POST", body: { task_id: taskId, action }, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] : rows;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
