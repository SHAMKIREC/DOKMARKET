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
    <div className="rounded-2xl p-5 sm:p-6 border border-white/10" style={{ background: "rgba(255,255,255,.03)" }}>
      <style>{`
        .category-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .category-card { min-height: 122px; }
        .subtype-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
        .back-to-categories {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 0 0 20px;
          border: 1px solid rgba(125,92,255,.35);
          border-radius: 999px;
          background: rgba(255,255,255,.04);
          color: #dbeafe;
          cursor: pointer;
          font-size: .84rem;
          font-weight: 600;
          line-height: 1;
          transition: background .2s, border-color .2s, color .2s, transform .2s;
        }
        .back-to-categories:hover {
          background: rgba(125,92,255,.14);
          border-color: rgba(125,92,255,.65);
          color: #f5f3ff;
          transform: translateY(-1px);
        }
        .subtype-option { min-height: 58px; }
        @media (max-width: 640px) {
          .category-grid, .subtype-grid { grid-template-columns: 1fr; }
          .category-card { min-height: 0; }
        }
      `}</style>

      {!selectedCategory ? (
        <>
          <h2 style={{ fontWeight: 750, color: "white", fontSize: "clamp(1.2rem,3vw,1.45rem)", margin: "0 0 7px" }}>Выберите категорию спора</h2>
          <p style={{ color: "#9ca3af", fontSize: ".86rem", lineHeight: 1.55, margin: "0 0 22px" }}>От выбранной ситуации зависят вопросы, статьи закона и текст будущей претензии.</p>
          <div className="category-grid">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                className="category-card"
                onClick={() => selectCategory(category)}
                style={{ width: "100%", background: "rgba(255,255,255,.025)", border: "1.5px solid rgba(255,255,255,.1)", borderRadius: 15, padding: "18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 15, color: "white", transition: "border-color .2s, background .2s, transform .2s" }}
              >
                <span style={{ width: 48, height: 48, borderRadius: 13, background: category.background, border: `1px solid ${category.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: category.color, flexShrink: 0, fontSize: "1.05rem" }}><i className={`fa-solid ${category.icon}`} /></span>
                <span><strong style={{ display: "block", fontSize: ".98rem", lineHeight: 1.3, marginBottom: 6 }}>{category.title}</strong><span style={{ display: "block", color: "#9ca3af", fontSize: ".78rem", lineHeight: 1.5 }}>{category.description}</span></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={returnToCategories} className="back-to-categories"><i className="fa-solid fa-arrow-left" />Назад к категориям</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: selectedCategory.background, border: `1px solid ${selectedCategory.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: selectedCategory.color, flexShrink: 0 }}><i className={`fa-solid ${selectedCategory.icon}`} /></span>
            <h2 style={{ color: "white", fontSize: "clamp(1.15rem,3vw,1.35rem)", fontWeight: 750, margin: 0 }}>{selectedCategory.title}</h2>
          </div>
          <p style={{ color: "#9ca3af", fontSize: ".88rem", margin: "0 0 19px 56px" }}>Что произошло?</p>
          <div className="subtype-grid">
            {selectedCategory.subtypes.map(([subtypeId, subtypeLabel]) => {
              const isActive = claimData.subtype === subtypeId;
              return (
                <button
                  key={subtypeId}
                  type="button"
                  className="subtype-option"
                  onClick={() => selectSubtype(subtypeId, subtypeLabel)}
                  style={{ width: "100%", padding: "13px 15px", borderRadius: 11, background: isActive ? "rgba(99,102,241,.16)" : "rgba(255,255,255,.025)", border: `1px solid ${isActive ? "rgba(129,140,248,.55)" : "rgba(255,255,255,.1)"}`, color: "white", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 11, fontSize: ".84rem", lineHeight: 1.4, whiteSpace: "normal", overflowWrap: "anywhere" }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isActive ? "#818cf8" : "#4b5563"}`, background: isActive ? "#818cf8" : "transparent", boxShadow: isActive ? "inset 0 0 0 4px #191a2e" : "none", flexShrink: 0 }} />
                  {subtypeLabel}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
