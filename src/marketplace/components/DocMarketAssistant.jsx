import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { offers, specialists } from "@/data/marketplaceMock";

const quickActions = [
  { label: "Не выплатили зарплату", query: "не выплатили зарплату" },
  { label: "Вернуть деньги", query: "вернуть деньги" },
  { label: "Мне должны деньги", query: "мне должны деньги" },
  { label: "Найти специалиста", query: "нужен специалист" },
];

const normalize = value => String(value || "").toLowerCase().replace(/ё/g, "е").trim();

function scoreText(query, text) {
  const q = normalize(query);
  const haystack = normalize(text);
  if (!q || !haystack) return 0;
  let score = haystack.includes(q) ? 8 : 0;
  const words = q.split(/\s+/).filter(word => word.length > 2);
  for (const word of words) if (haystack.includes(word)) score += 2;
  return score;
}

function routeByIntent(query) {
  const q = normalize(query);
  if (/зарплат|работодател|увол|работал без договор/.test(q)) return { title: "Похоже на трудовой спор", text: "Начните с Досудебки. Сервис задаст вопросы и соберёт претензию по вашей ситуации.", to: "/dosudebka", cta: "Открыть Досудебку", icon: "fa-scale-balanced" };
  if (/вернут.*деньг|курс|товар|покупк|услуг/.test(q)) return { title: "Нужен возврат денег", text: "Сначала выберите вашу ситуацию. Если подходит претензионный порядок, ДокМаркет проведёт в Досудебку.", to: "/#start", cta: "Выбрать ситуацию", icon: "fa-rotate-left" };
  if (/долг|должн|расписк|займ/.test(q)) return { title: "Похоже на спор по долгу", text: "Можно начать с официального требования через Досудебку или посмотреть готовые документы по долгам.", to: "/dosudebka", cta: "Начать", icon: "fa-hand-holding-dollar" };
  if (/специалист|юрист|провер|консультац/.test(q)) return { title: "Подберём специалиста", text: "Ниже покажу подходящие карточки из каталога. Перед запуском реальные профили будут отделены от демо.", to: "/market#specialists", cta: "Открыть специалистов", icon: "fa-user-tie" };
  if (/договор|заявлен|жалоб|документ|шаблон/.test(q)) return { title: "Ищем готовый документ", text: "Откройте каталог или выберите найденную карточку ниже.", to: "/market", cta: "Открыть каталог", icon: "fa-file-lines" };
  return { title: "Помогу найти следующий шаг", text: "Напишите проблему обычными словами. Я найду подходящий документ, сервис или специалиста из ДокМаркета.", to: "/#smart-find", cta: "Подбор по ситуации", icon: "fa-compass" };
}

