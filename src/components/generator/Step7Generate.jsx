import { useState, useRef, useEffect } from "react";
import { createDocument } from "@/services/documentService";
import { generatePDF, buildHtml, buildDocxBlob, normalizeLaborAddress, normalizeLaborText, normalizeLaborPhone } from "./pdfGenerator";
import { checkGarbledText } from "@/components/generator/GarbledTextWarning";
import { isGibberish } from "@/components/generator/GarbledTextWarning";
import { getCategoryRules, getSelectedRequirementTexts } from "@/data/legalRules";
import { validateProductCircumstances } from "@/components/generator/validation";

const COLLECTIVE_PRICE_PER = 790;

function participantsGenitive(count) {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "участников";
  const mod10 = count % 10;
  if (mod10 === 1) return "участник";
  if (mod10 >= 2 && mod10 <= 4) return "участника";
  return "участников";
}

// Phone complete check
function isPhoneComplete(val) {
  const digits = (val || "").replace(/\D/g, "");
  return digits.length === 11;
}

function isLaborPhoneComplete(value) {
  return /^7\d{10}$/.test(normalizeLaborPhone(value).replace(/\D/g, ""));
}

function looksClearlyFemaleName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return /(?:ова|ева|ёва|ина|ына|ская|цкая)$/iu.test(parts[0] || "") || /(?:овна|евна|ична)$/iu.test(parts[2] || "");
}

// FIO validation
function isNameValid(name) {
  if (!name || !name.trim()) return false;
  const cleaned = name.trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  if (cleaned.length < 5) return false;
  if (!/^[А-Яа-яЁё\s-]+$/.test(cleaned)) return false;
  if (parts.some(p => p.length < 2)) return false;
  return true;
}

function runFullAudit(claimData) {
  const errors = [];
  const warnings = [];

  // 1. FIO validation
  const workers = claimData.workers || [];
  workers.forEach((w, i) => {
    const label = workers.length > 1 ? `Заявитель ${i + 1}` : "Заявитель";
    if (!isNameValid(w.name)) {
      errors.push(`${label}: некорректное ФИО`);
    } else if (isGibberish(w.name || "")) {
      errors.push(`${label}: ФИО похоже на случайный набор символов`);
    }
    if (!w.gender) {
      errors.push(`${label}: не указан пол`);
    } else if (claimData.type === "labor" && w.gender === "male" && looksClearlyFemaleName(w.name)) {
      warnings.push("Проверьте пол заявителя: выбран мужской, но ФИО похоже на женское");
    }
    if (!w.address || w.address.trim().length < 10) {
      errors.push(`${label}: некорректный адрес`);
    } else if (isGibberish(w.address)) {
      errors.push(`${label}: адрес похож на случайный набор символов`);
    }
    if (!(claimData.type === "labor" ? isLaborPhoneComplete(w.phone || "") : isPhoneComplete(w.phone || ""))) {
      errors.push(claimData.type === "labor" ? "Укажите корректный номер телефона" : `${label}: некорректный телефон`);
    }
    if (w.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.email)) {
      errors.push(claimData.type === "labor" ? "Укажите корректный email" : `${label}: некорректный email`);
    }
  });

  // 2. Respondent
  const emp = claimData.employer || {};
  if (!emp.name || emp.name.trim().length < 2) {
    errors.push(claimData.type === "labor" ? "Ответчик: укажите наименование работодателя" : "Ответчик: некорректное наименование");
  } else if (isGibberish(emp.name)) {
    errors.push("Ответчик: название похоже на случайный набор символов");
  }
  if (!emp.address || emp.address.trim().length < 5) {
    errors.push(claimData.type === "labor" ? "Ответчик: укажите юридический адрес" : "Ответчик: некорректный адрес");
  }
  if (emp.inn && !/^\d{10}$|^\d{12}$/.test(String(emp.inn))) {
    errors.push("Ответчик: ИНН должен содержать 10 или 12 цифр");
  }
  if (emp.ogrn && !/^\d{13}$|^\d{15}$/.test(String(emp.ogrn))) {
    errors.push("Ответчик: ОГРН/ОГРНИП должен содержать 13 или 15 цифр");
  }

  // 3. Circumstances - gibberish check
  const circ = claimData.circumstances || {};
  if (claimData.type === "labor") {
    if (!circ.workStart) errors.push("Обстоятельства: не указана дата начала работы");
    if (!circ.workplace || circ.workplace.trim().length < 5) errors.push("Обстоятельства: не указано место выполнения работ");
    const salarySubtypes = new Set(["unpaid-wages", "dismissal-payment", "delayed-leave-or-sick-pay", "unpaid-overtime"]);
    if (salarySubtypes.has(claimData.subtype) && !(Number(circ.debtAmount) > 0)) errors.push("Обстоятельства: не указана сумма задолженности");
    if (!circ.description || circ.description.trim().length < 30) errors.push("Опишите ситуацию подробнее: когда начали работать, какую оплату обещали и что не выплатили");
  } else if (claimData.type === "product") {
    Object.values(validateProductCircumstances(circ)).forEach(message => errors.push(`Шаг 5 — обстоятельства: ${message}`));
  } else if (!circ.description || circ.description.trim().length < 50) {
    errors.push("Описание ситуации: минимум 50 символов");
  }
  if (circ.description && isGibberish(circ.description)) {
    errors.push("Описание ситуации: обнаружен бессмысленный набор символов");
  }

  const textFields = [
    { key: "supervisor", label: "ФИО руководителя" },
    { key: "workplace", label: "Место работы" },
    { key: "productName", label: "Наименование товара/курса" },
    { key: "defectDescription", label: "Описание недостатков" },
    { key: "partialPayments", label: "Частичные выплаты" },
    { key: "socialImpact", label: "Социальные последствия" },
  ];
  textFields.forEach(f => {
    if (claimData.circumstances?.[f.key] && isGibberish(claimData.circumstances[f.key])) {
      errors.push(`${f.label}: обнаружен бессмысленный набор символов`);
    }
  });

  // 4. Category check
  if (!claimData.type) {
    errors.push("Не выбрана категория спора");
  }

  // 5. Garbled text check (existing check)
  const garbledCheck = checkGarbledText(claimData);
  if (garbledCheck.isSuspicious) {
    garbledCheck.fields.forEach(f => {
      if (!errors.some(e => e.includes(f))) {
        warnings.push(f);
      }
    });
  }

  const errorsWithSteps = errors.map(message => {
    if (message.startsWith("Шаг ")) return message;
    if (message.startsWith("Ответчик:")) return `Шаг 3 — ответчик: ${message.replace(/^Ответчик:\s*/, "")}`;
    if (message.startsWith("Заявитель") || message.includes("номер телефона") || message.includes("email")) {
      return `Шаг 4 — заявитель: ${message}`;
    }
    if (message.includes("Обстоятельства") || message.includes("Описание ситуации") || textFields.some(field => message.startsWith(field.label))) {
      return `Шаг 5 — обстоятельства: ${message}`;
    }
    if (message.includes("категория")) return `Шаг 1 — категория: ${message}`;
    return message;
  });

  return { errors: errorsWithSteps, warnings, passed: errorsWithSteps.length === 0 };
}

