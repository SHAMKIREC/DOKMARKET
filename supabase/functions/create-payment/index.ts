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

  const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
  const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");
  if (!shopId || !secretKey) return json({ error: "PAYMENT_PROVIDER_NOT_CONFIGURED" }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const mode = body?.mode === "collective" ? "collective" : "solo";
  const memberCount = mode === "collective" ? Math.max(2, Math.min(100, Number(body?.memberCount) || 2)) : 1;
  const amount = mode === "collective" ? memberCount * 790 : 800;
  const returnUrl = typeof body?.returnUrl === "string" && /^https:\/\//i.test(body.returnUrl) ? body.returnUrl : "https://dokmarket.vercel.app/generator";
  const category = ["labor", "product", "course", "debt"].includes(body?.category) ? body.category : "claim";
  const idempotencyKey = crypto.randomUUID();

  const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${shopId}:${secretKey}`)}`,
      "Idempotence-Key": idempotencyKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: returnUrl },
      description: mode === "collective" ? `Совместная претензия (${memberCount} заявителей)` : "Индивидуальная претензия",
      metadata: { product_code: "claim_document", mode, member_count: String(memberCount), category },
    }),
  });

  const payment = await paymentResponse.json();
  if (!paymentResponse.ok) return json({ error: "PROVIDER_ERROR", details: payment }, 502);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const clientToken = crypto.randomUUID();
  const { error: dbError } = await supabase.from("payments").insert({
    provider: "yookassa",
    provider_payment_id: payment.id,
    idempotency_key: idempotencyKey,
    client_token: clientToken,
    amount,
    currency: "RUB",
    status: payment.status || "pending",
    confirmation_url: payment.confirmation?.confirmation_url || null,
    provider_payload: payment,
    product_code: "claim_document",
    mode,
    member_count: memberCount,
  });
  if (dbError) return json({ error: "PAYMENT_SAVE_FAILED" }, 500);

  return json({ paymentId: payment.id, clientToken, status: payment.status, confirmationUrl: payment.confirmation?.confirmation_url || null, amount });
});
