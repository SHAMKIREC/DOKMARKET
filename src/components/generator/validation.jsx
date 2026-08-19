// Validation rules for Russian legal documents

export const RULES = {
  fio: {
    min: 5, max: 100,
    pattern: /^[А-Яа-яЁё\s-]+$/,
    message: "Введите корректные ФИО"
  },
  phone: {
    pattern: /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/,
    message: "Формат: +7 (999) 999-99-99"
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Некорректный email"
  },
  inn: {
    pattern: /^\d{10}$|^\d{12}$/,
    message: "ИНН должен содержать 10 или 12 цифр"
  },
  ogrn: {
    pattern: /^\d{13}$|^\d{15}$/,
    message: "ОГРН должен содержать 13 цифр, ОГРНИП — 15 цифр"
  },
  address: {
    min: 5, max: 300,
    message: "Укажите адрес ответчика"
  },
  amount: {
    min: 1, max: 999999999,
    message: "Введите корректную сумму (больше 0)"
  },
  days: {
    min: 1, max: 3650,
    message: "Введите количество дней от 1 до 3650"
  },
  respondentName: {
    min: 2, max: 200,
    message: "Укажите наименование ответчика"
  },
  birthDate: {
    pattern: /^\d{2}\.\d{2}\.\d{4}$/,
    message: "Дата рождения: дд.мм.гггг"
  },
  text: {
    min: 10, max: 5000,
    message: "Минимум 10 символов"
  }
};

export function validate(value, ruleKey) {
  const rule = RULES[ruleKey];
  if (!rule) return null;
  const val = (value || "").toString().trim();
  if (!val) return "Обязательное поле";
  if (rule.pattern && !rule.pattern.test(val)) return rule.message;
  if (rule.min && ruleKey !== "fio" && val.replace(/\s/g, "").length < rule.min) return rule.message;
  if (rule.min && ruleKey === "fio" && val.length < rule.min) return rule.message;
  if (rule.max && val.length > rule.max) return `Максимум ${rule.max} символов`;
  return null;
}

export function validateOptional(value, ruleKey) {
  const val = (value || "").toString().trim();
  if (!val) return null;
  return validate(value, ruleKey);
}

