import { useMemo, useState } from "react";
import { createDocument } from "@/services/documentService";
import { generatePDF, buildHtml, buildDocxBlob } from "./pdfGenerator";
import { isGibberish } from "@/components/generator/GarbledTextWarning";
import { getCategoryRules, getSelectedRequirementTexts, normalizeCategoryId } from "@/data/legalRules";
import { validateProductCircumstances } from "@/components/generator/validation";

const COLLECTIVE_PRICE_PER = 790;

function isNameValid(name) {
  const value = String(name || "").trim();
  if (value.length < 5) return false;
  const parts = value.split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every(part => /^[А-Яа-яЁёA-Za-z-]{2,}$/.test(part));
}

function isPhoneValid(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length === 11;
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

function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function addTextError(errors, value, message, min = 10) {
  const text = String(value || "").trim();
  if (!text || text.length < min) errors.push(message);
  else if (isGibberish(text)) errors.push(`${message}: текст похож на случайный набор символов`);
}

function auditCourse(circ, selected, errors, warnings) {
  addTextError(errors, circ.productName, "Шаг 5 — укажите название онлайн-курса", 2);
  if (!positive(circ.purchaseAmount)) errors.push("Шаг 5 — укажите стоимость онлайн-курса");
  if (circ.purchaseDate && isFutureDate(circ.purchaseDate)) errors.push("Шаг 5 — дата оплаты курса не может быть в будущем");
  addTextError(errors, circ.description, "Шаг 5 — подробно опишите ситуацию", 50);

  const refund = Number(circ.refundAmount || 0);
  const purchase = Number(circ.purchaseAmount || 0);
  if (refund < 0) errors.push("Шаг 5 — сумма возврата не может быть отрицательной");
  if (refund > purchase && purchase > 0) warnings.push("Сумма возврата выше стоимости курса. Проверьте, что разница обоснована отдельными расходами или убытками.");

  if (selected.has("poor_quality_service") && !String(circ.serviceDefects || "").trim() && !String(circ.actualResult || "").trim()) {
    errors.push("Шаг 5 — для требования из-за недостатков обучения опишите, в чём именно недостаток услуги");
  }
  if (selected.has("refund_refused") && !circ.refundRequestDate && !String(circ.supportResponse || "").trim()) {
    warnings.push("Вы указали отказ в возврате, но не указали дату обращения или ответ поддержки.");
  }
  if (selected.has("credit_payment") && !circ.creditOrInstallment) {
    warnings.push("Отмечена оплата кредитными средствами, но переключатель «кредит / рассрочка» не включён.");
  }
  if (circ.refundRequestDate && circ.purchaseDate && parseDate(circ.refundRequestDate) < parseDate(circ.purchaseDate)) {
    errors.push("Шаг 5 — дата требования о возврате не может быть раньше даты оплаты курса");
  }
  if (selected.has("voluntary_withdrawal") && selected.has("poor_quality_service")) {
    warnings.push("Одновременно выбраны отказ от дальнейшего обучения и недостатки услуги. В документе эти основания будут изложены раздельно.");
  }
}

function auditDebt(circ, selected, errors, warnings) {
  if (!positive(circ.debtAmount)) errors.push("Шаг 5 — укажите основную сумму долга");
  addTextError(errors, circ.description, "Шаг 5 — подробно опишите происхождение долга", 50);
  if (circ.contractDate && isFutureDate(circ.contractDate)) errors.push("Шаг 5 — дата расписки или договора не может быть в будущем");
  if (circ.moneyTransferDate && isFutureDate(circ.moneyTransferDate)) errors.push("Шаг 5 — дата передачи денег не может быть в будущем");
  if (circ.repaymentDate && circ.contractDate && parseDate(circ.repaymentDate) < parseDate(circ.contractDate)) {
    errors.push("Шаг 5 — срок возврата не может быть раньше даты расписки или договора");
  }

  const principal = Number(circ.debtAmount || 0);
  const returned = Number(circ.returnedAmount || 0);
  const remaining = Number(circ.remainingDebtAmount || 0);
  if (returned < 0 || remaining < 0) errors.push("Шаг 5 — суммы частичного возврата и остатка не могут быть отрицательными");
  if (returned > principal && principal > 0) errors.push("Шаг 5 — уже возвращённая сумма не может превышать исходный долг");
  if (remaining > principal && principal > 0) errors.push("Шаг 5 — остаток долга не может превышать исходную сумму");
  if (returned > 0 && remaining > 0 && Math.abs((returned + remaining) - principal) > 1) {
    warnings.push("Проверьте расчёт: возвращённая сумма + остаток не совпадают с исходной суммой долга.");
  }

  if (!circ.repaymentDate && !selected.has("no_due_date") && !circ.demandDate) {
    warnings.push("Срок возврата не указан. Для займа без срока важно зафиксировать дату требования о возврате.");
  }
  if (selected.has("no_due_date") && !circ.demandDate) {
    errors.push("Шаг 5 — для займа без установленного срока укажите дату предъявления требования о возврате");
  }
  if (circ.demandDate && isFutureDate(circ.demandDate)) errors.push("Шаг 5 — дата требования о возврате не может быть в будущем");
  if (circ.demandDate && circ.contractDate && parseDate(circ.demandDate) < parseDate(circ.contractDate)) {
    errors.push("Шаг 5 — требование о возврате не может быть направлено раньше возникновения займа");
  }
  if ((selected.has("interest_required") || circ.interestRequired) && circ.interestRate && !nonNegative(circ.interestRate)) {
    errors.push("Шаг 5 — процентная ставка указана некорректно");
  }
  if (selected.has("interest_required") || circ.interestRequired) {
    warnings.push("Проценты по ст. 395 ГК РФ должны рассчитываться по ключевой ставке, действовавшей в соответствующие периоды, если иной размер не установлен законом или договором.");
  }
}

function runFullAudit(claimData) {
  const errors = [];
  const warnings = [];
  const type = normalizeCategoryId(claimData.type);
  const circ = claimData.circumstances || {};
  const selected = new Set(claimData.selectedLegalOptions || []);
  const workers = claimData.workers || [];

  if (!type) errors.push("Шаг 1 — выберите направление спора");
  if (!workers.length) errors.push("Шаг 4 — добавьте заявителя");
  workers.forEach((worker, index) => {
    const prefix = workers.length > 1 ? `Шаг 4 — заявитель ${index + 1}` : "Шаг 4 — заявитель";
    if (!isNameValid(worker.name)) errors.push(`${prefix}: укажите корректные ФИО`);
    if (!String(worker.address || "").trim() || String(worker.address).trim().length < 8) errors.push(`${prefix}: укажите адрес`);
    if (!isPhoneValid(worker.phone)) errors.push(`${prefix}: укажите корректный номер телефона`);
    if (!isEmailValid(worker.email)) errors.push(`${prefix}: укажите корректный email`);
  });

  const respondent = claimData.employer || {};
  if (!String(respondent.name || "").trim()) errors.push("Шаг 3 — укажите ответчика");
  if (!String(respondent.address || "").trim()) errors.push("Шаг 3 — укажите адрес ответчика");
  if (respondent.inn && !/^\d{10}$|^\d{12}$/.test(String(respondent.inn))) errors.push("Шаг 3 — ИНН должен содержать 10 или 12 цифр");
  if (respondent.ogrn && !/^\d{13}$|^\d{15}$/.test(String(respondent.ogrn))) errors.push("Шаг 3 — ОГРН/ОГРНИП должен содержать 13 или 15 цифр");

  if (type === "labor") {
    if (!circ.workStart) errors.push("Шаг 5 — укажите дату начала работы");
    if (circ.workStart && isFutureDate(circ.workStart)) errors.push("Шаг 5 — дата начала работы не может быть в будущем");
    if (!String(circ.workplace || "").trim()) errors.push("Шаг 5 — укажите место выполнения работы");
    addTextError(errors, circ.description, "Шаг 5 — подробно опишите трудовую ситуацию", 30);
    const moneySubtypes = new Set(["unpaid-wages", "dismissal-payment", "delayed-leave-or-sick-pay", "unpaid-overtime"]);
    if (moneySubtypes.has(claimData.subtype) && !positive(circ.debtAmount)) errors.push("Шаг 5 — укажите сумму задолженности");
    if (Number(circ.partialPaymentAmount || 0) > Number(circ.debtAmount || 0) && positive(circ.debtAmount)) errors.push("Шаг 5 — частичная выплата не может превышать начисленную задолженность");
  } else if (type === "product") {
    Object.values(validateProductCircumstances(circ)).forEach(message => errors.push(`Шаг 5 — ${message}`));
    if (circ.purchaseDate && isFutureDate(circ.purchaseDate)) errors.push("Шаг 5 — дата покупки не может быть в будущем");
    if (circ.defectFoundDate && circ.purchaseDate && parseDate(circ.defectFoundDate) < parseDate(circ.purchaseDate)) errors.push("Шаг 5 — недостаток не может быть обнаружен раньше покупки");
  } else if (type === "course") {
    auditCourse(circ, selected, errors, warnings);
  } else if (type === "debt") {
    auditDebt(circ, selected, errors, warnings);
  }

  const evidence = Array.isArray(claimData.evidence) ? claimData.evidence : [];
  if (!evidence.length) errors.push("Шаг 6 — выберите доказательства или вариант «Нет доказательств»");
  if (evidence.includes("Нет доказательств") && evidence.length > 1) errors.push("Шаг 6 — «Нет доказательств» нельзя выбирать одновременно с другими доказательствами");

  if (claimData.mode === "collective" && claimData.collectiveFinalized) {
    const members = claimData.collectiveMembers || [];
    if (members.length < 2 && workers.length < 2) errors.push("Коллективная претензия должна содержать минимум двух заполненных заявителей");
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], passed: errors.length === 0 };
}

