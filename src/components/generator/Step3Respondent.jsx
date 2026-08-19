import { useEffect, useState } from "react";
import RespondentNameInput from "@/components/generator/RespondentNameInput";
import { validateOptional } from "@/components/generator/validation";
import { isGibberish } from "@/components/generator/GarbledTextWarning";

const S = { width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.875rem", outline: "none" };
const SE = { ...S, border: "1px solid #f43f5e" };
const SW = { ...S, border: "1px solid #f59e0b" };
const L = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#d1d5db", marginBottom: 6 };

function ErrMsg({ msg }) { return msg ? <p style={{ color: "#f43f5e", fontSize: "0.72rem", marginTop: 3 }}>{msg}</p> : null; }
function GarbMsg({ msg }) { return msg ? <p style={{ color: "#f59e0b", fontSize: "0.72rem", marginTop: 3 }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{msg}</p> : null; }

const RESPONDENT_COPY = {
  labor: {
    title: "Данные работодателя",
    name: "Работодатель / организация",
    address: "Адрес работодателя",
    placeholder: "ООО «Компания» или ИП Иванов И.И.",
    hint: "Укажите работодателя, которому будет направлена претензия.",
  },
  product: {
    title: "Данные продавца",
    name: "Продавец / магазин / ИП",
    address: "Адрес продавца",
    placeholder: "ООО «Магазин», ИП Иванов И.И. или название продавца",
    hint: "Лучше переписать данные продавца из чека, заказа, сайта или карточки продавца на маркетплейсе.",
  },
  course: {
    title: "Данные исполнителя обучения",
    name: "Школа / исполнитель / ИП / организация",
    address: "Адрес исполнителя",
    placeholder: "ООО «Онлайн-школа» или ИП Иванов И.И.",
    hint: "Укажите именно того, кто получил оплату или указан исполнителем в оферте/договоре.",
  },
  debt: {
    title: "Данные должника / ответчика",
    name: "ФИО должника или наименование организации",
    address: "Адрес должника / ответчика",
    placeholder: "Иванов Иван Иванович или ООО «Компания»",
    hint: "Для физлица укажите известный адрес проживания; для организации — адрес из договора или реестра.",
  },
};

export default function Step3Respondent({ claimData, updateClaimData, nextStep, prevStep, isJoiner = false }) {
  const [form, setForm] = useState(claimData.employer || claimData.respondent || {});
  const [errors, setErrors] = useState({});
  const [garbledName, setGarbledName] = useState(false);
  const type = claimData.type || "debt";
  const copy = RESPONDENT_COPY[type] || RESPONDENT_COPY.debt;
  const isLabor = type === "labor";
  const isProduct = type === "product";

  useEffect(() => {
    updateClaimData({ employer: form, respondent: form });
  }, [form, updateClaimData]);

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => {
      const next = { ...current };
      const trimmed = String(value || "").trim();
      if (key === "name") next.name = trimmed.length >= 2 ? undefined : `Укажите: ${copy.name.toLowerCase()}`;
      if (key === "address") next.address = trimmed.length >= 5 ? undefined : copy.address;
      if (key === "inn") next.inn = validateOptional(value, "inn") || undefined;
      if (key === "ogrn") next.ogrn = validateOptional(value, "ogrn") || undefined;
      return next;
    });
  };

  function handleRespondentName(value) {
    set("name", value);
    setGarbledName(false);
  }

  function doValidate() {
    const e = {};
    if (!form.name?.trim() || form.name.trim().length < 2) {
      e.name = `Укажите: ${copy.name.toLowerCase()}`;
    } else if (isGibberish(form.name)) {
      e.name = "Название или ФИО похоже на случайный набор символов";
      setGarbledName(true);
    } else {
      setGarbledName(false);
    }
    if (!form.address?.trim() || form.address.trim().length < 5) e.address = `Укажите ${copy.address.toLowerCase()}`;
    const innError = validateOptional(form.inn, "inn");
    if (innError) e.inn = innError;
    const ogrnError = validateOptional(form.ogrn, "ogrn");
    if (ogrnError) e.ogrn = ogrnError;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const innDigits = String(form.inn || "").replace(/\D/g, "");
  const ogrnDigits = String(form.ogrn || "").replace(/\D/g, "");
  function save() {
    if (!doValidate()) return;
    const respondent = {
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      inn: innDigits,
      ogrn: ogrnDigits,
      type: form.type || claimData.respondent?.type,
      source: "manual",
    };
    updateClaimData({ employer: respondent, respondent });
    nextStep();
  }

  if (isJoiner && isLabor) {
    return (
      <div className="rounded-2xl border border-white/10" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))", padding: "clamp(16px,5vw,30px)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 9px", borderRadius: 999, color: "#a5f3fc", background: "rgba(8,145,178,.09)", border: "1px solid rgba(103,232,249,.16)", fontSize: ".7rem", fontWeight: 800, marginBottom: 11 }}><i className="fa-solid fa-building" /> ОБЩИЕ ДАННЫЕ</div>
        <h3 className="text-xl font-bold text-white mb-2">Данные работодателя</h3>
        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 20 }}>Эти данные указал организатор совместной претензии. Чтобы у всех участников был один адресат, изменить их здесь нельзя.</p>
        <div style={{ display: "grid", gap: 10, padding: 16, borderRadius: 13, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)" }}>
          <p style={{ color: "white", fontWeight: 700, margin: 0 }}>{form.name || "—"}</p>
          {form.inn && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>ИНН: {form.inn}</p>}
          {form.ogrn && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>ОГРН/ОГРНИП: {form.ogrn}</p>}
          {form.address && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>Адрес: {form.address}</p>}
        </div>
        <div style={{ display: "flex", marginTop: 24 }}>
          <button type="button" onClick={nextStep} style={{ width: "100%", padding: 13, borderRadius: 12, background: "linear-gradient(135deg,#0891b2,#7c3aed)", border: "none", color: "white", cursor: "pointer", fontWeight: 750 }}>Продолжить к личным данным</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))", padding: "clamp(16px,5vw,30px)" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 9px", borderRadius: 999, color: "#a5f3fc", background: "rgba(8,145,178,.09)", border: "1px solid rgba(103,232,249,.16)", fontSize: ".7rem", fontWeight: 800, marginBottom: 10 }}><i className="fa-solid fa-address-card" /> ШАГ 3 ИЗ 7</div>
      <h3 className="text-xl font-bold text-white mb-2">{copy.title}</h3>
      <p style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.55, marginBottom: 18 }}><i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "#67e8f9" }} />{copy.hint}</p>

      {isProduct && (
        <div style={{ color: "#fde68a", fontSize: "0.75rem", lineHeight: 1.5, margin: "0 0 18px", padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.22)" }}>
          ИНН и ОГРН/ОГРНИП повышают точность адресата, но не блокируют создание претензии, если этих реквизитов у вас сейчас нет.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={L}>{copy.name} <span style={{ color: "#f43f5e" }}>*</span></label>
          <RespondentNameInput value={form.name || ""} onChange={handleRespondentName} placeholder={copy.placeholder} style={errors.name ? SE : (garbledName ? SW : S)} />
          <ErrMsg msg={errors.name} />
          {garbledName && !errors.name && <GarbMsg msg="Название или ФИО похоже на случайный набор символов" />}
        </div>

        <div>
          <label style={L}>{copy.address} <span style={{ color: "#f43f5e" }}>*</span></label>
          <input style={errors.address ? SE : S} value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Город, улица, дом" />
          <ErrMsg msg={errors.address} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          <div>
            <label style={L}>ИНН <span style={{ color: "#64748b", fontSize: ".72rem", fontWeight: 400 }}>(если известен)</span></label>
            <input style={errors.inn ? SE : S} value={form.inn || ""} onChange={e => set("inn", e.target.value.replace(/\D/g, ""))} placeholder="7701234567" maxLength={12} />
            <ErrMsg msg={errors.inn} />
            <p style={{ color: "#64748b", fontSize: "0.69rem", marginTop: 3 }}>10 цифр — организация, 12 — ИП/физлицо</p>
          </div>
          <div>
            <label style={L}>ОГРН / ОГРНИП <span style={{ color: "#64748b", fontSize: ".72rem", fontWeight: 400 }}>(если известен)</span></label>
            <input style={errors.ogrn ? SE : S} value={form.ogrn || ""} onChange={e => set("ogrn", e.target.value.replace(/\D/g, ""))} placeholder="1157746123456" maxLength={15} />
            <ErrMsg msg={errors.ogrn} />
            <p style={{ color: "#64748b", fontSize: "0.69rem", marginTop: 3 }}>13 цифр — ОГРН, 15 — ОГРНИП</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 25, flexWrap: "wrap" }}>
        <button type="button" onClick={prevStep} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 650 }}>Назад</button>
        <button type="button" onClick={save} style={{ flex: 2, minWidth: 140, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#0891b2,#7c3aed)", border: "none", color: "white", cursor: "pointer", fontWeight: 750, boxShadow: "0 10px 28px rgba(79,70,229,.18)" }}>Далее</button>
      </div>
    </div>
  );
}
