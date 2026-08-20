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

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "assistant_not_configured" }, 503);

  try {
    const payload = await req.json();
    const message = String(payload?.message || "").trim().slice(0, 3000);
    const history = Array.isArray(payload?.history) ? payload.history.slice(-8) : [];
    const catalog = Array.isArray(payload?.catalog) ? payload.catalog.slice(0, 40) : [];
    if (!message) return json({ error: "empty_message" }, 400);

    const safeHistory = history.map((item: any) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: String(item?.content || "").slice(0, 1500),
    }));
    const catalogText = catalog.map((item: any) => ({
      id: String(item?.id || ""), title: String(item?.title || item?.name || ""),
      type: String(item?.type || ""), description: String(item?.description || item?.profession || ""),
    }));

    const input = [
      { role: "system", content: SYSTEM },
      ...safeHistory,
      { role: "user", content: `Доступный каталог: ${JSON.stringify(catalogText)}\n\nСообщение пользователя: ${message}` },
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