function amountPreview(claimData) {
  const type = normalizeCategoryId(claimData.type);
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
  const [message, setMessage] = useState("");
  const type = normalizeCategoryId(claimData.type);
  const rules = getCategoryRules(type);
  const requirements = useMemo(() => getSelectedRequirementTexts(type, claimData.selectedLegalOptions || []), [type, claimData.selectedLegalOptions]);
  const isCollective = claimData.mode === "collective";
  const memberCount = (claimData.collectiveMembers || []).length || claimData.workers?.length || 1;
  const price = isCollective && claimData.collectiveFinalized ? memberCount * COLLECTIVE_PRICE_PER : 800;

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
      setGenerated(true);
    } catch {
      setMessage("Не удалось сохранить документ. Проверьте данные и попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadPDF() {
    try {
      await generatePDF(claimData);
    } catch {
      setMessage("Не удалось сформировать PDF.");
    }
  }

  function downloadDOCX() {
    try {
      downloadBlob(buildDocxBlob(claimData), `pretenziya_${type}_${Date.now()}.docx`);
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
          {generated && <span style={{ color: "#86efac", border: "1px solid rgba(74,222,128,.25)", background: "rgba(74,222,128,.08)", borderRadius: 999, padding: "6px 10px", fontSize: ".75rem", fontWeight: 800 }}>ПРОВЕРЕНО</span>}
        </div>

        {message && <div style={{ marginTop: 16, color: "#fbbf24", fontSize: ".82rem" }}>{message}</div>}

        {!generated ? (
          <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
            {!audit && <button style={primary} onClick={check}>Проверить все данные</button>}
            {audit && (
              <>
                <div style={{ ...box, borderColor: audit.passed ? "rgba(74,222,128,.3)" : "rgba(244,63,94,.3)", background: audit.passed ? "rgba(74,222,128,.06)" : "rgba(244,63,94,.06)" }}>
                  <p style={{ color: audit.passed ? "#86efac" : "#fda4af", fontWeight: 800, margin: "0 0 8px" }}>{audit.passed ? "Все обязательные проверки пройдены" : "Нужно исправить данные"}</p>
                  {audit.errors.map(error => <p key={error} style={{ color: "#fecdd3", margin: "4px 0", fontSize: ".8rem" }}>• {error}</p>)}
                  {audit.warnings.map(warning => <p key={warning} style={{ color: "#fde68a", margin: "4px 0", fontSize: ".8rem" }}>⚠ {warning}</p>)}
                </div>

                <div style={box}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                    <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>Ответчик</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{claimData.employer?.name || "—"}</p></div>
                    <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>Заявителей</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{claimData.workers?.length || memberCount}</p></div>
                    <div><span style={{ color: "#64748b", fontSize: ".72rem" }}>Основная сумма</span><p style={{ color: "white", margin: "3px 0 0", fontSize: ".84rem" }}>{amountPreview(claimData) ? `${Number(amountPreview(claimData)).toLocaleString("ru-RU")} ₽` : "—"}</p></div>
                  </div>
                  <div style={{ marginTop: 12 }}><span style={{ color: "#64748b", fontSize: ".72rem" }}>Требования</span><p style={{ color: "#cbd5e1", margin: "4px 0 0", fontSize: ".8rem", lineHeight: 1.5 }}>{requirements.join("; ") || "Будут сформированы из выбранной ситуации"}</p></div>
                </div>

                {audit.passed && <label style={{ ...box, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} style={{ marginTop: 3, accentColor: "#0ea5e9" }} /><span style={{ color: "#dbeafe", fontSize: ".84rem" }}>Я проверил(а) сводку. Данные верны, документ можно формировать.</span></label>}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => { setAudit(null); setConfirmed(false); prevStep(); }} style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "white", cursor: "pointer" }}>Назад</button>
                  <button onClick={generate} disabled={!audit.passed || !confirmed || saving} style={{ ...primary, flex: 2, opacity: !audit.passed || !confirmed || saving ? .45 : 1, cursor: !audit.passed || !confirmed || saving ? "not-allowed" : "pointer" }}>{saving ? "Сохраняю…" : isCollective && !claimData.collectiveFinalized ? "Сохранить данные участника" : "Сформировать документ"}</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
            <div style={{ ...box, background: "white", padding: 0, overflow: "hidden", maxHeight: 620 }}>
              <iframe title="Предпросмотр претензии" srcDoc={buildHtml(claimData)} style={{ width: "100%", height: 620, border: 0, background: "white" }} />
            </div>
            <div style={{ ...box, background: "radial-gradient(circle at 90% 0%,rgba(139,92,246,.17),transparent 38%),rgba(15,23,42,.82)" }}>
              <p style={{ color: "white", fontWeight: 800, margin: "0 0 5px" }}>PDF + настоящий DOCX</p>
              <p style={{ color: "#94a3b8", fontSize: ".8rem", margin: "0 0 14px" }}>Файлы формируются из одной и той же проверенной версии документа.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button disabled={!paid} onClick={downloadPDF} style={{ padding: 12, borderRadius: 11, border: "1px solid rgba(248,113,113,.3)", background: paid ? "rgba(248,113,113,.1)" : "rgba(255,255,255,.03)", color: paid ? "#fca5a5" : "#64748b", fontWeight: 800, cursor: paid ? "pointer" : "not-allowed" }}>PDF</button>
                <button disabled={!paid} onClick={downloadDOCX} style={{ padding: 12, borderRadius: 11, border: "1px solid rgba(96,165,250,.3)", background: paid ? "rgba(96,165,250,.1)" : "rgba(255,255,255,.03)", color: paid ? "#93c5fd" : "#64748b", fontWeight: 800, cursor: paid ? "pointer" : "not-allowed" }}>DOCX</button>
              </div>
              {!paid && <button onClick={() => { window.open("https://t.me/+mxSPQZosRBAwMTMy", "_blank"); setTimeout(() => setPaid(true), 5000); }} style={{ ...primary, marginTop: 12 }}>Оплатить и скачать — {price.toLocaleString("ru-RU")} ₽</button>}
              {paid && <p style={{ color: "#86efac", textAlign: "center", margin: "12px 0 0", fontSize: ".82rem", fontWeight: 800 }}>Оплата отмечена. Скачивание доступно.</p>}
            </div>
            <button onClick={reset} style={{ padding: 11, borderRadius: 11, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>Создать новую претензию</button>
          </div>
        )}
      </div>
    </div>
  );
}
