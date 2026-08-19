import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createCheckRequest } from "@/services/lawyerService";

const plans = [
  {
    id: "single",
    topBadge: "★ Популярный",
    icon: "fa-user",
    iconBg: "#172554",
    iconColor: "#60a5fa",
    name: "SINGLE",
    desc: "Одна претензия для вашей ситуации",
    price: "490 ₽",
    oldPrice: "800 ₽",
    borderColor: "rgba(59,130,246,0.55)",
    accentColor: "#3b82f6",
    buttonBg: "linear-gradient(135deg,#3b82f6,#2563eb)",
    buttonText: "Создать документ",
    features: [
      "1 готовая претензия",
      "Экспорт PDF + DOCX",
      "Предпросмотр перед оплатой",
      "Чек-лист по отправке",
      "Хранение документа 72 часа",
      "Возможность исправить данные",
    ],
  },
  {
    id: "collective",
    topBadge: "Коллективная претензия",
    icon: "fa-users",
    iconBg: "#2e1065",
    iconColor: "#a78bfa",
    name: "COLLECTIVE",
    desc: "Одна общая претензия для нескольких участников",
    price: "790 ₽",
    priceExtra: "/ человек",
    oldPrice: "1 200 ₽",
    borderColor: "rgba(168,85,247,0.5)",
    accentColor: "#8b5cf6",
    buttonBg: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    buttonText: "Подать группой",
    features: [
      "Вы создаёте группу и получаете ссылку",
      "Отправляете ссылку другим участникам",
      "Каждый участник заполняет свои данные",
      "Сервис объединяет ответы в одну претензию",
      "Список участников включается в документ",
      "Экспорт PDF + DOCX",
    ],
  },
  {
    id: "check",
    topBadge: "Проверка от 999 ₽",
    icon: "fa-scale-balanced",
    iconBg: "#052e2b",
    iconColor: "#2dd4bf",
    name: "CHECK",
    desc: "Проверка готовой претензии перед отправкой",
    price: "от 999 ₽",
    oldPrice: "1 990 ₽",
    priceDetail: "Итоговая стоимость зависит от сложности ситуации.",
    borderColor: "rgba(34,211,238,0.42)",
    accentColor: "#22d3ee",
    buttonBg: "linear-gradient(135deg,#0891b2,#7c3aed)",
    buttonText: "Отправить на проверку",
    buttonNote: "Если нужны дополнительные правки, стоимость согласуем заранее.",
    features: [
      "Проверим готовую претензию",
      "Подскажет, каких доказательств не хватает",
      "Исправит слабые формулировки",
      "Проверит реквизиты и требования",
      "Ответ в течение 24 часов",
      "Можно отправить уже созданный документ на проверку",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");

  function handlePlan(plan) {
    if (plan.id !== "check") {
      navigate(createPageUrl("Generator"));
      return;
    }

    try {
      createCheckRequest({ source: "pricing" });
      setNotice("Заявка на проверку создана. Юрист свяжется с вами после подключения обработки заявок.");
    } catch {
      console.error("Не удалось сохранить локальную заявку на проверку.");
      setNotice("Не удалось сохранить заявку локально. Проверьте доступность хранилища и попробуйте ещё раз.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 12% 8%,rgba(14,165,233,.09),transparent 30%),radial-gradient(circle at 88% 12%,rgba(139,92,246,.1),transparent 34%),linear-gradient(180deg,rgba(2,6,23,.2),rgba(2,6,23,.72))", paddingTop: 90, paddingBottom: 80 }}>
      <style>{`
        .plans-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px; align-items:stretch; padding:8px 4px 22px; }
        .plan-card { transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease; display:flex; flex-direction:column; overflow:hidden; isolation:isolate; }
        .plan-card::before { content:""; position:absolute; z-index:0; inset:-45%; pointer-events:none; opacity:0; transform:translateX(-22%); background:radial-gradient(circle,rgba(255,255,255,.075),transparent 42%); transition:opacity .3s ease,transform .45s ease; }
        .plan-card > * { position:relative; z-index:1; }
        .plan-card:hover { transform:translateY(-5px); box-shadow:0 28px 66px rgba(2,8,23,.52),0 0 40px rgba(56,189,248,.1)!important; }
        .plan-card:hover::before { opacity:1; transform:translateX(18%); }
        .plan-card.single:hover { border-color:rgba(56,189,248,.72)!important; box-shadow:0 28px 66px rgba(2,8,23,.52),0 0 42px rgba(14,165,233,.16)!important; }
        .plan-card.collective:hover { border-color:rgba(167,139,250,.72)!important; box-shadow:0 28px 66px rgba(2,8,23,.52),0 0 42px rgba(139,92,246,.17)!important; }
        .plan-card.check:hover { border-color:rgba(45,212,191,.72)!important; box-shadow:0 28px 66px rgba(2,8,23,.52),0 0 42px rgba(20,184,166,.15)!important; }
        .plan-top-badge { display:inline-flex; align-items:center; min-height:27px; padding:5px 12px; border-radius:999px; color:#f8fafc; font-size:.72rem; font-weight:850; letter-spacing:.025em; border:1px solid rgba(255,255,255,.34); animation:planBadgeGlow 3.2s ease-in-out infinite; }
        .plan-top-badge.single { background:linear-gradient(120deg,rgba(14,165,233,.5),rgba(99,102,241,.62),rgba(139,92,246,.5)); border-color:rgba(125,211,252,.66); box-shadow:0 0 18px rgba(14,165,233,.18); }
        .plan-top-badge.single strong { color:#fde68a; font-size:.8rem; margin-right:4px; text-shadow:0 0 10px rgba(251,191,36,.25); }
        .plan-top-badge.collective { background:linear-gradient(120deg,rgba(124,58,237,.5),rgba(79,70,229,.58),rgba(6,182,212,.34)); border-color:rgba(196,181,253,.6); box-shadow:0 0 18px rgba(139,92,246,.19); }
        .plan-top-badge.check { background:linear-gradient(120deg,rgba(8,145,178,.46),rgba(13,148,136,.48),rgba(99,102,241,.34)); border-color:rgba(94,234,212,.62); box-shadow:0 0 18px rgba(20,184,166,.18); }
        .plan-top-badge.check strong { color:#ccfbf1; font-weight:900; margin-left:3px; text-shadow:0 0 10px rgba(94,234,212,.25); }
        .sale-badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:999px; color:#ecfeff; font-size:.7rem; font-weight:850; background:linear-gradient(120deg,rgba(6,182,212,.24),rgba(16,185,129,.2),rgba(124,58,237,.2)); border:1px solid rgba(103,232,249,.52); box-shadow:0 0 18px rgba(14,165,233,.13); }
        .old-price { color:#fbbf24; font-size:.9rem; font-weight:700; opacity:.9; text-decoration:line-through; text-decoration-thickness:1px; text-decoration-color:rgba(251,191,36,.75); }
        .new-price.check { color:#ecfeff!important; text-shadow:0 0 18px rgba(34,211,238,.14); }
        .plan-btn { transition:transform .2s ease,box-shadow .2s ease,filter .2s ease; cursor:pointer; border:none; }
        .plan-btn:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(59,130,246,.24); filter:saturate(1.08); }
        .plan-btn:active { transform:scale(.99); }
        .telegram-link,.manual-help-link { transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease,background .2s ease; }
        .telegram-link:hover,.manual-help-link:hover { transform:translateY(-2px); border-color:rgba(103,232,249,.46)!important; box-shadow:0 12px 30px rgba(14,165,233,.12)!important; }
        .support-grid { display:grid; grid-template-columns:1fr; gap:16px; margin-top:34px; }
        .plan-cta { margin-top:auto; padding-top:20px; min-height:102px; display:flex; flex-direction:column; }
        .plan-cta-note { min-height:32px; }
        @keyframes planBadgeGlow { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.12); box-shadow:0 0 24px rgba(103,232,249,.21); } }
        @media (max-width:640px) {
          .plans-grid { grid-template-columns:1fr; gap:20px; padding:8px 0 16px; }
          .pricing-wrap { padding-left:16px!important; padding-right:16px!important; }
          .support-grid { grid-template-columns:1fr; }
          .support-card { padding:18px!important; }
        }
        @media (prefers-reduced-motion:reduce) {
          .plan-top-badge { animation:none; }
          .plan-card,.plan-card::before,.plan-btn,.telegram-link,.manual-help-link { transition:none; }
          .plan-card:hover,.plan-btn:hover,.telegram-link:hover,.manual-help-link:hover { transform:none; }
        }
      `}</style>

      <div className="pricing-wrap" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, color: "white", marginBottom: 10, letterSpacing: "-0.02em" }}>
            Получите претензию <span style={{ display: "inline-block", background: "linear-gradient(90deg,#22d3ee,#8b5cf6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", textShadow: "0 0 24px rgba(99,102,241,.1)" }}>за 5 минут</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1rem", marginBottom: 10 }}>
            Заполните данные, проверьте образец и скачайте готовый PDF или DOCX.
          </p>
        </div>

        <div className="support-card" style={{ marginBottom: 44, padding: "15px 18px", borderRadius: 15, background: "linear-gradient(135deg,rgba(15,23,42,.72),rgba(30,41,59,.44))", border: "1px solid rgba(103,232,249,.18)", boxShadow: "0 14px 34px rgba(2,8,23,.24),inset 0 1px rgba(255,255,255,.025)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 13, flex: "1 1 420px" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#67e8f9", background: "linear-gradient(135deg,rgba(14,165,233,.16),rgba(139,92,246,.16))", border: "1px solid rgba(103,232,249,.18)" }}><i className="fa-brands fa-telegram"></i></span>
            <div>
              <h2 style={{ color: "white", fontSize: ".96rem", fontWeight: 750, margin: "0 0 4px" }}>Поддержка и новости Досудебки</h2>
              <p style={{ color: "#94a3b8", fontSize: ".8rem", lineHeight: 1.5, margin: 0 }}>В Telegram можно задать вопрос, следить за обновлениями сервиса и узнать о новых шаблонах претензий.</p>
            </div>
          </div>
          <a className="telegram-link" href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 15px", borderRadius: 10, background: "rgba(14,165,233,.08)", border: "1px solid rgba(56,189,248,.24)", color: "#bae6fd", textDecoration: "none", fontSize: ".82rem", fontWeight: 700, whiteSpace: "nowrap" }}>
            <i className="fa-brands fa-telegram"></i>Открыть Telegram
          </a>
        </div>

        {notice && (
          <div role="status" style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 12, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.25)", color: "#99f6e4", fontSize: "0.88rem", textAlign: "center" }}>
            {notice}
          </div>
        )}

        <div className="plans-grid">
          {plans.map(plan => (
            <article key={plan.id} className={`plan-card ${plan.id}`} style={{ borderRadius: 22, border: `1px solid ${plan.borderColor}`, background: plan.id === "single" ? "radial-gradient(circle at 50% 0%,rgba(59,130,246,.13),transparent 34%),linear-gradient(160deg,rgba(23,37,84,.94),rgba(15,23,42,.96))" : plan.id === "check" ? "radial-gradient(circle at 90% 0%,rgba(139,92,246,.13),transparent 38%),linear-gradient(160deg,rgba(8,47,73,.42),rgba(15,23,42,.96) 45%)" : "radial-gradient(circle at 50% 0%,rgba(139,92,246,.12),transparent 36%),rgba(15,23,42,.96)", padding: "28px 24px 22px", position: "relative", boxShadow: `0 16px 42px rgba(2,8,23,.34),0 0 24px ${plan.borderColor}` }}>
              <div style={{ minHeight: 25, marginBottom: 14 }}>
                <span className={`plan-top-badge ${plan.id}`}>{plan.id === "check" ? <>Проверка от <strong>999 ₽</strong></> : plan.id === "single" ? <><strong>★</strong>Популярный</> : plan.topBadge}</span>
              </div>

              <div style={{ minHeight: 116, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: plan.iconBg, border: `1px solid ${plan.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: plan.iconColor, flexShrink: 0 }}><i className={`fa-solid ${plan.icon}`}></i></div>
                  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "white", margin: 0 }}>{plan.name}</h2>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.45, margin: 0 }}>{plan.desc}</p>
              </div>

              <div style={{ minHeight: 92, marginBottom: 18 }}>
                {plan.oldPrice && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                    <span className="sale-badge">Акция</span>
                    <span className="old-price">{plan.oldPrice}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <span className={`new-price ${plan.id}`} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: plan.id === "check" ? "2rem" : "2.4rem", fontWeight: 800, color: "white", lineHeight: 1 }}>{plan.price}</span>
                  {plan.priceExtra && <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{plan.priceExtra}</span>}
                </div>
                {plan.priceDetail && <p style={{ color: "#94a3b8", fontSize: ".72rem", lineHeight: 1.45, margin: "8px 0 0" }}>{plan.priceDetail}</p>}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9, flexGrow: 1 }}>
                {plan.features.map(feature => (
                  <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 9, color: "#f1f5f9", fontSize: "0.8rem", lineHeight: 1.4 }}>
                    <i className="fa-solid fa-check" style={{ color: plan.accentColor, fontSize: "0.7rem", marginTop: 3, flexShrink: 0 }}></i>{feature}
                  </li>
                ))}
              </ul>

              {plan.fitsFor && <p style={{ color: "#94a3b8", fontSize: "0.73rem", margin: "14px 0 0", lineHeight: 1.4 }}>{plan.fitsFor}</p>}

              <div className="plan-cta">
                <button className="plan-btn" onClick={() => handlePlan(plan)} style={{ width: "100%", padding: "12px 8px", borderRadius: 11, fontWeight: 700, fontSize: "0.95rem", background: plan.buttonBg, color: "white", flexShrink: 0 }}>
                  {plan.buttonText}
                </button>
                <p className="plan-cta-note" style={{ color: "#64748b", fontSize: ".68rem", lineHeight: 1.45, textAlign: "center", margin: "8px 2px 0" }}>{plan.buttonNote || ""}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="support-grid">
          <div className="support-card" style={{ padding: "19px 22px", borderRadius: 17, background: "radial-gradient(circle at 90% 0%,rgba(139,92,246,.11),transparent 38%),linear-gradient(135deg,rgba(15,23,42,.76),rgba(17,24,39,.62))", border: "1px solid rgba(103,232,249,.2)", boxShadow: "0 16px 40px rgba(2,8,23,.28),0 0 26px rgba(139,92,246,.045)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: "1 1 520px" }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd", background: "linear-gradient(135deg,rgba(14,165,233,.14),rgba(139,92,246,.18))", border: "1px solid rgba(167,139,250,.22)" }}><i className="fa-solid fa-comments"></i></span>
              <div>
                <h2 style={{ color: "white", fontSize: "1.02rem", fontWeight: 750, margin: "0 0 5px" }}>Не нашли свою ситуацию?</h2>
                <p style={{ color: "#cbd5e1", fontSize: ".82rem", lineHeight: 1.52, margin: "0 0 5px" }}>Напишите нам в Telegram, если ваша проблема не подходит под готовые сценарии. Мы подскажем, как лучше оформить претензию, и заранее согласуем стоимость помощи.</p>
                <p style={{ color: "#64748b", fontSize: ".75rem", lineHeight: 1.5, margin: 0 }}>Подходит для нестандартных случаев, сложных документов и ситуаций, где нужно разобрать детали.</p>
              </div>
            </div>
            <a className="manual-help-link" href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px", borderRadius: 10, background: "linear-gradient(135deg,rgba(8,145,178,.18),rgba(124,58,237,.16))", border: "1px solid rgba(103,232,249,.26)", color: "#e0f2fe", textDecoration: "none", fontWeight: 700, fontSize: ".84rem", whiteSpace: "nowrap" }}>
              <i className="fa-brands fa-telegram"></i>Написать в Telegram
            </a>
          </div>
        </section>

        <div style={{ marginTop: 46, paddingTop: 20, borderTop: "1px solid rgba(148,163,184,.1)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>© 2026 Досудебка — генерация юридических документов по законодательству РФ</p>
        </div>
      </div>
    </div>
  );
}
