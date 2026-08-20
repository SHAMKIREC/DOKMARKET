import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { askDocMarketAssistant } from "@/marketplace/services/assistantService";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";

const STORAGE_KEY = "dokmarket_assistant_context_v3";
const quickActions = ["Не выплатили зарплату", "Вернуть деньги", "Мне должны деньги", "Найти специалиста"];
const normalize = value => String(value || "").toLowerCase().replace(/ё/g, "е").trim();

function localGuide(query) {
  const q = normalize(query);
  if (/зарплат|работодател|увол/.test(q)) return {
    title: "Похоже на трудовой спор",
    text: "Начните с Досудебки: она поможет собрать данные и подготовить претензию работодателю.",
    to: "/dosudebka",
    cta: "Открыть Досудебку",
    steps: [["1", "Откройте Досудебку", "/dosudebka"], ["2", "Выберите трудовой спор", "/Generator"], ["3", "Заполните обстоятельства", "/Generator"], ["4", "Проверьте документ", "/Generator"]],
  };
  if (/вернут.*деньг|курс|товар|покупк|услуг/.test(q)) return {
    title: "Помогу найти способ вернуть деньги",
    text: "Покажу доступный документ или сервис. Если подходящего решения пока нет, скажу об этом прямо.",
    to: "/market",
    cta: "Посмотреть каталог",
    steps: [["1", "Откройте каталог", "/market"], ["2", "Выберите ситуацию", "/market"], ["3", "Посмотрите карточку", "/market"], ["4", "Продолжите", "/market/cart"]],
  };
  if (/долг|должн|расписк|займ/.test(q)) return {
    title: "Похоже на спор по долгу",
    text: "Досудебка уже поддерживает споры по долгу и поможет собрать требование по вашим данным.",
    to: "/dosudebka",
    cta: "Начать",
    steps: [["1", "Откройте Досудебку", "/dosudebka"], ["2", "Выберите спор по долгу", "/Generator"], ["3", "Укажите сумму и доказательства", "/Generator"], ["4", "Получите документ", "/Generator"]],
  };
  if (/специалист|юрист|провер|консультац/.test(q)) return {
    title: "Ищу специалиста",
    text: "Сейчас в публичной базе нет подтверждённых специалистов. Когда появятся реальные профили, помощник покажет их здесь.",
    to: "/market",
    cta: "Открыть каталог",
    steps: [["1", "Откройте каталог", "/market"], ["2", "Посмотрите доступные решения", "/market"]],
  };
  return {
    title: "Помогу выбрать решение",
    text: "Опишите ситуацию своими словами. Я проверю текущий каталог и предложу доступный следующий шаг.",
    to: "/market",
    cta: "Открыть каталог",
    steps: [["1", "Опишите задачу", "/"], ["2", "Сравните доступные варианты", "/market"], ["3", "Откройте карточку", "/market"]],
  };
}