function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPositive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isNonNegative(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

function todayEnd() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Validation for the "Некачественный товар" direction.
 * It deliberately validates facts rather than making a legal conclusion:
 * technical-complexity and statutory exceptions are surfaced as warnings in the UI/document layer.
 */
export function validateProductCircumstances(form = {}) {
  const errors = {};
  const today = todayEnd();
  const purchaseDate = parseIsoDate(form.purchaseDate);
  const problemDate = parseIsoDate(form.defectFoundDate);
  const requestDate = parseIsoDate(form.sellerRequestDate);
  const responseDate = parseIsoDate(form.sellerResponseDate);

  if (!String(form.productName || "").trim()) errors.productName = "Укажите название товара";
  if (String(form.productName || "").trim().length > 300) errors.productName = "Название товара слишком длинное";

  if (!form.purchaseDate) errors.purchaseDate = "Укажите дату покупки";
  else if (!purchaseDate) errors.purchaseDate = "Укажите корректную дату покупки";
  else if (purchaseDate > today) errors.purchaseDate = "Дата покупки не может быть в будущем";

  if (!isPositive(form.purchaseAmount)) errors.purchaseAmount = "Укажите стоимость товара больше 0";
  else if (Number(form.purchaseAmount) > 999999999) errors.purchaseAmount = "Проверьте стоимость товара";

  if (!form.problemType) errors.problemType = "Выберите тип проблемы";
  if (form.problemType === "другое" && String(form.problemOther || "").trim().length < 10) {
    errors.problemOther = "Опишите, какая проблема возникла — минимум 10 символов";
  }

  if (!form.defectFoundDate) errors.defectFoundDate = "Укажите дату обнаружения проблемы";
  else if (!problemDate) errors.defectFoundDate = "Укажите корректную дату";
  else if (problemDate > today) errors.defectFoundDate = "Дата обнаружения проблемы не может быть в будущем";
  else if (purchaseDate && problemDate < purchaseDate) {
    errors.defectFoundDate = "Дата обнаружения проблемы не может быть раньше даты покупки";
  }

  const description = String(form.defectDescription || "").trim();
  if (description.length < 30) errors.defectDescription = "Опишите проблему подробнее — минимум 30 символов";
  else if (description.length > 5000) errors.defectDescription = "Описание не должно превышать 5000 символов";

  if (!form.consumerDemand) errors.consumerDemand = "Выберите одно основное требование";
  if (form.consumerDemand === "другое" && String(form.demandOther || "").trim().length < 10) {
    errors.demandOther = "Уточните ваше требование — минимум 10 символов";
  }

  const amountRequiredDemands = ["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"];
  const claimAmount = form.claimAmount ?? form.refundAmount;
  if (amountRequiredDemands.includes(form.consumerDemand) && !isPositive(claimAmount)) {
    errors.claimAmount = "Укажите сумму требования больше 0";
  }

  if (form.consumerDemand === "вернуть деньги" && isPositive(form.purchaseAmount) && isPositive(claimAmount)) {
    const purchaseAmount = Number(form.purchaseAmount);
    const requested = Number(claimAmount);
    const extraExpenses = Number(form.additionalExpensesAmount || 0);
    if (requested > purchaseAmount + Math.max(0, extraExpenses)) {
      errors.claimAmount = "Сумма возврата превышает стоимость товара и указанные дополнительные расходы";
    }
  }

  if (form.sellerRequestDate) {
    if (!requestDate) errors.sellerRequestDate = "Укажите корректную дату обращения";
    else if (requestDate > today) errors.sellerRequestDate = "Дата обращения не может быть в будущем";
    else if (purchaseDate && requestDate < purchaseDate) {
      errors.sellerRequestDate = "Дата обращения не может быть раньше даты покупки";
    } else if (problemDate && requestDate < problemDate) {
      errors.sellerRequestDate = "Проверьте дату: обращение к продавцу указано раньше обнаружения проблемы";
    }
  }

  if (form.sellerResponseDate) {
    if (!responseDate) errors.sellerResponseDate = "Укажите корректную дату ответа";
    else if (responseDate > today) errors.sellerResponseDate = "Дата ответа не может быть в будущем";
    else if (requestDate && responseDate < requestDate) {
      errors.sellerResponseDate = "Дата ответа не может быть раньше даты обращения";
    } else if (!requestDate) {
      errors.sellerResponseDate = "Сначала укажите дату обращения к продавцу";
    }
  }

  if (form.purchasePaymentMethod === "другое" && !String(form.purchasePaymentOther || "").trim()) {
    errors.purchasePaymentOther = "Укажите способ оплаты";
  }
  if (form.requestMethod === "другое" && !String(form.requestMethodOther || "").trim()) {
    errors.requestMethodOther = "Укажите способ обращения";
  }
  if (form.sellerResponseStatus === "другое" && !String(form.sellerResponseOther || "").trim()) {
    errors.sellerResponseOther = "Уточните ответ продавца";
  }

  ["additionalExpensesAmount", "moralDamageAmount"].forEach(key => {
    if (form[key] !== "" && form[key] != null && !isPositive(form[key])) {
      errors[key] = "Если сумма указана, она должна быть больше 0";
    }
  });

  if (form.refundAmount !== "" && form.refundAmount != null && !isNonNegative(form.refundAmount)) {
    errors.refundAmount = "Проверьте сумму возврата";
  }

  return errors;
}

/**
 * Non-blocking facts used by the product flow to explain the user's situation.
 * These are not legal conclusions and therefore are returned separately from validation errors.
 */
export function getProductSituationFlags(form = {}) {
  const purchaseDate = parseIsoDate(form.purchaseDate);
  const problemDate = parseIsoDate(form.defectFoundDate);
  const requestDate = parseIsoDate(form.sellerRequestDate);
  const flags = [];

  const problemAfterPurchaseDays = daysBetween(purchaseDate, problemDate);
  if (problemAfterPurchaseDays != null) {
    flags.push({ id: "days_from_purchase", value: problemAfterPurchaseDays });
    if (problemAfterPurchaseDays <= 15) flags.push({ id: "within_15_days", value: true });
    else flags.push({ id: "after_15_days", value: true });
  }

  const responseDelayDays = daysBetween(requestDate, parseIsoDate(form.sellerResponseDate) || new Date());
  if (requestDate && responseDelayDays != null && responseDelayDays >= 0) {
    flags.push({ id: "days_since_seller_request", value: responseDelayDays });
  }

  if (form.diagnosticsInfo) flags.push({ id: "has_diagnostics", value: true });
  if (form.warrantyInfo) flags.push({ id: "has_warranty_info", value: true });
  if (form.sellerResponseStatus) flags.push({ id: "seller_response_recorded", value: true });

  return flags;
}

export function validateLaborCircumstances(form = {}, { debtRequired = false } = {}) {
  const errors = {};
  const start = parseIsoDate(form.workStart);
  const end = parseIsoDate(form.workEnd);
  const dismissal = parseIsoDate(form.dismissalDate);
  const today = todayEnd();

  if (!form.workStart) errors.workStart = "Укажите дату начала работы";
  else if (!start || start > today) errors.workStart = "Проверьте дату начала работы";
  if (end && start && end < start) errors.workEnd = "Дата окончания работы не может быть раньше даты начала";
  if (dismissal && start && dismissal < start) errors.dismissalDate = "Дата увольнения не может быть раньше даты начала работы";
  if (!String(form.workplace || "").trim() || String(form.workplace || "").trim().length < 5) errors.workplace = "Укажите место выполнения работ";
  if (debtRequired && !isPositive(form.debtAmount)) errors.debtAmount = "Укажите сумму задолженности";
  if (isPositive(form.partialPaymentAmount) && isPositive(form.debtAmount) && Number(form.partialPaymentAmount) > Number(form.debtAmount)) {
    errors.partialPaymentAmount = "Частичная выплата не может превышать указанную задолженность";
  }
  if (String(form.description || "").trim().length < 30) errors.description = "Опишите ситуацию подробнее — минимум 30 символов";
  return errors;
}

export function validateCourseCircumstances(form = {}) {
  const errors = {};
  const purchaseDate = parseIsoDate(form.purchaseDate);
  const refundDate = parseIsoDate(form.refundRequestDate);
  const today = todayEnd();

  if (!String(form.productName || "").trim()) errors.productName = "Укажите название курса или программы";
  if (!isPositive(form.purchaseAmount)) errors.purchaseAmount = "Укажите сумму оплаты";
  if (purchaseDate && purchaseDate > today) errors.purchaseDate = "Дата покупки не может быть в будущем";
  if (refundDate && refundDate > today) errors.refundRequestDate = "Дата обращения не может быть в будущем";
  if (purchaseDate && refundDate && refundDate < purchaseDate) errors.refundRequestDate = "Дата обращения не может быть раньше оплаты курса";
  if (form.refundAmount && Number(form.refundAmount) < 0) errors.refundAmount = "Сумма возврата не может быть отрицательной";
  return errors;
}

export function validateDebtCircumstances(form = {}) {
  const errors = {};
  const contractDate = parseIsoDate(form.contractDate);
  const transferDate = parseIsoDate(form.moneyTransferDate);
  const repaymentDate = parseIsoDate(form.repaymentDate);
  const demandDate = parseIsoDate(form.demandDate);
  const today = todayEnd();

  if (!isPositive(form.debtAmount)) errors.debtAmount = "Укажите сумму долга";
  if (contractDate && contractDate > today) errors.contractDate = "Дата документа не может быть в будущем";
  if (transferDate && transferDate > today) errors.moneyTransferDate = "Дата передачи денег не может быть в будущем";
  if (repaymentDate && contractDate && repaymentDate < contractDate) errors.repaymentDate = "Срок возврата не может быть раньше даты договора";
  if (demandDate && demandDate > today) errors.demandDate = "Дата требования не может быть в будущем";
  if (isPositive(form.returnedAmount) && isPositive(form.debtAmount) && Number(form.returnedAmount) > Number(form.debtAmount)) errors.returnedAmount = "Возвращённая сумма не может превышать основной долг";
  if (form.remainingDebtAmount !== "" && form.remainingDebtAmount != null && !isNonNegative(form.remainingDebtAmount)) errors.remainingDebtAmount = "Остаток долга не может быть отрицательным";
  if (form.interestRequired && form.interestRate !== "" && form.interestRate != null && Number(form.interestRate) < 0) errors.interestRate = "Процентная ставка не может быть отрицательной";
  return errors;
}
