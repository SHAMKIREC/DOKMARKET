import { useEffect, useState } from "react";
import DatePickerField from "@/components/generator/DatePickerField";
import { isGibberish } from "@/components/generator/GarbledTextWarning";

const S = { width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.875rem", outline: "none" };
const SE = { ...S, border: "1px solid #f43f5e" };
const SG = { ...S, border: "1px solid #4ade80" };
const SW = { ...S, border: "1px solid #f59e0b" }; // gibberish warning
const L = { display: "block", fontSize: "0.8rem", fontWeight: 500, color: "#d1d5db", marginBottom: 4 };

function ErrMsg({ msg }) { return msg ? <p style={{ color: "#f43f5e", fontSize: "0.7rem", marginTop: 3 }}>{msg}</p> : null; }
function GarbMsg({ msg }) { return msg ? <p style={{ color: "#f59e0b", fontSize: "0.7rem", marginTop: 3 }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{msg}</p> : null; }

function phoneFormat(val) {
  let d = val.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (d.startsWith("7")) {
    const n = d.slice(1);
    let out = "+7";
    if (n.length > 0) out += " (" + n.slice(0, 3);
    if (n.length >= 3) out += ") " + n.slice(3, 6);
    if (n.length >= 6) out += "-" + n.slice(6, 8);
    if (n.length >= 8) out += "-" + n.slice(8, 10);
    return out;
  }
  return val;
}

function laborPhoneFormat(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (!digits.startsWith("7")) {
    if (digits.length !== 11) return digits.slice(0, 11);
    digits = `7${digits.slice(1)}`;
  }
  digits = digits.slice(0, 11);
  const subscriber = digits.slice(1);
  let result = "+7";
  if (subscriber.length) result += ` (${subscriber.slice(0, 3)}`;
  if (subscriber.length >= 3) result += `) ${subscriber.slice(3, 6)}`;
  if (subscriber.length >= 6) result += `-${subscriber.slice(6, 8)}`;
  if (subscriber.length >= 8) result += `-${subscriber.slice(8, 10)}`;
  return result;
}

// Phone is complete when we have exactly 10 digits after +7
function isPhoneComplete(val) {
  const digits = (val || "").replace(/\D/g, "");
  return digits.length === 11; // +7 + 10 digits
}

function isLaborPhoneComplete(value) {
  return /^7\d{10}$/.test(String(value || "").replace(/\D/g, ""));
}

function isEmailValid(value) {
  return !String(value || "").trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function looksClearlyFemaleName(value) {
  const parts = capitalizeName(value).split(/\s+/).filter(Boolean);
  return /(?:ова|ева|ёва|ина|ына|ская|цкая)$/iu.test(parts[0] || "") || /(?:овна|евна|ична)$/iu.test(parts[2] || "");
}

function blankWorker() { return { id: Date.now() + Math.random(), name: "", address: "", phone: "", email: "", birthDate: "", position: "", gender: "" }; }

const RU_NAME_RE = /^[А-Яа-яЁё\s-]+$/;

// Auto-capitalize: Иванов Иван Иванович
function capitalizeName(name) {
  if (!name) return "";
  return name
    .replace(/[0-9]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeAddress(value) {
  let result = String(value || "").trim().replace(/\s+/g, " ");
  if (!result) return "";
  result = result
    .replace(/\s*,\s*/g, ", ")
    .replace(/(^|[\s,])(г|с|ул)(?:\s*\.\s*|\s+)/giu, (_, prefix, abbreviation) => `${prefix}${abbreviation.toLowerCase()}. `)
    .replace(/\s+(?=(?:г|с|ул)\.\s)/giu, ", ")
    .replace(/,\s*,+/g, ", ");
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result = result.replace(/(^|[\s,])(г|с|ул)\.\s+([а-яё])/giu, (_, prefix, abbreviation, letter) => `${prefix}${abbreviation.toLowerCase()}. ${letter.toUpperCase()}`);
  return result;
}

// Check minimal validity: at least 2 parts, only Russian letters, each part ≥ 2 chars
function isNameValid(name) {
  const cleaned = capitalizeName(name);
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length < 2) return false; // need at least first + last name
  if (cleaned.length < 5) return false;
  if (!RU_NAME_RE.test(cleaned)) return false;
  // Each part must be at least 2 chars
  if (parts.some(p => p.length < 2)) return false;
  return true;
}

export default function Step4Claimants({ claimData, updateClaimData, nextStep, prevStep }) {
  const [workers, setWorkers] = useState(
    claimData.workers?.length && claimData.workers[0]?.name
      ? claimData.workers
      : claimData.claimant?.name
        ? [{ ...claimData.claimant, id: claimData.claimant.id ?? 0 }]
        : [{ ...blankWorker(), id: 0 }]
  );
  const [errors, setErrors] = useState({});
  const [garbled, setGarbled] = useState({});
  const isCollective = claimData.mode === "collective";
  const isLabor = claimData.type === "labor";

  useEffect(() => {
    updateClaimData({ workers, claimant: workers[0] || {} });
  }, [workers, updateClaimData]);

  const setField = (id, key, val) => {
    setWorkers(ws => ws.map(w => w.id === id ? { ...w, [key]: val } : w));
  };

  // Let user type freely — capitalize only on blur to preserve spaces between words
  const handleNameChange = (id, val) => {
    setField(id, "name", val);
    // Clear gibberish warning on edit
    setGarbled(g => ({ ...g, [`${id}_name`]: false }));
  };

  const handleNameBlur = (id, val) => {
    const capitalized = capitalizeName(val);
    setField(id, "name", capitalized);
    // Check for gibberish after capitalization
    if (capitalized.length >= 8 && isGibberish(capitalized)) {
      setGarbled(g => ({ ...g, [`${id}_name`]: true }));
    } else {
      setGarbled(g => ({ ...g, [`${id}_name`]: false }));
    }
  };

  const addWorker = () => { if (workers.length < 10) setWorkers(ws => [...ws, blankWorker()]); };
  const removeWorker = (id) => setWorkers(ws => ws.filter(w => w.id !== id));

  function doValidate() {
    const e = {};
    const g = {};
    workers.forEach(w => {
      const displayName = capitalizeName(w.name || "");
      if (!w.name?.trim() || w.name.trim().length < 3) {
        e[`${w.id}_name`] = "Введите корректные ФИО";
      } else if (!isNameValid(w.name || "")) {
        e[`${w.id}_name`] = "Введите корректные ФИО. Только русские буквы, минимум имя и фамилия";
      } else if (isGibberish(displayName)) {
        e[`${w.id}_name`] = "ФИО похоже на случайный набор символов";
        g[`${w.id}_name`] = true;
      }
      if (!w.gender) e[`${w.id}_gender`] = "Укажите пол заявителя";
      if (!w.address?.trim() || w.address.trim().length < 10) {
        e[`${w.id}_address`] = "Укажите полный адрес (минимум 10 символов)";
      } else if (isGibberish(w.address)) {
        e[`${w.id}_address`] = "Адрес похож на случайный набор символов";
        g[`${w.id}_address`] = true;
      }
      if (!(isLabor ? isLaborPhoneComplete(w.phone || "") : isPhoneComplete(w.phone || ""))) {
        e[`${w.id}_phone`] = isLabor ? "Укажите корректный номер телефона" : "Введите полный номер телефона: +7 (999) 999-99-99";
      }
      if (!isEmailValid(w.email)) e[`${w.id}_email`] = isLabor ? "Укажите корректный email" : "Некорректный email";
    });
    setErrors(e);
    setGarbled(prev => ({ ...prev, ...g }));
    return Object.keys(e).length === 0;
  }

  // Address blur handler — check gibberish
  const handleAddressBlur = (id, val) => {
    const normalized = normalizeAddress(val);
    setField(id, "address", normalized);
    if (normalized && normalized.length >= 10 && isGibberish(normalized)) {
      setGarbled(g => ({ ...g, [`${id}_address`]: true }));
    } else {
      setGarbled(g => ({ ...g, [`${id}_address`]: false }));
    }
  };

  function save() {
    if (!doValidate()) return;
    const cleaned = workers.map(w => ({
      ...w,
      name: capitalizeName(w.name || ""),
      phone: isLabor ? laborPhoneFormat(w.phone) : w.phone,
      email: String(w.email || "").trim(),
    }));
    updateClaimData({ workers: cleaned });
    nextStep();
  }

  // Real-time field validation feedback
  const fieldError = (workerId, fieldKey) => errors[`${workerId}_${fieldKey}`] || null;

  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h3 className="text-xl font-bold text-white">
          {isCollective && !isLabor ? "Данные заявителей" : "Данные заявителя"}
        </h3>
        {isCollective && !isLabor && workers.length < 10 && (
          <button onClick={addWorker} style={{ padding: "8px 14px", background: "rgba(14,165,233,0.2)", color: "#22d3ee", border: "1px solid rgba(14,165,233,0.3)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>Добавить заявителя
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {workers.map((w, idx) => (
          <div key={w.id} style={{ position: "relative", border: "1px solid rgba(14,165,233,0.25)", background: "rgba(14,165,233,0.03)", borderRadius: 14, padding: 16 }}>
            {isCollective && !isLabor && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ color: "#22d3ee", fontWeight: 600, fontSize: "0.82rem" }}>Заявитель {idx + 1}</p>
                {idx > 0 && (
                  <button onClick={() => removeWorker(w.id)} style={{ background: "rgba(244,63,94,0.15)", border: "none", color: "#f43f5e", cursor: "pointer", borderRadius: 6, padding: "3px 10px", fontSize: "0.8rem" }}>
                    <i className="fa-solid fa-times" style={{ marginRight: 4 }}></i>Удалить
                  </button>
                )}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={L}>ФИО полностью <span style={{ color: "#f43f5e" }}>*</span></label>
                <input
                  style={fieldError(w.id, "name") ? SE : (garbled[`${w.id}_name`] ? SW : (isNameValid(w.name || "") ? SG : S))}
                  value={w.name || ""}
                  onChange={e => handleNameChange(w.id, e.target.value)}
                  onBlur={e => handleNameBlur(w.id, e.target.value)}
                  placeholder="Иванов Иван Иванович"
                />
                <ErrMsg msg={fieldError(w.id, "name")} />
                <GarbMsg msg={garbled[`${w.id}_name`] && !fieldError(w.id, "name") ? "Имя похоже на случайный набор символов" : null} />
              </div>
              <div>
                <label style={L}>Адрес регистрации <span style={{ color: "#f43f5e" }}>*</span></label>
                <input
                  style={fieldError(w.id, "address") ? SE : (garbled[`${w.id}_address`] ? SW : ((w.address || "").trim().length >= 10 ? SG : S))}
                  value={w.address || ""}
                  onChange={e => { setField(w.id, "address", e.target.value); setGarbled(g => ({ ...g, [`${w.id}_address`]: false })); }}
                  onBlur={e => handleAddressBlur(w.id, e.target.value)}
                  placeholder="г. Москва, ул. Пушкина, д. 1, кв. 10"
                />
                <ErrMsg msg={fieldError(w.id, "address")} />
                <GarbMsg msg={garbled[`${w.id}_address`] && !fieldError(w.id, "address") ? "Адрес похож на случайный набор символов" : null} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={L}>Телефон <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={fieldError(w.id, "phone") ? SE : ((isLabor ? isLaborPhoneComplete(w.phone || "") : isPhoneComplete(w.phone || "")) ? SG : S)}
                    value={w.phone || ""}
                    onChange={e => setField(w.id, "phone", isLabor ? laborPhoneFormat(e.target.value) : phoneFormat(e.target.value))}
                    placeholder="+7 (999) 999-99-99"
                    type="tel"
                    inputMode="numeric"
                    maxLength={18}
                  />
                  <ErrMsg msg={fieldError(w.id, "phone")} />
                </div>
                <div>
                  <label style={L}>Дата рождения</label>
                  <DatePickerField value={w.birthDate} onChange={val => setField(w.id, "birthDate", val)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={L}>Email</label>
                  <input
                    style={fieldError(w.id, "email") ? SE : S}
                    type="email"
                    value={w.email || ""}
                    onChange={e => setField(w.id, "email", e.target.value)}
                    placeholder="example@mail.ru"
                  />
                  <ErrMsg msg={fieldError(w.id, "email")} />
                </div>
                <div>
                  <label style={L}>Должность</label>
                  <input style={S} value={w.position || ""} onChange={e => setField(w.id, "position", e.target.value)} placeholder="Менеджер по продажам" maxLength={100} />
                </div>
              </div>
              <div>
                <label style={L}>Пол заявителя <span style={{ color: "#f43f5e" }}>*</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ val: "male", label: "Мужской" }, { val: "female", label: "Женский" }].map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => setField(w.id, "gender", val)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500, border: `1px solid ${w.gender === val ? "#0ea5e9" : "rgba(255,255,255,0.15)"}`, background: w.gender === val ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.04)", color: w.gender === val ? "#22d3ee" : "#d1d5db", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <ErrMsg msg={fieldError(w.id, "gender")} />
                <GarbMsg msg={isLabor && w.gender === "male" && looksClearlyFemaleName(w.name) ? "Проверьте пол заявителя: выбран мужской, но ФИО похоже на женское" : null} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <button onClick={() => { updateClaimData({ workers }); prevStep(); }} style={{ flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>Назад</button>
        <button onClick={save}
          style={{ flex: 2, minWidth: 140, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
          Далее
        </button>
      </div>
    </div>
  );
}