function toAiCatalog(catalog) {
  return catalog.slice(0, 40).map(item => ({
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
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.query) setQuery(saved.query);
      if (Array.isArray(saved?.history)) setHistory(saved.history.slice(-8));
    } catch {}
  }, []);

  useEffect(() => {
    let active = true;
    loadPublishedCatalog()
      .then(items => { if (active) setCatalog(items); })
      .catch(() => { if (active) setCatalog([]); })
      .finally(() => { if (active) setCatalogLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ query, history: history.slice(-8), updatedAt: Date.now() })); }
    catch {}
  }, [query, history]);

  const guide = useMemo(() => localGuide(submitted), [submitted]);
  const offerMatches = useMemo(() => {
    if (!submitted || !catalog.length) return [];
    const words = normalize(submitted).split(/\s+/).filter(word => word.length > 2);
    return catalog
      .map(item => ({
        item,
        score: words.reduce((score, word) => score + (normalize([item.title, item.description, ...(item.tags || [])].join(" ")).includes(word) ? 1 : 0), 0),
      }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(entry => entry.item);
  }, [submitted, catalog]);

  async function ask(value = query) {
    const message = value.trim();
    if (!message || loading) return;
    setQuery(message);
    setSubmitted(message);
    setLoading(true);
    setFallback(false);
    setShowSteps(false);
    try {
      const data = await askDocMarketAssistant({ message, history, catalog: toAiCatalog(catalog) });
      setAnswer(data);
      const text = data?.reply || data?.answer || data?.message || data?.text || data?.summary || "";
      setHistory(previous => [...previous, { role: "user", content: message }, ...(text ? [{ role: "assistant", content: text }] : [])].slice(-8));
    } catch {
      setAnswer(null);
      setFallback(true);
      setShowSteps(true);
      setHistory(previous => [...previous, { role: "user", content: message }].slice(-8));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuery("");
    setSubmitted("");
    setAnswer(null);
    setFallback(false);
    setHistory([]);
    setShowSteps(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const aiText = answer?.reply || answer?.answer || answer?.message || answer?.text || answer?.summary;
  const aiTitle = answer?.title || "Ответ помощника";
  const aiTo = answer?.route || answer?.action?.url || answer?.to || answer?.url;
  const aiCta = answer?.cta || answer?.action?.label || "Продолжить";
  const aiSteps = Array.isArray(answer?.steps) ? answer.steps : [];
  const pageHint = location.pathname.startsWith("/dosudebka")
    ? "Вы в Досудебке. Опишите ситуацию — помогу пройти дальше."
    : location.pathname.startsWith("/market")
      ? "Вы в каталоге. Опишите задачу — подберу доступный путь."
      : "Опишите, что произошло. Помощник подберёт следующий шаг.";

  return <>
    <button className="dm-assistant-fab" type="button" onClick={() => setOpen(value => !value)}>
      <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"}`} /><span>Помощник</span>
    </button>
    {open && <aside className="dm-assistant">
      <header><div className="dm-assistant-logo"><i className="fa-solid fa-wand-magic-sparkles" /></div><div><strong>Помощник ДокМаркета</strong><small>Документы, сервисы и специалисты</small></div></header>
      <p className="dm-assistant-hint">{pageHint}</p>
      <form onSubmit={event => { event.preventDefault(); ask(); }}>
        <textarea rows="3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Например: мне не выплатили зарплату за два месяца" />
        <button type="submit" disabled={loading}>{loading ? "Ищу…" : "Спросить"}</button>
      </form>
      {!submitted && <div className="dm-assistant-chips">{quickActions.map(label => <button key={label} type="button" onClick={() => ask(label)}>{label}</button>)}</div>}
      {submitted && <div className="dm-assistant-results">
        {loading && <div className="dm-status">Проверяю ситуацию и текущий каталог…</div>}
        {!loading && aiText && <section className="dm-guide"><strong>{aiTitle}</strong><p>{aiText}</p>{aiTo && <Link to={aiTo} onClick={() => setOpen(false)}>{aiCta} →</Link>}</section>}
        {!loading && aiSteps.length > 0 && <section className="dm-steps"><h3>Что делать дальше</h3>{aiSteps.map((step, index) => { const title = typeof step === "string" ? step : step.title || step.label || step.text; const to = typeof step === "object" ? step.url || step.to : null; return to ? <Link key={index} to={to} onClick={() => setOpen(false)}><span>{index + 1}</span><b>{title}</b></Link> : <div key={index}><span>{index + 1}</span><b>{title}</b></div>; })}</section>}
        {!loading && (fallback || !aiText) && <><div className="dm-fallback">AI сейчас недоступен — использую встроенный подбор по текущему каталогу.</div><section className="dm-guide"><strong>{guide.title}</strong><p>{guide.text}</p><div className="dm-actions"><Link to={guide.to} onClick={() => setOpen(false)}>{guide.cta} →</Link><button type="button" onClick={() => setShowSteps(value => !value)}>{showSteps ? "Скрыть путь" : "Провести меня"}</button></div></section>{showSteps && <section className="dm-steps"><h3>Куда нажимать</h3>{guide.steps.map(([number, title, to]) => <Link key={number + title} to={to} onClick={() => setOpen(false)}><span>{number}</span><b>{title}</b></Link>)}</section>}</>}
        {offerMatches.length > 0 && <section><h3>Подходящие карточки</h3>{offerMatches.map(item => <Link className="dm-card" key={item.id} to={item.actionUrl || item.route || "/market"} onClick={() => setOpen(false)}><b>{item.title}</b><small>{item.price ? `${Number(item.price).toLocaleString("ru-RU")} ₽` : "Открыть"}</small></Link>)}</section>}
        {!loading && catalogLoaded && catalog.length === 0 && <div className="dm-fallback">В опубликованном каталоге пока нет карточек.</div>}
        {!loading && <button className="dm-reset" type="button" onClick={reset}>Задать другой вопрос</button>}
      </div>}
    </aside>}
    <style>{`.dm-assistant-fab{position:fixed;right:18px;bottom:18px;z-index:90;display:flex;align-items:center;gap:9px;min-height:50px;padding:0 17px;border:1px solid #155e75;border-radius:999px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;font-weight:800;cursor:pointer}.dm-assistant{position:fixed;right:18px;bottom:80px;z-index:89;width:min(410px,calc(100vw - 24px));max-height:calc(100dvh - 110px);overflow:auto;box-sizing:border-box;padding:17px;border-radius:20px;background:#07111dfb;border:1px solid #164e63;color:#e2e8f0;box-shadow:0 24px 80px #0008}.dm-assistant header{display:flex;gap:11px;align-items:center}.dm-assistant-logo{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#0e749033;color:#a5f3fc}.dm-assistant header div:last-child{display:grid}.dm-assistant header small{color:#64748b;font-size:.7rem}.dm-assistant-hint{color:#94a3b8;font-size:.78rem}.dm-assistant form{display:grid;gap:8px}.dm-assistant textarea{box-sizing:border-box;width:100%;resize:none;padding:12px;border-radius:12px;border:1px solid #334155;background:#0f172acc;color:#fff;font:inherit}.dm-assistant form button{justify-self:end;padding:9px 13px;border:0;border-radius:10px;background:#0891b2;color:#fff;font-weight:800}.dm-assistant-chips,.dm-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.dm-assistant-chips button,.dm-actions button,.dm-reset{padding:8px 10px;border:1px solid #334155;border-radius:999px;background:#ffffff08;color:#cbd5e1;cursor:pointer}.dm-assistant-results{display:grid;gap:13px;margin-top:14px}.dm-status,.dm-fallback{padding:10px;border-radius:11px;background:#22d3ee0d;color:#94a3b8;font-size:.72rem}.dm-guide{padding:13px;border-radius:14px;background:linear-gradient(135deg,#0891b21c,#7c3aed1a);border:1px solid #67e8f924}.dm-guide p{color:#b0bdd0;font-size:.75rem;line-height:1.55}.dm-guide a,.dm-actions a{color:#67e8f9;text-decoration:none;font-size:.72rem;font-weight:800}.dm-steps{display:grid;gap:6px}.dm-steps h3,.dm-assistant-results h3{font-size:.75rem;margin:0}.dm-steps>a,.dm-steps>div{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:9px;padding:9px 10px;border-radius:11px;color:#dbeafe;text-decoration:none;background:#0f172a8a}.dm-steps span{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:#22d3ee14;color:#a5f3fc}.dm-steps b{font-size:.72rem}.dm-card{display:grid;gap:3px;padding:9px 2px;color:#e2e8f0;text-decoration:none;border-bottom:1px solid #ffffff0f}.dm-card b{font-size:.76rem}.dm-card small{color:#64748b;font-size:.65rem}@media(max-width:600px){.dm-assistant-fab{right:12px;bottom:12px}.dm-assistant{right:12px;bottom:72px;width:calc(100vw - 24px);max-height:calc(100dvh - 92px)}}`}</style>
  </>;
}
