import { formatAmount, formatDate, safeString } from "../../document-model/normalization/index.js";

function cleanPresentationValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return 0;
  if (Array.isArray(value)) return value.map(cleanPresentationValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanPresentationValue(item)]));
  }
  return value;
}

export function createDocxtemplaterData(model, options = {}) {
  const facts = model.facts || {};
  const employment = facts.employment || {};
  const debt = facts.debt || {};
  const violation = facts.violation || {};
  const generatedDate = options.documentDate || model.generatedAt;
  const evidence = (model.evidence || []).map((item, index) => ({
    number: index + 1,
    label: safeString(item.label),
    description: safeString(item.description),
    files: (item.files || []).map((file, fileIndex) => ({
      number: fileIndex + 1,
      name: safeString(file.name),
    })),
    filesText: (item.files || []).map(file => safeString(file.name)).filter(Boolean).join(", "),
  }));

  const presentation = {
    document: {
      title: "ПРЕТЕНЗИЯ",
      subtitle: "о выплате задолженности по заработной плате",
      date: formatDate(generatedDate),
    },
    claimant: {
      fullName: safeString(model.claimant?.fullName),
      shortName: safeString(model.claimant?.shortName),
      address: safeString(model.claimant?.address),
      phone: safeString(model.claimant?.phone),
      email: safeString(model.claimant?.email),
      position: safeString(model.claimant?.position),
    },
    respondent: {
      displayName: safeString(model.respondent?.displayName),
      address: safeString(model.respondent?.address),
      inn: safeString(model.respondent?.inn),
      registrationNumberLabel: safeString(model.respondent?.registrationNumberLabel),
      registrationNumber: safeString(model.respondent?.registrationNumber),
    },
    facts: {
      workStartDate: formatDate(employment.workStartDate),
      workEndText: employment.stillWorking
        ? "по настоящее время"
        : formatDate(employment.workEndDate, "не указано"),
      workplaceAddress: safeString(employment.workplaceAddress),
      debtAmount: formatAmount(debt.outstandingAmount),
      originalDebtAmount: formatAmount(debt.originalAmount),
      partialPaymentAmount: formatAmount(debt.partialPaymentAmount),
      description: safeString(violation.description),
      paymentForm: (employment.paymentForm || []).map(safeString).filter(Boolean).join(", "),
    },
    legalGrounds: (model.legalGrounds || []).map((item, index) => ({
      number: index + 1,
      citation: safeString(item.citation),
      title: safeString(item.title),
      text: safeString(item.text),
    })),
    demands: (model.demands || []).map((item, index) => ({
      number: index + 1,
      title: safeString(item.title),
      text: safeString(item.text),
      amount: item.amount > 0 ? formatAmount(item.amount) : "",
    })),
    evidence,
    deadlines: {
      responseTermText: `${model.deadlines?.responseTerm?.amount || 10} календарных дней с момента получения претензии`,
    },
  };
  return cleanPresentationValue(presentation);
}

export function validatePresentationData(value) {
  const errors = [];
  function visit(item, path) {
    if (item === undefined || item === null || (typeof item === "number" && !Number.isFinite(item))) {
      errors.push(path || "presentation");
      return;
    }
    if (Array.isArray(item)) item.forEach((child, index) => visit(child, `${path}[${index}]`));
    else if (typeof item === "object") Object.entries(item).forEach(([key, child]) => visit(child, path ? `${path}.${key}` : key));
  }
  visit(value, "");
  return { valid: errors.length === 0, errors };
}
