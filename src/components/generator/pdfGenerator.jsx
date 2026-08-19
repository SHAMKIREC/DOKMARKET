/** Unified PDF/DOCX renderer for the four production claim directions. */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PizZip from "pizzip";
import {
  getEvidenceHints,
  getSelectedDocumentBlocks,
  getSelectedLegalReferences,
  getSelectedRequirementTexts,
  normalizeCategoryId,
} from "@/data/legalRules";

const RUB = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `${number.toLocaleString("ru-RU")} ₽` : "";
};

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").replace(/\s([,.;:])/g, "$1").trim();
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return clean(value);
  return date.toLocaleDateString("ru-RU");
}

export function normalizeLaborPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (digits.length === 10) digits = `7${digits}`;
  if (!/^7\d{10}$/.test(digits)) return clean(value);
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function normalizeLaborAddress(value) {
  return clean(value)
    .replace(/\bг\.?\s*/giu, "г. ")
    .replace(/\bул\.?\s*/giu, "ул. ")
    .replace(/\bд\.?\s*/giu, "д. ")
    .replace(/\bкв\.?\s*/giu, "кв. ")
    .replace(/\s*,\s*/g, ", ");
}

export function normalizeLaborText(value) {
  return clean(value)
    .replace(/\bработадател/giu, "работодател")
    .replace(/\bпритензи/giu, "претензи")
    .replace(/\bвыплоч/giu, "выплач");
}

export function declineApplicantName(value) {
  return clean(value);
}

export function normalizeCollectiveMember(member = {}) {
  const claimant = member.claimantData || member.claimData?.workers?.[0] || member.claimData?.claimant || member;
  return {
    fullName: clean(claimant.name || member.name),
    address: clean(claimant.address || member.address),
    phone: normalizeLaborPhone(claimant.phone || member.phone),
    email: clean(claimant.email || member.email),
    circumstances: member.circumstancesData || member.circumstances || member.claimData?.circumstances || {},
    evidence: member.evidenceData?.selected || member.evidence || member.claimData?.evidence || [],
  };
}

function selectedSet(claimData) {
  return new Set(claimData.selectedLegalOptions || []);
}

function remainingLabor(circ) {
  if (Number(circ.outstandingDebtAmount) > 0) return Number(circ.outstandingDebtAmount);
  const debt = Number(circ.debtAmount || 0);
  const paid = Number(circ.partialPaymentAmount || 0);
  return Math.max(0, debt - paid);
}

function remainingDebt(circ) {
  if (Number(circ.remainingDebtAmount) > 0) return Number(circ.remainingDebtAmount);
  return Math.max(0, Number(circ.debtAmount || 0) - Number(circ.returnedAmount || 0));
}

function getTitle(type, claimData) {
  const collective = claimData.mode === "collective" || (claimData.workers || []).length > 1;
  const prefix = collective ? "СОВМЕСТНАЯ ПРЕТЕНЗИЯ" : "ПРЕТЕНЗИЯ";
  if (type === "labor") return `${prefix} о защите трудовых прав`;
  if (type === "product") return `${prefix} в связи с недостатками товара`;
  if (type === "course") return `${prefix} по договору оказания услуг онлайн-обучения`;
  if (type === "debt") return `${prefix} о возврате задолженности`;
  return `${prefix} о досудебном урегулировании спора`;
}

function baseArticles(type, claimData) {
  const selected = selectedSet(claimData);
  if (type === "labor") {
    const articles = [];
    if (selected.has("no_employment_contract") || selected.has("actual_admission") || claimData.subtype === "no-employment-contract") {
      articles.push("ст. 16, 61 и 67 ТК РФ — возникновение и оформление трудовых отношений, включая фактический допуск к работе");
    }
    if (selected.has("salary_delayed") || claimData.subtype === "unpaid-wages") articles.push("ст. 136 ТК РФ — сроки выплаты заработной платы");
    if (selected.has("dismissal_not_paid") || claimData.subtype === "dismissal-payment") articles.push("ст. 140 ТК РФ — расчёт при увольнении");
    if (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || claimData.subtype === "unpaid-wages" || claimData.subtype === "dismissal-payment") {
      articles.push("ст. 236 ТК РФ — денежная компенсация за задержку причитающихся работнику выплат");
    }
    return articles;
  }
  if (type === "product") return ["ст. 18 Закона РФ «О защите прав потребителей» — права при обнаружении недостатков товара"];
  if (type === "course") return [
    "ст. 29 Закона РФ «О защите прав потребителей» — права потребителя при недостатках выполненной работы (оказанной услуги)",
    "ст. 32 Закона РФ «О защите прав потребителей» — право отказаться от договора оказания услуг при оплате фактически понесённых исполнителем расходов",
  ];
  if (type === "debt") return [
    "ст. 309 ГК РФ — обязательства должны исполняться надлежащим образом",
    "ст. 807 и 810 ГК РФ — договор займа и обязанность возвратить сумму займа",
  ];
  return [];
}

