import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { isGibberish } from "@/components/generator/GarbledTextWarning";
import { getCategoryRules } from "@/data/legalRules";
import { validateProductCircumstances } from "@/components/generator/validation";

const S = { width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.875rem", outline: "none" };
const SE = { ...S, border: "1px solid #f43f5e" };
const SG = { ...S, border: "1px solid #4ade80" };
const SEG = { ...S, border: "1px solid #f59e0b" }; // gibberish warning
const TA = { ...S, resize: "vertical" };
const TAE = { ...SE, resize: "vertical" };
const TAG = { ...SG, resize: "vertical" };
const TAEG = { ...SEG, resize: "vertical" };
const L = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#d1d5db", marginBottom: 6 };
const SELECT = { ...S, backgroundColor: "#111827", colorScheme: "dark", cursor: "pointer" };
const SECTION = { background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 14 };

function ErrMsg({ msg }) { return msg ? <p style={{ color: "#f43f5e", fontSize: "0.72rem", marginTop: 3 }}>{msg}</p> : null; }
function GarbMsg({ msg }) { return msg ? <p style={{ color: "#f59e0b", fontSize: "0.72rem", marginTop: 3 }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{msg}</p> : null; }

const PRODUCT_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const PRODUCT_WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function parseProductDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : undefined;
}

function formatProductStorageDate(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatProductDisplayDate(value) {
  const date = parseProductDate(value);
  if (!date) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function ProductDatePicker({ value, onChange, error, maxDate }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = parseProductDate(value);

  useEffect(() => {
    const closeOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          readOnly
          value={formatProductDisplayDate(value)}
          placeholder="ДД.ММ.ГГГГ"
          onClick={() => setOpen(current => !current)}
          onFocus={() => setOpen(true)}
          style={{ ...(error ? SE : S), paddingRight: 72, cursor: "pointer", caretColor: "transparent" }}
        />
        <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 2 }}>
          {value && <button type="button" aria-label="Очистить дату" onClick={event => { event.stopPropagation(); onChange(""); }} style={{ border: 0, background: "transparent", color: "#64748b", padding: 6, cursor: "pointer" }}><i className="fa-solid fa-xmark" /></button>}
          <button type="button" aria-label="Открыть календарь" onClick={event => { event.stopPropagation(); setOpen(current => !current); }} style={{ border: 0, background: "transparent", color: "#94a3b8", padding: 6, cursor: "pointer" }}><i className="fa-regular fa-calendar" /></button>
        </div>
      </div>
      {open && <div className="product-date-picker" style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 60, padding: 9, borderRadius: 14, background: "#1e293b", border: "1px solid rgba(148,163,184,.25)", boxShadow: "0 18px 48px rgba(0,0,0,.65)" }}>
        <style>{`
          .product-date-picker .rdp { --rdp-accent-color:#0ea5e9; --rdp-background-color:rgba(14,165,233,.18); margin:0; color:#e2e8f0; }
          .product-date-picker .rdp-caption_label { color:#fff; font-size:.9rem; font-weight:700; }
          .product-date-picker .rdp-head_cell { color:#94a3b8; font-size:.72rem; font-weight:700; }
          .product-date-picker .rdp-day { color:#e2e8f0; border-radius:8px; }
          .product-date-picker .rdp-day:hover:not(.rdp-day_selected) { background:rgba(14,165,233,.14); }
          .product-date-picker .rdp-day_selected { color:#fff; background:#0ea5e9; font-weight:800; }
          .product-date-picker .rdp-day_outside { color:#475569; }
          .product-date-picker .rdp-day_disabled { color:#334155; opacity:.55; }
          .product-date-picker .rdp-nav_button { color:#cbd5e1; border-radius:8px; }
          .product-date-picker .rdp-nav_button:hover { background:rgba(255,255,255,.08); }
        `}</style>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={date => {
            if (!date) return;
            onChange(formatProductStorageDate(date));
            setOpen(false);
          }}
          defaultMonth={selected || maxDate || new Date()}
          disabled={maxDate ? { after: maxDate } : undefined}
          showOutsideDays
          fixedWeeks
          formatters={{
            formatCaption: date => `${PRODUCT_MONTHS[date.getMonth()]} ${date.getFullYear()}`,
            formatWeekdayName: date => PRODUCT_WEEKDAYS[date.getDay()],
          }}
        />
      </div>}
    </div>
  );
}