export default function DocMarketAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const location = useLocation();

  const guide = useMemo(() => routeByIntent(submitted), [submitted]);
  const offerMatches = useMemo(() => {
    if (!submitted) return [];
    return offers.map(item => ({ item, score: scoreText(submitted, [item.title, item.description, item.suitableFor, ...(item.tags || [])].join(" ")) }))
      .filter(row => row.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(row => row.item);
  }, [submitted]);
  const specialistMatches = useMemo(() => {
    if (!submitted || !/специалист|юрист|провер|консультац|зарплат|возврат|труд|потребител/.test(normalize(submitted))) return [];
    return specialists.map(item => ({ item, score: scoreText(submitted, [item.name, item.profession, item.bio, ...(item.specializations || [])].join(" ")) + 1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(row => row.item);
  }, [submitted]);

  function ask(value = query) {
    const next = value.trim();
    if (!next) return;
    setQuery(next);
    setSubmitted(next);
  }

  const pageHint = location.pathname.startsWith("/dosudebka") ? "Вы сейчас в Досудебке. Могу помочь выбрать направление или вернуться в ДокМаркет." : location.pathname.startsWith("/market") ? "Вы в каталоге. Опишите задачу — отфильтрую варианты." : "Опишите, что случилось — покажу, куда нажать.";

  return <>
    <button className="dm-assistant-fab" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Помощник ДокМаркета">
      <i className={`fa-solid ${open ? "fa-xmark" : "fa-comment-dots"}`} />
      <span>Помощник</span>
    </button>
    {open && <aside className="dm-assistant" aria-label="Помощник ДокМаркета">
      <header><div className="dm-assistant-logo"><i className="fa-solid fa-wand-magic-sparkles" /></div><div><strong>Помощник ДокМаркета</strong><small>Найду документ, сервис или специалиста</small></div></header>
      <p className="dm-assistant-hint">{pageHint}</p>
      <form onSubmit={event => { event.preventDefault(); ask(); }}>
        <textarea rows="3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Например: мне не выплатили зарплату за два месяца" />
        <button type="submit"><i className="fa-solid fa-arrow-up" /> Найти</button>
      </form>
      {!submitted && <div className="dm-assistant-chips">{quickActions.map(item => <button key={item.label} type="button" onClick={() => ask(item.query)}>{item.label}</button>)}</div>}
      {submitted && <div className="dm-assistant-results">
        <section className="dm-assistant-guide"><span><i className={`fa-solid ${guide.icon}`} /></span><div><strong>{guide.title}</strong><p>{guide.text}</p><Link to={guide.to} onClick={() => setOpen(false)}>{guide.cta} <i className="fa-solid fa-arrow-right" /></Link></div></section>
        {offerMatches.length > 0 && <section><h3>Подходящие карточки</h3>{offerMatches.map(item => <Link className="dm-assistant-card" key={item.id} to={`/market/offer/${item.id}`} onClick={() => setOpen(false)}><span><b>{item.title}</b><small>{item.type === "service" ? "Услуга" : "Документ / сервис"}{item.price ? ` · ${Number(item.price).toLocaleString("ru-RU")} ₽` : ""}</small></span><i className="fa-solid fa-chevron-right" /></Link>)}</section>}
        {specialistMatches.length > 0 && <section><h3>Специалисты</h3>{specialistMatches.map(item => <Link className="dm-assistant-card" key={item.id} to={`/market/specialist/${item.id}`} onClick={() => setOpen(false)}><span className="dm-assistant-avatar">{item.initials}</span><span><b>{item.name}</b><small>{item.profession} · Демо каталога</small></span><i className="fa-solid fa-chevron-right" /></Link>)}</section>}
        <button className="dm-assistant-reset" type="button" onClick={() => { setSubmitted(""); setQuery(""); }}>Задать другой вопрос</button>
      </div>}
    </aside>}
    <style>{`
      .dm-assistant-fab{position:fixed;right:18px;bottom:18px;z-index:90;display:flex;align-items:center;gap:9px;min-height:50px;padding:0 17px;border:1px solid rgba(103,232,249,.26);border-radius:999px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;font-weight:800;box-shadow:0 16px 44px rgba(15,23,42,.5);cursor:pointer}.dm-assistant{position:fixed;right:18px;bottom:80px;z-index:89;width:min(390px,calc(100vw - 24px));max-height:min(680px,calc(100vh - 110px));overflow:auto;padding:17px;border-radius:20px;background:rgba(7,17,29,.98);border:1px solid rgba(103,232,249,.2);box-shadow:0 24px 80px rgba(0,0,0,.5);backdrop-filter:blur(22px);color:#e2e8f0}.dm-assistant header{display:flex;align-items:center;gap:11px;margin-bottom:12px}.dm-assistant-logo{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(8,145,178,.22),rgba(124,58,237,.24));color:#a5f3fc}.dm-assistant header div:last-child{display:grid}.dm-assistant header strong{color:#fff;font-size:.92rem}.dm-assistant header small{color:#64748b;font-size:.7rem;margin-top:2px}.dm-assistant-hint{color:#94a3b8;font-size:.78rem;line-height:1.5;margin:0 0 12px}.dm-assistant form{display:grid;gap:8px}.dm-assistant textarea{width:100%;resize:none;border-radius:12px;padding:12px;color:#fff;background:rgba(15,23,42,.75);border:1px solid rgba(148,163,184,.17);outline:none;font:inherit;font-size:.82rem;line-height:1.45}.dm-assistant textarea:focus{border-color:rgba(103,232,249,.45)}.dm-assistant form button{justify-self:end;border:0;border-radius:10px;padding:9px 13px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:#fff;font-weight:800;cursor:pointer}.dm-assistant-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.dm-assistant-chips button,.dm-assistant-reset{border:1px solid rgba(148,163,184,.15);background:rgba(255,255,255,.035);color:#cbd5e1;border-radius:999px;padding:8px 10px;font-size:.7rem;cursor:pointer}.dm-assistant-results{display:grid;gap:14px;margin-top:14px}.dm-assistant-results h3{color:#fff;font-size:.75rem;margin:0 0 7px}.dm-assistant-guide{display:flex;gap:11px;padding:13px;border-radius:14px;background:linear-gradient(135deg,rgba(8,145,178,.11),rgba(124,58,237,.1));border:1px solid rgba(103,232,249,.14)}.dm-assistant-guide>span{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center;color:#67e8f9;background:rgba(34,211,238,.08)}.dm-assistant-guide strong{color:#fff;font-size:.82rem}.dm-assistant-guide p{color:#94a3b8;font-size:.72rem;line-height:1.45;margin:5px 0 8px}.dm-assistant-guide a{color:#67e8f9;text-decoration:none;font-size:.72rem;font-weight:800}.dm-assistant-card{display:flex;align-items:center;gap:10px;padding:10px 3px;color:inherit;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.06)}.dm-assistant-card>span:not(.dm-assistant-avatar){display:grid;gap:3px;flex:1}.dm-assistant-card b{color:#e2e8f0;font-size:.76rem;line-height:1.35}.dm-assistant-card small{color:#64748b;font-size:.65rem}.dm-assistant-card>i{color:#475569;font-size:.65rem}.dm-assistant-avatar{width:32px;height:32px;flex:0 0 32px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#0e7490,#6d28d9);font-size:.65rem;font-weight:850}.dm-assistant-reset{justify-self:start}.dm-assistant-fab:focus-visible,.dm-assistant button:focus-visible,.dm-assistant a:focus-visible,.dm-assistant textarea:focus-visible{outline:2px solid #67e8f9;outline-offset:2px}@media(max-width:640px){.dm-assistant-fab{right:12px;bottom:12px;min-width:50px;padding:0 15px}.dm-assistant-fab span{display:none}.dm-assistant{right:12px;bottom:72px;width:calc(100vw - 24px);max-height:calc(100vh - 92px);border-radius:18px}.dm-assistant textarea{font-size:16px}}
    `}</style>
  </>;
}
