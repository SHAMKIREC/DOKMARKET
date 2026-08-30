import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { askDocMarketAssistant } from "@/marketplace/services/assistantService";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";

const STORAGE_KEY = "dokmarket_assistant_context_v4";
const MAX_RESULTS = 3;
const quickActions = ["Не выплатили зарплату", "Хочу вернуть деньги", "Мне должны деньги", "Нужен специалист"];
const normalize = value => String(value || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9\s-]/gi, " ").replace(/\s+/g, " ").trim();

const PLATFORM_ITEMS = [
  {
    id: "platform-dosudebka",
    type: "service",
    title: "Досудебка",
    description: "Сервис ДокМаркета для подготовки досудебной претензии по ситуации пользователя: трудовой спор, возврат денег, долг и другие требования.",
    tags: ["претензия", "зарплата", "работодатель", "увольнение", "возврат денег", "товар", "услуга", "курс", "долг", "займ", "досудебка"],
    price: 490,
    actionUrl: "/dosudebka",
  },
  {
    id: "platform-construction-docs",
    type: "service",
    title: "Строительная документация",
    description: "ППР, акты, журналы и другие решения для строительной документации.",
    tags: ["строительство", "ппр", "акт", "журнал", "строительная документация"],
    actionUrl: "/construction-docs",
  },
];

const INTENT_TERMS = [
  { test: /зарплат|работодател|увол|трудов/, terms: ["зарплата", "работодатель", "трудовой", "увольнение", "претензия", "досудебка"] },
  { test: /вернут|возврат|товар|покупк|курс|услуг|деньг/, terms: ["возврат денег", "товар", "услуга", "курс", "покупка", "претензия", "досудебка"] },
  { test: /долг|должн|займ|расписк/, terms: ["долг", "займ", "расписка", "претензия", "досудебка"] },
  { test: /стро|ппр|журнал|акт/, terms: ["строительство", "ппр", "акт", "журнал"] },
  { test: /специалист|юрист|бухгалтер|консультац|помощ/, terms: ["специалист", "юрист", "бухгалтер", "услуга", "консультация"] },
];

function searchable(item) {
  return normalize([item.title, item.description, item.type, ...(item.tags || [])].join(" "));
}

function scoreItem(item, query) {
  const q = normalize(query);
  if (!q) return 0;
  const haystack = searchable(item);
  const words = q.split(" ").filter(word => word.length > 2);
  let score = 0;
  for (const word of words) {
    if (haystack.includes(word)) score += word.length > 6 ? 4 : 2;
    if (normalize(item.title).includes(word)) score += 3;
  }
  for (const rule of INTENT_TERMS) {
    if (rule.test.test(q)) {
      for (const term of rule.terms) if (haystack.includes(normalize(term))) score += 3;
    }
  }
  return score;
}

