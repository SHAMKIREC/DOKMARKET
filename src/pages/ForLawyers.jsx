import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { createBusinessLead } from "@/services/lawyerService";

const plans = [
  {
    id: "start",
    name: "START",
    subtitle: "Для частной практики",
    badge: "Для старта",
    price: "3 990 ₽",
    limit: "До 30 документов в месяц",
    icon: "fa-user-tie",
    accent: "#22d3ee",
    border: "rgba(34,211,238,.34)",
    background: "radial-gradient(circle at 20% 0%,rgba(14,165,233,.12),transparent 34%),linear-gradient(155deg,rgba(8,47,73,.34),rgba(15,23,42,.95) 46%)",
    button: "linear-gradient(120deg,#0891b2,#2563eb)",
    features: [
      "До 30 активных клиентов",
      "PDF + DOC",
      "Анкеты клиентов по ссылке",
      "Карточки клиентов и дел",
      "Базовые шаблоны",
      "Коллективные претензии",
      "История и хранение документов",
      "Базовая поддержка",
    ],
  },
  {
    id: "business",
    name: "BUSINESS",
    subtitle: "Для растущей юридической практики",
    badge: "🔥 Самый популярный",
    price: "9 900 ₽",
    limit: "До 150 документов в месяц",
    icon: "fa-briefcase",
    accent: "#a78bfa",
    border: "rgba(167,139,250,.52)",
    background: "radial-gradient(circle at 82% 0%,rgba(139,92,246,.18),transparent 38%),linear-gradient(155deg,rgba(30,41,89,.5),rgba(15,23,42,.96) 48%)",
    button: "linear-gradient(120deg,#2563eb,#7c3aed,#9333ea)",
    popular: true,
    features: [
      "До 150 активных клиентов",
      "До 3 сотрудников",
      "PDF + DOC",
      "Анкеты клиентов по ссылке",
      "Карточки клиентов и дел",
      "Все шаблоны",
      "Коллективные претензии",
      "Статусы дел",
      "Контроль сроков",
      "Собственный логотип",
      "Свои цены для клиентов",
      "Приоритетная поддержка",
    ],
  },
  {
    id: "unlimited",
    name: "UNLIMITED",
    subtitle: "Для агентств и юридических компаний",
    badge: "👑 Для агентств",
    price: "24 900 ₽",
    limit: "До 500 документов в месяц",
    icon: "fa-building",
    accent: "#c084fc",
    border: "rgba(192,132,252,.48)",
    background: "radial-gradient(circle at 86% 0%,rgba(168,85,247,.18),transparent 38%),linear-gradient(155deg,rgba(59,7,100,.31),rgba(15,23,42,.96) 46%)",
    button: "linear-gradient(120deg,#6d28d9,#9333ea,#7c3aed)",
    features: [
      "Безлимит клиентов в базе",
      "До 10 сотрудников",
      "PDF + DOC",
      "Массовая генерация",
      "Анкеты клиентов по ссылке",
      "Шаблоны из своих документов",
      "Коллективные обращения",
      "White Label элементы",
      "Собственный логотип",
      "Свой домен",
      "Свои цены для клиентов",
      "Роли сотрудников",
      "Командная работа",
      "История документов",
      "Статусы дел",
      "Приоритетная поддержка",
      "Ранний доступ к новым модулям",
    ],
  },
];

const advantages = [
  { icon: "fa-bolt", title: "Документы быстрее", text: "Готовьте претензии за минуты, а не собирайте текст с нуля." },
  { icon: "fa-address-book", title: "Клиенты в одном месте", text: "Храните заявки, документы и историю обращений в одном кабинете." },
  { icon: "fa-users", title: "Коллективные претензии", text: "Собирайте данные участников через ссылку и объединяйте их в один документ." },
  { icon: "fa-pen-ruler", title: "Работа под брендом", text: "Логотип, свои цены, фирменный стиль и домен на старших тарифах." },
  { icon: "fa-file-export", title: "PDF + DOCX", text: "Отдавайте клиенту документ для отправки или дальнейшего редактирования." },
  { icon: "fa-chart-line", title: "Масштабирование практики", text: "Подходит для частных юристов, команд и юридических агентств." },
];

const workflow = [
  { title: "Подключаете кабинет", text: "Получаете рабочее пространство для документов и клиентов." },
  { title: "Добавляете клиента или заявку", text: "Вносите данные вручную или принимаете обращение." },
  { title: "Генерируете документ", text: "Система собирает структуру претензии, требования, статьи закона и приложения." },
  { title: "Отдаёте PDF/DOCX клиенту", text: "Документ можно скачать, отправить или доработать." },
  { title: "Работаете под своим брендом", text: "На старших тарифах доступны логотип, свои цены и домен." },
];

