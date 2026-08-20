import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
  const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");
  if (!shopId || !secretKey) return new Response("provider not configured", { status: 503 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const paymentId = body?.object?.id;
  if (!paymentId) return new Response("ok", { status: 200 });

  const providerResponse = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${shopId}:${secretKey}`)}` },
  });
  if (!providerResponse.ok) return new Response("provider verify failed", { status: 502 });

  const payment = await providerResponse.json();
  const status = payment.status || "pending";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  await supabase.from("payments").update({
    status,
    provider_payload: payment,
    confirmation_url: payment.confirmation?.confirmation_url || null,
    paid_at: status === "succeeded" ? new Date().toISOString() : null,
  }).eq("provider_payment_id", paymentId);

  return new Response("ok", { status: 200 });
});
