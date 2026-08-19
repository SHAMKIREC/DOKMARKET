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

export default function Step3Respondent({ claimData, updateClaimData, nextStep, prevStep, isJoiner = false }) {
  const [form, setForm] = useState(claimData.employer || claimData.respondent || {});
  const [errors, setErrors] = useState({});
  const [garbledName, setGarbledName] = useState(false);
  const isLabor = claimData.type === "labor";
  const isProduct = claimData.type === "product";
  const sellerHasRegisteredBusinessForm = /^\s*(?:ИП|ООО)(?=\s|[«"'(]|$)/iu.test(form.name || "")
    || ["ip", "individual_entrepreneur", "ooo", "llc", "legal"].includes(String(form.type || "").toLowerCase());

  useEffect(() => {
    updateClaimData({ employer: form, respondent: form });
  }, [form, updateClaimData]);

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => {
      const next = { ...current };
      const trimmed = String(value || "").trim();
      if (key === "name") next.name = trimmed.length >= 2 ? undefined : (isLabor ? "Укажите наименование работодателя" : "Укажите наименование ответчика");
      if (key === "address") next.address = trimmed.length >= 5 ? undefined : (isLabor ? "Укажите юридический адрес" : "Укажите адрес ответчика");
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
      e.name = isLabor ? "Укажите наименование работодателя" : "Укажите наименование ответчика";
    } else if (isGibberish(form.name)) {
      e.name = "Название похоже на случайный набор символов";
      setGarbledName(true);
    } else {
      setGarbledName(false);
    }
    if (!form.address?.trim() || form.address.trim().length < 5) e.address = isLabor ? "Укажите юридический адрес" : "Укажите адрес ответчика";
    const innError = validateOptional(form.inn, "inn");
    if (innError) e.inn = innError;
    const ogrnError = validateOptional(form.ogrn, "ogrn");
    if (ogrnError) e.ogrn = ogrnError;
    if (isProduct && sellerHasRegisteredBusinessForm && !String(form.inn || "").trim()) {
      e.inn = "Укажите ИНН продавца";
    }
    if (isProduct && sellerHasRegisteredBusinessForm && !String(form.ogrn || "").trim()) {
      e.ogrn = "Укажите ОГРН или ОГРНИП продавца";
    }
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
      <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
        <h3 className="text-xl font-bold text-white mb-2">Данные работодателя</h3>
        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 20 }}>
          Эти общие данные указал организатор. Участник не может их изменять.
        </p>
        <div style={{ display: "grid", gap: 10, padding: 16, borderRadius: 12, background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)" }}>
          <p style={{ color: "white", fontWeight: 700, margin: 0 }}>{form.name || "—"}</p>
          {form.inn && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>ИНН: {form.inn}</p>}
          {form.ogrn && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>ОГРН/ОГРНИП: {form.ogrn}</p>}
          {form.address && <p style={{ color: "#cbd5e1", margin: 0, fontSize: ".85rem" }}>Юридический адрес: {form.address}</p>}
        </div>
        <div style={{ display: "flex", marginTop: 28 }}>
          <button onClick={nextStep} style={{ width: "100%", padding: 13, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", cursor: "pointer", fontWeight: 700 }}>Продолжить к личным данным</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      <h3 className="text-xl font-bold text-white mb-2">Данные ответчика</h3>
      <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 20 }}>
        <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 6, color: "#0ea5e9" }}></i>
        Заполните наименование и реквизиты ответчика вручную
      </p>
      {isProduct && (
        <p style={{ color: "#fcd34d", fontSize: "0.78rem", lineHeight: 1.5, margin: "-8px 0 18px", padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.22)" }}>
          Для сильной претензии рекомендуем указать ИНН и ОГРН/ОГРНИП продавца. Для продавца, указанного как ИП или ООО, эти реквизиты обязательны.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={L}>Наименование компании / ФИО <span style={{ color: "#f43f5e" }}>*</span></label>
          <RespondentNameInput
            value={form.name || ""}
            onChange={handleRespondentName}
            placeholder="ООО «Компания» или Иванов Иван Иванович"
            style={errors.name ? SE : (garbledName ? SW : S)}
          />
          <ErrMsg msg={errors.name} />
          {garbledName && !errors.name && (
            <GarbMsg msg="Название похоже на случайный набор символов" />
          )}
        </div>

        <div>
          <label style={L}>Юридический адрес <span style={{ color: "#f43f5e" }}>*</span></label>
          <input style={errors.address ? SE : S} value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="г. Москва, ул. Ленина, д. 10" />
          <ErrMsg msg={errors.address} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={L}>ИНН {isProduct && sellerHasRegisteredBusinessForm && <span style={{ color: "#f43f5e" }}>*</span>}</label>
            <input style={errors.inn ? SE : S} value={form.inn || ""} onChange={e => set("inn", e.target.value.replace(/\D/g, ""))} placeholder="7701234567" maxLength={12} />
            <ErrMsg msg={errors.inn} />
            <p style={{ color: "#6b7280", fontSize: "0.7rem", marginTop: 3 }}>10 цифр (юр. лицо) или 12 (ИП)</p>
          </div>
          <div>
            <label style={L}>ОГРН / ОГРНИП {isProduct && sellerHasRegisteredBusinessForm && <span style={{ color: "#f43f5e" }}>*</span>}</label>
            <input style={errors.ogrn ? SE : S} value={form.ogrn || ""} onChange={e => set("ogrn", e.target.value.replace(/\D/g, ""))} placeholder="1157746123456" maxLength={15} />
            <ErrMsg msg={errors.ogrn} />
            <p style={{ color: "#6b7280", fontSize: "0.7rem", marginTop: 3 }}>13 цифр (ОГРН) или 15 (ОГРНИП)</p>
          </div>
        </div>
      </div>

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
