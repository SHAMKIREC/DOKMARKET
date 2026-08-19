import { useState } from "react";

const CATEGORIES = [
  {
    id: "labor",
    title: "Трудовой спор",
    description: "Зарплата, увольнение, расчёт, работа без договора.",
    icon: "fa-briefcase",
    color: "#67e8f9",
    background: "rgba(8,145,178,.14)",
    border: "rgba(34,211,238,.28)",
    subtypes: [
      ["unpaid-wages", "Невыплата заработной платы"],
      ["no-employment-contract", "Работа без трудового договора"],
      ["dismissal-payment", "Не выплатили расчёт при увольнении"],
      ["unlawful-dismissal", "Незаконное увольнение"],
      ["delayed-leave-or-sick-pay", "Задержка отпускных или больничных"],
      ["forced-resignation", "Принудили уволиться"],
      ["employment-documents-withheld", "Не выдали трудовую книжку или документы"],
      ["unpaid-overtime", "Не оплатили переработки"],
      ["other-labor", "Другая трудовая ситуация"],
    ],
  },
  {
    id: "product",
    title: "Некачественный товар",
    description: "Брак, возврат денег, гарантия, магазин или маркетплейс.",
    icon: "fa-cart-shopping",
    color: "#c4b5fd",
    background: "rgba(124,58,237,.14)",
    border: "rgba(167,139,250,.28)",
    subtypes: [
      ["defective-product", "Товар с браком"],
      ["seller-refused-refund", "Отказ продавца вернуть деньги"],
      ["warranty-case", "Гарантийный случай"],
      ["marketplace-purchase", "Покупка через маркетплейс"],
      ["not-as-described", "Товар не соответствует описанию"],
      ["paid-product-not-delivered", "Не доставили оплаченный товар"],
      ["quality-check-delayed", "Продавец затягивает проверку качества"],
      ["exchange-refused", "Отказали в обмене товара"],
      ["other-product", "Другая ситуация с товаром"],
    ],
  },
  {
    id: "course",
    title: "Онлайн-курс / инфопродукт",
    description: "Нет доступа, отказ в возврате, плохое обучение, куратор не отвечает.",
    icon: "fa-graduation-cap",
    color: "#f0abfc",
    background: "rgba(192,38,211,.12)",
    border: "rgba(232,121,249,.25)",
    subtypes: [
      ["no-course-access", "Нет доступа к курсу"],
      ["course-refund-refused", "Отказ в возврате"],
      ["no-curator-feedback", "Нет обратной связи от куратора"],
      ["course-not-as-described", "Контент не соответствует описанию"],
      ["poor-quality-course", "Обучение оказалось некачественным"],
      ["course-credit-imposed", "Навязали рассрочку или кредит"],
      ["promised-result-not-delivered", "Обещали результат, но условия не выполнили"],
      ["course-cancelled-or-postponed", "Курс отменили или перенесли"],
      ["other-course", "Другая ситуация с курсом"],
    ],
  },
  {
    id: "debt",
    title: "Гражданский спор / долг",
    description: "Расписка, займ, аренда, ЖКХ, банк, туризм, услуги или договор.",
    icon: "fa-file-contract",
    color: "#86efac",
    background: "rgba(22,163,74,.12)",
    border: "rgba(74,222,128,.25)",
    subtypes: [
      ["promissory-note-debt", "Долг по расписке"],
      ["loan-debt", "Долг по займу"],
      ["contract-breach", "Нарушение договора"],
      ["rent", "Аренда / найм"],
      ["utilities", "ЖКХ / управляющая компания"],
      ["bank-credit", "Банк / кредит"],
      ["travel", "Туризм / билеты / поездка"],
      ["poor-service", "Некачественная услуга"],
      ["other-civil", "Другая гражданская ситуация"],
    ],
  },
];

