import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const clientToken = String(body?.clientToken || "");
  if (!/^[0-9a-f-]{36}$/i.test(clientToken)) return json({ error: "INVALID_TOKEN" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: row, error } = await supabase.from("payments").select("provider_payment_id,status,amount,currency,paid_at").eq("client_token", clientToken).maybeSingle();
  if (error || !row) return json({ error: "PAYMENT_NOT_FOUND" }, 404);

  const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
  const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");
  let status = row.status;
  if (shopId && secretKey && row.provider_payment_id && status !== "succeeded" && status !== "canceled") {
    const providerResponse = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(row.provider_payment_id)}`, {
      headers: { Authorization: `Basic ${btoa(`${shopId}:${secretKey}`)}` },
    });
    if (providerResponse.ok) {
      const payment = await providerResponse.json();
      status = payment.status || status;
      await supabase.from("payments").update({ status, provider_payload: payment, paid_at: status === "succeeded" ? new Date().toISOString() : row.paid_at }).eq("client_token", clientToken);
    }
  }

  return json({ status, paid: status === "succeeded", amount: row.amount, currency: row.currency });
});