export default function ForLawyers() {
  const [notice, setNotice] = useState("");
  const reduceMotion = useReducedMotion();

  function submitLead(plan) {
    try {
      createBusinessLead(plan.name);
      setNotice("Заявка отправлена. Мы свяжемся с вами для подключения Досудебка Business.");
    } catch {
      console.error("Не удалось сохранить локальную заявку на подключение бизнес-кабинета.");
      setNotice("Не удалось сохранить заявку локально. Проверьте доступность хранилища и попробуйте ещё раз.");
    }
  }

  return (
    <div className="business-page">
      <style>{`
        .business-page { min-height:100vh; padding:96px 0 72px; background:radial-gradient(circle at 10% 6%,rgba(14,165,233,.1),transparent 28%),radial-gradient(circle at 90% 10%,rgba(139,92,246,.12),transparent 32%),linear-gradient(180deg,rgba(2,6,23,.18),rgba(2,6,23,.78)); }
        .business-wrap { width:min(1280px,calc(100% - 40px)); margin:0 auto; }
        .business-hero-badges { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin-top:22px; }
        .business-hero-badge { padding:6px 10px; border-radius:999px; color:#dbeafe; background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(139,92,246,.09)); border:1px solid rgba(103,232,249,.17); font-size:.72rem; font-weight:700; }
        .business-plans { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; align-items:stretch; margin-bottom:68px; }
        .lawyer-trial { display:grid; grid-template-columns:1.25fr .75fr; gap:24px; align-items:center; margin-bottom:32px; padding:clamp(24px,5vw,42px); border-radius:22px; background:radial-gradient(circle at 8% 0%,rgba(34,211,238,.14),transparent 42%),linear-gradient(145deg,rgba(8,47,73,.54),rgba(30,27,75,.5)); border:1px solid rgba(103,232,249,.3); box-shadow:0 22px 58px rgba(2,8,23,.35); }
        .lawyer-trial ul { display:grid; grid-template-columns:1fr 1fr; gap:9px 18px; padding:0; margin:20px 0 0; list-style:none; color:#d5e3f3; font-size:.84rem; }
        .lawyer-trial li::before { content:"✓"; margin-right:8px; color:#67e8f9; font-weight:900; }
        .lawyer-trial-offer { padding:20px; border-radius:16px; background:rgba(2,6,23,.42); border:1px solid rgba(167,139,250,.25); text-align:center; }
        .lawyer-trial-link { display:block; margin-top:17px; padding:12px 16px; border-radius:11px; color:white; background:linear-gradient(120deg,#0891b2,#7c3aed); text-decoration:none; font-weight:800; }
        .business-card { height:100%; display:flex; flex-direction:column; overflow:hidden; isolation:isolate; transition:all .22s ease; }
        .business-card::before { content:""; position:absolute; z-index:0; inset:-45%; pointer-events:none; opacity:0; transform:translateX(-24%); background:radial-gradient(circle,rgba(255,255,255,.075),transparent 42%); transition:opacity .3s ease,transform .45s ease; }
        .business-card > * { position:relative; z-index:1; }
        .business-card:hover { transform:translateY(-5px); box-shadow:0 28px 68px rgba(2,8,23,.52),0 0 42px rgba(99,102,241,.12)!important; }
        .business-card:hover::before { opacity:1; transform:translateX(18%); }
        .business-card.start:hover { border-color:rgba(34,211,238,.7)!important; }
        .business-card.business:hover { border-color:rgba(167,139,250,.78)!important; }
        .business-card.unlimited:hover { border-color:rgba(192,132,252,.76)!important; }
        .business-plan-badge { display:inline-flex; align-items:center; align-self:flex-start; min-height:28px; padding:5px 11px; border-radius:999px; color:#f8fafc; font-size:.72rem; font-weight:850; letter-spacing:.02em; animation:businessBadgeGlow 3.2s ease-in-out infinite; }
        .business-plan-badge.start { background:linear-gradient(120deg,rgba(8,145,178,.4),rgba(37,99,235,.38)); border:1px solid rgba(103,232,249,.5); box-shadow:0 0 18px rgba(14,165,233,.14); }
        .business-plan-badge.business { background:linear-gradient(120deg,rgba(37,99,235,.46),rgba(124,58,237,.58)); border:1px solid rgba(196,181,253,.62); box-shadow:0 0 20px rgba(139,92,246,.2); }
        .business-plan-badge.unlimited { background:linear-gradient(120deg,rgba(109,40,217,.48),rgba(147,51,234,.5)); border:1px solid rgba(216,180,254,.58); box-shadow:0 0 20px rgba(168,85,247,.19); }
        .business-plan-cta { margin-top:auto; padding-top:24px; }
        .business-plan-button { width:100%; min-height:46px; padding:12px; border-radius:12px; border:none; cursor:pointer; color:white; font-size:.92rem; font-weight:800; transition:all .2s ease; }
        .business-plan-button:hover { transform:translateY(-2px); filter:saturate(1.1); box-shadow:0 14px 30px rgba(99,102,241,.25); }
        .business-plan-button:active { transform:scale(.99); }
        .business-benefits { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
        .business-benefit,.business-step { transition:all .22s ease; }
        .business-benefit:hover,.business-step:hover { transform:translateY(-3px); border-color:rgba(103,232,249,.3)!important; box-shadow:0 18px 38px rgba(2,8,23,.28),0 0 26px rgba(14,165,233,.055); }
        .business-steps { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; align-items:stretch; }
        @keyframes businessBadgeGlow { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.11); box-shadow:0 0 25px rgba(167,139,250,.22); } }
        @media (max-width:1050px) { .business-plans { grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); } .business-steps { grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); } }
        @media (max-width:720px) { .business-page { padding-top:84px; } .business-wrap { width:min(100% - 28px,1280px); } .business-plans,.business-benefits,.business-steps,.lawyer-trial { grid-template-columns:1fr; } .lawyer-trial ul { grid-template-columns:1fr; } }
        @media (prefers-reduced-motion:reduce) { .business-plan-badge { animation:none; } .business-card,.business-card::before,.business-plan-button,.business-benefit,.business-step { transition:none; } .business-card:hover,.business-plan-button:hover,.business-benefit:hover,.business-step:hover { transform:none; } }
      `}</style>

      <div className="business-wrap">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(2.25rem,6vw,3.8rem)", fontWeight: 850, color: "white", lineHeight: 1.08, letterSpacing: "-.035em", margin: "0 0 11px" }}>Досудебка <span style={{ background: "linear-gradient(90deg,#22d3ee,#8b5cf6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Business</span></h1>
          <p style={{ color: "#a5f3fc", fontSize: "clamp(1.05rem,2.5vw,1.3rem)", fontWeight: 700, margin: "0 auto 15px" }}>Кабинет для юристов и юридических компаний</p>
          <p style={{ color: "#d5e3f3", fontSize: "1rem", maxWidth: 800, margin: "0 auto 10px", lineHeight: 1.65 }}>Создавайте претензии, ведите клиентов, запускайте коллективные обращения и выдавайте документы под собственным брендом.</p>
          <p style={{ color: "#94a3b8", fontSize: ".94rem", maxWidth: 820, margin: "0 auto", lineHeight: 1.6 }}>Автоматизируйте рутинную подготовку документов и превратите Досудебку в клиентский сервис вашей юридической практики.</p>
          <div className="business-hero-badges">{["Кабинет юриста", "PDF + DOCX", "Коллективные претензии", "White Label"].map(item => <span className="business-hero-badge" key={item}>{item}</span>)}</div>
        </motion.header>

        {notice && <div role="status" style={{ maxWidth: 820, margin: "0 auto 28px", padding: "13px 18px", borderRadius: 12, background: "rgba(34,211,238,.08)", border: "1px solid rgba(34,211,238,.25)", color: "#a5f3fc", textAlign: "center", fontSize: ".9rem" }}>{notice}</div>}

        <section className="lawyer-trial">
          <div>
            <h2 style={{ color: "white", fontSize: "clamp(1.55rem,3vw,2.1rem)", margin: "0 0 10px" }}>Попробуйте кабинет юриста бесплатно</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>После регистрации вы получите тариф START на 30 дней без оплаты.</p>
            <ul>{["до 30 документов в месяц","до 30 активных клиентов","PDF и DOCX","коллективные претензии","клиентские карточки","хранение документов"].map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="lawyer-trial-offer">
            <strong style={{ display: "block", color: "#fef3c7", fontSize: "1.05rem", lineHeight: 1.45 }}>Первые 50 юристов</strong>
            <span style={{ display: "block", color: "#e2e8f0", lineHeight: 1.55, marginTop: 9 }}>2 месяца START бесплатно + скидка 50% после пробного периода.</span>
            <small style={{ display: "block", color: "#aebed1", lineHeight: 1.5, marginTop: 9 }}>Первые 10 юристов получат скидку 50% на 12 месяцев.</small>
            <Link className="lawyer-trial-link" to="/RegisterLawyer">Зарегистрироваться как юрист</Link>
          </div>
        </section>

        <section className="business-plans">
          {plans.map((plan, index) => (
            <motion.article key={plan.name} initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: reduceMotion ? 0 : index * .08 }} className={`business-card ${plan.id}`} style={{ borderRadius: 22, background: plan.background, border: `1px solid ${plan.border}`, padding: "26px 24px 23px", position: "relative", boxShadow: plan.popular ? "0 20px 58px rgba(2,8,23,.4),0 0 38px rgba(139,92,246,.13)" : "0 18px 48px rgba(2,8,23,.34)" }}>
              <div style={{ minHeight: 42, marginBottom: 14 }}><span className={`business-plan-badge ${plan.id}`}>{plan.badge}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: `${plan.accent}16`, border: `1px solid ${plan.accent}38`, color: plan.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", flexShrink: 0 }}><i className={`fa-solid ${plan.icon}`}></i></div>
                <div><h2 style={{ fontFamily: "'Space Grotesk',sans-serif", color: "white", fontSize: "1.35rem", fontWeight: 820, margin: "0 0 3px" }}>{plan.name}</h2><p style={{ color: "#b6c5d8", fontSize: ".8rem", lineHeight: 1.4, margin: 0 }}>{plan.subtitle}</p></div>
              </div>
              <div style={{ minHeight: 105, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: plan.accent, fontSize: "clamp(1.85rem,3vw,2.3rem)", fontWeight: 850, lineHeight: 1.1 }}>{plan.price}</div>
                <div style={{ color: "#94a3b8", fontSize: ".79rem", margin: "4px 0 9px" }}>/ месяц</div>
                <div style={{ display: "inline-flex", color: "#e2e8f0", background: "rgba(255,255,255,.035)", border: "1px solid rgba(148,163,184,.13)", borderRadius: 9, padding: "6px 9px", fontSize: ".82rem", fontWeight: 700 }}>{plan.limit}</div>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
                {plan.features.map(feature => <li key={feature} style={{ display: "flex", gap: 9, alignItems: "flex-start", color: "#d5deeb", fontSize: ".8rem", lineHeight: 1.4 }}><i className="fa-solid fa-circle-check" style={{ color: plan.accent, fontSize: ".68rem", marginTop: 4, flexShrink: 0 }}></i>{feature}</li>)}
              </ul>
              <div className="business-plan-cta"><button className="business-plan-button" onClick={() => submitLead(plan)} style={{ background: plan.button }}>Оставить заявку</button></div>
            </motion.article>
          ))}
        </section>

        <section style={{ borderRadius: 22, background: "radial-gradient(circle at 10% 0%,rgba(14,165,233,.08),transparent 32%),rgba(15,23,42,.56)", border: "1px solid rgba(103,232,249,.13)", padding: "clamp(26px,5vw,42px)", marginBottom: 28, boxShadow: "0 20px 48px rgba(2,8,23,.26)" }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(1.45rem,3vw,1.9rem)", fontWeight: 800, color: "white", textAlign: "center", margin: "0 0 28px" }}>Почему юристы выбирают Досудебку</h2>
          <div className="business-benefits">
            {advantages.map(item => <article className="business-benefit" key={item.title} style={{ padding: "18px", borderRadius: 15, background: "rgba(255,255,255,.027)", border: "1px solid rgba(148,163,184,.1)" }}><div style={{ width: 41, height: 41, borderRadius: 11, background: "linear-gradient(135deg,rgba(14,165,233,.14),rgba(139,92,246,.15))", border: "1px solid rgba(103,232,249,.13)", color: "#67e8f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><i className={`fa-solid ${item.icon}`}></i></div><h3 style={{ color: "white", fontSize: ".95rem", fontWeight: 760, margin: "0 0 6px" }}>{item.title}</h3><p style={{ color: "#aebed1", fontSize: ".81rem", lineHeight: 1.52, margin: 0 }}>{item.text}</p></article>)}
          </div>
        </section>

        <section style={{ borderRadius: 22, background: "radial-gradient(circle at 90% 0%,rgba(139,92,246,.12),transparent 36%),linear-gradient(145deg,rgba(14,165,233,.045),rgba(139,92,246,.06))", border: "1px solid rgba(139,92,246,.18)", padding: "clamp(26px,5vw,42px)", boxShadow: "0 20px 48px rgba(2,8,23,.26)" }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(1.45rem,3vw,1.9rem)", fontWeight: 800, color: "white", textAlign: "center", margin: "0 0 28px" }}>Как это работает</h2>
          <div className="business-steps">
            {workflow.map((step, index) => <article className="business-step" key={step.title} style={{ minHeight: 188, padding: "18px 15px", borderRadius: 15, background: "rgba(15,23,42,.66)", border: "1px solid rgba(148,163,184,.1)", textAlign: "left" }}><div style={{ width: 36, height: 36, borderRadius: 11, marginBottom: 13, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 850, fontSize: ".82rem" }}>{index + 1}</div><h3 style={{ color: "white", fontSize: ".88rem", fontWeight: 750, lineHeight: 1.4, margin: "0 0 7px" }}>{step.title}</h3><p style={{ color: "#aebed1", fontSize: ".78rem", lineHeight: 1.52, margin: 0 }}>{step.text}</p></article>)}
          </div>
        </section>
      </div>
    </div>
  );
}