// ──────────────── LABOR ────────────────
function LaborForm({ form, set, errors, garbled, subtype }) {
  const [stillWorking, setStillWorking] = useState(form.stillWorking ?? (!form.workEnd || form.workEnd === "настоящее время"));

  const payOptions = ["Наличными", "На карту", "На расчётный счёт"];

  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16 }}>
        <h4 style={{ fontWeight: 600, color: "white", marginBottom: 14, fontSize: "0.9rem" }}>Период работы</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={L}>Дата начала работы <span style={{ color: "#f43f5e" }}>*</span></label>
            <input type="date" style={errors.workStart ? SE : S} value={form.workStart || ""} onChange={e => set("workStart", e.target.value)} />
            <ErrMsg msg={errors.workStart} />
          </div>
          <div>
            <label style={L}>Дата окончания работы</label>
            <input type="date" style={S} disabled={stillWorking} value={form.workEnd || ""} onChange={e => set("workEnd", e.target.value)} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={stillWorking} onChange={e => { const checked = e.target.checked; setStillWorking(checked); set("stillWorking", checked); set("workEnd", ""); }} />
              <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>По настоящее время</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label style={L}>ФИО непосредственного руководителя</label>
        <input style={garbled.supervisor ? SEG : S} value={form.supervisor || ""} onChange={e => set("supervisor", e.target.value)} placeholder="Петров Пётр Петрович" maxLength={100} />
        <GarbMsg msg={garbled.supervisor ? "Обнаружен бессмысленный или случайный набор символов" : null} />
      </div>

      <div>
        <label style={L}>Место выполнения работ <span style={{ color: "#f43f5e" }}>*</span></label>
        <input style={errors.workplace ? SE : (garbled.workplace ? SEG : S)} value={form.workplace || ""} onChange={e => set("workplace", e.target.value)} placeholder="г. Москва, ул. Строителей, д. 5" />
        <ErrMsg msg={errors.workplace} />
        <GarbMsg msg={garbled.workplace ? "Обнаружен бессмысленный или случайный набор символов" : null} />
      </div>

      {(subtype === "dismissal-payment" || subtype === "unlawful-dismissal" || subtype === "forced-resignation") && (
        <div>
          <label style={L}>Дата увольнения</label>
          <input type="date" style={S} value={form.dismissalDate || ""} onChange={e => set("dismissalDate", e.target.value)} />
        </div>
      )}

      <div>
        <label style={L}>Форма оплаты <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "0.75rem" }}>(можно выбрать несколько)</span></label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {payOptions.map(opt => {
            const selected = Array.isArray(form.paymentForm) ? form.paymentForm.includes(opt) : form.paymentForm === opt;
            const toggle = () => {
              const cur = Array.isArray(form.paymentForm) ? form.paymentForm : (form.paymentForm ? [form.paymentForm] : []);
              set("paymentForm", selected ? cur.filter(x => x !== opt) : [...cur, opt]);
            };
            return (
              <button key={opt} type="button" onClick={toggle}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500, border: `1px solid ${selected ? "#0ea5e9" : "rgba(255,255,255,0.15)"}`, background: selected ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.04)", color: selected ? "#22d3ee" : "#d1d5db", cursor: "pointer" }}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 16 }}>
        <h4 style={{ fontWeight: 600, color: "#fbbf24", marginBottom: 14, fontSize: "0.9rem" }}>Задолженность</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={L}>Начислено, но не выплачено до учёта частичных выплат (руб.)</label>
            <input type="number" min="1" style={errors.debtAmount ? SE : S} value={form.debtAmount || ""} onChange={e => set("debtAmount", e.target.value)} placeholder="125000" />
            <ErrMsg msg={errors.debtAmount} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={L}>Дата выплаты (плановая)</label>
              <input type="date" style={S} value={form.dueDate || ""} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div>
              <label style={L}>Дней просрочки</label>
              <input type="number" min="1" max="3650" style={S} value={form.delayDays || ""} onChange={e => set("delayDays", e.target.value)} placeholder="45" />
            </div>
          </div>
          <p style={{ color: "#9ca3af", fontSize: ".74rem", lineHeight: 1.5 }}>Компенсация по статье 236 ТК РФ рассчитывается с учётом ключевой ставки, действующей в соответствующие периоды задержки, по день фактического расчёта.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
        <div>
          <label style={L}>Сумма частичной выплаты (руб.)</label>
          <input type="number" min="0" style={S} value={form.partialPaymentAmount || ""} onChange={e => set("partialPaymentAmount", e.target.value)} placeholder="25000" />
        </div>
        <div>
          <label style={L}>Дата последней частичной выплаты</label>
          <input type="date" style={S} value={form.lastPartialPaymentDate || ""} onChange={e => set("lastPartialPaymentDate", e.target.value)} />
        </div>
      </div>
      <div>
        <label style={L}>Комментарий о частичных выплатах</label>
        <textarea style={garbled.partialPayments ? TAEG : TA} rows={2} value={form.partialPayments || ""} onChange={e => set("partialPayments", e.target.value)} placeholder="Например: перевод на карту, назначение платежа" maxLength={500} />
        <GarbMsg msg={garbled.partialPayments ? "Обнаружен бессмысленный или случайный набор символов" : null} />
      </div>
    </>
  );
}

// ──────────────── PRODUCT ────────────────
function ProductForm({ form, set, errors, garbled }) {
  const garbledMessage = "Обнаружен бессмысленный или случайный набор символов";
  const responsiveGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 };
  const optionStyle = { background: "#111827", color: "#f8fafc" };
  const required = <span style={{ color: "#f43f5e" }}>*</span>;
  const demandNeedsAmount = ["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"].includes(form.consumerDemand);
  const claimAmount = form.claimAmount ?? form.refundAmount ?? "";
  const amountPlaceholder = {
    "вернуть деньги": "например 12 990",
    "уменьшить цену": "на какую сумму уменьшить цену",
    "возместить расходы на ремонт": "сумма расходов",
    "компенсировать убытки": "сумма убытков",
  }[form.consumerDemand] || "укажите сумму";
  const setClaimAmount = value => {
    set("claimAmount", value);
    set("refundAmount", value);
  };

  return (
    <div className="product-form" style={{ display: "contents" }}>
      <style>{`
        .product-form input:focus,
        .product-form textarea:focus,
        .product-form select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
        }
        .product-form select:hover,
        .product-form input:hover,
        .product-form textarea:hover {
          border-color: rgba(125, 211, 252, 0.55) !important;
        }
        .product-form select,
        .product-form option {
          background-color: #111827;
          color: #f8fafc;
        }
        .product-form input,
        .product-form textarea {
          background-color: #111827 !important;
          color-scheme: dark;
        }
        .product-form input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(1) brightness(1.2);
        }
      `}</style>
      <section style={SECTION}>
        <div>
          <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Данные о товаре</h4>
          <p style={{ color: "#94a3b8", fontSize: ".78rem", margin: "4px 0 0" }}>Укажите сведения из чека, заказа или карточки товара.</p>
        </div>
        <div>
          <label style={L}>Наименование товара {required}</label>
          <input style={errors.productName ? SE : (garbled.productName ? SEG : S)} value={form.productName || ""} onChange={e => set("productName", e.target.value)} placeholder="Например, смартфон Samsung Galaxy S23" maxLength={200} />
          <ErrMsg msg={errors.productName} />
          <GarbMsg msg={garbled.productName ? garbledMessage : null} />
        </div>
        <div>
          <label style={L}>Место покупки / магазин</label>
          <input style={garbled.sellerName ? SEG : S} value={form.sellerName || ""} onChange={e => set("sellerName", e.target.value)} placeholder="Магазин, сайт или маркетплейс" maxLength={300} />
          <GarbMsg msg={garbled.sellerName ? garbledMessage : null} />
        </div>
        <div style={responsiveGrid}>
          <div>
            <label style={L}>Дата покупки {required}</label>
            <ProductDatePicker value={form.purchaseDate || ""} onChange={value => set("purchaseDate", value)} error={errors.purchaseDate} maxDate={new Date()} />
            <ErrMsg msg={errors.purchaseDate} />
          </div>
          <div>
            <label style={L}>Стоимость товара, ₽ {required}</label>
            <input type="number" min="0.01" step="0.01" style={errors.purchaseAmount ? SE : S} value={form.purchaseAmount || ""} onChange={e => set("purchaseAmount", e.target.value)} placeholder="15000" />
            <ErrMsg msg={errors.purchaseAmount} />
          </div>
          <div>
            <label style={L}>Способ оплаты</label>
            <select style={SELECT} value={form.purchasePaymentMethod || ""} onChange={e => set("purchasePaymentMethod", e.target.value)}>
              <option style={optionStyle} value="">Выберите способ оплаты</option>
              {["наличные", "карта", "онлайн-оплата", "кредит/рассрочка", "другое"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={L}>Номер заказа или чека</label>
            <input style={S} value={form.orderNumber || ""} onChange={e => set("orderNumber", e.target.value)} placeholder="Если сохранился" maxLength={100} />
          </div>
        </div>
        {form.purchasePaymentMethod === "другое" && <div>
          <label style={L}>Укажите способ оплаты</label>
          <input style={errors.purchasePaymentOther ? SE : S} value={form.purchasePaymentOther || ""} onChange={e => set("purchasePaymentOther", e.target.value)} placeholder="Как вы оплатили товар" maxLength={200} />
          <ErrMsg msg={errors.purchasePaymentOther} />
        </div>}
        <div>
          <label style={L}>Гарантия</label>
          <input style={garbled.warrantyInfo ? SEG : S} value={form.warrantyInfo || ""} onChange={e => set("warrantyInfo", e.target.value)} placeholder="Например, 1 год или «не указан»" maxLength={500} />
          <GarbMsg msg={garbled.warrantyInfo ? garbledMessage : null} />
        </div>
      </section>

      <section style={SECTION}>
        <div>
          <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Проблема с товаром</h4>
          <p style={{ color: "#94a3b8", fontSize: ".78rem", margin: "4px 0 0" }}>Опишите, что произошло и когда вы это обнаружили.</p>
        </div>
        <div>
          <label style={L}>Тип проблемы {required}</label>
          <select style={errors.problemType ? { ...SELECT, ...SE } : SELECT} value={form.problemType || ""} onChange={e => set("problemType", e.target.value)}>
            <option style={optionStyle} value="">Выберите проблему</option>
            {["товар с дефектом", "товар не соответствует описанию", "товар не подошёл, продавец отказал в возврате", "товар не доставлен", "товар доставлен с повреждениями", "гарантийный ремонт затянулся", "продавец отказал в гарантии", "другое"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </select>
          <ErrMsg msg={errors.problemType} />
        </div>
        {form.problemType === "другое" && <div>
          <label style={L}>Уточните проблему {required}</label>
          <input style={errors.problemOther ? SE : S} value={form.problemOther || ""} onChange={e => set("problemOther", e.target.value)} placeholder="Кратко опишите тип проблемы" maxLength={300} />
          <ErrMsg msg={errors.problemOther} />
        </div>}
        <div style={responsiveGrid}>
          <div>
            <label style={L}>Дата обнаружения недостатка {required}</label>
            <ProductDatePicker value={form.defectFoundDate || ""} onChange={value => set("defectFoundDate", value)} error={errors.defectFoundDate} />
            <ErrMsg msg={errors.defectFoundDate} />
          </div>
          <div>
            <label style={L}>Использовался ли товар</label>
            <select style={SELECT} value={form.productUsage || ""} onChange={e => set("productUsage", e.target.value)}>
              <option style={optionStyle} value="">Выберите вариант</option>
              {["да", "нет", "частично"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={L}>Описание недостатков {required}</label>
          <textarea style={errors.defectDescription ? TAE : (garbled.defectDescription ? TAEG : TA)} rows={4} value={form.defectDescription || ""} onChange={e => set("defectDescription", e.target.value)} placeholder="Опишите, что произошло: когда купили товар, какой недостаток обнаружили, как обращались к продавцу и что он ответил." maxLength={2000} />
          <ErrMsg msg={errors.defectDescription} />
          <GarbMsg msg={garbled.defectDescription ? garbledMessage : null} />
        </div>
      </section>

      <section style={SECTION}>
        <div>
          <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Обращение к продавцу</h4>
          <p style={{ color: "#94a3b8", fontSize: ".78rem", margin: "4px 0 0" }}>Если вы уже обращались, укажите способ и результат.</p>
        </div>
        <div style={responsiveGrid}>
          <div>
            <label style={L}>Дата обращения к продавцу</label>
            <ProductDatePicker value={form.sellerRequestDate || ""} onChange={value => set("sellerRequestDate", value)} error={errors.sellerRequestDate} />
            <ErrMsg msg={errors.sellerRequestDate} />
          </div>
          <div>
            <label style={L}>Способ обращения</label>
            <select style={SELECT} value={form.requestMethod || ""} onChange={e => set("requestMethod", e.target.value)}>
              <option style={optionStyle} value="">Выберите способ</option>
            {["лично", "по email", "через сайт", "через чат поддержки", "через маркетплейс", "через мессенджер", "по телефону", "другое"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={L}>Дата ответа продавца</label>
            <ProductDatePicker value={form.sellerResponseDate || ""} onChange={value => set("sellerResponseDate", value)} error={errors.sellerResponseDate} />
            <ErrMsg msg={errors.sellerResponseDate} />
          </div>
        </div>
        {form.requestMethod === "другое" && <div>
          <label style={L}>Укажите способ обращения</label>
          <input style={errors.requestMethodOther ? SE : S} value={form.requestMethodOther || ""} onChange={e => set("requestMethodOther", e.target.value)} />
          <ErrMsg msg={errors.requestMethodOther} />
        </div>}
        <div>
          <label style={L}>Что ответил продавец</label>
          <select style={SELECT} value={form.sellerResponseStatus || ""} onChange={e => set("sellerResponseStatus", e.target.value)}>
            <option style={optionStyle} value="">Выберите ответ продавца</option>
            {["не ответил", "отказал", "обещал решить, но не решил", "предложил ремонт", "предложил частичный возврат", "другое"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </select>
        </div>
        {form.sellerResponseStatus === "другое" && <div>
          <label style={L}>Уточните результат обращения</label>
          <input style={errors.sellerResponseOther ? SE : S} value={form.sellerResponseOther || ""} onChange={e => set("sellerResponseOther", e.target.value)} />
          <ErrMsg msg={errors.sellerResponseOther} />
        </div>}
        <div>
          <label style={L}>Суть ответа продавца</label>
          <textarea style={garbled.sellerResponse ? TAEG : TA} rows={3} value={form.sellerResponse || ""} onChange={e => set("sellerResponse", e.target.value)} placeholder="Что сообщил продавец или поддержка" maxLength={2000} />
          <GarbMsg msg={garbled.sellerResponse ? garbledMessage : null} />
        </div>
      </section>

      <section style={SECTION}>
        <div>
          <h4 style={{ color: "white", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Требования</h4>
          <p style={{ color: "#94a3b8", fontSize: ".78rem", margin: "4px 0 0" }}>Выберите основной результат, которого хотите добиться.</p>
        </div>
        <div>
          <label style={L}>Что требуете от продавца {required}</label>
          <select style={errors.consumerDemand ? { ...SELECT, ...SE } : SELECT} value={form.consumerDemand || ""} onChange={e => set("consumerDemand", e.target.value)}>
            <option style={optionStyle} value="">Выберите требование</option>
            {["вернуть деньги", "заменить товар", "уменьшить цену", "бесплатно устранить недостатки", "возместить расходы на ремонт", "компенсировать убытки", "другое"].map(value => <option style={optionStyle} key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </select>
          <ErrMsg msg={errors.consumerDemand} />
        </div>
        {form.consumerDemand === "другое" && <div>
          <label style={L}>Уточните требование {required}</label>
          <input style={errors.demandOther ? SE : S} value={form.demandOther || ""} onChange={e => set("demandOther", e.target.value)} />
          <ErrMsg msg={errors.demandOther} />
        </div>}
        {demandNeedsAmount && <div>
          <label style={L}>Сумма требования, ₽ {required}</label>
          <input type="number" min="0.01" step="0.01" style={errors.claimAmount ? SE : S} value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder={amountPlaceholder} />
          <ErrMsg msg={errors.claimAmount} />
        </div>}
        <div>
          <label style={L}>Дополнительные расходы: описание</label>
          <input style={errors.additionalExpenses ? SE : S} value={form.additionalExpenses || ""} onChange={e => set("additionalExpenses", e.target.value)} placeholder="Какие расходы вы понесли" maxLength={500} />
          <ErrMsg msg={errors.additionalExpenses} />
        </div>
        <div style={responsiveGrid}>
          <div>
            <label style={L}>Сумма дополнительных расходов, ₽</label>
            <input type="number" min="0.01" step="0.01" style={errors.additionalExpensesAmount ? SE : S} value={form.additionalExpensesAmount || ""} onChange={e => set("additionalExpensesAmount", e.target.value)} />
            <ErrMsg msg={errors.additionalExpensesAmount} />
          </div>
          <div>
            <label style={L}>Сумма морального вреда, ₽</label>
            <input type="number" min="0.01" step="0.01" style={errors.moralDamageAmount ? SE : S} value={form.moralDamageAmount || ""} onChange={e => set("moralDamageAmount", e.target.value)} />
            <ErrMsg msg={errors.moralDamageAmount} />
          </div>
        </div>
        <div>
          <label style={L}>Способ возврата денег / реквизиты</label>
          <input style={garbled.bankDetails ? SEG : S} value={form.bankDetails || ""} onChange={e => set("bankDetails", e.target.value)} placeholder="карта, счёт, СБП, телефон или другое удобное описание" maxLength={500} />
          <GarbMsg msg={garbled.bankDetails ? garbledMessage : null} />
        </div>
        <div>
          <label style={L}>Комментарий пользователя</label>
          <textarea style={garbled.userComment ? TAEG : TA} rows={3} value={form.userComment || ""} onChange={e => set("userComment", e.target.value)} placeholder="Дополнительные обстоятельства или важные уточнения" maxLength={2000} />
          <GarbMsg msg={garbled.userComment ? garbledMessage : null} />
        </div>
      </section>
    </div>
  );
}

// ──────────────── INFOPRODUCT ────────────────
function InfoproductForm({ form, set, errors, garbled }) {
  const violations = ["Отказ в возврате", "Ошибки куратора", "Нет доступа к курсу", "Контент не соответствует описанию", "Срок доступа сокращён"];
  const togViolation = (v) => {
    const arr = form.violations || [];
    set("violations", arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  return (
    <>
      <div>
        <label style={L}>Название курса <span style={{ color: "#f43f5e" }}>*</span></label>
        <input style={errors.productName ? SE : (garbled.productName ? SEG : S)} value={form.productName || ""} onChange={e => set("productName", e.target.value)} placeholder='Курс "Python с нуля"' maxLength={200} />
        <ErrMsg msg={errors.productName} />
        <GarbMsg msg={garbled.productName ? "Обнаружен бессмысленный или случайный набор символов" : null} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={L}>Дата покупки</label>
          <input type="date" style={S} value={form.purchaseDate || ""} onChange={e => set("purchaseDate", e.target.value)} />
        </div>
        <div>
          <label style={L}>Стоимость курса (руб.) <span style={{ color: "#f43f5e" }}>*</span></label>
          <input type="number" min="1" style={errors.purchaseAmount ? SE : S} value={form.purchaseAmount || ""} onChange={e => set("purchaseAmount", e.target.value)} placeholder="25000" />
          <ErrMsg msg={errors.purchaseAmount} />
        </div>
      </div>
      <div>
        <label style={L}>Название онлайн-школы / исполнителя</label>
        <input style={garbled.providerName ? SEG : S} value={form.providerName || ""} onChange={e => set("providerName", e.target.value)} placeholder="Онлайн-школа или исполнитель" maxLength={200} />
        <GarbMsg msg={garbled.providerName ? "Проверьте название исполнителя" : null} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <div>
          <label style={L}>Способ оплаты</label>
          <select style={S} value={form.paymentMethod || ""} onChange={e => set("paymentMethod", e.target.value)}>
            <option value="">Выберите способ</option>
            <option value="Карта">Карта</option>
            <option value="Кредит">Кредит</option>
            <option value="Рассрочка">Рассрочка</option>
            <option value="Другое">Другое</option>
          </select>
        </div>
        <div>
          <label style={L}>Требуемая сумма возврата (руб.)</label>
          <input type="number" min="0" style={S} value={form.refundAmount || ""} onChange={e => set("refundAmount", e.target.value)} placeholder="25000" />
        </div>
      </div>
      <label style={{ ...L, display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        <input type="checkbox" checked={Boolean(form.creditOrInstallment)} onChange={e => set("creditOrInstallment", e.target.checked)} />
        Курс оплачен кредитом или в рассрочку
      </label>
      {[
        ["salesPromises", "Что обещали при продаже курса", "Опишите программу, результат, поддержку и иные обещанные условия"],
        ["actualResult", "Что получили фактически", "Опишите фактически предоставленные материалы и услуги"],
        ["serviceDefects", "В чём недостаток услуги", "Укажите конкретные недостатки обучения"],
      ].map(([key, label, placeholder]) => (
        <div key={key}>
          <label style={L}>{label}</label>
          <textarea style={garbled[key] ? TAEG : TA} rows={3} value={form[key] || ""} onChange={e => set(key, e.target.value)} placeholder={placeholder} maxLength={2000} />
          <GarbMsg msg={garbled[key] ? "Проверьте введённый текст" : null} />
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <div>
          <label style={L}>Дата обращения за возвратом</label>
          <input type="date" style={S} value={form.refundRequestDate || ""} onChange={e => set("refundRequestDate", e.target.value)} />
        </div>
        <div>
          <label style={L}>Моральный вред (руб.)</label>
          <input type="number" min="0" style={S} value={form.moralDamageAmount || ""} onChange={e => set("moralDamageAmount", e.target.value)} placeholder="Укажите при необходимости" />
        </div>
      </div>
      <div>
        <label style={L}>Что ответила поддержка</label>
        <textarea style={garbled.supportResponse ? TAEG : TA} rows={3} value={form.supportResponse || ""} onChange={e => set("supportResponse", e.target.value)} placeholder="Ответ поддержки или отметка об отсутствии ответа" maxLength={2000} />
        <GarbMsg msg={garbled.supportResponse ? "Проверьте введённый текст" : null} />
      </div>
      <div>
        <label style={L}>Комментарий пользователя</label>
        <textarea style={garbled.userComment ? TAEG : TA} rows={3} value={form.userComment || ""} onChange={e => set("userComment", e.target.value)} placeholder="Дополнительные обстоятельства" maxLength={2000} />
        <GarbMsg msg={garbled.userComment ? "Проверьте введённый текст" : null} />
      </div>
      <div>
        <label style={L}>Характер нарушений</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {violations.map(v => {
            const checked = (form.violations || []).includes(v);
            return (
              <button key={v} type="button" onClick={() => togViolation(v)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem", border: `1px solid ${checked ? "#f472b6" : "rgba(255,255,255,0.15)"}`, background: checked ? "rgba(244,114,182,0.15)" : "rgba(255,255,255,0.04)", color: checked ? "#f472b6" : "#d1d5db", cursor: "pointer" }}>
                {v}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ──────────────── CIVIL ────────────────
function CivilForm({ form, set, errors, garbled }) {
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 };
  const textError = "Обнаружен бессмысленный или случайный набор символов";
  return (
    <>
      <div style={grid}>
        <div>
          <label style={L}>Кредитор / тот, кто передал деньги</label>
          <input style={garbled.creditorName ? SEG : S} value={form.creditorName || ""} onChange={e => set("creditorName", e.target.value)} maxLength={300} />
          <GarbMsg msg={garbled.creditorName ? textError : null} />
        </div>
        <div>
          <label style={L}>Должник / тот, кто должен вернуть деньги</label>
          <input style={garbled.debtorName ? SEG : S} value={form.debtorName || ""} onChange={e => set("debtorName", e.target.value)} maxLength={300} />
          <GarbMsg msg={garbled.debtorName ? textError : null} />
        </div>
      </div>

      <div style={grid}>
        <div>
          <label style={L}>Основание долга</label>
          <select style={S} value={form.contractType || ""} onChange={e => set("contractType", e.target.value)}>
            <option value="">Выберите основание</option>
            <option value="Расписка">Расписка</option>
            <option value="Договор займа">Договор займа</option>
            <option value="Иное основание">Иное основание</option>
          </select>
        </div>
        <div>
          <label style={L}>Номер документа</label>
          <input style={garbled.contractNumber ? SEG : S} value={form.contractNumber || ""} onChange={e => set("contractNumber", e.target.value)} maxLength={100} />
          <GarbMsg msg={garbled.contractNumber ? textError : null} />
        </div>
        <div>
          <label style={L}>Дата заключения договора / расписки</label>
          <input type="date" style={S} value={form.contractDate || ""} onChange={e => set("contractDate", e.target.value)} />
          <ErrMsg msg={errors.contractDate} />
        </div>
        <div>
          <label style={L}>Дата передачи денег</label>
          <input type="date" style={S} value={form.moneyTransferDate || ""} onChange={e => set("moneyTransferDate", e.target.value)} />
        </div>
      </div>

      <div style={grid}>
        <div>
          <label style={L}>Основная сумма долга (руб.) <span style={{ color: "#f43f5e" }}>*</span></label>
          <input type="number" min="1" style={errors.debtAmount ? SE : S} value={form.debtAmount || ""} onChange={e => set("debtAmount", e.target.value)} placeholder="100000" />
          <ErrMsg msg={errors.debtAmount} />
        </div>
        <div>
          <label style={L}>Сколько уже возвращено (руб.)</label>
          <input type="number" min="0" style={S} value={form.returnedAmount || ""} onChange={e => set("returnedAmount", e.target.value)} />
        </div>
        <div>
          <label style={L}>Остаток долга (руб.)</label>
          <input type="number" min="0" style={S} value={form.remainingDebtAmount || ""} onChange={e => set("remainingDebtAmount", e.target.value)} />
        </div>
      </div>

      <div style={grid}>
        <div>
          <label style={L}>Срок возврата</label>
          <input type="date" style={S} value={form.repaymentDate || ""} onChange={e => set("repaymentDate", e.target.value)} />
        </div>
        <div>
          <label style={L}>Дней просрочки</label>
          <input type="number" min="0" style={S} value={form.delayDays || ""} onChange={e => set("delayDays", e.target.value)} placeholder="30" />
        </div>
        <div>
          <label style={L}>Способ передачи денег</label>
          <select style={S} value={form.transferMethod || ""} onChange={e => set("transferMethod", e.target.value)}>
            <option value="">Выберите способ</option>
            <option value="Наличные">Наличные</option>
            <option value="Банковский перевод">Банковский перевод</option>
            <option value="Другое">Другое</option>
          </select>
        </div>
      </div>

      <div style={grid}>
        <div>
          <label style={L}>Дата требования вернуть долг</label>
          <input type="date" style={S} value={form.demandDate || ""} onChange={e => set("demandDate", e.target.value)} />
        </div>
        <div>
          <label style={L}>Способ направления требования</label>
          <select style={S} value={form.demandMethod || ""} onChange={e => set("demandMethod", e.target.value)}>
            <option value="">Выберите способ</option>
            <option value="Лично">Лично</option>
            <option value="Почта">Почта</option>
            <option value="Электронно">Электронно</option>
            <option value="Мессенджер">Мессенджер</option>
          </select>
        </div>
      </div>
      <div>
        <label style={L}>Ответ должника</label>
        <textarea style={garbled.debtorResponse ? TAEG : TA} rows={3} value={form.debtorResponse || ""} onChange={e => set("debtorResponse", e.target.value)} maxLength={2000} />
        <GarbMsg msg={garbled.debtorResponse ? textError : null} />
      </div>

      <label style={{ ...L, display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        <input type="checkbox" checked={Boolean(form.interestRequired)} onChange={e => set("interestRequired", e.target.checked)} />
        Требуются проценты
      </label>
      <div style={grid}>
        <div>
          <label style={L}>Процентная ставка</label>
          <input type="number" min="0" step="0.01" style={S} value={form.interestRate || ""} onChange={e => set("interestRate", e.target.value)} placeholder="%" />
        </div>
        <div>
          <label style={L}>Период начисления процентов</label>
          <input style={garbled.interestPeriod ? SEG : S} value={form.interestPeriod || ""} onChange={e => set("interestPeriod", e.target.value)} placeholder="Например: с 01.01.2025 по 01.06.2025" maxLength={300} />
          <GarbMsg msg={garbled.interestPeriod ? textError : null} />
        </div>
      </div>

      <div>
        <label style={L}>Дополнительные расходы</label>
        <textarea style={garbled.additionalExpenses ? TAEG : TA} rows={2} value={form.additionalExpenses || ""} onChange={e => set("additionalExpenses", e.target.value)} maxLength={1000} />
        <GarbMsg msg={garbled.additionalExpenses ? textError : null} />
      </div>
      <div>
        <label style={L}>Реквизиты для возврата денег</label>
        <input style={garbled.bankDetails ? SEG : S} value={form.bankDetails || ""} onChange={e => set("bankDetails", e.target.value)} maxLength={500} />
        <GarbMsg msg={garbled.bankDetails ? textError : null} />
      </div>
      <div>
        <label style={L}>Комментарий</label>
        <textarea style={garbled.userComment ? TAEG : TA} rows={3} value={form.userComment || ""} onChange={e => set("userComment", e.target.value)} maxLength={2000} />
        <GarbMsg msg={garbled.userComment ? textError : null} />
      </div>
    </>
  );
}

function BasicCategoryFields({ rules, form, set }) {
  return <>{(rules?.fields || []).filter(field => field.id !== "description").map(field => <div key={field.id}><label style={L}>{field.label}{field.required && <span style={{ color: "#f43f5e" }}> *</span>}</label><input type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} style={S} value={form[field.id] || ""} onChange={event => set(field.id, event.target.value)} /></div>)}</>;
}

// ──────────────── MAIN ────────────────
export default function Step5Circumstances({ claimData, updateClaimData, nextStep, prevStep }) {
  const [form, setForm] = useState(claimData.circumstances || {});
  const [errors, setErrors] = useState({});
  const [garbled, setGarbled] = useState({});
  const [selectedLegalOptions, setSelectedLegalOptions] = useState(claimData.selectedLegalOptions || []);
  const type = claimData.type;
  const rules = getCategoryRules(type);
  const normalizedType = type === "infoproduct" ? "course" : type === "civil" ? "debt" : type;
  const laborDebtSubtypes = new Set(["unpaid-wages", "dismissal-payment", "delayed-leave-or-sick-pay", "unpaid-overtime"]);
  const laborDebtRequired = type === "labor" && laborDebtSubtypes.has(claimData.subtype);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    updateClaimData({ circumstances: form, selectedLegalOptions });
  }, [form, selectedLegalOptions, updateClaimData]);

  // Check fields for gibberish
  function checkGarbled(f) {
    const g = {};
    const textFields = ["description", "supervisor", "workplace", "productName", "defectDescription", "sellerName", "warrantyInfo", "sellerResponse", "diagnosticsInfo", "additionalExpenses", "bankDetails", "partialPayments", "socialImpact", "providerName", "salesPromises", "actualResult", "serviceDefects", "supportResponse", "userComment", "creditorName", "debtorName", "contractNumber", "debtorResponse", "interestPeriod"];
    textFields.forEach(key => {
      if (f[key] && typeof f[key] === "string" && f[key].trim().length >= 8 && isGibberish(f[key])) {
        g[key] = true;
      }
    });
    return g;
  }

  function doValidate() {
    const e = {};
    if (type === "product") {
      Object.assign(e, validateProductCircumstances(form));
      const purchaseAmount = Number(form.purchaseAmount);
      const claimAmount = Number(form.claimAmount ?? form.refundAmount);
      const hasExplainedExtraAmount = Number(form.additionalExpensesAmount) > 0
        || Boolean(String(form.additionalExpenses || "").trim());
      if (form.consumerDemand === "вернуть деньги"
        && purchaseAmount > 0
        && claimAmount > purchaseAmount
        && !hasExplainedExtraAmount) {
        e.claimAmount = "Сумма возврата не может превышать стоимость товара без отдельно указанных расходов или убытков";
      }
    } else if (type === "labor") {
      if (!form.workStart) e.workStart = "Укажите дату начала работы";
      if (!form.workplace?.trim() || form.workplace.trim().length < 5) e.workplace = "Укажите место выполнения работ";
      if (laborDebtRequired && (!form.debtAmount || parseFloat(form.debtAmount) <= 0)) e.debtAmount = "Укажите сумму задолженности";
      if (!form.description?.trim() || form.description.trim().length < 30) e.description = "Опишите ситуацию подробнее: когда начали работать, какую оплату обещали и что не выплатили";
    } else if (normalizedType === "debt") {
      if (!form.contractDate && (!form.description?.trim() || form.description.trim().length < 50)) e.contractDate = "Укажите дату документа или опишите основание долга ниже";
    } else if (!form.description?.trim() || form.description.trim().length < 50) e.description = "Минимум 50 символов";
    if (normalizedType === "course" && (!form.purchaseAmount || parseFloat(form.purchaseAmount) <= 0)) e.purchaseAmount = "Укажите сумму";
    if (normalizedType === "course" && !form.productName?.trim()) e.productName = "Укажите название курса";
    if (normalizedType === "debt" && (!form.debtAmount || parseFloat(form.debtAmount) <= 0)) e.debtAmount = "Укажите сумму";

    // Gibberish check
    const g = checkGarbled(form);
    if (g.description) e.description = "Обнаружен бессмысленный или случайный набор символов в описании";

    setErrors(e);
    setGarbled(g);
    return Object.keys(e).length === 0 && Object.keys(g).length === 0;
  }

  function save() {
    if (!doValidate()) return;
    const circumstances = type === "labor" ? {
      ...form,
      outstandingDebtAmount: Math.max(0, (parseFloat(form.debtAmount) || 0) - (parseFloat(form.partialPaymentAmount) || 0)),
    } : form;
    updateClaimData({ circumstances, selectedLegalOptions });
    nextStep();
  }

  const toggleLegalOption = id => setSelectedLegalOptions(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: rules?.color || "#9ca3af", flexShrink: 0 }}></div>
        <h3 className="text-xl font-bold text-white">Обстоятельства: {rules?.title || "Спор"}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {type === "labor" && <LaborForm form={form} set={set} errors={errors} garbled={garbled} subtype={claimData.subtype} />}
        {type === "product" && <ProductForm form={form} set={set} errors={errors} garbled={garbled} />}
        {normalizedType === "course" && <InfoproductForm form={form} set={set} errors={errors} garbled={garbled} />}
        {normalizedType === "debt" && <CivilForm form={form} set={set} errors={errors} garbled={garbled} />}
        {!['labor', 'product', 'course', 'debt'].includes(normalizedType) && <BasicCategoryFields rules={rules} form={form} set={set} />}

        <div style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: 16 }}>
          <h4 style={{ color: "white", fontSize: ".92rem", fontWeight: 650, margin: "0 0 5px" }}>Юридически значимые обстоятельства</h4>
          <p style={{ color: "#64748b", fontSize: ".74rem", margin: "0 0 13px" }}>Отметьте только юридически значимые факты, которые соответствуют вашей ситуации.</p>
          {(rules?.checkboxes || []).map(item => <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.04)" }}><input type="checkbox" checked={selectedLegalOptions.includes(item.id)} onChange={() => toggleLegalOption(item.id)} style={{ marginTop: 3, accentColor: rules?.color || "#22d3ee" }} /><span><b style={{ display: "block", color: "#d1d5db", fontSize: ".82rem" }}>{item.label}</b><span style={{ color: "#64748b", fontSize: ".72rem", lineHeight: 1.4 }}>{item.description}</span>{item.warningText && selectedLegalOptions.includes(item.id) && <span style={{ display: "block", color: "#fbbf24", fontSize: ".7rem", marginTop: 3 }}>{item.warningText}</span>}</span></label>)}
        </div>

        {type !== "product" && <div>
          <label style={L}>Подробное описание ситуации {type === "labor" ? <span style={{ color: "#f43f5e" }}>*</span> : <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: ".75rem" }}>(обязательно)</span>}</label>
          <textarea
            style={errors.description ? TAE : (garbled.description ? TAEG : ((form.description || "").trim().length >= (type === "labor" ? 30 : 50) ? TAG : TA))}
            rows={5}
            value={form.description || ""}
            onChange={e => { set("description", e.target.value); setGarbled(g => ({ ...g, description: false })); }}
            placeholder={type === "labor" ? "Например: 01.01.2024 я устроился(лась) на работу в ООО «Компания» на должность менеджера. Зарплату обещали 50 000 ₽ в месяц, но выплаты не произвели..." : "Опишите ситуацию подробно. Пример: 01.01.2024 я устроился на работу в ООО «Компания» на должность менеджера. Зарплату обещали 50 000 руб. в месяц..."}
            maxLength={5000}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <ErrMsg msg={errors.description} />
            <GarbMsg msg={garbled.description ? "Обнаружен бессмысленный или случайный набор символов" : null} />
            <span style={{ color: "#6b7280", fontSize: "0.72rem" }}>{(form.description || "").length}/5000</span>
          </div>
        </div>}

        {type !== "product" && <div>
          <label style={L}>Социально значимые последствия <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: "0.75rem" }}>(необязательно)</span></label>
          <textarea style={garbled.socialImpact ? TAEG : TA} rows={2} value={form.socialImpact || ""} onChange={e => set("socialImpact", e.target.value)} placeholder="Наличие иждивенцев, ипотека, болезнь и т.д." maxLength={500} />
          <GarbMsg msg={garbled.socialImpact ? "Обнаружен бессмысленный или случайный набор символов" : null} />
        </div>}
      </div>

      {type === "product" && Object.keys(errors).length > 0 && (
        <div role="alert" style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.28)" }}>
          <p style={{ color: "#fda4af", fontSize: ".82rem", fontWeight: 700, margin: "0 0 6px" }}>Исправьте отмеченные поля:</p>
          <ul style={{ color: "#fecdd3", fontSize: ".76rem", margin: 0, paddingLeft: 18 }}>
            {[...new Set(Object.values(errors).filter(Boolean))].map(message => <li key={message}>{message}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <button onClick={prevStep} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
        <button onClick={save}
          style={{ flex: 2, minWidth: 140, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
          Далее
        </button>
      </div>
    </div>
  );
}