function findMatches(items, query) {
  const unique = new Map();
  [...PLATFORM_ITEMS, ...items].forEach(item => {
    const key = item.slug || item.id || item.title;
    if (!unique.has(key)) unique.set(key, item);
  });
  return [...unique.values()]
    .map(item => ({ item, score: scoreItem(item, query) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(entry => entry.item);
}

function localReply(query, matches) {
  const q = normalize(query);
  if (!matches.length) return "По этой формулировке я не нашёл точного решения среди доступных позиций. Опишите ситуацию чуть подробнее — что произошло и какой результат вам нужен.";
  if (/зарплат|работодател|увол|трудов/.test(q)) return "Похоже на трудовой спор. Нашёл наиболее подходящий вариант среди доступных решений ДокМаркета.";
  if (/вернут|возврат|товар|покупк|курс|услуг/.test(q)) return "Понял: нужен вариант для возврата денег или требования к продавцу/исполнителю. Вот подходящие решения из текущего каталога.";
  if (/долг|должн|займ|расписк/.test(q)) return "Похоже на вопрос по долгу. Ниже только те решения, которые реально доступны в ДокМаркете.";
  if (/специалист|юрист|бухгалтер|консультац/.test(q)) return "Ищу подходящую услугу или специалиста среди опубликованных предложений. Показываю только найденные варианты.";
  return `Нашёл ${matches.length === 1 ? "подходящий вариант" : "подходящие варианты"} по вашему описанию.`;
}

function toAiCatalog(catalog) {
  return [...PLATFORM_ITEMS, ...catalog].slice(0, 40).map(item => ({
    id: item.slug || item.id,
    kind: item.type,
    title: item.title,
    description: item.description,
    tags: item.tags,
    price: item.price,
    url: item.actionUrl || item.route || "/market",
  }));
}

export default function DocMarketAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved?.history)) setHistory(saved.history.slice(-8));
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    loadPublishedCatalog().then(items => { if (active) setCatalog(Array.isArray(items) ? items : []); }).catch(() => { if (active) setCatalog([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: history.slice(-8), updatedAt: Date.now() })); } catch {}
  }, [history]);

  const matches = useMemo(() => findMatches(catalog, submitted), [catalog, submitted]);

  async function ask(value = query) {
    const message = String(value || "").trim();
    if (!message || loading) return;
    setSubmitted(message);
    setQuery("");
    setLoading(true);
    const localMatches = findMatches(catalog, message);
    let text = localReply(message, localMatches);
    try {
      const data = await askDocMarketAssistant({ message, history, catalog: toAiCatalog(catalog) });
      const ai = data?.reply || data?.answer || data?.message || data?.text || data?.summary;
      if (typeof ai === "string" && ai.trim()) text = ai.trim();
    } catch {}
    setAnswerText(text);
    setHistory(previous => [...previous, { role: "user", content: message }, { role: "assistant", content: text }].slice(-8));
    setLoading(false);
  }

  function reset() {
    setQuery("");
    setSubmitted("");
    setAnswerText("");
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const pageHint = location.pathname.startsWith("/dosudebka")
    ? "Опишите ситуацию — я найду подходящий следующий вариант внутри ДокМаркета."
    : "Опишите проблему обычными словами. Я найду подходящий документ, сервис или специалиста среди того, что реально есть на сайте.";

  return <>
    <button className="dm-assistant-fab" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? "Закрыть помощника" : "Открыть помощника"}>
      <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"}`} /><span>Помощник</span>
    </button>
    {open && <aside className="dm-assistant" role="dialog" aria-label="Помощник ДокМаркета">
      <header>
        <div className="dm-assistant-logo">DM</div>
        <div><strong>Помощник ДокМаркета</strong><small>Ищет только среди доступных решений</small></div>
        <button className="dm-assistant-close" type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button>
      </header>
      <p className="dm-assistant-hint">{pageHint}</p>

      <div className="dm-chat-body">
        {!submitted && <div className="dm-chat-welcome">Что случилось? Напишите одним сообщением — например: «не выплатили зарплату», «хочу вернуть деньги за курс» или «нужен специалист».</div>}
        {submitted && <div className="dm-user-bubble">{submitted}</div>}
        {loading && <div className="dm-bot-bubble dm-loading">Ищу подходящие варианты…</div>}
        {!loading && answerText && <div className="dm-bot-bubble">{answerText}</div>}

        {!loading && submitted && matches.length > 0 && <div className="dm-match-list">
          {matches.map(item => {
            const to = item.actionUrl || item.route || "/market";
            const price = Number(item.price);
            return <Link className="dm-match-card" key={item.slug || item.id || item.title} to={to} onClick={() => setOpen(false)}>
              <div className="dm-match-type">{item.type === "service" ? "Сервис" : item.type === "specialist" ? "Специалист" : "Документ"}</div>
              <strong>{item.title}</strong>
              {item.description && <p>{String(item.description).slice(0, 125)}{String(item.description).length > 125 ? "…" : ""}</p>}
              <div className="dm-match-footer"><span>{Number.isFinite(price) && price > 0 ? `от ${price.toLocaleString("ru-RU")} ₽` : "Открыть"}</span><b>Открыть →</b></div>
            </Link>;
          })}
        </div>}
      </div>

      {!submitted && <div className="dm-assistant-chips">{quickActions.map(label => <button key={label} type="button" onClick={() => ask(label)}>{label}</button>)}</div>}
      {submitted && !loading && <button className="dm-reset" type="button" onClick={reset}>Новый вопрос</button>}

      <form onSubmit={event => { event.preventDefault(); ask(); }}>
        <textarea rows="2" value={query} onChange={event => setQuery(event.target.value)} placeholder="Опишите проблему…" />
        <button type="submit" disabled={loading || !query.trim()}>{loading ? "Ищу…" : "Отправить"}</button>
      </form>
    </aside>}
    <style>{`
      .dm-assistant-fab{position:fixed;right:18px;bottom:82px;z-index:1090;width:54px;height:54px;border:1px solid #825f32;border-radius:50%;background:linear-gradient(145deg,#dc8b2e,#a96623);color:#fff;display:grid;place-items:center;box-shadow:0 12px 28px #0008;cursor:pointer}.dm-assistant-fab span{display:none}.dm-assistant-fab i{font-size:18px}
      .dm-assistant{position:fixed;right:14px;bottom:145px;z-index:1089;width:min(430px,calc(100vw - 28px));max-height:min(650px,calc(100dvh - 175px));overflow:auto;box-sizing:border-box;padding:16px;border-radius:22px;background:#07111df7;border:1px solid #2c4050;color:#edf2f7;box-shadow:0 24px 80px #000a;backdrop-filter:blur(18px)}
      .dm-assistant header{display:grid;grid-template-columns:42px 1fr 34px;gap:11px;align-items:center}.dm-assistant-logo{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(145deg,#2c2117,#17130f);border:1px solid #6e4d2c;color:#e0a85e;font-weight:900}.dm-assistant header>div:nth-child(2){display:grid}.dm-assistant header strong{font-size:.95rem}.dm-assistant header small{font-size:.66rem;color:#8090a1;margin-top:2px}.dm-assistant-close{border:0;background:transparent;color:#9dacba;font-size:25px;cursor:pointer}.dm-assistant-hint{font-size:.75rem;line-height:1.45;color:#8f9eae;margin:12px 0}
      .dm-chat-body{display:grid;gap:10px}.dm-chat-welcome,.dm-bot-bubble,.dm-user-bubble{padding:12px 13px;border-radius:15px;font-size:.78rem;line-height:1.5}.dm-chat-welcome,.dm-bot-bubble{background:#0d1a27;border:1px solid #263b4c;color:#c4cfda}.dm-user-bubble{justify-self:end;max-width:88%;background:#20180f;border:1px solid #6e4b28;color:#f0d0a0}.dm-loading{opacity:.75}
      .dm-match-list{display:grid;gap:8px}.dm-match-card{display:grid;gap:5px;padding:12px;border:1px solid #2a4051;border-radius:15px;background:#0a1723;color:#eef3f7;text-decoration:none}.dm-match-type{font-size:.58rem;text-transform:uppercase;letter-spacing:.08em;color:#d5a15e;font-weight:900}.dm-match-card strong{font-size:.86rem}.dm-match-card p{margin:0;color:#8e9cad;font-size:.7rem;line-height:1.4}.dm-match-footer{display:flex;justify-content:space-between;align-items:center;margin-top:4px;color:#f3f5f7;font-size:.7rem}.dm-match-footer b{color:#dda25c}
      .dm-assistant-chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.dm-assistant-chips button,.dm-reset{border:1px solid #334858;border-radius:999px;background:#0a1621;color:#b9c5d1;padding:8px 10px;font-size:.68rem;cursor:pointer}.dm-reset{margin:11px 0 0}
      .dm-assistant form{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #1d3040}.dm-assistant textarea{box-sizing:border-box;width:100%;resize:none;padding:11px 12px;border-radius:13px;border:1px solid #304656;background:#0b1521;color:#fff;font:inherit;font-size:.78rem}.dm-assistant form button{align-self:stretch;padding:0 14px;border:1px solid #9b6628;border-radius:12px;background:linear-gradient(145deg,#e89a37,#bd7628);color:#101419;font-weight:900;cursor:pointer}.dm-assistant form button:disabled{opacity:.45;cursor:default}
      @media(max-width:760px){.dm-assistant-fab{right:17px;bottom:82px;width:52px;height:52px}.dm-assistant{left:9px;right:9px;bottom:143px;width:auto;max-height:calc(100dvh - 170px);padding:14px}.dm-assistant form{grid-template-columns:1fr auto}.dm-assistant textarea{min-height:48px}.dm-match-card{padding:11px}}
    `}</style>
  </>;
}
