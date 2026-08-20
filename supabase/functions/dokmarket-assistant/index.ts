import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `Ты — помощник ДокМаркета. ДокМаркет помогает выбрать документы, умные сервисы и специалистов. Досудебка — отдельный сервис внутри ДокМаркета.
Отвечай по-русски, коротко и простыми словами. Не выдавай себя за адвоката и не обещай юридический результат. Не придумывай документы, цены, специалистов, рейтинги или факты, которых нет в переданном каталоге.
Твоя задача — понять ситуацию, при необходимости задать один короткий уточняющий вопрос и предложить следующий шаг внутри ДокМаркета.
Если подходит Досудебка, используй route /dosudebka. Для каталога route /market. Для специалистов route /market#specialists.
Верни только JSON без markdown: {"reply":"...","route":"/...","cta":"...","intent":"labor|consumer|course|debt|document|specialist|unknown","search":"короткая строка для поиска по каталогу"}.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}

async function loadPublishedCatalog(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const apiKey = Deno.env.get("SUPABASE_ANON_KEY") || (() => {
    try {
      const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
      return keys.default || "";
    } catch {
      return "";
    }
  })();
  const authorization = req.headers.get("Authorization") || "";
  if (!url || !apiKey || !authorization) return [];

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/catalog_items?status=eq.published&select=id,slug,item_type,title,short_description,description,category,subcategory,platform_service_id,provider_type,price_rub,price_type,formats,tags,featured,metadata&order=featured.desc,sort_order.asc&limit=60`,
    {
      headers: {
        apikey: apiKey,
        Authorization: authorization,
      },
    },
  );

  if (!response.ok) {
    console.error("Catalog load failed", response.status, await response.text());
    return [];
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows.map((item: any) => ({
    id: String(item?.id || ""),
    slug: String(item?.slug || ""),
    title: String(item?.title || ""),
    type: String(item?.item_type || ""),
    description: String(item?.short_description || item?.description || "").slice(0, 1000),
    category: String(item?.category || ""),
    subcategory: String(item?.subcategory || ""),
    providerType: String(item?.provider_type || ""),
    priceRub: Number.isFinite(Number(item?.price_rub)) ? Number(item.price_rub) : null,
    priceType: String(item?.price_type || ""),
    formats: Array.isArray(item?.formats) ? item.formats.slice(0, 10) : [],
    tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20) : [],
    route: String(item?.metadata?.route || "/market"),
    actionRoute: String(item?.metadata?.action_route || item?.metadata?.route || "/market"),
  }));
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "assistant_not_configured" }, 503);

  try {
    const payload = await req.json();
    const message = String(payload?.message || "").trim().slice(0, 3000);
    const history = Array.isArray(payload?.history) ? payload.history.slice(-8) : [];
    if (!message) return json({ error: "empty_message" }, 400);

    const safeHistory = history.map((item: any) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").slice(0, 1500),
    }));
    const catalog = await loadPublishedCatalog(req);

    const input = [
      { role: "system", content: SYSTEM },
      ...safeHistory,
      { role: "user", content: `Актуальный опубликованный каталог ДокМаркета из базы: ${JSON.stringify(catalog)}\n\nСообщение пользователя: ${message}` },
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("OPENAI_ASSISTANT_MODEL") || "gpt-5.6-luna", input, max_output_tokens: 500 }),
    });
    if (!response.ok) {
      console.error("OpenAI error", response.status, await response.text());
      return json({ error: "assistant_upstream_error" }, 502);
    }
    const data = await response.json();
    const text = (data?.output || []).flatMap((item: any) => item?.content || []).find((part: any) => part?.type === "output_text")?.text || "";
    let result: any;
    try { result = JSON.parse(text); } catch { result = { reply: text || "Не удалось разобрать ответ. Опишите ситуацию ещё раз.", intent: "unknown", search: "" }; }
    return json({
      reply: String(result.reply || "Опишите ситуацию чуть подробнее."),
      route: String(result.route || "/#smart-find"),
      cta: String(result.cta || "Показать варианты"),
      intent: String(result.intent || "unknown"),
      search: String(result.search || message).slice(0, 200),
    });
  } catch (error) {
    console.error(error);
    return json({ error: "assistant_failed" }, 500);
  }
});
