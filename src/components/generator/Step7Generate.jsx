import { useEffect, useMemo, useState } from "react";
import { createDocument } from "@/services/documentService";
import { generatePDF, buildHtml, buildDocxBlob } from "./pdfGenerator";
import { isGibberish } from "@/components/generator/GarbledTextWarning";
import { getCategoryRules, getSelectedRequirementTexts, normalizeCategoryId } from "@/data/legalRules";
import { validateProductCircumstances } from "@/components/generator/validation";
import { checkPayment, clearStoredPaymentToken, createPayment, getStoredPaymentToken } from "@/services/paymentService";

const COLLECTIVE_PRICE_PER = 790;
const SOLO_PRICE = 800;

function isNameValid(name) {
  const value = String(name || "").trim();
  const parts = value.split(/\s+/).filter(Boolean);
  return value.length >= 5 && parts.length >= 2 && parts.every(part => /^[А-Яа-яЁёA-Za-z-]{2,}$/.test(part));
}

function isPhoneValid(phone) {
  return String(phone || "").replace(/\D/g, "").length === 11;
}

function isEmailValid(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFutureDate(value) {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function addTextError(errors, value, message, min = 10) {
  const text = String(value || "").trim();
  if (!text || text.length < min) errors.push(message);
  else if (isGibberish(text)) errors.push(`${message}: текст похож на случайный набор символов`);
}

function auditCourse(circ, selected, errors, warnings, prefix) {
  addTextError(errors, circ.productName, `${prefix} — укажите название онлайн-курса`, 2);
  if (!positive(circ.purchaseAmount)) errors.push(`${prefix} — укажите стоимость онлайн-курса`);
  if (circ.purchaseDate && isFutureDate(circ.purchaseDate)) errors.push(`${prefix} — дата оплаты курса не может быть в будущем`);
  addTextError(errors, circ.description, `${prefix} — подробно опишите ситуацию`, 50);

  const refund = Number(circ.refundAmount || 0);
  const purchase = Number(circ.purchaseAmount || 0);
  if (refund < 0) errors.push(`${prefix} — сумма возврата не может быть отрицательной`);
  if (refund > purchase && purchase > 0) warnings.push(`${prefix} — сумма возврата выше стоимости курса. Проверьте обоснование разницы.`);

  if (selected.has("poor_quality_service") && !String(circ.serviceDefects || "").trim() && !String(circ.actualResult || "").trim()) {
    errors.push(`${prefix} — для требований из-за недостатков обучения опишите конкретный недостаток услуги`);
  }
  if (circ.refundRequestDate && circ.purchaseDate && parseDate(circ.refundRequestDate) < parseDate(circ.purchaseDate)) {
    errors.push(`${prefix} — дата требования о возврате не может быть раньше даты оплаты курса`);
  }
  if (selected.has("voluntary_withdrawal") && selected.has("poor_quality_service")) {
    warnings.push(`${prefix} — одновременно выбраны обычный отказ от обучения и недостатки услуги; в документе основания будут разделены.`);
  }
}

function auditDebt(circ, selected, errors, warnings, prefix) {
  if (!positive(circ.debtAmount)) errors.push(`${prefix} — укажите основную сумму долга`);
  addTextError(errors, circ.description, `${prefix} — подробно опишите происхождение долга`, 50);
  if (circ.contractDate && isFutureDate(circ.contractDate)) errors.push(`${prefix} — дата расписки или договора не может быть в будущем`);
  if (circ.moneyTransferDate && isFutureDate(circ.moneyTransferDate)) errors.push(`${prefix} — дата передачи денег не может быть в будущем`);
  if (circ.repaymentDate && circ.contractDate && parseDate(circ.repaymentDate) < parseDate(circ.contractDate)) {
    errors.push(`${prefix} — срок возврата не может быть раньше даты расписки или договора`);
  }

  const principal = Number(circ.debtAmount || 0);
  const returned = Number(circ.returnedAmount || 0);
  const remaining = Number(circ.remainingDebtAmount || 0);
  if (returned < 0 || remaining < 0) errors.push(`${prefix} — суммы частичного возврата и остатка не могут быть отрицательными`);
  if (returned > principal && principal > 0) errors.push(`${prefix} — уже возвращённая сумма не может превышать исходный долг`);
  if (remaining > principal && principal > 0) errors.push(`${prefix} — остаток долга не может превышать исходную сумму`);
  if (returned > 0 && remaining > 0 && Math.abs(returned + remaining - principal) > 1) {
    warnings.push(`${prefix} — возвращённая сумма + остаток не совпадают с исходной суммой долга.`);
  }
  if (selected.has("no_due_date") && !circ.demandDate) errors.push(`${prefix} — для займа без установленного срока укажите дату предъявления требования о возврате`);
  if (circ.demandDate && isFutureDate(circ.demandDate)) errors.push(`${prefix} — дата требования о возврате не может быть в будущем`);
  if (circ.demandDate && circ.contractDate && parseDate(circ.demandDate) < parseDate(circ.contractDate)) {
    errors.push(`${prefix} — требование о возврате не может быть направлено раньше возникновения займа`);
  }
  if (selected.has("interest_required") || circ.interestRequired) {
    warnings.push(`${prefix} — проценты по ст. 395 ГК РФ требуют расчёта по ставкам соответствующих периодов, если иной размер не установлен законом или договором.`);
  }
}

function auditCategory(type, subtype, circ, selected, evidence, errors, warnings, prefix = "Шаг 5") {
  if (type === "labor") {
    if (!circ.workStart) errors.push(`${prefix} — укажите дату начала работы`);
    if (circ.workStart && isFutureDate(circ.workStart)) errors.push(`${prefix} — дата начала работы не может быть в будущем`);
    if (!String(circ.workplace || "").trim()) errors.push(`${prefix} — укажите место выполнения работы`);
    addTextError(errors, circ.description, `${prefix} — подробно опишите трудовую ситуацию`, 30);
    const moneySubtypes = new Set(["unpaid-wages", "dismissal-payment", "delayed-leave-or-sick-pay", "unpaid-overtime"]);
    if (moneySubtypes.has(subtype) && !positive(circ.debtAmount)) errors.push(`${prefix} — укажите сумму задолженности`);
    if (Number(circ.partialPaymentAmount || 0) > Number(circ.debtAmount || 0) && positive(circ.debtAmount)) {
      errors.push(`${prefix} — частичная выплата не может превышать начисленную задолженность`);
    }
  } else if (type === "product") {
    Object.values(validateProductCircumstances(circ)).forEach(message => errors.push(`${prefix} — ${message}`));
    if (circ.purchaseDate && isFutureDate(circ.purchaseDate)) errors.push(`${prefix} — дата покупки не может быть в будущем`);
    if (circ.defectFoundDate && circ.purchaseDate && parseDate(circ.defectFoundDate) < parseDate(circ.purchaseDate)) {
      errors.push(`${prefix} — недостаток не может быть обнаружен раньше покупки`);
    }
  } else if (type === "course") {
    auditCourse(circ, selected, errors, warnings, prefix);
  } else if (type === "debt") {
    auditDebt(circ, selected, errors, warnings, prefix);
  }

  const selectedEvidence = Array.isArray(evidence) ? evidence : [];
  const evidencePrefix = prefix.replace("Шаг 5", "Шаг 6");
  if (!selectedEvidence.length) errors.push(`${evidencePrefix} — выберите доказательства или вариант «Нет доказательств»`);
  if (selectedEvidence.includes("Нет доказательств") && selectedEvidence.length > 1) {
    errors.push(`${evidencePrefix} — «Нет доказательств» нельзя выбирать одновременно с другими доказательствами`);
  }
}

function memberData(member = {}, fallbackOptions = [], fallbackSubtype = "") {
  const claimant = member.claimantData || member.claimData?.workers?.[0] || member.claimData?.claimant || member;
  const evidenceData = member.evidenceData || member.claimData?.evidenceData || {};
  return {
    claimant,
    circumstances: member.circumstancesData || member.circumstances || member.claimData?.circumstances || {},
    evidence: Array.isArray(evidenceData.selected) ? evidenceData.selected : Array.isArray(member.evidence) ? member.evidence : member.claimData?.evidence || [],
    selectedLegalOptions: Array.isArray(member.selectedLegalOptions) && member.selectedLegalOptions.length ? member.selectedLegalOptions : member.claimData?.selectedLegalOptions || fallbackOptions,
    subtype: member.subtype || member.claimData?.subtype || fallbackSubtype,
  };
}

function validateClaimant(worker, errors, prefix) {
  if (!isNameValid(worker?.name)) errors.push(`${prefix}: укажите корректные ФИО`);
  if (!String(worker?.address || "").trim() || String(worker.address).trim().length < 8) errors.push(`${prefix}: укажите адрес`);
  if (!isPhoneValid(worker?.phone)) errors.push(`${prefix}: укажите корректный номер телефона`);
  if (!isEmailValid(worker?.email)) errors.push(`${prefix}: укажите корректный email`);
}

function runFullAudit(claimData) {
  const errors = [];
  const warnings = [];
  const type = normalizeCategoryId(claimData.type);
  const respondent = claimData.employer || claimData.respondent || {};
  const collective = claimData.mode === "collective";

  if (!type) errors.push("Шаг 1 — выберите направление спора");
  if (!String(respondent.name || "").trim()) errors.push("Шаг 3 — укажите ответчика");
  if (!String(respondent.address || "").trim()) errors.push("Шаг 3 — укажите адрес ответчика");
  if (respondent.inn && !/^\d{10}$|^\d{12}$/.test(String(respondent.inn))) errors.push("Шаг 3 — ИНН должен содержать 10 или 12 цифр");
  if (respondent.ogrn && !/^\d{13}$|^\d{15}$/.test(String(respondent.ogrn))) errors.push("Шаг 3 — ОГРН/ОГРНИП должен содержать 13 или 15 цифр");

  if (collective && claimData.collectiveFinalized) {
    const members = claimData.collectiveMembers || [];
    if (members.length < 2) errors.push("Совместная претензия должна содержать минимум двух полностью заполненных заявителей");
    members.forEach((member, index) => {
      const data = memberData(member, claimData.selectedLegalOptions || [], claimData.subtype || "");
      const label = `Заявитель ${index + 1}`;
      validateClaimant(data.claimant, errors, `Шаг 4 — ${label}`);
      auditCategory(type, data.subtype, data.circumstances, new Set(data.selectedLegalOptions || []), data.evidence, errors, warnings, `Шаг 5 — ${label}`);
    });
  } else {
    const workers = claimData.workers || [];
    if (!workers.length) errors.push("Шаг 4 — добавьте заявителя");
    workers.forEach((worker, index) => validateClaimant(worker, errors, workers.length > 1 ? `Шаг 4 — заявитель ${index + 1}` : "Шаг 4 — заявитель"));
    auditCategory(type, claimData.subtype || "", claimData.circumstances || {}, new Set(claimData.selectedLegalOptions || []), claimData.evidence || [], errors, warnings, "Шаг 5");
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], passed: errors.length === 0 };
}

function amountPreview(claimData) {
  const type = normalizeCategoryId(claimData.type);
  if (claimData.mode === "collective" && claimData.collectiveFinalized) {
    const total = (claimData.collectiveMembers || []).reduce((sum, member) => {
      const circ = member.circumstancesData || member.circumstances || {};
      if (type === "labor") return sum + Number(circ.outstandingDebtAmount || circ.debtAmount || 0);
      if (type === "product" || type === "course") return sum + Number(circ.refundAmount || circ.purchaseAmount || 0);
      if (type === "debt") return sum + Number(circ.remainingDebtAmount || circ.debtAmount || 0);
      return sum;
    }, 0);
    return total || null;
  }
  const circ = claimData.circumstances || {};
  if (type === "labor") return circ.outstandingDebtAmount ?? circ.debtAmount;
  if (type === "product" || type === "course") return circ.refundAmount || circ.purchaseAmount;
  if (type === "debt") return circ.remainingDebtAmount || circ.debtAmount;
  return null;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Step7Generate({ claimData, reset, prevStep, onCollectiveComplete, onSuccessfulSave }) {
  const [audit, setAudit] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [generated, setGenerated] = useState(Boolean(claimData.collectiveFinalized));
  const [saving, setSaving] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [message, setMessage] = useState("");
  const type = normalizeCategoryId(claimData.type);
  const rules = getCategoryRules(type);
  const requirements = useMemo(() => getSelectedRequirementTexts(type, claimData.selectedLegalOptions || []), [type, claimData.selectedLegalOptions]);
  const isCollective = claimData.mode === "collective";
  const memberCount = (claimData.collectiveMembers || []).length || claimData.workers?.length || 1;
  const price = isCollective && claimData.collectiveFinalized ? memberCount * COLLECTIVE_PRICE_PER : SOLO_PRICE;

  useEffect(() => {
    if (!generated) return;
    const token = getStoredPaymentToken();
    if (!token) return;
    let cancelled = false;
    setPaymentBusy(true);
    checkPayment(token)
      .then(result => {
        if (cancelled) return;
        setPaymentStatus(result.status || "");
        if (result.paid) {
          setPaid(true);
          setMessage("Оплата подтверждена. PDF и DOCX доступны для скачивания.");
          const url = new URL(window.location.href);
          if (url.searchParams.has("payment")) {
            url.searchParams.delete("payment");
            window.history.replaceState({}, "", url.toString());
          }
        } else if (new URLSearchParams(window.location.search).get("payment") === "return") {
          setMessage("Платёж пока не подтверждён. Нажмите «Проверить оплату» через несколько секунд.");
        }
      })
      .catch(error => {
        if (!cancelled) setMessage(error.message === "PAYMENT_PROVIDER_NOT_CONFIGURED" ? "Платёжный провайдер ещё не настроен." : "Не удалось проверить оплату.");
      })
      .finally(() => { if (!cancelled) setPaymentBusy(false); });
    return () => { cancelled = true; };
  }, [generated]);

  const check = () => {
    setAudit(runFullAudit(claimData));
    setConfirmed(false);
  };

  async function generate() {
    if (!audit?.passed || !confirmed) return;
    setSaving(true);
    setMessage("");
    try {
      if (isCollective && onCollectiveComplete && !claimData.collectiveFinalized) {
        const ok = await onCollectiveComplete(claimData);
        if (ok === false) throw new Error("collective-save");
        return;
      }
      createDocument({ type: claimData.type, subtype: claimData.subtype || "", respondent_name: claimData.employer?.name || "", claim_data: claimData, status: "ready" });
      onSuccessfulSave?.();
      clearStoredPaymentToken();
      setPaid(false);
      setPaymentStatus("");
      setGenerated(true);
    } catch {
      setMessage("Не удалось сохранить документ. Проверьте данные и попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  async function startPayment() {
    setPaymentBusy(true);
    setMessage("");
    try {
      const payment = await createPayment({ mode: isCollective ? "collective" : "solo", memberCount, category: type });
      setPaymentStatus(payment.status || "pending");
      window.location.assign(payment.confirmationUrl);
    } catch (error) {
      if (error.message === "PAYMENT_PROVIDER_NOT_CONFIGURED") setMessage("ЮKassa ещё не подключена: нужны Shop ID и секретный ключ магазина.");
      else setMessage("Не удалось создать платёж. Попробуйте ещё раз.");
      setPaymentBusy(false);
    }
  }

  async function refreshPayment() {
    const token = getStoredPaymentToken();
    if (!token) {
      setMessage("Платёж ещё не создан.");
      return;
    }
    setPaymentBusy(true);
    try {
      const result = await checkPayment(token);
      setPaymentStatus(result.status || "");
      if (result.paid) {
        setPaid(true);
        setMessage("Оплата подтверждена. PDF и DOCX доступны для скачивания.");
      } else {
        setMessage("Оплата пока не подтверждена.");
      }
    } catch {
      setMessage("Не удалось проверить оплату.");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function downloadPDF() {
    if (!paid) return;
    try { await generatePDF(claimData); }
    catch { setMessage("Не удалось сформировать PDF."); }
  }

  function downloadDOCX() {
    if (!paid) return;
    try {
      const mode = isCollective ? "collective" : "solo";
      downloadBlob(buildDocxBlob(claimData), `pretenziya_${type}_${mode}_${Date.now()}.docx`);
    } catch {
      setMessage("Не удалось сформировать DOCX.");
    }
  }

  const box = { border: "1px solid rgba(255,255,255,.11)", background: "rgba(255,255,255,.035)", borderRadius: 16, padding: 16 };
  const primary = { width: "100%", padding: "13px 16px", border: 0, borderRadius: 12, fontWeight: 800, color: "white", background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", cursor: "pointer" };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...box, padding: "clamp(18px,5vw,30px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: rules?.color || "#22d3ee", fontWeight: 800, margin: "0 0 5px", fontSize: ".8rem" }}>ШАГ 7 ИЗ 7</p>
            <h3 style={{ color: "white", margin: 0, fontSize: "clamp(1.25rem,4vw,1.6rem)" }}>{generated ? "Документ готов" : "Финальная проверка"}</h3>
            <p style={{ color: "#94a3b8", margin: "7px 0 0", fontSize: ".85rem" }}>{rules?.title || "Претензия"} · {isCollective ? "совместная претензия" : "индивидуальная претензия"}</p>
          </div>
          {generated && <span style={{ color: paid ? "#86efac" : "#fde68a", border: `1px solid ${paid ? "rgba(74,222,128,.25)" : "rgba(250,204,21,.25)"}`, background: paid ? "rgba(74,222,128,.08)" : "rgba(250,204,21,.08)", borderRadius: 999, padding: "6px 10px", fontSize: ".75rem", fontWeight: 800 }}>{paid ? "ОПЛАЧЕНО" : "ГОТОВО К ОПЛАТЕ"}</span>}
        </div>

        {message && <div style={{ marginTop: 16, color: paid ? "#86efac" : "#fbbf24", fontSize: ".82rem" }}>{message}</div>}

        {!generated ? (
          <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
            {!audit && <button style={primary} onClick={check}>Проверить все данные</button>}
            {audit && <>
              <div style={{ ...box, borderColor: audit.passed ? "rgba(74,222,128,.3)" : "rgba(244,63,94,.3)", background: audit.passed ? "rgba(74,222,128,.06)" : "rgba(244,63,94,.06)" }}>
                <p style={{ color: audit.passed ? "#86efac" : "#fda4af", fontWeight: 800, margin: "0 0 8px" }}>{audit.passed ? "Все обязательные проверки пройдены" : "Нужно исправить данные"}</p>
                {audit.errors.map(error => <p key={error} style={{ color: "#fecdd3", margin: "4px 0", fontSize: ".8rem" }}>• {error}</p>)}
                {audit.warnings.map(warning => <p key={warning} style={{ color: "#fde68a", margin: "4px 0", fontSize: ".8rem" }}>⚠ {warning}</p>)}
              </div>
              <div style={box}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                  <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>Ответчик</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{claimData.employer?.name || "—"}</p></div>
                  <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>Заявителей</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{memberCount}</p></div>
                  <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>{isCollective ? "Сумма по заявителям" : "Основная сумма"}</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{amountPreview(claimData) ? `${Number(amountPreview(claimData)).toLocaleString("ru-RU")} ₽` : "—"}</p></div>
                </div>
                <div style={{ marginTop: 12 }}><span style={{ color: "#64748b", fontSize: ".72rem" }}>Базовые требования</span><p style={{ color: "#cbd5e1", margin: "4px 0 0", fontSize: ".8rem", lineHeight: 1.5 }}>{requirements.join("; ") || "Будут сформированы индивидуально по обстоятельствам каждого заявителя"}</p></div>
              </div>
              {audit.passed && <label style={{ ...box, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} style={{ marginTop: 3, accentColor: "#0ea5e9" }} /><span style={{ color: "#dbeafe", fontSize: ".84rem" }}>Я проверил(а) сводку. Данные верны, документ можно формировать.</span></label>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => { setAudit(null); setConfirmed(false); prevStep(); }} style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "white", cursor: "pointer" }}>Назад</button>
                <button onClick={generate} disabled={!audit.passed || !confirmed || saving} style={{ ...primary, flex: 2, opacity: !audit.passed || !confirmed || saving ? .45 : 1, cursor: !audit.passed || !confirmed || saving ? "not-allowed" : "pointer" }}>{saving ? "Сохраняю…" : isCollective && !claimData.collectiveFinalized ? "Сохранить данные участника" : "Сформировать документ"}</button>
              </div>
            </>}
          </div>
        ) : (
          <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
            <div style={{ ...box, background: "white", padding: 0, overflow: "hidden", maxHeight: 620 }}>
              <iframe title="Предпросмотр претензии" srcDoc={buildHtml(claimData)} style={{ width: "100%", height: 620, border: 0, background: "white" }} />
            </div>
            <div style={{ ...box, background: "radial-gradient(circle at 90% 0%,rgba(139,92,246,.17),transparent 38%),rgba(15,23,42,.82)" }}>
              <p style={{ color: "white", fontWeight: 800, margin: "0 0 5px" }}>PDF + настоящий DOCX</p>
              <p style={{ color: "#94a3b8", fontSize: ".8rem", margin: "0 0 14px" }}>Скачивание открывается только после подтверждённой оплаты. PDF, DOCX и предпросмотр формируются из одной проверенной модели.</p>
              {paymentStatus && !paid && <p style={{ color: "#fde68a", fontSize: ".78rem", margin: "0 0 10px" }}>Статус платежа: {paymentStatus}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button disabled={!paid} onClick={downloadPDF} style={{ padding: 12, borderRadius: 11, border: "1px solid rgba(248,113,113,.3)", background: paid ? "rgba(248,113,113,.1)" : "rgba(255,255,255,.03)", color: paid ? "#fca5a5" : "#64748b", fontWeight: 800, cursor: paid ? "pointer" : "not-allowed" }}>PDF</button>
                <button disabled={!paid} onClick={downloadDOCX} style={{ padding: 12, borderRadius: 11, border: "1px solid rgba(96,165,250,.3)", background: paid ? "rgba(96,165,250,.1)" : "rgba(255,255,255,.03)", color: paid ? "#93c5fd" : "#64748b", fontWeight: 800, cursor: paid ? "pointer" : "not-allowed" }}>DOCX</button>
              </div>
              {!paid && <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <button onClick={startPayment} disabled={paymentBusy} style={{ ...primary, opacity: paymentBusy ? .55 : 1, cursor: paymentBusy ? "wait" : "pointer" }}>{paymentBusy ? "Проверяем…" : `Оплатить и скачать — ${price.toLocaleString("ru-RU")} ₽`}</button>
                {getStoredPaymentToken() && <button onClick={refreshPayment} disabled={paymentBusy} style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: "#cbd5e1", cursor: paymentBusy ? "wait" : "pointer" }}>Проверить оплату</button>}
              </div>}
              {paid && <p style={{ color: "#86efac", textAlign: "center", margin: "12px 0 0", fontSize: ".82rem", fontWeight: 800 }}>Оплата подтверждена сервером. Скачивание доступно.</p>}
            </div>
            <button onClick={() => { clearStoredPaymentToken(); reset(); }} style={{ padding: 11, borderRadius: 11, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>Создать новую претензию</button>
          </div>
        )}
      </div>
    </div>
  );
}