export default function Step1Category({ claimData, updateClaimData, nextStep }) {
  const initialCategory = CATEGORIES.find(category => category.id === claimData.type) ?? null;
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  function selectCategory(category) {
    setSelectedCategory(category);
    updateClaimData({ type: category.id, subtype: "", subtypeLabel: "", selectedLegalOptions: [] });
  }

  function selectSubtype(subtypeId, subtypeLabel) {
    updateClaimData({
      type: selectedCategory.id,
      subtype: subtypeId,
      subtypeLabel,
    });
    nextStep();
  }

  function returnToCategories() {
    setSelectedCategory(null);
    updateClaimData({ type: "", subtype: "", subtypeLabel: "", selectedLegalOptions: [] });
  }

  return (
    <div className="rounded-2xl border border-white/10" style={{ padding: "clamp(17px,4vw,25px)", background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))" }}>
      <style>{`
        .category-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .category-card { min-height:136px; position:relative; overflow:hidden; }
        .category-card:after { content:""; position:absolute; width:110px; height:110px; right:-55px; top:-55px; border-radius:50%; background:rgba(255,255,255,.035); transition:transform .2s ease; }
        .category-card:hover { transform:translateY(-2px); border-color:rgba(129,140,248,.35)!important; background:rgba(255,255,255,.045)!important; }
        .category-card:hover:after { transform:scale(1.2); }
        .subtype-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
        .subtype-option { min-height:62px; transition:transform .18s ease,border-color .18s ease,background .18s ease; }
        .subtype-option:hover { transform:translateY(-1px); border-color:rgba(129,140,248,.42)!important; background:rgba(99,102,241,.09)!important; }
        .back-to-categories { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; margin:0 0 19px; border:1px solid rgba(125,92,255,.35); border-radius:999px; background:rgba(255,255,255,.04); color:#dbeafe; cursor:pointer; font-size:.8rem; font-weight:700; line-height:1; }
        @media (max-width:700px){ .category-grid,.subtype-grid{grid-template-columns:1fr}.category-card{min-height:0} }
      `}</style>

      {!selectedCategory ? (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:8 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"6px 9px", borderRadius:999, color:"#a5f3fc", background:"rgba(8,145,178,.09)", border:"1px solid rgba(103,232,249,.16)", fontSize:".7rem", fontWeight:800 }}><i className="fa-solid fa-scale-balanced" /> ШАГ 1 ИЗ 7</div>
            <div style={{ color:"#64748b", fontSize:".72rem", fontWeight:700 }}>4 направления · 36 ситуаций</div>
          </div>
          <h2 style={{ fontWeight:800, color:"white", fontSize:"clamp(1.25rem,4vw,1.6rem)", margin:"0 0 7px" }}>Что случилось?</h2>
          <p style={{ color:"#94a3b8", fontSize:".85rem", lineHeight:1.6, margin:"0 0 21px" }}>Сначала выберите направление. На следующем экране уточним конкретную ситуацию — от неё зависят вопросы, нормы права и текст претензии.</p>
          <div className="category-grid">
            {CATEGORIES.map(category => (
              <button key={category.id} type="button" className="category-card" onClick={() => selectCategory(category)} style={{ width:"100%", background:"rgba(255,255,255,.025)", border:"1.5px solid rgba(255,255,255,.1)", borderRadius:17, padding:"18px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"flex-start", gap:15, color:"white", transition:"all .2s ease" }}>
                <span style={{ width:49, height:49, borderRadius:14, background:category.background, border:`1px solid ${category.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:category.color, flexShrink:0, fontSize:"1.05rem" }}><i className={`fa-solid ${category.icon}`} /></span>
                <span style={{ position:"relative", zIndex:1, minWidth:0 }}>
                  <strong style={{ display:"block", fontSize:"1rem", lineHeight:1.3, marginBottom:6 }}>{category.title}</strong>
                  <span style={{ display:"block", color:"#9ca3af", fontSize:".77rem", lineHeight:1.5 }}>{category.description}</span>
                  <span style={{ display:"inline-flex", marginTop:11, color:category.color, fontSize:".68rem", fontWeight:800 }}>{category.subtypes.length} сценариев →</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop:16, padding:"11px 13px", borderRadius:12, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)", color:"#64748b", fontSize:".72rem", lineHeight:1.55 }}><i className="fa-solid fa-shield-halved" style={{ color:"#67e8f9", marginRight:7 }} />Если ситуация сложнее предложенных вариантов, выберите «Другая ситуация» в нужном направлении — генератор попросит описать факты подробнее.</div>
        </>
      ) : (
        <>
          <button type="button" onClick={returnToCategories} className="back-to-categories"><i className="fa-solid fa-arrow-left" />Все направления</button>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <span style={{ width:45, height:45, borderRadius:12, background:selectedCategory.background, border:`1px solid ${selectedCategory.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:selectedCategory.color, flexShrink:0 }}><i className={`fa-solid ${selectedCategory.icon}`} /></span>
            <div><h2 style={{ color:"white", fontSize:"clamp(1.15rem,3vw,1.35rem)", fontWeight:800, margin:0 }}>{selectedCategory.title}</h2><span style={{ color:"#64748b", fontSize:".72rem" }}>{selectedCategory.subtypes.length} вариантов ситуации</span></div>
          </div>
          <p style={{ color:"#9ca3af", fontSize:".85rem", margin:"13px 0 17px" }}>Выберите наиболее близкий вариант. После выбора сразу перейдём к формату претензии.</p>
          <div className="subtype-grid">
            {selectedCategory.subtypes.map(([subtypeId, subtypeLabel]) => {
              const isActive = claimData.subtype === subtypeId;
              return (
                <button key={subtypeId} type="button" className="subtype-option" onClick={() => selectSubtype(subtypeId, subtypeLabel)} style={{ width:"100%", padding:"13px 14px", borderRadius:12, background:isActive ? "rgba(99,102,241,.16)" : "rgba(255,255,255,.025)", border:`1px solid ${isActive ? "rgba(129,140,248,.55)" : "rgba(255,255,255,.1)"}`, color:"white", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:11, fontSize:".81rem", lineHeight:1.4, whiteSpace:"normal", overflowWrap:"anywhere" }}>
                  <span style={{ width:19, height:19, borderRadius:"50%", border:`2px solid ${isActive ? "#818cf8" : "#4b5563"}`, background:isActive ? "#818cf8" : "transparent", boxShadow:isActive ? "inset 0 0 0 4px #191a2e" : "none", flexShrink:0 }} />
                  <span>{subtypeLabel}</span>
                  <i className="fa-solid fa-chevron-right" style={{ marginLeft:"auto", color:"#475569", fontSize:".65rem" }} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
