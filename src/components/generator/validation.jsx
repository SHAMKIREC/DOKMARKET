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
  // For FIO: check without collapsing spaces, just raw length
  if (rule.min && ruleKey === "fio" && val.length < rule.min) return rule.message;
  if (rule.max && val.length > rule.max) return `Максимум ${rule.max} символов`;
  return null;
}

export function validateOptional(value, ruleKey) {
  const val = (value || "").toString().trim();
  if (!val) return null; // optional — empty is ok
  return validate(value, ruleKey);
}

export function validateProductCircumstances(form = {}) {
  const errors = {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const parseDate = value => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const purchaseDate = parseDate(form.purchaseDate);
  const problemDate = parseDate(form.defectFoundDate);
  const requestDate = parseDate(form.sellerRequestDate);
  const responseDate = parseDate(form.sellerResponseDate);

  if (!String(form.productName || "").trim()) errors.productName = "Укажите название товара";
  if (!form.purchaseDate) errors.purchaseDate = "Укажите дату покупки";
  else if (!purchaseDate) errors.purchaseDate = "Укажите корректную дату покупки";
  else if (purchaseDate > today) errors.purchaseDate = "Дата покупки не может быть в будущем";

  if (!positive(form.purchaseAmount)) errors.purchaseAmount = "Укажите стоимость товара больше 0";
  if (!form.problemType) errors.problemType = "Выберите тип проблемы";
  if (form.problemType === "другое" && !String(form.problemOther || "").trim()) {
    errors.problemOther = "Опишите, какая проблема возникла";
  }

  if (!form.defectFoundDate) errors.defectFoundDate = "Укажите дату обнаружения проблемы";
  else if (!problemDate) errors.defectFoundDate = "Укажите корректную дату";
  else if (problemDate > today) errors.defectFoundDate = "Дата обнаружения проблемы не может быть в будущем";
  else if (purchaseDate && problemDate < purchaseDate) {
    errors.defectFoundDate = "Дата обнаружения проблемы не может быть раньше даты покупки";
  }

  const description = String(form.defectDescription || "").trim();
  if (description.length < 30) errors.defectDescription = "Опишите проблему подробнее — минимум 30 символов";

  if (!form.consumerDemand) errors.consumerDemand = "Выберите требование";
  if (form.consumerDemand === "другое" && !String(form.demandOther || "").trim()) {
    errors.demandOther = "Уточните ваше требование";
  }
  const amountRequiredDemands = ["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"];
  const claimAmount = form.claimAmount ?? form.refundAmount;
  if (amountRequiredDemands.includes(form.consumerDemand) && !positive(claimAmount)) {
    errors.claimAmount = "Укажите сумму требования больше 0";
  }

  if (form.sellerRequestDate) {
    if (!requestDate) errors.sellerRequestDate = "Укажите корректную дату обращения";
    else if (requestDate > today) errors.sellerRequestDate = "Дата обращения не может быть в будущем";
    else if (purchaseDate && requestDate < purchaseDate) {
      errors.sellerRequestDate = "Дата обращения не может быть раньше даты покупки";
    }
  }
  if (form.sellerResponseDate) {
    if (!responseDate) errors.sellerResponseDate = "Укажите корректную дату ответа";
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
    if (form[key] !== "" && form[key] != null && !positive(form[key])) {
      errors[key] = "Если сумма указана, она должна быть больше 0";
    }
  });

  return errors;
}