export default function Step7Generate({ claimData, reset, prevStep, onCollectiveComplete, onSuccessfulSave }) {
  const isCollective = claimData.mode === "collective";
  const isCollectiveFinal = isCollective && claimData.collectiveFinalized === true;
  const [confirmed, setConfirmed] = useState(false);
  const [generated, setGenerated] = useState(isCollectiveFinal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paid, setPaid] = useState(false);
  const [discountVerified, setDiscountVerified] = useState(false);
  const [showPreviewSummary, setShowPreviewSummary] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [pdfInfo, setPdfInfo] = useState(null);
  const isDev = import.meta.env.DEV === true;

  const collectiveMembers = claimData.collectiveMembers || [];
  const collectiveMemberCount = collectiveMembers.length || Number(claimData.completedParticipantsCount) || 1;
  const collectiveTotal = COLLECTIVE_PRICE_PER * collectiveMemberCount;
  const hasMinimumCollectiveParticipants = !isCollectiveFinal || collectiveMemberCount >= 2;
  const selectedEvidence = new Set(claimData.evidence || []);
  const activeEvidenceFiles = Object.entries(claimData.evidenceFiles || {})
    .filter(([evidenceName, file]) => selectedEvidence.has(evidenceName) && file?.name)
    .map(([, file]) => file);
  const hasSeparateFiles = activeEvidenceFiles.some(file => !/\.(jpg|jpeg|png|webp)$/i.test(file.name || ""));

  useEffect(() => {
    if (!isCollectiveFinal || !hasMinimumCollectiveParticipants || saved) return;
    try {
      createDocument({
        type: claimData.type,
        subtype: claimData.subtype || "",
        respondent_name: claimData.employer?.name || "",
        claim_data: claimData,
        status: "ready",
      });
      setSaved(true);
      setSaveError("");
    } catch {
      console.error("Не удалось сохранить итоговую коллективную претензию локально.");
      setSaveError("Документ сформирован, но не сохранился в локальном списке документов.");
    }
  }, [claimData, hasMinimumCollectiveParticipants, isCollectiveFinal, saved]);

  function handleCheckDiscount() {
    setTimeout(() => setDiscountVerified(true), 4000);
  }

  const TYPES = { labor: "Трудовой спор", product: "Некачественный товар", course: "Онлайн-курс", debt: "Гражданский спор", infoproduct: "Онлайн-курс", civil: "Гражданский спор" };
  const categoryRules = getCategoryRules(claimData.type);
  const selectedLegalLabels = (categoryRules?.checkboxes || []).filter(item => (claimData.selectedLegalOptions || []).includes(item.id)).map(item => item.label);
  const selectedRequirements = getSelectedRequirementTexts(claimData.type, claimData.selectedLegalOptions || []);

  function handleConfirmAndCheck() {
    const garbledCheck = checkGarbledText(claimData);
    const audit = runFullAudit(claimData);
    // Merge garbled warnings that aren't already errors
    if (garbledCheck.isSuspicious) {
      garbledCheck.fields.forEach(f => {
        if (!audit.errors.some(e => e.includes(f))) {
          audit.warnings.push(f);
        }
      });
    }
    setAuditResult(audit);
    setShowPreviewSummary(true);
  }

  async function handleGenerate() {
    if (!auditResult?.passed) return; // block generation if audit fails
    if (isCollective && onCollectiveComplete && !isCollectiveFinal) {
      setSaving(true);
      try {
        const completed = await onCollectiveComplete(claimData);
        if (completed === false) setSaveError("Не удалось сохранить данные коллективной претензии. Попробуйте ещё раз.");
        else setSaveError("");
      } catch {
        console.error("Не удалось завершить сохранение коллективной претензии.");
        setSaveError("Не удалось сохранить данные коллективной претензии. Попробуйте ещё раз.");
      } finally {
        setSaving(false);
      }
      return;
    }
    setShowPreviewSummary(false);
    setGenerated(true);
    if (!saved) {
      try {
          createDocument({
            type: claimData.type,
            subtype: claimData.subtype || "",
            respondent_name: claimData.employer?.name || "",
            claim_data: claimData,
            status: "ready",
          });
          setSaved(true);
          setSaveError("");
          onSuccessfulSave?.();
      } catch {
          console.error("Не удалось сохранить документ локально.");
          setSaveError("Документ создан, но не сохранился в «Мои документы». Проверьте локальное хранилище и попробуйте ещё раз.");
      }
    }
  }

  function handlePay() {
    window.open("https://t.me/+mxSPQZosRBAwMTMy", "_blank");
    setTimeout(() => setPaid(true), 5000);
  }

  async function handleDownloadPDF(allowDevBypass = false) {
    if (!paid && !(isDev && allowDevBypass)) return;
    try {
      const result = await generatePDF(claimData);
      if (result?.sizeBytes) setPdfInfo(result);
      setSaveError("");
    } catch {
      console.error("Не удалось сформировать PDF претензии.");
      setSaveError("Не удалось скачать PDF. Попробуйте ещё раз.");
    }
  }

  function handleDownloadDOCX(allowDevBypass = false) {
    if (!paid && !(isDev && allowDevBypass)) return;
    try {
      const blob = buildDocxBlob(claimData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pretenziya_${Date.now()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveError("");
    } catch {
      console.error("Не удалось сформировать DOC претензии.");
      setSaveError("Не удалось скачать DOC. Попробуйте ещё раз.");
    }
  }

  if (isCollectiveFinal && !hasMinimumCollectiveParticipants) {
    return (
      <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", padding: "clamp(20px,5vw,34px)", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.25)", color: "#fbbf24", fontSize: "1.25rem" }}>
          <i className="fa-solid fa-users-slash"></i>
        </div>
        <h3 style={{ color: "white", fontSize: "1.25rem", fontWeight: 800, margin: "0 0 8px" }}>Недостаточно участников для коллективной претензии</h3>
        <p style={{ color: "#cbd5e1", fontSize: ".9rem", margin: "0 0 5px" }}>Нужно минимум 2 заполненных участника.</p>
        <p style={{ color: "#94a3b8", fontSize: ".8rem", margin: "0 0 20px" }}>Коллективная оплата и скачивание недоступны для одного участника.</p>
        <button onClick={reset} style={{ padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "white", cursor: "pointer", fontWeight: 700 }}>
          Создать новую индивидуальную претензию
        </button>
      </div>
    );
  }

  const S = { width: "100%", padding: "15px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: "1.05rem", cursor: "pointer", transition: "all 0.2s ease" };
  const summaryAddress = value => claimData.type === "labor" ? normalizeLaborAddress(value) : value;
  const summaryText = value => claimData.type === "labor" ? normalizeLaborText(value) : value;

  return (
    <div>
      <style>{`
        @keyframes finalReadyEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .final-ready-shell { animation: finalReadyEnter .35s ease both; box-shadow: 0 24px 70px rgba(2,8,23,.34); }
        .final-file-card, .final-pay-button, .final-secondary-button, .final-dev-button { transition: all .2s ease; }
        .final-file-card:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,.28); }
        .final-file-card.pdf:not(:disabled):hover { border-color: rgba(248,113,113,.72) !important; box-shadow: 0 12px 30px rgba(248,113,113,.12); }
        .final-file-card.docx:not(:disabled):hover { border-color: rgba(96,165,250,.72) !important; box-shadow: 0 12px 30px rgba(96,165,250,.12); }
        .final-file-card:disabled:hover { border-color: rgba(148,163,184,.22) !important; background: rgba(255,255,255,.045) !important; }
        .final-pay-button:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(99,102,241,.28) !important; filter: saturate(1.08); }
        .final-pay-button:active { transform: scale(.99); }
        .final-secondary-button:hover, .final-dev-button:hover { transform: translateY(-1px); border-color: rgba(148,163,184,.34) !important; background: rgba(255,255,255,.075) !important; }
      `}</style>
      <div className={`rounded-2xl border border-white/10${generated ? " final-ready-shell" : ""}`} style={{ background: generated ? "radial-gradient(circle at 85% 5%,rgba(139,92,246,.11),transparent 34%),radial-gradient(circle at 10% 0%,rgba(14,165,233,.09),transparent 32%),rgba(255,255,255,0.035)" : "rgba(255,255,255,0.03)", padding: "clamp(16px,5vw,32px)" }}>
        {saveError && <p style={{ color: "#fbbf24", marginBottom: 16, fontSize: "0.85rem" }}>{saveError}</p>}

        {!generated ? (
          <>
            <h3 style={{ fontWeight: 800, color: "white", fontSize: "1.35rem", marginBottom: 4 }}>
              {isCollective ? "Подтверждение данных" : "Генерация претензии"}
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 20 }}>
                      Категория: <span style={{ color: "#22d3ee", fontWeight: 600 }}>{TYPES[claimData.type] || "—"}</span>
            </p>

            {isCollective && (
              <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ color: "#c4b5fd", fontSize: "0.85rem", margin: 0 }}>
                  <i className="fa-solid fa-users" style={{ marginRight: 8 }}></i>
                  Групповая претензия · Ответчик: <b>{claimData.employer?.name || "—"}</b>
                </p>
              </div>
            )}

            {!showPreviewSummary ? (
              <>
                <button onClick={handleConfirmAndCheck}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "1rem", marginBottom: 12 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }}></i>
                  Проверить данные и показать предпросмотр
                </button>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={prevStep}
                    style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                    Назад
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Full audit errors */}
                {auditResult && auditResult.errors.length > 0 && (
                  <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <i className="fa-solid fa-circle-exclamation" style={{ color: "#f43f5e", fontSize: "1.1rem", marginTop: 2 }}></i>
                      <div>
                        <p style={{ color: "#f87171", fontWeight: 700, fontSize: "0.9rem", margin: "0 0 8px" }}>
                          Обнаружены ошибки. Исправьте их перед генерацией документа.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {auditResult.errors.map((err, i) => (
                            <span key={i} style={{ color: "#fca5a5", fontSize: "0.8rem" }}>
                              ❌ {err}
                            </span>
                          ))}
                          {auditResult.warnings.map((warn, i) => (
                            <span key={`w${i}`} style={{ color: "#fcd34d", fontSize: "0.8rem" }}>
                              ⚠️ {warn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit passed — show green */}
                {auditResult && auditResult.passed && (
                  <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                    <p style={{ color: "#4ade80", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
                      Все проверки пройдены успешно
                    </p>
                  </div>
                )}

                {/* Data preview summary */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <h4 style={{ fontWeight: 600, color: "white", marginBottom: 12, fontSize: "0.95rem" }}>
                    <i className="fa-solid fa-clipboard-list" style={{ marginRight: 8, color: "#22d3ee" }}></i>
                    Сводка данных
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {claimData.workers?.map((w, i) => (
                      <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <p style={{ color: "#9ca3af", fontSize: "0.72rem", margin: "0 0 3px" }}>Заявитель {claimData.workers.length > 1 ? i + 1 : ""}</p>
                        <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{w.name || "—"}</p>
                        {w.address && <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "2px 0 0" }}>{summaryAddress(w.address)}</p>}
                      </div>
                    ))}
                    {claimData.employer?.name && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <p style={{ color: "#9ca3af", fontSize: "0.72rem", margin: "0 0 3px" }}>Ответчик</p>
                        <p style={{ color: "white", fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{claimData.employer.name}</p>
                        <p style={{ color: "#94a3b8", fontSize: ".76rem", margin: "3px 0 0" }}>{summaryAddress(claimData.employer.address) || "—"} · ИНН {claimData.employer.inn || "—"} · ОГРН/ОГРНИП {claimData.employer.ogrn || "—"}</p>
                      </div>
                    )}
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                      <p style={{ color: "#9ca3af", fontSize: ".72rem", margin: "0 0 3px" }}>Ситуация и формат</p>
                      <p style={{ color: "white", fontSize: ".84rem", margin: 0 }}>{claimData.subtypeLabel || "—"} · {isCollective ? "Коллективная" : "Индивидуальная"}</p>
                    </div>
                    {claimData.type === "labor" && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <p style={{ color: "#9ca3af", fontSize: ".72rem", margin: "0 0 3px" }}>Основные обстоятельства</p>
                        <p style={{ color: "#cbd5e1", fontSize: ".8rem", margin: 0, lineHeight: 1.5 }}>Начало работы: {claimData.circumstances?.workStart || "—"}; место: {summaryAddress(claimData.circumstances?.workplace) || "—"}; задолженность: {claimData.circumstances?.outstandingDebtAmount ?? claimData.circumstances?.debtAmount ?? "—"} ₽</p>
                      </div>
                    )}
                    {claimData.circumstances?.description && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <p style={{ color: "#9ca3af", fontSize: "0.72rem", margin: "0 0 3px" }}>Описание ситуации</p>
                        <p style={{ color: "#cbd5e1", fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                          {summaryText(claimData.circumstances.description).slice(0, 200)}{summaryText(claimData.circumstances.description).length > 200 ? "..." : ""}
                        </p>
                      </div>
                    )}
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}><p style={{ color: "#9ca3af", fontSize: ".72rem", margin: "0 0 3px" }}>Юридически значимые обстоятельства</p><p style={{ color: "#cbd5e1", fontSize: ".8rem", margin: 0 }}>{selectedLegalLabels.join("; ") || "Не выбраны"}</p></div>
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}><p style={{ color: "#9ca3af", fontSize: ".72rem", margin: "0 0 3px" }}>Доказательства</p><p style={{ color: "#cbd5e1", fontSize: ".8rem", margin: 0 }}>{(claimData.evidence || []).join("; ") || "Не выбраны"}</p></div>
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}><p style={{ color: "#9ca3af", fontSize: ".72rem", margin: "0 0 3px" }}>Итоговые требования</p><p style={{ color: "#cbd5e1", fontSize: ".8rem", margin: 0 }}>{selectedRequirements.join("; ") || "Будут сформированы по выбранной ситуации"}</p></div>
                  </div>
                </div>

                <div style={{ background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                      style={{ marginTop: 2, width: 18, height: 18, accentColor: "#0ea5e9", flexShrink: 0 }} />
                    <div>
                      <span style={{ display: "block", fontWeight: 500, color: "white", marginBottom: 3 }}>Я проверил(а) данные и подтверждаю, что они указаны верно</span>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Документ будет сформирован на основе этой информации.</span>
                    </div>
                  </label>
                </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowPreviewSummary(false)}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                Назад
              </button>
              <button onClick={handleGenerate} disabled={!confirmed || saving || !auditResult?.passed}
                style={{ flex: 2, padding: "13px", borderRadius: 12, background: confirmed && !saving && auditResult?.passed ? "linear-gradient(135deg,#0ea5e9,#8b5cf6)" : "rgba(255,255,255,0.08)", border: "none", color: confirmed && !saving && auditResult?.passed ? "white" : "#6b7280", cursor: confirmed && !saving && auditResult?.passed ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "1rem", transition: "all 0.2s" }}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Сохранение...</>
                  : <><i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 8 }}></i>{isCollective && !isCollectiveFinal ? "Сохранить мои данные" : "Сгенерировать документ"}</>
                }
              </button>
            </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 7, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#67e8f9", background: "linear-gradient(135deg,rgba(14,165,233,.2),rgba(139,92,246,.2))", border: "1px solid rgba(103,232,249,.2)" }}><i className="fa-solid fa-check"></i></span>
                  <h3 style={{ fontWeight: 800, color: "white", fontSize: "clamp(1.3rem,4vw,1.55rem)", margin: 0 }}>{isCollectiveFinal ? "Коллективная претензия готова" : "Ваша претензия готова"}</h3>
                </div>
                <span style={{ color: "#86efac", background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.22)", borderRadius: 999, padding: "5px 10px", fontSize: ".72rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>Документ сформирован
                </span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.86rem", margin: 0 }}>{isCollectiveFinal ? "Проверьте данные участников и скачайте итоговый документ после оплаты." : "Проверьте образец и скачайте готовый документ после оплаты."}</p>
            </div>

            <div style={{ marginBottom: 24, padding: "18px", borderRadius: 16, background: "rgba(2,6,23,.24)", border: "1px solid rgba(148,163,184,.14)" }}>
              <h4 style={{ color: "white", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px" }}>
                Предпросмотр документа
              </h4>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0 0 12px" }}>Это образец с водяным знаком. Готовый PDF и DOCX будут доступны после оплаты.</p>
              <div onContextMenu={event => event.preventDefault()} style={{ position: "relative", maxHeight: 560, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(226,232,240,.75)", boxShadow: "0 16px 40px rgba(0,0,0,0.24)", userSelect: "none" }}>
                <PreviewIframe claimData={claimData} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
                  <span style={{ fontSize: "clamp(2.5rem,8vw,4rem)", fontWeight: 900, color: "rgba(14,165,233,0.13)", border: "4px solid rgba(14,165,233,0.1)", padding: "8px 28px", borderRadius: 10, transform: "rotate(-30deg)", letterSpacing: 8, whiteSpace: "nowrap", fontFamily: "Arial, sans-serif" }}>
                    ОБРАЗЕЦ
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 20, border: "1px solid rgba(103,232,249,.34)", background: "radial-gradient(circle at 90% 0%,rgba(139,92,246,.18),transparent 38%),linear-gradient(145deg,rgba(14,165,233,.09),rgba(15,23,42,.82) 48%,rgba(139,92,246,.09))", boxShadow: "0 22px 60px rgba(2,8,23,.38),0 0 36px rgba(14,165,233,.07)", padding: "clamp(18px,4vw,26px)" }}>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>{isCollectiveFinal ? "Скачать коллективную претензию" : "Скачать готовый документ"}</h4>
              <p style={{ color: "#a5b4c7", fontSize: "0.82rem", margin: "0 0 8px" }}>После оплаты будут доступны PDF для отправки и DOCX для редактирования.</p>
              <p style={{ color: "#cbd5e1", fontSize: "0.8rem", margin: "0 0 6px" }}>{isCollectiveFinal ? "PDF будет содержать коллективную претензию и данные заполненных участников." : "PDF включает претензию и загруженные изображения-доказательства в разделе приложений."}</p>
              {hasSeparateFiles && <p style={{ color: "#fbbf24", fontSize: "0.76rem", margin: "0 0 14px" }}>Некоторые файлы нельзя встроить в PDF автоматически. Они будут указаны в списке приложений.</p>}
              {!hasSeparateFiles && <div style={{ height: 8 }} />}

              {pdfInfo?.exceedsRecommendedSize && (
                <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 9, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", fontSize: "0.78rem" }}>
                  Файл получился больше 5 МБ. Для онлайн-отправки уменьшите количество или размер изображений.
                </div>
              )}

              {isCollectiveFinal && collectiveMemberCount >= 2 && (
                <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <p style={{ color: "#c4b5fd", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 8px" }}>
                    <i className="fa-solid fa-users" style={{ marginRight: 8 }}></i>
                    Стоимость коллективной претензии
                  </p>
                  <p style={{ color: "#cbd5e1", fontSize: "0.82rem", margin: "0 0 5px" }}>Участников в документе: {collectiveMemberCount}</p>
                  <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: "0 0 6px" }}>790 ₽ × {collectiveMemberCount} {participantsGenitive(collectiveMemberCount)}</p>
                  <p style={{ color: "#a78bfa", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 6px" }}>Итого: {collectiveTotal.toLocaleString("ru-RU")} ₽</p>
                  <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }}></i>
                    В оплату включены только участники, которые заполнили данные.
                  </p>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 18 }}>
                {(isCollectiveFinal ? ["PDF с участниками", "DOCX для правок", "Без водяного знака", "Готово к отправке"] : ["PDF с приложениями", "DOCX для правок", "Без водяного знака", "Готово к отправке"]).map(t => (
                  <p key={t} style={{ color: "#d1fae5", fontSize: "0.82rem", margin: 0, padding: "9px 10px", borderRadius: 9, background: "rgba(74,222,128,.055)", border: "1px solid rgba(74,222,128,.12)" }}>
                    <i className="fa-solid fa-check" style={{ marginRight: 8, color: "#4ade80" }}></i>{t}
                  </p>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <button className="final-file-card pdf" onClick={() => handleDownloadPDF()} disabled={!paid}
                  style={{ minHeight: 76, padding: "12px 14px", borderRadius: 13, border: `1px solid ${paid ? "rgba(248,113,113,0.45)" : "rgba(148,163,184,0.18)"}`, background: paid ? "linear-gradient(145deg,rgba(248,113,113,.15),rgba(127,29,29,.08))" : "rgba(255,255,255,0.035)", color: paid ? "#fca5a5" : "#94a3b8", fontWeight: 700, fontSize: "0.9rem", cursor: paid ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(248,113,113,.1)", color: paid ? "#f87171" : "#64748b" }}><i className="fa-solid fa-file-pdf"></i></span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "left" }}><span>{paid ? "Скачать PDF" : "PDF"}</span>{!paid && <small style={{ color: "#64748b", fontWeight: 500 }}><i className="fa-solid fa-lock" style={{ marginRight: 5 }}></i>После оплаты</small>}</span>
                </button>
                <button className="final-file-card docx" onClick={() => handleDownloadDOCX()} disabled={!paid}
                  style={{ minHeight: 76, padding: "12px 14px", borderRadius: 13, border: `1px solid ${paid ? "rgba(96,165,250,0.45)" : "rgba(148,163,184,0.18)"}`, background: paid ? "linear-gradient(145deg,rgba(96,165,250,.15),rgba(30,64,175,.08))" : "rgba(255,255,255,0.035)", color: paid ? "#93c5fd" : "#94a3b8", fontWeight: 700, fontSize: "0.9rem", cursor: paid ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(96,165,250,.1)", color: paid ? "#60a5fa" : "#64748b" }}><i className="fa-solid fa-file-word"></i></span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "left" }}><span>{paid ? "Скачать DOCX" : "DOCX"}</span>{!paid && <small style={{ color: "#64748b", fontWeight: 500 }}><i className="fa-solid fa-lock" style={{ marginRight: 5 }}></i>После оплаты</small>}</span>
                </button>
              </div>

              {!paid ? (
                <>
                  {(!isCollective || isCollectiveFinal) && !discountVerified && (
                    <div style={{ margin: "14px 0 12px", padding: "12px 14px", borderRadius: 11, background: "rgba(15,23,42,.42)", border: "1px solid rgba(148,163,184,.13)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                      <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.86rem", margin: "0 0 2px" }}>Хотите скидку?</p>
                      <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: 0 }}>{isCollectiveFinal ? "Получите скидку или задайте вопрос по коллективной претензии в Telegram." : "Написать в Telegram и получить промокод"}</p>
                      </div>
                      <a className="final-secondary-button" href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer" onClick={isCollectiveFinal ? undefined : handleCheckDiscount}
                        style={{ padding: "8px 13px", borderRadius: 8, background: "rgba(34,211,238,0.055)", border: "1px solid rgba(34,211,238,0.18)", color: "#a5f3fc", fontWeight: 600, cursor: "pointer", fontSize: "0.8rem" }}>
                        <i className="fa-brands fa-telegram" style={{ marginRight: 6 }}></i>Получить скидку
                      </a>
                    </div>
                  )}
                  {!isCollective && discountVerified && (
                    <p style={{ color: "#86efac", fontWeight: 600, fontSize: "0.82rem", margin: "12px 0" }}>
                      Скидка применена — вы экономите 310 ₽
                    </p>
                  )}

                  <button className="final-pay-button" onClick={handlePay}
                    style={{ ...S, display: "block", minHeight: 54, background: "linear-gradient(115deg,#06b6d4 0%,#3b82f6 48%,#8b5cf6 100%)", color: "white", marginBottom: 8, boxShadow: "0 12px 28px rgba(59,130,246,.22)", letterSpacing: ".01em" }}>
                    <i className="fa-solid fa-credit-card" style={{ marginRight: 9 }}></i>
                    {isCollective
                      ? `Оплатить и скачать — ${collectiveTotal.toLocaleString("ru-RU")} ₽`
                      : discountVerified
                        ? "Оплатить и скачать — 490 ₽"
                        : "Оплатить и скачать — 800 ₽"}
                  </button>

                  <p style={{ color: "#64748b", fontSize: "0.78rem", textAlign: "center", marginBottom: 14 }}>
                    После оплаты кнопки PDF и DOCX станут активными.
                  </p>
                  <button className="final-secondary-button" onClick={reset}
                    style={{ display: "block", width: "100%", padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem" }}>
                    <i className="fa-solid fa-rotate-right" style={{ marginRight: 6 }}></i>Создать новую претензию
                  </button>
                </>
              ) : (
                <div style={{ marginTop: 14, background: "linear-gradient(135deg,rgba(74,222,128,.09),rgba(16,185,129,.045))", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 11, padding: "14px 16px", textAlign: "center", boxShadow: "0 10px 25px rgba(16,185,129,.06)" }}>
                  <p style={{ color: "#86efac", fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>
                    <i className="fa-solid fa-check-circle" style={{ marginRight: 8 }}></i>{isCollectiveFinal ? "Оплата прошла успешно. Коллективная претензия доступна для скачивания." : "Оплата прошла успешно. Документ доступен для скачивания."}
                  </p>
                </div>
              )}

              {isDev && (
                <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 9, border: "1px dashed rgba(148,163,184,0.2)", background: "rgba(2,6,23,.22)", opacity: .82 }}>
                  <p style={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.78rem", margin: "0 0 3px" }}>Режим разработки</p>
                  <p style={{ color: "#64748b", fontSize: "0.72rem", margin: "0 0 3px" }}>Локальная проверка скачивания без оплаты. Пользователи этого не видят.</p>
                  <p style={{ color: "#64748b", fontSize: "0.7rem", margin: "0 0 9px" }}>Режим разработки: скачивание доступно без оплаты{pdfInfo?.sizeBytes ? ` · PDF примерно ${(pdfInfo.sizeBytes / (1024 * 1024)).toFixed(2)} МБ` : ""}.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button className="final-dev-button" onClick={() => handleDownloadPDF(true)} style={{ padding: "9px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.035)", color: "#94a3b8", cursor: "pointer", fontSize: "0.76rem" }}>Скачать PDF без оплаты</button>
                    <button className="final-dev-button" onClick={() => handleDownloadDOCX(true)} style={{ padding: "9px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.035)", color: "#94a3b8", cursor: "pointer", fontSize: "0.76rem" }}>Скачать DOCX без оплаты</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {generated && <CollapsibleNextSteps />}
    </div>
  );
}

function PreviewIframe({ claimData }) {
  const iframeRef = useRef(null);
  const [cutHeight, setCutHeight] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try {
        const doc = iframe.contentDocument;
        const all = doc.body.querySelectorAll("p");
        let cutEl = null;
        let foundHeader = false;
        for (let el of all) {
          const t = el.textContent || "";
          if (/выявленные нарушения|правовое обоснование требований/i.test(t)) { foundHeader = true; continue; }
          if (foundHeader && /Статья\s+\d+/i.test(t)) { cutEl = el; break; }
        }
        if (cutEl) {
          const top = cutEl.offsetTop + cutEl.offsetHeight + 8;
          setCutHeight(top);
        }
      } catch {
        console.error("Не удалось рассчитать высоту предпросмотра документа.");
      }
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [claimData]);

  const showHeight = cutHeight ? Math.min(cutHeight + 20, 680) : 560;

  return (
    <div style={{ position: "relative", overflow: "hidden", height: showHeight, background: "white" }}>
      <iframe ref={iframeRef} srcDoc={buildHtml(claimData)}
        style={{ width: "100%", height: "1200px", border: "none", display: "block", background: "white", pointerEvents: "none", filter: "blur(0.25px)" }}
        scrolling="no" title="Предпросмотр документа" />
      {cutHeight && (
        <div style={{ position: "absolute", top: cutHeight, left: 0, right: 0, bottom: 0, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", background: "rgba(255,255,255,0.45)", zIndex: 4 }} />
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.98))", pointerEvents: "none", zIndex: 5 }} />
    </div>
  );
}

function CollapsibleNextSteps() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)", marginTop: 16, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "none", border: "none", cursor: "pointer", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22d3ee", fontSize: "1rem" }}>
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontWeight: 700, color: "white", fontSize: "1rem", margin: 0 }}>Что делать дальше</p>
            <p style={{ color: "#9ca3af", fontSize: "0.78rem", margin: 0 }}>Пошаговая инструкция</p>
          </div>
        </div>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} style={{ color: "#6b7280", fontSize: "0.9rem" }}></i>
      </button>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          <ol style={{ margin: 0, paddingLeft: 20, color: "#cbd5e1", fontSize: "0.86rem", lineHeight: 1.8 }}>
            <li>Скачайте PDF после оплаты.</li>
            <li>Если отправляете онлайн, используйте PDF с приложениями.</li>
            <li>Если размер файла больше лимита площадки, уменьшите количество или размер изображений.</li>
            <li>Если отправляете на бумаге, распечатайте претензию и приложения.</li>
            <li>Подпишите претензию.</li>
            <li>Сохраните доказательство отправки: чек, трек-номер, опись вложения или отметку о вручении.</li>
          </ol>
          <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "12px 0 0" }}>Для важных споров можно дополнительно показать документ юристу.</p>
        </div>
      )}
    </div>
  );
}