function buildDemands(type, claimData) {
  const circ = claimData.circumstances || {};
  const selected = selectedSet(claimData);
  const demands = [];

  if (type === "labor") {
    const outstanding = remainingLabor(circ);
    if (outstanding > 0) demands.push(`Выплатить задолженность по причитающимся работнику выплатам в размере ${RUB(outstanding)}.`);
    if (outstanding > 0 && (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || claimData.subtype === "unpaid-wages" || claimData.subtype === "dismissal-payment")) {
      demands.push("Выплатить денежную компенсацию по ст. 236 ТК РФ — не ниже 1/150 действующей в соответствующий период ключевой ставки Банка России от невыплаченной в срок суммы за каждый день задержки по день фактического расчёта включительно.");
    }
    if (selected.has("no_employment_contract") || selected.has("actual_admission") || claimData.subtype === "no-employment-contract") demands.push("Оформить трудовые отношения и документы в соответствии с фактическими обстоятельствами и требованиями трудового законодательства.");
    if (selected.has("dismissal_not_paid") || claimData.subtype === "dismissal-payment") demands.push("Произвести полный окончательный расчёт при увольнении.");
    demands.push("Предоставить письменный ответ на претензию способом, позволяющим подтвердить его получение.");
  }

  if (type === "product") {
    const amount = Number(circ.refundAmount || circ.purchaseAmount || 0);
    const demand = String(circ.consumerDemand || "").toLowerCase();
    if (demand.includes("замен") || selected.has("replacement_required")) demands.push(`Заменить товар «${clean(circ.productName) || "указанный товар"}» на товар надлежащего качества.`);
    else if (demand.includes("ремонт") || selected.has("repair_required")) demands.push(`Безвозмездно устранить недостатки товара «${clean(circ.productName) || "указанный товар"}».`);
    else if (demand.includes("уменьш") || selected.has("price_reduction_required")) demands.push("Соразмерно уменьшить покупную цену товара и вернуть соответствующую часть уплаченной суммы.");
    else demands.push(`Вернуть уплаченную за товар денежную сумму${amount > 0 ? ` в размере ${RUB(amount)}` : ""}.`);
    if (Number(circ.additionalExpensesAmount || 0) > 0) demands.push(`Возместить подтверждённые расходы в размере ${RUB(circ.additionalExpensesAmount)}.`);
    if (selected.has("penalty_required")) demands.push("Уплатить предусмотренную законом неустойку за нарушение установленного срока удовлетворения требования потребителя, если основания для её начисления наступили.");
    if (selected.has("moral_damage") && Number(circ.moralDamageAmount || 0) > 0) demands.push(`Компенсировать моральный вред в заявленном размере ${RUB(circ.moralDamageAmount)}.`);
    demands.push("Предоставить письменный мотивированный ответ в срок, установленный для соответствующего требования Законом РФ «О защите прав потребителей».");
  }

  if (type === "course") {
    const amount = Number(circ.refundAmount || circ.purchaseAmount || 0);
    if (selected.has("poor_quality_service")) {
      demands.push(`Удовлетворить требование в связи с недостатками услуги и вернуть денежные средства${amount > 0 ? ` в заявленном размере ${RUB(amount)}` : ""} в части, обоснованной обстоятельствами и законом.`);
    } else {
      demands.push(`Прекратить исполнение договора по заявлению потребителя и вернуть уплаченные денежные средства${amount > 0 ? `, исходя из суммы ${RUB(amount)}` : ""}, за вычетом только документально подтверждённых фактически понесённых исполнителем расходов, непосредственно связанных с исполнением договора.`);
    }
    if (selected.has("replacement_imposed")) demands.push("Не навязывать замену курса или дополнительные платные услуги без отдельного согласия потребителя.");
    if (selected.has("moral_damage") && Number(circ.moralDamageAmount || 0) > 0) demands.push(`Компенсировать моральный вред в размере ${RUB(circ.moralDamageAmount)}.`);
    demands.push("Предоставить расчёт удерживаемых фактически понесённых расходов, если исполнитель намерен уменьшить сумму возврата.");
    demands.push("Предоставить письменный мотивированный ответ на претензию.");
  }

  if (type === "debt") {
    const amount = remainingDebt(circ);
    const onDemand = selected.has("repayment_on_demand") || (!circ.repaymentDate && Boolean(circ.demandDate));
    if (onDemand) demands.push(`Возвратить сумму займа${amount > 0 ? ` в размере ${RUB(amount)}` : ""} в срок, предусмотренный п. 1 ст. 810 ГК РФ для займа без установленного срока, если договором не предусмотрено иное.`);
    else demands.push(`Возвратить задолженность${amount > 0 ? ` в размере ${RUB(amount)}` : ""}.`);
    if (selected.has("interest_required") || circ.interestRequired) demands.push("Уплатить проценты за неправомерное удержание денежных средств по ст. 395 ГК РФ, рассчитанные исходя из ключевой ставки Банка России, действовавшей в соответствующие периоды, если иной размер не установлен законом или договором.");
    demands.push("Предоставить письменный ответ с указанием даты и способа погашения задолженности.");
  }

  const fromRules = getSelectedRequirementTexts(type, claimData.selectedLegalOptions || []);
  return [...new Set([...demands, ...fromRules].map(clean).filter(Boolean))];
}

