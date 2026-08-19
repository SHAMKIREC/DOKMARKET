/**
 * Единый production-генератор PDF/DOCX для 4 направлений Досудебки.
 * Один и тот же document model используется для предпросмотра, PDF и DOCX.
 * В коллективном режиме каждый участник сохраняет собственные обстоятельства,
 * суммы, доказательства и требования внутри одного совместного документа.
 */
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
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s([,.;:])/g, "$1")
    .trim();
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

// Оставлено как совместимый экспорт для старых импортов.
export function declineApplicantName(value) {
  return clean(value);
}

export function normalizeCollectiveMember(member = {}) {
  const claimant = member.claimantData || member.claimData?.workers?.[0] || member.claimData?.claimant || member;
  const evidenceData = member.evidenceData || member.claimData?.evidenceData || {};
  return {
    id: member.participantId || member.id || "",
    fullName: clean(claimant.name || member.name),
    address: normalizeLaborAddress(claimant.address || member.address),
    phone: normalizeLaborPhone(claimant.phone || member.phone),
    email: clean(claimant.email || member.email),
    circumstances: member.circumstancesData || member.circumstances || member.claimData?.circumstances || {},
    evidence: Array.isArray(evidenceData.selected)
      ? evidenceData.selected
      : Array.isArray(member.evidence)
        ? member.evidence
        : Array.isArray(member.claimData?.evidence)
          ? member.claimData.evidence
          : [],
    selectedLegalOptions: Array.isArray(member.selectedLegalOptions)
      ? member.selectedLegalOptions
      : Array.isArray(member.claimData?.selectedLegalOptions)
        ? member.claimData.selectedLegalOptions
        : [],
    subtype: member.subtype || member.claimData?.subtype || "",
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

function isCollective(claimData) {
  return claimData.mode === "collective" || (claimData.collectiveMembers || []).length > 1 || (claimData.workers || []).length > 1;
}

function getTitle(type, claimData) {
  const prefix = isCollective(claimData) ? "СОВМЕСТНАЯ ПРЕТЕНЗИЯ" : "ПРЕТЕНЗИЯ";
  if (type === "labor") return `${prefix} о защите трудовых прав`;
  if (type === "product") return `${prefix} в связи с недостатками товара`;
  if (type === "course") return `${prefix} по договору оказания услуг онлайн-обучения`;
  if (type === "debt") return `${prefix} о возврате задолженности`;
  return `${prefix} о досудебном урегулировании спора`;
}

function baseArticles(type, claimData) {
  const selected = selectedSet(claimData);
  const articles = [];

  if (type === "labor") {
    if (selected.has("no_employment_contract") || selected.has("actual_admission") || claimData.subtype === "no-employment-contract") {
      articles.push("ст. 16, 61 и 67 ТК РФ — возникновение и оформление трудовых отношений, включая фактический допуск к работе");
    }
    if (selected.has("salary_delayed") || selected.has("salary_over_two_months") || claimData.subtype === "unpaid-wages") {
      articles.push("ст. 136 ТК РФ — сроки и порядок выплаты заработной платы");
    }
    if (selected.has("dismissal_not_paid") || claimData.subtype === "dismissal-payment") {
      articles.push("ст. 140 ТК РФ — сроки окончательного расчёта при увольнении");
    }
    if (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || selected.has("salary_over_two_months") || claimData.subtype === "unpaid-wages" || claimData.subtype === "dismissal-payment") {
      articles.push("ст. 236 ТК РФ — денежная компенсация за задержку причитающихся работнику выплат");
    }
  }

  if (type === "product") {
    articles.push("ст. 18 Закона РФ «О защите прав потребителей» — права потребителя при обнаружении недостатков товара");
    if (selected.has("penalty_required")) articles.push("ст. 23 Закона РФ «О защите прав потребителей» — неустойка за нарушение отдельных сроков удовлетворения требований потребителя");
    if (selected.has("moral_damage")) articles.push("ст. 15 Закона РФ «О защите прав потребителей» — компенсация морального вреда");
  }

  if (type === "course") {
    const poorQuality = selected.has("poor_quality_service") || selected.has("substantial_defects") || selected.has("promises_not_met");
    const withdrawal = selected.has("voluntary_withdrawal") || !poorQuality;
    if (poorQuality) articles.push("ст. 29 Закона РФ «О защите прав потребителей» — права потребителя при недостатках выполненной работы (оказанной услуги)");
    if (withdrawal) articles.push("ст. 32 Закона РФ «О защите прав потребителей» — право потребителя отказаться от договора оказания услуг при оплате фактически понесённых исполнителем расходов");
    if (selected.has("extra_service_imposed")) articles.push("ст. 16 Закона РФ «О защите прав потребителей» — недопустимые условия договора и навязывание дополнительных услуг");
    if (selected.has("moral_damage")) articles.push("ст. 15 Закона РФ «О защите прав потребителей» — компенсация морального вреда");
  }

  if (type === "debt") {
    articles.push("ст. 309 ГК РФ — обязательства должны исполняться надлежащим образом");
    articles.push("ст. 807 и 810 ГК РФ — договор займа и обязанность возвратить сумму займа");
    if (selected.has("interest_required") || claimData.circumstances?.interestRequired) {
      articles.push("ст. 395 ГК РФ — проценты за пользование чужими денежными средствами при наличии предусмотренных законом оснований");
    }
  }

  return articles;
}

function buildDemands(type, claimData) {
  const circ = claimData.circumstances || {};
  const selected = selectedSet(claimData);
  const demands = [];

  if (type === "labor") {
    const outstanding = remainingLabor(circ);
    if (outstanding > 0) demands.push(`Выплатить задолженность по причитающимся выплатам в размере ${RUB(outstanding)}.`);
    if (outstanding > 0 && (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || selected.has("salary_over_two_months") || claimData.subtype === "unpaid-wages" || claimData.subtype === "dismissal-payment")) {
      demands.push("Выплатить денежную компенсацию по ст. 236 ТК РФ — не ниже 1/150 действующей в соответствующий период ключевой ставки Банка России от невыплаченной в срок суммы за каждый день задержки по день фактического расчёта включительно.");
    }
    if (selected.has("no_employment_contract") || selected.has("actual_admission") || claimData.subtype === "no-employment-contract") {
      demands.push("Оформить трудовые отношения и связанные документы в соответствии с фактическими обстоятельствами и требованиями трудового законодательства.");
    }
    if (selected.has("dismissal_not_paid") || claimData.subtype === "dismissal-payment") demands.push("Произвести полный окончательный расчёт при увольнении.");
  }

  if (type === "product") {
    const amount = Number(circ.refundAmount || circ.purchaseAmount || 0);
    const demand = String(circ.consumerDemand || "").toLowerCase();
    if (demand.includes("замен") || selected.has("replacement_required")) {
      demands.push(`Заменить товар «${clean(circ.productName) || "указанный товар"}» на товар надлежащего качества.`);
    } else if (demand.includes("ремонт") || selected.has("repair_required")) {
      demands.push(`Безвозмездно устранить недостатки товара «${clean(circ.productName) || "указанный товар"}» в установленный законом срок.`);
    } else if (demand.includes("уменьш") || selected.has("price_reduction_required")) {
      demands.push("Соразмерно уменьшить покупную цену товара и вернуть соответствующую часть уплаченной суммы.");
    } else {
      demands.push(`Вернуть уплаченную за товар денежную сумму${amount > 0 ? ` в размере ${RUB(amount)}` : ""}.`);
    }
    if (Number(circ.additionalExpensesAmount || 0) > 0) demands.push(`Возместить подтверждённые расходы в размере ${RUB(circ.additionalExpensesAmount)}.`);
    if (selected.has("penalty_required")) demands.push("Уплатить предусмотренную законом неустойку, если срок удовлетворения соответствующего требования нарушен и имеются основания для её начисления.");
    if (selected.has("moral_damage") && Number(circ.moralDamageAmount || 0) > 0) demands.push(`Компенсировать моральный вред в размере ${RUB(circ.moralDamageAmount)}.`);
  }

  if (type === "course") {
    const amount = Number(circ.refundAmount || circ.purchaseAmount || 0);
    const poorQuality = selected.has("poor_quality_service") || selected.has("substantial_defects") || selected.has("promises_not_met") || Boolean(circ.serviceDefects);
    const voluntary = selected.has("voluntary_withdrawal") || !poorQuality;

    if (poorQuality) {
      demands.push(`Удовлетворить законное требование в связи с недостатками услуги${amount > 0 ? ` с учётом заявленной суммы ${RUB(amount)}` : ""} и фактического объёма оказанной услуги.`);
    }
    if (voluntary) {
      demands.push(`Прекратить исполнение договора по заявлению потребителя и возвратить подлежащие возврату денежные средства${amount > 0 ? ` исходя из заявленной суммы ${RUB(amount)}` : ""}, за вычетом только документально подтверждённых фактически понесённых исполнителем расходов, непосредственно связанных с исполнением конкретного договора.`);
    }
    if (selected.has("extra_service_imposed")) demands.push("Вернуть денежные средства, уплаченные за навязанную либо подключённую без надлежащего согласия дополнительную услугу, при наличии такого платежа.");
    if (selected.has("moral_damage") && Number(circ.moralDamageAmount || 0) > 0) demands.push(`Компенсировать моральный вред в размере ${RUB(circ.moralDamageAmount)}.`);
    demands.push("Если из суммы возврата удерживаются расходы исполнителя — предоставить их конкретный документально подтверждённый расчёт.");
  }

  if (type === "debt") {
    const amount = remainingDebt(circ);
    const onDemand = selected.has("no_due_date") || (!circ.repaymentDate && Boolean(circ.demandDate));
    if (onDemand) {
      demands.push(`Возвратить сумму займа${amount > 0 ? ` в размере ${RUB(amount)}` : ""} в срок, предусмотренный п. 1 ст. 810 ГК РФ для займа без установленного срока или до востребования, если договором не установлен иной срок.`);
    } else {
      demands.push(`Возвратить задолженность${amount > 0 ? ` в размере ${RUB(amount)}` : ""}.`);
    }
    if (selected.has("interest_required") || circ.interestRequired) {
      demands.push("Уплатить проценты по ст. 395 ГК РФ при наличии оснований, рассчитанные с учётом ключевой ставки Банка России, действовавшей в соответствующие периоды, если иной размер не установлен законом или договором.");
    }
  }

  const fromRules = getSelectedRequirementTexts(type, claimData.selectedLegalOptions || []);
  demands.push(...fromRules);
  demands.push("Предоставить письменный мотивированный ответ способом, позволяющим подтвердить его получение.");
  return [...new Set(demands.map(clean).filter(Boolean))];
}

function describeCircumstances(type, claimData) {
  const circ = claimData.circumstances || {};
  const lines = [];

  if (type === "labor") {
    if (circ.workStart) lines.push(`Работа начата ${fmtDate(circ.workStart)}${circ.stillWorking ? " и продолжается по настоящее время" : circ.workEnd ? `, окончена ${fmtDate(circ.workEnd)}` : ""}.`);
    if (circ.workplace) lines.push(`Место выполнения работы: ${normalizeLaborAddress(circ.workplace)}.`);
    if (circ.supervisor) lines.push(`Непосредственный руководитель: ${clean(circ.supervisor)}.`);
    if (circ.dueDate) lines.push(`Плановая дата выплаты: ${fmtDate(circ.dueDate)}.`);
    if (Number(circ.debtAmount || 0) > 0) {
      lines.push(`Начислено, но не выплачено: ${RUB(circ.debtAmount)}${Number(circ.partialPaymentAmount || 0) > 0 ? `; частично выплачено ${RUB(circ.partialPaymentAmount)}; остаток ${RUB(remainingLabor(circ))}` : ""}.`);
    }
    if (circ.dismissalDate) lines.push(`Дата увольнения: ${fmtDate(circ.dismissalDate)}.`);
  }

  if (type === "product") {
    lines.push(`Товар: ${clean(circ.productName) || "не указан"}${circ.purchaseDate ? `, приобретён ${fmtDate(circ.purchaseDate)}` : ""}${Number(circ.purchaseAmount || 0) > 0 ? ` за ${RUB(circ.purchaseAmount)}` : ""}.`);
    if (circ.defectDescription) lines.push(`Недостаток товара: ${clean(circ.defectDescription)}.`);
    if (circ.defectFoundDate) lines.push(`Недостаток обнаружен ${fmtDate(circ.defectFoundDate)}.`);
    if (circ.sellerRequestDate) lines.push(`К продавцу обращались ${fmtDate(circ.sellerRequestDate)}${circ.requestMethod ? ` способом: ${clean(circ.requestMethod)}` : ""}.`);
    if (circ.sellerResponse) lines.push(`Ответ продавца: ${clean(circ.sellerResponse)}.`);
    if (circ.isTechnicallyComplex) lines.push("Заявитель указал, что товар относится к технически сложным; применимость возврата или замены после 15 дней оценивается с учётом оснований, предусмотренных ст. 18 Закона РФ «О защите прав потребителей». ");
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
    else if (circ.demandDate) lines.push(`Срок возврата заранее не определён; требование о возврате предъявлено ${fmtDate(circ.demandDate)}.`);
    if (circ.debtorResponse) lines.push(`Ответ должника: ${clean(circ.debtorResponse)}.`);
  }

  if (circ.description) lines.push(type === "labor" ? normalizeLaborText(circ.description) : clean(circ.description));
  return lines.filter(Boolean);
}

function normalizeApplicant(worker = {}) {
  return {
    name: clean(worker.name),
    address: normalizeLaborAddress(worker.address),
    phone: normalizeLaborPhone(worker.phone),
    email: clean(worker.email),
  };
}

function makeMemberClaimData(base, member, index) {
  const normalized = normalizeCollectiveMember(member);
  const workerFallback = (base.workers || [])[index] || {};
  const claimant = {
    name: normalized.fullName || clean(workerFallback.name),
    address: normalized.address || normalizeLaborAddress(workerFallback.address),
    phone: normalized.phone || normalizeLaborPhone(workerFallback.phone),
    email: normalized.email || clean(workerFallback.email),
  };
  return {
    ...base,
    mode: "individual",
    workers: [claimant],
    claimant,
    circumstances: normalized.circumstances && Object.keys(normalized.circumstances).length
      ? normalized.circumstances
      : (index === 0 ? base.circumstances || {} : {}),
    evidence: normalized.evidence?.length ? normalized.evidence : (index === 0 ? base.evidence || [] : []),
    selectedLegalOptions: normalized.selectedLegalOptions?.length ? normalized.selectedLegalOptions : base.selectedLegalOptions || [],
    subtype: normalized.subtype || base.subtype || "",
  };
}

function participantClaims(claimData) {
  const members = claimData.collectiveMembers || [];
  if (isCollective(claimData) && members.length) return members.map((member, index) => makeMemberClaimData(claimData, member, index));
  const workers = claimData.workers || [];
  if (workers.length > 1) {
    return workers.map((worker, index) => ({
      ...claimData,
      mode: "individual",
      workers: [worker],
      claimant: worker,
      circumstances: index === 0 ? claimData.circumstances || {} : worker.circumstances || claimData.circumstances || {},
      evidence: worker.evidence || claimData.evidence || [],
      selectedLegalOptions: worker.selectedLegalOptions || claimData.selectedLegalOptions || [],
    }));
  }
  return [{ ...claimData, workers: [workers[0] || claimData.claimant || {}] }];
}

function getApplications(type, memberClaim) {
  const selected = memberClaim.selectedLegalOptions || [];
  const evidence = (memberClaim.evidence || []).filter(item => item && item !== "Нет доказательств");
  const hints = evidence.length ? getEvidenceHints(type, selected) : [];
  return [...new Set([...evidence, ...hints].map(clean).filter(Boolean))];
}

function buildDocumentModel(claimData) {
  const type = normalizeCategoryId(claimData.type);
  const respondent = claimData.employer || claimData.respondent || {};
  const claims = participantClaims(claimData);
  const participants = claims.map((memberClaim, index) => {
    const applicant = normalizeApplicant(memberClaim.workers?.[0] || memberClaim.claimant || {});
    const facts = describeCircumstances(type, memberClaim);
    const articles = [...new Set([
      ...baseArticles(type, memberClaim),
      ...getSelectedLegalReferences(type, memberClaim.selectedLegalOptions || []),
    ].map(clean).filter(Boolean))];
    const demands = buildDemands(type, memberClaim);
    const blocks = getSelectedDocumentBlocks(type, memberClaim.selectedLegalOptions || []);
    const applications = getApplications(type, memberClaim);
    return { index, applicant, facts, articles, demands, blocks, applications };
  });

  const articles = [...new Set(participants.flatMap(item => item.articles))];
  const allApplications = [...new Set(participants.flatMap(item => item.applications))];
  return {
    type,
    title: getTitle(type, claimData),
    respondent,
    participants,
    articles,
    allApplications,
    collective: participants.length > 1 || isCollective(claimData),
  };
}

export function buildHtml(claimData) {
  const model = buildDocumentModel(claimData);
  const { type, title, respondent, participants, articles, collective } = model;
  const date = new Date().toLocaleDateString("ru-RU");
  const p = text => `<p>${esc(text)}</p>`;
  const li = text => `<li>${esc(text)}</li>`;

  const applicantHtml = participants.map((item, index) => {
    const a = item.applicant;
    return `<div class="applicant"><b>${participants.length > 1 ? `Заявитель ${index + 1}` : "Заявитель"}: ${esc(a.name || "___")}</b><br>${esc(a.address || "адрес не указан")}<br>${esc(a.phone || "телефон не указан")}${a.email ? `<br>${esc(a.email)}` : ""}</div>`;
  }).join("");

  const participantSections = participants.map((item, index) => {
    const label = participants.length > 1 ? `Заявитель ${index + 1}: ${item.applicant.name || "___"}` : "Обстоятельства";
    const facts = item.facts.length ? item.facts.map(p).join("") : p("Обстоятельства изложены заявителем в анкете.");
    const blocks = item.blocks.length ? `<h3>Юридически значимые обстоятельства</h3>${item.blocks.map(p).join("")}` : "";
    const demands = item.demands.length ? `<ol>${item.demands.map(li).join("")}</ol>` : p("Требование определяется с учётом указанных обстоятельств.");
    const apps = item.applications.length ? `<ol>${item.applications.map(li).join("")}</ol>` : p("Документы и иные доказательства прилагаются при наличии.");
    return `<section class="participant"><h2>${esc(label)}</h2>${facts}${blocks}<h3>Требования ${participants.length > 1 ? "этого заявителя" : ""}</h3>${demands}<h3>Доказательства и приложения ${participants.length > 1 ? "этого заявителя" : ""}</h3>${apps}</section>`;
  }).join("");

  const specialNote = type === "course"
    ? p("При обычном отказе от дальнейшего исполнения договора оказания услуг сумма возврата определяется с учётом документально подтверждённых фактически понесённых исполнителем расходов, непосредственно связанных с исполнением конкретного договора. Требования из-за недостатков услуги оцениваются отдельно.")
    : type === "debt"
      ? p("Если срок возврата займа договором не установлен или определён моментом востребования, применяется правило п. 1 ст. 810 ГК РФ, если договором не установлен иной срок.")
      : type === "product"
        ? p("Для технически сложного товара возврат или замена после 15 дней со дня передачи возможны при наличии предусмотренных законом специальных оснований; выбранное требование должно соответствовать фактическим обстоятельствам.")
        : "";

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;color:#111;background:white;margin:0;padding:36px 44px;font-size:12.5px;line-height:1.65}
    .head{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:26px}.to{border-left:2px solid #111;padding-left:16px}.applicant{margin-bottom:10px}
    h1{text-align:center;font-size:17px;line-height:1.35;margin:26px 0 20px;text-transform:uppercase}h2{font-size:13px;margin:20px 0 8px;text-transform:uppercase}h3{font-size:12.5px;margin:16px 0 7px}
    p{margin:0 0 8px;text-align:justify}ol,ul{padding-left:22px;margin:6px 0 12px}li{margin:0 0 6px}.participant{padding:0 0 14px;margin:0 0 10px;border-bottom:1px solid #e5e7eb}.participant:last-of-type{border-bottom:0}
    .signatures{margin-top:26px}.signature-row{display:grid;grid-template-columns:1fr 150px;gap:20px;margin:12px 0}.note{font-size:10.5px;color:#555;border-top:1px solid #ccc;padding-top:10px;margin-top:24px}
    @media(max-width:650px){body{padding:24px}.head{grid-template-columns:1fr}.signature-row{grid-template-columns:1fr}}
  </style></head><body>
    <div class="head"><div>${applicantHtml || "Заявитель: ___"}</div><div class="to"><b>Кому:</b> ${esc(respondent.name || "___")}<br>${esc(respondent.address || "адрес не указан")}${respondent.inn ? `<br>ИНН: ${esc(respondent.inn)}` : ""}${respondent.ogrn ? `<br>ОГРН/ОГРНИП: ${esc(respondent.ogrn)}` : ""}</div></div>
    <h1>${esc(title)}</h1>
    ${collective ? p(`Настоящая совместная претензия объединяет требования ${participants.length} заявителей к одному ответчику. Обстоятельства и требования каждого заявителя приведены отдельно.`) : ""}
    ${participantSections}
    <h2>Общее правовое обоснование</h2>${articles.length ? `<ul>${articles.map(li).join("")}</ul>` : p("Правовое основание определяется с учётом договора и фактических обстоятельств.")}
    ${specialNote}
    <div class="signatures"><h2>Дата и подписи</h2>${participants.map(item => `<div class="signature-row"><span>${esc(item.applicant.name || "Заявитель")}</span><span>__________________</span></div>`).join("")}<p>Дата: ${esc(date)}</p></div>
    <div class="note">Документ сформирован автоматически по сведениям пользователей. Перед отправкой каждый заявитель должен проверить свои фактические данные, суммы, даты, доказательства и выбранные требования.</div>
  </body></html>`;
}

function documentTextLines(claimData) {
  const model = buildDocumentModel(claimData);
  const lines = [model.title, "", `Ответчик: ${clean(model.respondent.name) || "___"}`];
  if (model.respondent.address) lines.push(`Адрес: ${clean(model.respondent.address)}`);
  if (model.respondent.inn) lines.push(`ИНН: ${clean(model.respondent.inn)}`);
  if (model.respondent.ogrn) lines.push(`ОГРН/ОГРНИП: ${clean(model.respondent.ogrn)}`);

  lines.push("");
  model.participants.forEach((item, index) => {
    const a = item.applicant;
    lines.push(`${model.participants.length > 1 ? `ЗАЯВИТЕЛЬ ${index + 1}` : "ЗАЯВИТЕЛЬ"}: ${a.name || "___"}`);
    if (a.address) lines.push(`Адрес: ${a.address}`);
    if (a.phone) lines.push(`Телефон: ${a.phone}`);
    if (a.email) lines.push(`Email: ${a.email}`);
    lines.push("", "ОБСТОЯТЕЛЬСТВА");
    item.facts.forEach(fact => lines.push(fact));
    if (item.blocks.length) {
      lines.push("", "ЮРИДИЧЕСКИ ЗНАЧИМЫЕ ОБСТОЯТЕЛЬСТВА");
      item.blocks.forEach(block => lines.push(block));
    }
    lines.push("", "ТРЕБОВАНИЯ");
    item.demands.forEach((demand, demandIndex) => lines.push(`${demandIndex + 1}. ${demand}`));
    lines.push("", "ДОКАЗАТЕЛЬСТВА И ПРИЛОЖЕНИЯ");
    if (item.applications.length) item.applications.forEach((application, appIndex) => lines.push(`${appIndex + 1}. ${application}`));
    else lines.push("Документы и иные доказательства прилагаются при наличии.");
    lines.push("");
  });

  lines.push("ОБЩЕЕ ПРАВОВОЕ ОБОСНОВАНИЕ");
  model.articles.forEach(article => lines.push(`• ${article}`));
  lines.push("", "ДАТА И ПОДПИСИ");
  model.participants.forEach(item => lines.push(`${item.applicant.name || "Заявитель"}: __________________`));
  lines.push(`Дата: ${new Date().toLocaleDateString("ru-RU")}`);
  lines.push("", "Документ сформирован автоматически по сведениям пользователей. Перед отправкой проверьте фактические данные, суммы, даты и требования.");
  return lines;
}

function xmlParagraph(text, bold = false) {
  const safe = esc(text);
  const pPr = `<w:pPr><w:spacing w:after="100" w:line="320" w:lineRule="auto"/></w:pPr>`;
  const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`;
}

export function buildDocxBlob(claimData) {
  const lines = documentTextLines(claimData);
  const title = lines.shift() || "ПРЕТЕНЗИЯ";
  const body = [
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="30"/></w:rPr><w:t>${esc(title)}</w:t></w:r></w:p>`,
    ...lines.map(line => xmlParagraph(line, /^(ЗАЯВИТЕЛЬ|ОБСТОЯТЕЛЬСТВА|ТРЕБОВАНИЯ|ДОКАЗАТЕЛЬСТВА|ОБЩЕЕ ПРАВОВОЕ|ЮРИДИЧЕСКИ|ДАТА И ПОДПИСИ)/.test(line))),
  ].join("");

  const zip = new PizZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  const word = zip.folder("word");
  word.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`);
  word.file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`);
  word.folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
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
    const canvas = await html2canvas(container, {
      scale: 1.7,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 900,
    });
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
    const mode = isCollective(claimData) ? "collective" : "solo";
    pdf.save(`pretenziya_${normalizeCategoryId(claimData.type)}_${mode}_${Date.now()}.pdf`);
    return { sizeBytes: blob.size, exceedsRecommendedSize: blob.size > 5 * 1024 * 1024 };
  } finally {
    container.remove();
  }
}