function describeCircumstances(type, claimData) {
  const circ = claimData.circumstances || {};
  const lines = [];
  if (type === "labor") {
    if (circ.workStart) lines.push(`Работа начата ${fmtDate(circ.workStart)}${circ.stillWorking ? " и продолжается по настоящее время" : circ.workEnd ? `, окончена ${fmtDate(circ.workEnd)}` : ""}.`);
    if (circ.workplace) lines.push(`Место выполнения работы: ${normalizeLaborAddress(circ.workplace)}.`);
    if (circ.supervisor) lines.push(`Непосредственный руководитель: ${clean(circ.supervisor)}.`);
    if (Number(circ.debtAmount || 0) > 0) lines.push(`Начислено, но не выплачено: ${RUB(circ.debtAmount)}${Number(circ.partialPaymentAmount || 0) > 0 ? `; частично выплачено ${RUB(circ.partialPaymentAmount)}; остаток ${RUB(remainingLabor(circ))}` : ""}.`);
  }
  if (type === "product") {
    lines.push(`Товар: ${clean(circ.productName) || "не указан"}${circ.purchaseDate ? `, приобретён ${fmtDate(circ.purchaseDate)}` : ""}${Number(circ.purchaseAmount || 0) > 0 ? ` за ${RUB(circ.purchaseAmount)}` : ""}.`);
    if (circ.defectDescription) lines.push(`Недостаток товара: ${clean(circ.defectDescription)}.`);
    if (circ.defectFoundDate) lines.push(`Недостаток обнаружен ${fmtDate(circ.defectFoundDate)}.`);
    if (circ.sellerRequestDate) lines.push(`К продавцу обращались ${fmtDate(circ.sellerRequestDate)}${circ.requestMethod ? ` способом: ${clean(circ.requestMethod)}` : ""}.`);
    if (circ.sellerResponse) lines.push(`Ответ продавца: ${clean(circ.sellerResponse)}.`);
  }
  if (type === "course") {
    lines.push(`Онлайн-курс: ${clean(circ.productName) || "не указан"}${circ.purchaseDate ? `, оплачен ${fmtDate(circ.purchaseDate)}` : ""}${Number(circ.purchaseAmount || 0) > 0 ? ` в размере ${RUB(circ.purchaseAmount)}` : ""}.`);
    if (circ.salesPromises) lines.push(`При продаже было заявлено: ${clean(circ.salesPromises)}.`);
    if (circ.actualResult) lines.push(`Фактически предоставлено: ${clean(circ.actualResult)}.`);
    if (circ.serviceDefects) lines.push(`Недостатки услуги: ${clean(circ.serviceDefects)}.`);
    if (circ.refundRequestDate) lines.push(`Требование о возврате направлено ${fmtDate(circ.refundRequestDate)}.`);
    if (circ.supportResponse) lines.push(`Ответ исполнителя: ${clean(circ.supportResponse)}.`);
    if (circ.creditOrInstallment) lines.push("Оплата курса производилась с использованием кредита или рассрочки.");
  }
  if (type === "debt") {
    if (circ.contractType || circ.contractDate) lines.push(`${clean(circ.contractType) || "Обязательство"}${circ.contractNumber ? ` № ${clean(circ.contractNumber)}` : ""}${circ.contractDate ? ` от ${fmtDate(circ.contractDate)}` : ""}.`);
    if (circ.moneyTransferDate) lines.push(`Денежные средства переданы ${fmtDate(circ.moneyTransferDate)}${circ.transferMethod ? ` способом: ${clean(circ.transferMethod)}` : ""}.`);
    if (Number(circ.debtAmount || 0) > 0) lines.push(`Исходная сумма долга: ${RUB(circ.debtAmount)}${Number(circ.returnedAmount || 0) > 0 ? `; возвращено ${RUB(circ.returnedAmount)}; остаток ${RUB(remainingDebt(circ))}` : ""}.`);
    if (circ.repaymentDate) lines.push(`Согласованный срок возврата: ${fmtDate(circ.repaymentDate)}.`);
    else if (circ.demandDate) lines.push(`Срок возврата заранее не определён; требование о возврате направлено ${fmtDate(circ.demandDate)}.`);
    if (circ.debtorResponse) lines.push(`Ответ должника: ${clean(circ.debtorResponse)}.`);
  }
  if (circ.description) lines.push(clean(circ.description));
  return lines.filter(Boolean);
}

function applicantRows(claimData) {
  const workers = claimData.workers || [];
  if (workers.length) return workers.map(worker => ({ name: clean(worker.name), address: clean(worker.address), phone: normalizeLaborPhone(worker.phone), email: clean(worker.email) }));
  return (claimData.collectiveMembers || []).map(member => normalizeCollectiveMember(member)).map(member => ({ name: member.fullName, address: member.address, phone: member.phone, email: member.email }));
}

function getApplications(type, claimData) {
  const selected = claimData.selectedLegalOptions || [];
  const evidence = (claimData.evidence || []).filter(item => item && item !== "Нет доказательств");
  return [...new Set([...evidence, ...getEvidenceHints(type, selected)].map(clean).filter(Boolean))];
}

export function buildHtml(claimData) {
  const type = normalizeCategoryId(claimData.type);
  const respondent = claimData.employer || {};
  const applicants = applicantRows(claimData);
  const articles = [...new Set([...baseArticles(type, claimData), ...getSelectedLegalReferences(type, claimData.selectedLegalOptions || [])])];
  const demands = buildDemands(type, claimData);
  const facts = describeCircumstances(type, claimData);
  const blocks = getSelectedDocumentBlocks(type, claimData.selectedLegalOptions || []);
  const applications = getApplications(type, claimData);
  const date = new Date().toLocaleDateString("ru-RU");

  const p = text => `<p>${esc(text)}</p>`;
  const li = text => `<li>${esc(text)}</li>`;
  const applicantHtml = applicants.map((a, index) => `<div class="applicant"><b>${applicants.length > 1 ? `Заявитель ${index + 1}` : "Заявитель"}: ${esc(a.name || "___")}</b><br>${esc(a.address || "адрес не указан")}<br>${esc(a.phone || "телефон не указан")}${a.email ? `<br>${esc(a.email)}` : ""}</div>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#111;background:white;margin:0;padding:36px 44px;font-size:12.5px;line-height:1.65}
    .head{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:26px}.to{border-left:2px solid #111;padding-left:16px}.applicant{margin-bottom:10px}
    h1{text-align:center;font-size:17px;line-height:1.35;margin:26px 0 20px;text-transform:uppercase}h2{font-size:13px;margin:20px 0 8px;text-transform:uppercase}
    p{margin:0 0 8px;text-align:justify}ol,ul{padding-left:22px;margin:6px 0 12px}li{margin:0 0 6px}.sign{display:flex;justify-content:space-between;margin-top:30px}.note{font-size:10.5px;color:#555;border-top:1px solid #ccc;padding-top:10px;margin-top:24px}
    @media(max-width:650px){body{padding:24px}.head{grid-template-columns:1fr}}
  </style></head><body>
    <div class="head"><div>${applicantHtml || "Заявитель: ___"}</div><div class="to"><b>Кому:</b> ${esc(respondent.name || "___")}<br>${esc(respondent.address || "адрес не указан")}${respondent.inn ? `<br>ИНН: ${esc(respondent.inn)}` : ""}${respondent.ogrn ? `<br>ОГРН/ОГРНИП: ${esc(respondent.ogrn)}` : ""}</div></div>
    <h1>${esc(getTitle(type, claimData))}</h1>
    <h2>Обстоятельства</h2>${facts.map(p).join("") || p("Обстоятельства изложены заявителем в анкете.")}
    ${blocks.length ? `<h2>Юридически значимые обстоятельства</h2>${blocks.map(p).join("")}` : ""}
    <h2>Правовое обоснование</h2>${articles.length ? `<ul>${articles.map(li).join("")}</ul>` : p("Правовое основание определяется с учётом договора и фактических обстоятельств.")}
    <h2>Требования</h2><ol>${demands.map(li).join("")}</ol>
    ${type === "course" ? p("Если требование основано только на отказе от дальнейшего исполнения договора услуг, сумма возврата определяется с учётом документально подтверждённых фактически понесённых исполнителем расходов, непосредственно связанных с исполнением договора.") : ""}
    ${type === "debt" && !claimData.circumstances?.repaymentDate ? p("Если срок возврата займа договором не установлен или определён моментом востребования, применяется срок, предусмотренный п. 1 ст. 810 ГК РФ, если договором не установлено иное.") : ""}
    <h2>Приложения</h2>${applications.length ? `<ol>${applications.map(li).join("")}</ol>` : p("Документы и иные доказательства прилагаются при их наличии.")}
    <div class="sign"><span>Дата: ${esc(date)}</span><span>Подпись: __________________</span></div>
    <div class="note">Документ сформирован автоматически по сведениям пользователя. Перед отправкой проверьте фактические данные, суммы, даты и выбранные требования.</div>
  </body></html>`;
}

function htmlText(claimData) {
  const type = normalizeCategoryId(claimData.type);
  const respondent = claimData.employer || {};
  const applicants = applicantRows(claimData);
  const articles = [...new Set([...baseArticles(type, claimData), ...getSelectedLegalReferences(type, claimData.selectedLegalOptions || [])])];
  const demands = buildDemands(type, claimData);
  const facts = describeCircumstances(type, claimData);
  const applications = getApplications(type, claimData);
  const lines = [];
  lines.push(getTitle(type, claimData));
  lines.push("");
  lines.push(`Ответчик: ${clean(respondent.name) || "___"}`);
  if (respondent.address) lines.push(`Адрес: ${clean(respondent.address)}`);
  lines.push("");
  applicants.forEach((a, i) => {
    lines.push(`${applicants.length > 1 ? `Заявитель ${i + 1}` : "Заявитель"}: ${a.name || "___"}`);
    if (a.address) lines.push(`Адрес: ${a.address}`);
    if (a.phone) lines.push(`Телефон: ${a.phone}`);
    if (a.email) lines.push(`Email: ${a.email}`);
  });
  lines.push("", "ОБСТОЯТЕЛЬСТВА"); facts.forEach(item => lines.push(item));
  lines.push("", "ПРАВОВОЕ ОБОСНОВАНИЕ"); articles.forEach(item => lines.push(`• ${item}`));
  lines.push("", "ТРЕБОВАНИЯ"); demands.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
  lines.push("", "ПРИЛОЖЕНИЯ"); applications.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
  lines.push("", `Дата: ${new Date().toLocaleDateString("ru-RU")}`, "Подпись: __________________");
  return lines;
}

function xmlParagraph(text, bold = false) {
  const safe = esc(text);
  return `<w:p><w:pPr><w:spacing w:after="100" w:line="320" w:lineRule="auto"/></w:pPr><w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
}

export function buildDocxBlob(claimData) {
  const lines = htmlText(claimData);
  const title = lines.shift() || "ПРЕТЕНЗИЯ";
  const body = [xmlParagraph(title, true), ...lines.map(line => xmlParagraph(line, /^[А-ЯЁ0-9 .-]{5,}$/.test(line)))].join("");
  const zip = new PizZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  const word = zip.folder("word");
  word.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`);
  word.file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`);
  word.folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
}

export async function generatePDF(claimData) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "white";
  container.innerHTML = buildHtml(claimData);
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 1.7, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imageWidth = pageWidth - margin * 2;
    const imageHeight = canvas.height * imageWidth / canvas.width;
    const image = canvas.toDataURL("image/jpeg", 0.95);
    let heightLeft = imageHeight;
    let position = margin;
    pdf.addImage(image, "JPEG", margin, position, imageWidth, imageHeight);
    heightLeft -= pageHeight - margin * 2;
    while (heightLeft > 0) {
      position = margin - (imageHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(image, "JPEG", margin, position, imageWidth, imageHeight);
      heightLeft -= pageHeight - margin * 2;
    }
    const blob = pdf.output("blob");
    pdf.save(`pretenziya_${normalizeCategoryId(claimData.type)}_${Date.now()}.pdf`);
    return { sizeBytes: blob.size, exceedsRecommendedSize: blob.size > 5 * 1024 * 1024 };
  } finally {
    container.remove();
  }
}
