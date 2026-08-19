/**
 * PDF генератор с поддержкой кириллицы через html2canvas + jsPDF
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getEvidenceHints, getLegacyPdfType, getSelectedDocumentBlocks, getSelectedLegalReferences, getSelectedRequirementTexts } from "@/data/legalRules";

const LAWS = {
  labor: {
    title: "ПРЕТЕНЗИЯ о выплате задолженности по заработной плате и урегулировании трудового спора в досудебном порядке",
    getArticles: (claimData) => getLaborArticles(claimData),
    articles: [],
    demands: (claimData) => getLaborDemands(claimData),
  },
  product: {
    title: "ПРЕТЕНЗИЯ о возврате стоимости некачественного товара",
    articles: [
      "Статья 18 Закона РФ «О защите прав потребителей» — права потребителя при недостатках товара",
      "Статья 20 Закона РФ «О защите прав потребителей» — устранение недостатков",
      "Статья 22 Закона РФ «О защите прав потребителей» — сроки удовлетворения требований",
    ],
    demands: (c) => {
      const amt = c.circumstances?.purchaseAmount ? Number(c.circumstances.purchaseAmount).toLocaleString("ru-RU") : "___";
      return [
        `1. Принять товар ненадлежащего качества — ${c.circumstances?.productName || "___"}.`,
        `2. Возвратить уплаченную стоимость товара в размере ${amt} руб. в течение 10 (десяти) дней.`,
        "3. При отказе оставляю за собой право обратиться в суд с требованием о взыскании стоимости, неустойки и штрафа.",
      ];
    }
  },
  infoproduct: {
    title: "ПРЕТЕНЗИЯ о возврате денежных средств за онлайн-курс",
    articles: [
      "Статья 32 Закона РФ «О защите прав потребителей» — право на отказ от договора",
      "Статья 29 Закона РФ «О защите прав потребителей» — права при недостатках услуги",
      "Статья 16 Закона РФ «О защите прав потребителей» — недействительность условий",
    ],
    demands: (c) => {
      const amt = c.circumstances?.purchaseAmount ? Number(c.circumstances.purchaseAmount).toLocaleString("ru-RU") : "___";
      return [
        `1. Произвести возврат денежных средств в размере ${amt} руб. в течение 10 (десяти) дней.`,
        "2. Возврат осуществить на банковские реквизиты, которые я предоставлю дополнительно.",
        "3. При отказе оставляю за собой право обратиться в Роспотребнадзор и суд.",
      ];
    }
  },
  civil: {
    title: "ПРЕТЕНЗИЯ (досудебное требование о возврате долга)",
    articles: [
      "Статья 309 ГК РФ — надлежащее исполнение обязательств",
      "Статья 310 ГК РФ — недопустимость одностороннего отказа от обязательства",
      "Статья 807 ГК РФ — договор займа",
      "Статья 395 ГК РФ — ответственность за неисполнение денежного обязательства",
    ],
    demands: (c) => {
      const amt = c.circumstances?.debtAmount ? Number(c.circumstances.debtAmount).toLocaleString("ru-RU") : "___";
      return [
        `1. В течение 10 (десяти) рабочих дней возвратить долг в размере ${amt} руб.`,
        "2. При неисполнении оставляю за собой право обратиться в суд с требованием о взыскании задолженности и процентов по ст. 395 ГК РФ.",
      ];
    }
  },
  universal: {
    title: "ПРЕТЕНЗИЯ (досудебное урегулирование спора)",
    articles: [
      "Статья 309 ГК РФ — надлежащее исполнение обязательств",
      "Статья 310 ГК РФ — недопустимость одностороннего отказа",
      "Статья 15 ГК РФ — возмещение убытков",
    ],
    demands: (c) => {
      const amt = c.circumstances?.debtAmount || c.circumstances?.purchaseAmount;
      return [
        amt ? `1. В течение 10 (десяти) рабочих дней исполнить обязательство и возвратить денежные средства в размере ${Number(amt).toLocaleString("ru-RU")} руб.`
              : "1. В течение 10 (десяти) рабочих дней исполнить взятые на себя обязательства в полном объёме.",
        "2. При неурегулировании спора оставляю за собой право обратиться в суд.",
      ];
    }
  }
};

function today() {
  return new Date().toLocaleDateString("ru-RU");
}

// Полная прописная числа (целое, рублей)
function numToWords(num) {
  const n = Math.floor(Math.abs(Number(num)));
  if (!num || isNaN(n) || n === 0) return "ноль";
  const ones_m = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const ones_f = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять",
    "десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать",
    "шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hunds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];

  function chunk(x, fem) {
    let s = "";
    const h = Math.floor(x / 100);
    const rem = x % 100;
    if (h) s += hunds[h] + " ";
    if (rem < 20) {
      s += (fem ? ones_f[rem] : ones_m[rem]);
    } else {
      s += tens[Math.floor(rem / 10)];
      const u = rem % 10;
      if (u) s += " " + (fem ? ones_f[u] : ones_m[u]);
    }
    return s.trim();
  }

  function thousands_word(th) {
    const rem100 = th % 100;
    const rem10 = th % 10;
    if (rem100 >= 11 && rem100 <= 19) return "тысяч";
    if (rem10 === 1) return "тысяча";
    if (rem10 >= 2 && rem10 <= 4) return "тысячи";
    return "тысяч";
  }

  function millions_word(m) {
    const rem100 = m % 100;
    const rem10 = m % 10;
    if (rem100 >= 11 && rem100 <= 19) return "миллионов";
    if (rem10 === 1) return "миллион";
    if (rem10 >= 2 && rem10 <= 4) return "миллиона";
    return "миллионов";
  }

  const parts = [];
  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (billions) parts.push(chunk(billions, false) + " миллиард" + (billions === 1 ? "" : "ов"));
  if (millions) parts.push(chunk(millions, false) + " " + millions_word(millions));
  if (thousands) parts.push(chunk(thousands, true) + " " + thousands_word(thousands));
  if (remainder) parts.push(chunk(remainder, false));

  return parts.filter(Boolean).join(" ");
}

// Форматирование суммы с прописью: "125 000 (сто двадцать пять тысяч) рублей"
function fmtAmount(val) {
  const n = Number(val);
  if (!val || isNaN(n) || n <= 0) return "___";
  const formatted = n.toLocaleString("ru-RU");
  const words = numToWords(n);
  return `${formatted} (${words}) рублей`;
}

// Проверка текста на "мусор" (бессмысленный набор)
function isValidText(text) {
  if (!text || text.trim().length < 10) return false;
  // Считаем долю "нормальных" символов — буквы, цифры, знаки пунктуации
  const normal = (text.match(/[а-яёА-ЯЁa-zA-Z0-9\s,.:;!?()\-–—«»"']/g) || []).length;
  return normal / text.length > 0.7;
}

// Очистка текста от двойных пробелов и спецсимволов
function cleanText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/\s([,.;:])/g, "$1").trim();
}

function uppercaseFirstLetter(text) {
  return String(text || "").replace(/^(\s*[«“„"'(\[]*)([а-яёa-z])/iu, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

function normalizeLaborCommonText(value) {
  if (!value) return "";
  return cleanText(String(value))
    .replace(/(^|[\s,;:])пол\s+года(?=$|[\s,.;:!?])/giu, "$1полгода")
    .replace(/(^|[\s,;:])работадатель(?=$|[\s,.;:!?])/giu, "$1работодатель")
    .replace(/(^|[\s,;:])работадателем(?=$|[\s,.;:!?])/giu, "$1работодателем")
    .replace(/(^|[\s,;:])рабодатателем(?=$|[\s,.;:!?])/giu, "$1работодателем")
    .replace(/(^|[\s,;:])притензия(?=$|[\s,.;:!?])/giu, "$1претензия")
    .replace(/(^|[\s,;:])юредический(?=$|[\s,.;:!?])/giu, "$1юридический")
    .replace(/(^|[\s,;:])зарплата\s+не\s+выплочена(?=$|[\s,.;:!?])/giu, "$1зарплата не выплачена")
    .replace(/(^|[\s,;:])выплочена(?=$|[\s,.;:!?])/giu, "$1выплачена")
    .replace(/(^|[\s,;])((?:г|ул|д|кв|оф))(?:\.\s*|\s+(?=[а-яёa-z0-9]))/giu, "$1$2. ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+([.;!?])/g, "$1")
    .trim();
}

export function normalizeLaborAddress(value) {
  let text = normalizeLaborCommonText(value);
  if (!text) return "";
  text = text
    .replace(/\s+(?=(?:г|ул|д|кв|оф)\.\s)/giu, ", ")
    .replace(/(область)\s+([а-яё-]+)(?=\s*(?:,|г\.|ул\.|д\.|кв\.|оф\.|$))/giu, "$1, г. $2")
    .replace(/(^|[\s,])((?:г|ул)\.)\s*([а-яё])/giu, (_, prefix, abbreviation, letter) => `${prefix}${abbreviation.toLowerCase()} ${letter.toUpperCase()}`)
    .replace(/,\s*,+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
  text = uppercaseFirstLetter(text);
  return text.replace(/^(Г|Ул|Д|Кв|Оф)\./u, abbreviation => abbreviation.toLowerCase());
}

export function normalizeLaborPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  else if (!digits.startsWith("7")) {
    if (digits.length !== 11) return cleanText(String(value));
    digits = `7${digits.slice(1)}`;
  }
  if (!/^7\d{10}$/.test(digits)) return cleanText(String(value));
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

export function normalizeLaborText(value) {
  let text = normalizeLaborCommonText(value);
  if (!text) return "";
  text = text
    .replace(/(устроил(?:ся|ась)\s+на\s+работу)\s+(проработал(?:а)?)/giu, "$1, $2")
    .replace(/(проработал(?:а)?\s+полгода)\s+(денег\s+не\s+получил(?:а)?)/giu, "$1, $2")
    .replace(/([.!?]\s+)([а-яё])/giu, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
  text = uppercaseFirstLetter(text);
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function buildCourseCircumstances(circ, p, H) {
  let body = H("Обстоятельства:");
  body += p(`Мной был приобретён онлайн-курс: ${circ.productName || "___"}.`);
  if (circ.providerName) body += p(`Исполнитель (онлайн-школа): ${circ.providerName}.`);
  if (circ.purchaseDate) body += p(`Дата оплаты: ${fmtDate(circ.purchaseDate)}.`);
  if (circ.purchaseAmount && Number(circ.purchaseAmount) > 0) body += p(`Стоимость курса: ${fmtAmount(circ.purchaseAmount)}.`);
  if (circ.paymentMethod) body += p(`Способ оплаты: ${circ.paymentMethod}.`);
  if (circ.creditOrInstallment) body += p("Курс был оплачен с использованием кредита или рассрочки.");
  if (circ.salesPromises) body += p(`При продаже курса было обещано: ${circ.salesPromises}.`);
  if (circ.actualResult) body += p(`Фактически предоставлено: ${circ.actualResult}.`);
  if (circ.serviceDefects) body += p(`Недостатки услуги: ${circ.serviceDefects}.`);
  if (circ.refundRequestDate) body += p(`Дата обращения за возвратом: ${fmtDate(circ.refundRequestDate)}.`);
  if (circ.supportResponse) body += p(`Ответ поддержки: ${circ.supportResponse}.`);
  if (circ.refundAmount && Number(circ.refundAmount) > 0) body += p(`Требуемая сумма возврата: ${fmtAmount(circ.refundAmount)}.`);
  if (circ.userComment) body += p(`Комментарий заявителя: ${circ.userComment}.`);

  body += H("Последствия:");
  if (circ.moralDamageAmount && Number(circ.moralDamageAmount) > 0) {
    body += p(`Причинённый моральный вред заявитель оценивает в ${fmtAmount(circ.moralDamageAmount)}.`);
  } else {
    body += p("Нарушение условий оказания услуги привело к утрате ожидаемого результата обучения и необходимости добиваться возврата денежных средств.");
  }
  return body;
}

function buildProductCircumstances(circ, employerName, p, H) {
  const seller = cleanText(circ.sellerName) || employerName || "___";
  let body = H("Обстоятельства:");
  body += p(`Продавец товара: ${seller}.`);
  body += p(`Приобретённый товар: ${circ.productName || "___"}.`);
  if (circ.purchaseDate) body += p(`Дата приобретения товара: ${fmtDate(circ.purchaseDate)}.`);
  if (circ.purchaseAmount && Number(circ.purchaseAmount) > 0) body += p(`Стоимость товара: ${fmtAmount(circ.purchaseAmount)}.`);
  if (circ.defectFoundDate) body += p(`Недостаток товара обнаружен ${fmtDate(circ.defectFoundDate)}.`);
  if (circ.defectDescription && isValidText(circ.defectDescription)) body += p(`Описание недостатка: ${cleanText(circ.defectDescription)}.`);
  if (circ.warrantyInfo && isValidText(circ.warrantyInfo)) body += p(`Сведения о гарантии: ${cleanText(circ.warrantyInfo)}.`);
  if (circ.diagnosticsInfo && isValidText(circ.diagnosticsInfo)) body += p(`Сведения о диагностике или экспертизе: ${cleanText(circ.diagnosticsInfo)}.`);

  if (circ.sellerRequestDate || circ.requestMethod || circ.consumerDemand || circ.sellerResponse || circ.sellerResponseDate) {
    body += H("Обращение к продавцу:");
    if (circ.sellerRequestDate) body += p(`Дата обращения к продавцу: ${fmtDate(circ.sellerRequestDate)}.`);
    if (circ.requestMethod) body += p(`Способ обращения: ${cleanText(circ.requestMethod)}.`);
    if (circ.consumerDemand) body += p(`Заявленное потребителем требование: ${cleanText(circ.consumerDemand)}.`);
    if (circ.sellerResponseDate) body += p(`Дата ответа продавца: ${fmtDate(circ.sellerResponseDate)}.`);
    if (circ.sellerResponse && isValidText(circ.sellerResponse)) body += p(`Ответ продавца: ${cleanText(circ.sellerResponse)}.`);
  }
  if (circ.userComment && isValidText(circ.userComment)) body += p(`Дополнительные обстоятельства: ${cleanText(circ.userComment)}.`);
  if (circ.description && isValidText(circ.description)) body += p(circ.description);
  return body;
}

function getProductDemands(circ) {
  const demands = [];
  if (circ.consumerDemand) demands.push(cleanText(circ.consumerDemand));
  const refund = circ.refundAmount || circ.purchaseAmount;
  if (refund && Number(refund) > 0) demands.push(`Вернуть денежные средства в размере ${fmtAmount(refund)}.`);
  if (circ.additionalExpenses && Number(circ.additionalExpenses) > 0) demands.push(`Компенсировать подтверждённые дополнительные расходы в размере ${fmtAmount(circ.additionalExpenses)}.`);
  if (circ.moralDamageAmount && Number(circ.moralDamageAmount) > 0) demands.push(`Компенсировать моральный вред в размере ${fmtAmount(circ.moralDamageAmount)}.`);
  if (circ.bankDetails) demands.push(`Перечислить денежные средства по указанным заявителем банковским реквизитам: ${cleanText(circ.bankDetails)}.`);
  demands.push("Предоставить письменный ответ на настоящую претензию.");
  return demands;
}

function getProductEvidence(circ) {
  const evidence = [];
  if (circ.warrantyInfo) evidence.push("Гарантийные документы");
  if (circ.diagnosticsInfo) evidence.push("Заключение диагностики или экспертизы");
  if (circ.sellerResponse || circ.requestMethod) evidence.push("Переписка или иное подтверждение обращения к продавцу");
  if (circ.additionalExpenses && Number(circ.additionalExpenses) > 0) evidence.push("Документы, подтверждающие дополнительные расходы");
  return evidence;
}

function isSoloProduct(claimData) {
  const category = cleanText(String(
    claimData?.type
    || claimData?.category
    || claimData?.claimType
    || claimData?.claim_type
    || ""
  )).toLowerCase();
  const subtype = cleanText(String(claimData?.subtype || claimData?.claimSubtype || claimData?.claim_subtype || "")).toLowerCase();
  const productSubtypes = new Set([
    "defective-product", "not-as-described", "return-refused", "paid-product-not-delivered",
    "damaged-delivery", "warranty-repair-delayed", "warranty-refused", "exchange-refused", "other-product",
  ]);
  const circ = claimData?.circumstances || claimData?.circumstancesData || claimData?.productData || {};
  const looksLikeProduct = category === "product"
    || category === "некачественный товар"
    || productSubtypes.has(subtype)
    || Boolean(circ.problemType || circ.defectDescription);
  const mode = cleanText(String(claimData?.mode || claimData?.format || "")).toLowerCase();
  return looksLikeProduct && mode !== "collective";
}

function productValue(...values) {
  for (const value of values) {
    if (value === 0) return "0";
    if (value != null && cleanText(String(value))) return cleanText(String(value));
  }
  return "";
}

function normalizeProductPdfData(claimData) {
  const respondent = claimData.respondent || claimData.respondentData || claimData.respondent_data || {};
  const employer = claimData.employer || claimData.employerData || claimData.employer_data || {};
  const rawWorkers = Array.isArray(claimData.workers) ? claimData.workers
    : Array.isArray(claimData.claimants) ? claimData.claimants
    : Array.isArray(claimData.applicants) ? claimData.applicants
    : [];
  const rawApplicant = rawWorkers[0] || claimData.claimant || claimData.applicant || claimData.claimantData || {};
  const circumstances = claimData.circumstances || claimData.circumstancesData || claimData.productData || {};
  return {
    employer: {
      ...respondent,
      ...employer,
      name: productValue(employer.name, employer.respondentName, respondent.name, respondent.respondentName, claimData.respondent_name),
      address: productValue(employer.address, employer.legalAddress, employer.legal_address, respondent.address, respondent.legalAddress, respondent.legal_address, claimData.respondent_address),
      inn: productValue(employer.inn, employer.respondentInn, employer.respondent_inn, respondent.inn, respondent.respondentInn, respondent.respondent_inn, claimData.respondentInn, claimData.respondent_inn),
      registrationNumber: productValue(
        employer.ogrnip, employer.ogrn, employer.registrationNumber, employer.registration_number,
        respondent.ogrnip, respondent.ogrn, respondent.registrationNumber, respondent.registration_number,
        claimData.ogrnip, claimData.ogrn, claimData.registrationNumber, claimData.registration_number
      ),
    },
    applicant: {
      ...rawApplicant,
      name: productValue(rawApplicant.name, rawApplicant.fullName, rawApplicant.full_name, rawApplicant.fio),
      address: productValue(rawApplicant.address, rawApplicant.residentialAddress, rawApplicant.residential_address),
      phone: productValue(rawApplicant.phone, rawApplicant.telephone),
      email: productValue(rawApplicant.email),
    },
    circumstances,
  };
}

function normalizeProductDemand(value) {
  const demand = cleanText(value).toLowerCase();
  const aliases = {
    "отремонтировать товар": "бесплатно устранить недостатки",
    "возместить расходы": "возместить расходы на ремонт",
  };
  return aliases[demand] || demand;
}

function getProductSubtitle(circ = {}) {
  const demand = normalizeProductDemand(circ.consumerDemand);
  const subtitles = {
    "вернуть деньги": "о возврате денежных средств за некачественный товар",
    "заменить товар": "о замене некачественного товара",
    "уменьшить цену": "о соразмерном уменьшении цены товара",
    "бесплатно устранить недостатки": "об устранении недостатков товара",
    "возместить расходы на ремонт": "о возмещении расходов на ремонт товара",
    "компенсировать убытки": "о компенсации убытков, связанных с недостатками товара",
  };
  return subtitles[demand] || (demand === "другое" && circ.demandOther
    ? `по требованию потребителя: ${cleanText(circ.demandOther)}`
    : "в связи с недостатками товара");
}

function getProductArticles(circ = {}) {
  const demand = normalizeProductDemand(circ.consumerDemand);
  const monetary = new Set(["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"]);
  const articles = [
    "Статья 4 Закона РФ «О защите прав потребителей» обязывает продавца передать потребителю товар, качество которого соответствует договору.",
    "Статья 18 Закона РФ «О защите прав потребителей» предоставляет потребителю право выбрать предусмотренное законом требование при обнаружении недостатков товара.",
  ];
  if (monetary.has(demand)) {
    articles.push("Статья 22 Закона РФ «О защите прав потребителей» устанавливает срок удовлетворения требований о возврате денежных средств, соразмерном уменьшении цены и возмещении расходов.");
  }
  const responseText = `${productValue(circ.sellerResponseStatus)} ${productValue(circ.sellerResponseOther)} ${productValue(circ.sellerResponse)}`.toLowerCase();
  if (circ.sellerRequestDate && /(не ответ|отказ|не решил|игнор|просроч|затян)/u.test(responseText)) {
    articles.push("Статья 23 Закона РФ «О защите прав потребителей» предусматривает ответственность продавца за нарушение установленных сроков удовлетворения требований потребителя.");
  }
  if (Number(circ.moralDamageAmount) > 0) {
    articles.push("Статья 15 Закона РФ «О защите прав потребителей» предусматривает компенсацию морального вреда при нарушении прав потребителя.");
  }
  if (circ.sellerRequestDate || circ.sellerResponseStatus) {
    articles.push("Пункт 6 статьи 13 Закона РФ «О защите прав потребителей» предусматривает взыскание штрафа при неудовлетворении законных требований потребителя добровольно.");
  }
  return articles;
}

function getProductRequirements(circ = {}) {
  const demand = normalizeProductDemand(circ.consumerDemand);
  const purchaseAmount = Number(circ.purchaseAmount);
  const requestedAmount = Number(circ.refundAmount);
  const returnAmount = requestedAmount > 0 && (!purchaseAmount || requestedAmount <= purchaseAmount)
    ? requestedAmount
    : circ.purchaseAmount;
  const expenseAmount = Number(circ.additionalExpensesAmount) > 0 ? circ.additionalExpensesAmount : null;
  const moralAmount = Number(circ.moralDamageAmount) > 0 ? circ.moralDamageAmount : null;
  const requirements = [];
  const add = text => requirements.push(`${requirements.length + 1}. ${text}`);

  if (demand === "вернуть деньги") add(`Возвратить денежные средства за товар в размере ${fmtAmount(returnAmount)}.`);
  else if (demand === "заменить товар") add("Заменить товар на товар надлежащего качества.");
  else if (demand === "уменьшить цену") add(Number(circ.refundAmount) > 0
    ? `Соразмерно уменьшить цену товара на ${fmtAmount(circ.refundAmount)}.`
    : "Соразмерно уменьшить цену товара.");
  else if (demand === "бесплатно устранить недостатки") add("Безвозмездно устранить недостатки товара.");
  else if (demand === "возместить расходы на ремонт") add(expenseAmount
    ? `Возместить расходы на ремонт товара в размере ${fmtAmount(expenseAmount)}.`
    : "Возместить документально подтверждённые расходы на ремонт товара.");
  else if (demand === "компенсировать убытки") add(expenseAmount
    ? `Компенсировать убытки в размере ${fmtAmount(expenseAmount)}.`
    : "Компенсировать документально подтверждённые убытки, связанные с недостатками товара.");
  else if (demand === "другое" && circ.demandOther) add(`${uppercaseFirstLetter(cleanText(circ.demandOther)).replace(/[.;]+$/, "")}.`);
  else add("Удовлетворить законное требование потребителя в связи с недостатками товара.");

  if (expenseAmount && !["возместить расходы на ремонт", "компенсировать убытки"].includes(demand)) {
    add(`Возместить дополнительные документально подтверждённые расходы в размере ${fmtAmount(expenseAmount)}.`);
  }
  if (moralAmount) add(`Компенсировать моральный вред в размере ${fmtAmount(moralAmount)}.`);
  if (circ.bankDetails && ["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"].includes(demand)) {
    add(`Перечислить денежные средства по следующим реквизитам либо указанным способом: ${cleanText(circ.bankDetails)}.`);
  }
  add("Предоставить письменный ответ по существу настоящей претензии.");
  return requirements;
}

function getProductSignatureName(fullName) {
  const original = productValue(fullName);
  if (!original) return "___";
  const parts = original.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 3 || parts.some(part => !/^[А-ЯЁA-Z][А-ЯЁA-Za-zА-Яа-яёЁ'-]+$/u.test(part))) {
    return original;
  }
  const initials = parts.slice(1).map(part => `${part.charAt(0).toUpperCase()}.`).join(" ");
  return initials ? `${parts[0]} ${initials}` : original;
}

function getProductEvidenceGroups(claimData) {
  const evidenceData = claimData?.evidenceData || claimData?.evidence_data || {};
  const rawSelected = Array.isArray(claimData?.evidence) ? claimData.evidence
    : Array.isArray(evidenceData.selected) ? evidenceData.selected
    : [];
  const evidenceFiles = claimData?.evidenceFiles || claimData?.evidence_files || evidenceData.files || {};
  const selected = Array.isArray(rawSelected)
    ? rawSelected.filter(item => item && item !== "Нет доказательств")
    : [];
  return selected.map(label => ({
    label: cleanText(label),
    files: getEvidenceFilesForLabel(evidenceFiles, label),
  })).filter(group => group.label);
}

function buildProductDocument(claimData, forWord = false) {
  const normalized = normalizeProductPdfData(claimData);
  const employer = normalized.employer;
  const applicant = normalized.applicant;
  const circ = normalized.circumstances;
  const pt = forWord ? "pt" : "px";
  const fs = forWord ? "12pt" : "12px";
  const row = `font-size:${fs};margin:0 0 4${pt};line-height:${forWord ? "1.5" : "1.8"};color:#111;`;
  const p = text => {
    const value = cleanText(text);
    return value ? `<p style="font-size:${fs};margin:0 0 ${forWord ? "10pt" : "12px"};line-height:${forWord ? "1.5" : "1.9"};color:#111;">${value}</p>` : "";
  };
  const H = text => `<p style="font-size:${fs};font-weight:700;margin:${forWord ? "16pt" : "20px"} 0 ${forWord ? "6pt" : "8px"};line-height:1.5;color:#111;text-transform:uppercase;">${text}</p>`;
  const spacer = value => `<div style="height:${value}${pt};"></div>`;
  const registrationNumber = employer.registrationNumber;
  const registrationLabel = registrationNumber.length === 15 ? "ОГРНИП" : registrationNumber.length === 13 ? "ОГРН" : "ОГРН / ОГРНИП";
  const monetaryDemand = ["вернуть деньги", "уменьшить цену", "возместить расходы на ремонт", "компенсировать убытки"].includes(normalizeProductDemand(circ.consumerDemand));
  const evidenceGroups = getProductEvidenceGroups(claimData);

  let body = forWord
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14pt;border:none;"><tr><td width="50%" style="vertical-align:top;"></td><td width="50%" style="text-align:left;vertical-align:top;">`
    : `<div style="width:50%;max-width:360px;margin-left:auto;text-align:left;margin-bottom:0;">`;
  body += `<p style="${row}"><b>Продавцу:</b></p>`;
  body += `<p style="${row}"><b>${cleanText(employer.name) || "Наименование не указано"}</b></p>`;
  if (employer.inn) body += `<p style="${row}"><b>ИНН:</b> ${cleanText(String(employer.inn))}</p>`;
  if (registrationNumber) body += `<p style="${row}"><b>${registrationLabel}:</b> ${registrationNumber}</p>`;
  if (employer.address) body += `<p style="${row}"><b>Адрес:</b></p><p style="${row}">${cleanText(employer.address)}</p>`;
  body += forWord ? "</td></tr></table>" : "</div>";

  body += spacer(forWord ? 8 : 10);
  body += `<div style="text-align:left;">`;
  body += `<p style="${row}"><b>От потребителя:</b></p>`;
  body += `<p style="${row}"><b>${formatNameTitle(applicant.name) || "ФИО не указано"}</b></p>`;
  if (applicant.address) body += `<p style="${row}"><b>адрес для корреспонденции:</b> ${cleanText(applicant.address)}</p>`;
  if (applicant.phone) body += `<p style="${row}"><b>тел.:</b> ${cleanText(applicant.phone)}</p>`;
  if (applicant.email) body += `<p style="${row}"><b>эл. почта:</b> ${cleanText(applicant.email)}</p>`;
  body += "</div>";

  body += spacer(forWord ? 24 : 30);
  body += `<p style="font-size:${forWord ? "14pt" : "14px"};font-weight:700;text-align:center;margin:0 0 8${pt};color:#111;letter-spacing:1${pt};">ПРЕТЕНЗИЯ</p>`;
  body += `<p style="font-size:${fs};font-weight:700;text-align:center;margin:0 0 ${forWord ? "16pt" : "22px"};color:#111;line-height:1.5;">${getProductSubtitle(circ)}</p>`;

  body += H("Обстоятельства");
  const purchaseDetails = [];
  if (circ.purchaseDate) purchaseDetails.push(`${fmtLaborDate(circ.purchaseDate)} потребителем был приобретён у продавца товар: ${cleanText(circ.productName) || "наименование не указано"}`);
  else purchaseDetails.push(`Потребителем был приобретён у продавца товар: ${cleanText(circ.productName) || "наименование не указано"}`);
  if (Number(circ.purchaseAmount) > 0) purchaseDetails.push(`стоимостью ${fmtAmount(circ.purchaseAmount)}`);
  body += p(`${purchaseDetails.join(", ")}.`);
  if (circ.sellerName) body += p(`Место покупки: ${cleanText(circ.sellerName)}.`);
  const paymentMethod = circ.purchasePaymentMethod === "другое" ? circ.purchasePaymentOther : circ.purchasePaymentMethod;
  if (paymentMethod) body += p(`Оплата произведена способом: ${cleanText(paymentMethod)}.`);
  if (circ.orderNumber) body += p(`Номер заказа или чека: ${cleanText(circ.orderNumber)}.`);
  if (circ.warrantyInfo) body += p(`Гарантийный срок: ${cleanText(circ.warrantyInfo)}.`);
  const problemType = circ.problemType === "другое" ? circ.problemOther : circ.problemType;
  if (circ.defectFoundDate || problemType || circ.defectDescription) {
    let defectText = circ.defectFoundDate
      ? `${fmtLaborDate(circ.defectFoundDate)} в товаре был обнаружен недостаток`
      : "В товаре был обнаружен недостаток";
    if (problemType) defectText += `: ${cleanText(problemType)}`;
    defectText += ".";
    if (circ.defectDescription) defectText += ` Описание недостатка: ${cleanText(circ.defectDescription)}.`;
    defectText += " Указанный недостаток свидетельствует о передаче товара ненадлежащего качества и препятствует нормальному использованию товара по назначению.";
    body += p(defectText);
  }
  if (circ.productUsage) body += p(`Товар использовался: ${cleanText(circ.productUsage)}.`);
  if (circ.diagnosticsInfo) body += p(`Диагностика или экспертиза: ${cleanText(circ.diagnosticsInfo)}.`);
  const expenseTypes = Array.isArray(circ.additionalExpenseTypes) ? circ.additionalExpenseTypes.filter(Boolean).join(", ") : "";
  if (expenseTypes || circ.additionalExpenses) body += p(`Дополнительные расходы: ${cleanText(expenseTypes || circ.additionalExpenses)}.`);
  if (Number(circ.additionalExpensesAmount) > 0) body += p(`Сумма дополнительных расходов: ${fmtAmount(circ.additionalExpensesAmount)}.`);
  if (Number(circ.moralDamageAmount) > 0) body += p(`Заявленная компенсация морального вреда: ${fmtAmount(circ.moralDamageAmount)}.`);
  if (circ.bankDetails) body += p(`Реквизиты или способ возврата денежных средств: ${cleanText(circ.bankDetails)}.`);
  if (circ.userComment) body += p(`Дополнительный комментарий: ${cleanText(circ.userComment)}.`);

  body += H("Обращение к продавцу");
  if (circ.sellerRequestDate || circ.requestMethod || circ.sellerResponseStatus || circ.sellerResponse || circ.sellerResponseDate) {
    const requestMethod = circ.requestMethod === "другое" ? circ.requestMethodOther : circ.requestMethod;
    let requestText = "До направления настоящей претензии потребитель обращался к продавцу";
    if (circ.sellerRequestDate) requestText += ` ${fmtLaborDate(circ.sellerRequestDate)}`;
    if (requestMethod) requestText += ` способом: ${cleanText(requestMethod)}`;
    requestText += ".";
    body += p(requestText);
    const responseStatus = circ.sellerResponseStatus === "другое" ? circ.sellerResponseOther : circ.sellerResponseStatus;
    if (responseStatus || circ.sellerResponse || circ.sellerResponseDate) {
      let responseText = "Ответ продавца";
      if (circ.sellerResponseDate) responseText += ` от ${fmtLaborDate(circ.sellerResponseDate)}`;
      responseText += `: ${cleanText(circ.sellerResponse || responseStatus || "ответ по существу требования не предоставлен")}.`;
      body += p(responseText);
    }
  } else {
    body += p("До направления настоящей претензии отдельное обращение к продавцу не направлялось. Настоящая претензия является письменным требованием потребителя о добровольном урегулировании спора.");
  }

  body += H("Проверка качества товара");
  body += p("Товар может быть передан продавцу для проведения проверки качества в порядке, предусмотренном Законом РФ «О защите прав потребителей». Обязанность принять товар ненадлежащего качества и при необходимости провести проверку качества возлагается на продавца.");

  body += H("Правовое обоснование требований");
  getProductArticles(circ).forEach(article => { body += p(article); });

  body += H("Требования");
  body += p("ТРЕБУЮ:");
  getProductRequirements(circ).forEach(requirement => { body += p(requirement); });
  body += p(monetaryDemand
    ? "В соответствии со статьёй 22 Закона РФ «О защите прав потребителей» требования о возврате денежных средств, соразмерном уменьшении покупной цены, возмещении расходов или убытков подлежат удовлетворению в течение 10 дней со дня предъявления соответствующего требования."
    : "Иные требования прошу удовлетворить в установленный законом срок.");

  body += H("В случае отказа");
  body += p("В случае отказа в добровольном удовлетворении требований либо неполучения ответа в установленный законом срок заявитель оставляет за собой право обратиться в Роспотребнадзор и суд за защитой нарушенных прав, включая требования о взыскании неустойки, штрафа, компенсации морального вреда и судебных расходов при наличии законных оснований.");

  body += H("Приложения");
  if (!evidenceGroups.length) {
    body += p("Приложения: отсутствуют. Потребителю рекомендуется приложить документы, подтверждающие покупку, недостаток товара и обращение к продавцу, при их наличии.");
  } else {
    let applicationNumber = 1;
    evidenceGroups.forEach(group => {
      body += p(`${applicationNumber++}. ${group.label}.`);
      group.files.filter(file => !isEmbeddableEvidenceImage(file)).forEach(file => {
        body += p(`${applicationNumber++}. Файл приложен отдельно: ${cleanText(file.name)}.`);
      });
    });
    const evidenceComment = claimData.evidenceComment || claimData.evidenceData?.comment || claimData.evidence_data?.comment;
    if (evidenceComment) body += p(`Комментарий к доказательствам: ${cleanText(evidenceComment)}.`);
  }

  body += spacer(forWord ? 34 : 40);
  const initials = getProductSignatureName(formatNameTitle(applicant.name));
  body += `<p style="${row}">Дата: ${today()} г.</p>`;
  body += `<p style="${row}"><b>Заявитель:</b></p>`;
  body += `<p style="${row}">Подпись: _______________________ /${initials}/</p>`;

  return `<!DOCTYPE html><html lang="ru"${forWord ? " xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'" : ""}><head><meta charset="UTF-8"><style>
    @page{margin:2cm 3cm;} *{box-sizing:border-box;} body{font-family:'Times New Roman',Times,serif;margin:0;padding:${forWord ? "0" : "50px 70px 60px"};background:#fff;color:#111;font-size:${fs};} p{word-break:normal;overflow-wrap:normal;white-space:normal;} table{border-collapse:collapse;} td{border:none;}
  </style></head><body>${body}</body></html>`;
}

function fmtDate(d) {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function fmtLaborDate(value) {
  if (!value) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(value))) return String(value);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : cleanText(String(value));
}

function getLaborOutstanding(circ) {
  if (Number.isFinite(Number(circ.outstandingDebtAmount)) && Number(circ.outstandingDebtAmount) >= 0) return Number(circ.outstandingDebtAmount);
  return Math.max(0, (Number(circ.debtAmount) || 0) - (Number(circ.partialPaymentAmount) || 0));
}

function isIndividualEntrepreneur(employer) {
  const name = String(employer?.name || "").trim();
  return /^(ип\b|индивидуальн(?:ый|ому)\s+предпринимател)/i.test(name) || /^\d{15}$/.test(String(employer?.ogrn || ""));
}

function getLaborEmployerDisplayName(employer) {
  const name = cleanText(employer?.name || "") || "___";
  if (!isIndividualEntrepreneur(employer)) return name;
  const withoutPrefix = name
    .replace(/^ип\s+/i, "")
    .replace(/^индивидуальн(?:ый|ому)\s+предпринимател(?:ь|ю)\s*/i, "")
    .trim();
  return `Индивидуальному предпринимателю ${withoutPrefix || name}`;
}

function getLaborTitle(claimData) {
  const titles = {
    "unpaid-wages": "ПРЕТЕНЗИЯ о выплате задолженности по заработной плате",
    "dismissal-payment": "ПРЕТЕНЗИЯ о произведении окончательного расчёта при увольнении",
    "unlawful-dismissal": "ПРЕТЕНЗИЯ об устранении нарушений трудовых прав при увольнении",
    "employment-documents-withheld": "ПРЕТЕНЗИЯ о выдаче документов, связанных с работой",
  };
  return titles[claimData.subtype] || "ПРЕТЕНЗИЯ об устранении нарушений трудовых прав";
}

function getLaborArticles(claimData) {
  const selected = new Set(claimData.selectedLegalOptions || []);
  const subtype = claimData.subtype;
  const articles = [];
  const add = value => { if (!articles.some(item => item.startsWith(value.split(" — ")[0]))) articles.push(value); };
  if (selected.has("no_employment_contract") || selected.has("actual_admission") || subtype === "no-employment-contract") {
    add("Статья 16 ТК РФ — основания возникновения трудовых отношений и фактический допуск к работе");
    add("Статья 61 ТК РФ — вступление трудового договора в силу и фактическое начало работы");
    add("Статья 67 ТК РФ — обязанность работодателя оформить трудовой договор в письменной форме");
  }
  if (selected.has("salary_delayed") || selected.has("salary_over_two_months") || subtype === "unpaid-wages") add("Статья 136 ТК РФ — сроки и порядок выплаты заработной платы");
  if (selected.has("dismissal_not_paid") || subtype === "dismissal-payment") add("Статья 140 ТК РФ — сроки расчёта при увольнении");
  if (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || selected.has("salary_over_two_months") || subtype === "unpaid-wages" || subtype === "dismissal-payment") add("Статья 236 ТК РФ — денежная компенсация за задержку выплат");
  if (selected.has("salary_over_two_months")) add("Также заявитель обращает внимание, что при наличии предусмотренных законом условий длительная полная невыплата заработной платы может содержать признаки нарушения, предусмотренного статьёй 145.1 УК РФ.");
  return articles;
}

function getLaborDemands(claimData) {
  const circ = claimData.circumstances || {};
  const selected = new Set(claimData.selectedLegalOptions || []);
  const demands = [];
  let number = 1;
  const outstanding = getLaborOutstanding(circ);
  if (outstanding > 0) demands.push(`${number++}) выплатить задолженность по заработной плате в размере ${fmtAmount(outstanding)};`);
  if (outstanding > 0 && (selected.has("salary_delayed") || selected.has("dismissal_not_paid") || claimData.subtype === "unpaid-wages" || claimData.subtype === "dismissal-payment")) demands.push(`${number++}) выплатить денежную компенсацию за задержку выплат в размере не ниже 1/150 действующей в соответствующий период ключевой ставки Банка России от невыплаченной в срок суммы за каждый день задержки, начиная со следующего дня после установленного срока выплаты по день фактического расчёта включительно;`);
  if (selected.has("dismissal_not_paid") || claimData.subtype === "dismissal-payment") demands.push(`${number++}) произвести окончательный расчёт при увольнении;`);
  if (claimData.subtype === "employment-documents-withheld") demands.push(`${number++}) выдать надлежащим образом заверенные документы, связанные с работой;`);
  demands.push(`${number++}) предоставить письменный ответ на настоящую претензию способом, позволяющим подтвердить его получение.`);
  return demands;
}

function isEmbeddableEvidenceImage(file) {
  if (!file?.url) return false;
  return /^image\/(jpeg|png|webp)$/i.test(file.type || "") || /\.(jpg|jpeg|png|webp)$/i.test(file.name || "");
}

function getEvidenceFilesForLabel(rawFiles, evidenceLabel) {
  const value = Array.isArray(rawFiles)
    ? rawFiles.filter(file => (file?.evidenceLabel || file?.evidenceId) === evidenceLabel)
    : rawFiles?.[evidenceLabel];
  const source = Array.isArray(value) ? value : Array.isArray(value?.files) ? value.files : value?.name ? [value] : [];
  return source
    .filter(file => file?.name)
    .map(file => ({ ...file, evidenceId: file.evidenceId || evidenceLabel, evidenceLabel: file.evidenceLabel || evidenceLabel }))
    .filter((file, index, files) => files.findIndex(other => (file.id && other.id === file.id) || (!file.id && other.name === file.name && other.size === file.size && other.url === file.url)) === index);
}

function getLaborEvidenceGroups(claimData) {
  const evidence = (claimData.evidence || []).filter(item => item && item !== "Нет доказательств" && isValidText(item));
  return evidence.map(label => ({ label, files: getEvidenceFilesForLabel(claimData.evidenceFiles || {}, label) }));
}

function getLaborApplicationItems(claimData) {
  const groups = getLaborEvidenceGroups(claimData);
  const evidenceItems = groups.map(group => {
    if (!group.files.length) return group.label;
    const names = group.files.map((_, index) => `${group.label}${group.files.length > 1 ? ` ${index + 1}` : ""}`);
    const embeddedNames = names.filter((_, index) => isEmbeddableEvidenceImage(group.files[index]));
    const separateNames = names.filter((_, index) => !isEmbeddableEvidenceImage(group.files[index]));
    const details = [];
    if (embeddedNames.length) details.push(`${embeddedNames.length > 1 ? "файлы" : "файл"}: ${embeddedNames.join(", ")}`);
    if (separateNames.length) details.push(`${separateNames.length > 1 ? "файлы приложены отдельно" : "файл приложен отдельно"}: ${separateNames.join(", ")}`);
    return `${group.label} — ${details.join("; ")}.`;
  });
  const comment = isValidText(claimData.evidenceComment || "") ? `Иные сведения о доказательствах: ${normalizeLaborText(claimData.evidenceComment)}` : "";
  return [...evidenceItems, ...(comment ? [comment] : [])];
}

function getLaborApplications(claimData) {
  return getLaborApplicationItems(claimData);
}

function formatNameTitle(name) {
  if (!name) return name;
  return name
    .replace(/[0-9]/g, "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function declineApplicantName(fullName, gender) {
  if (!fullName) return fullName;
  const parts = fullName.trim().split(/\s+/);
  const patronymic = parts[2] || "";
  if (/(?:ович|евич|ич)а$/iu.test(patronymic) || /(?:овн|евн|ичн)ы$/iu.test(patronymic)) return parts.join(" ");
  const resolvedGender = gender === "female" || gender === "male"
    ? gender
    : /(?:овна|евна|ична)$/iu.test(patronymic) ? "female" : /ич$/iu.test(patronymic) ? "male" : "";
  if (!resolvedGender) return parts.join(" ");
  const female = resolvedGender === "female";

  return parts.map((part, idx) => {
    if (/^(оглы|кызы|угли|улы|гызы|оглу)$/iu.test(part)) return part;
    if (female) {
      if (idx === 0 && /(?:ова|ева|ёва|ина|ына)$/iu.test(part)) return `${part.slice(0, -1)}ой`;
      if (idx === 1 && /ия$/iu.test(part)) return `${part.slice(0, -1)}и`;
      if (idx === 1 && /ья$/iu.test(part)) return `${part.slice(0, -1)}и`;
      if (idx === 1 && /[гкх]а$/iu.test(part)) return `${part.slice(0, -1)}и`;
      if (idx === 1 && /а$/iu.test(part)) return `${part.slice(0, -1)}ы`;
      if (idx === 1 && /я$/iu.test(part)) return `${part.slice(0, -1)}и`;
      if (idx === 2 && /(?:овна|евна|ична)$/iu.test(part)) return `${part.slice(0, -1)}ы`;
      if (idx === 2 && /(?:ова|ева|ёва)$/iu.test(part)) return `${part.slice(0, -1)}ны`;
      return part;
    }
    if (idx === 0 && /(?:ов|ев|ёв|ин|ын)$/iu.test(part)) return `${part}а`;
    if (idx === 1 && /^П[её]тр$/iu.test(part)) return "Петра";
    if (idx === 1 && /ей$/iu.test(part)) return `${part.slice(0, -1)}я`;
    if (idx === 1 && /[бвгджзклмнпрстфхцчшщ]$/iu.test(part)) return `${part}а`;
    if (idx === 2 && /ич$/iu.test(part)) return `${part}а`;
    return part;
  }).join(" ");
}

function toGenitive(fullName) {
  if (!fullName) return fullName;
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, idx) => {
    if (/^(оглы|кызы|угли|улы|гызы|оглу)$/i.test(part)) return part;
    if (/[оё]вич$/i.test(part)) return part + "а";
    if (/[оё]вна$/i.test(part)) return part.slice(0,-1) + "ой";
    if (/[её]ва$/i.test(part)) return part.slice(0,-2) + "ой";
    if (/ова$/i.test(part)) return part.slice(0,-2) + "ой";
    if (/[иы]на$/i.test(part)) return part.slice(0,-2) + "ой";
    if (/[её]в$/i.test(part)) return part + "а";
    if (/ов$/i.test(part)) return part + "а";
    if (/[иы]н$/i.test(part)) return part + "а";
    if (idx === 1 && /[бвгджзклмнпрстфхцчшщ]$/i.test(part)) return part + "а";
    if (/я$/i.test(part) && part.length > 3) return part.slice(0,-1) + "и";
    if (/[аА]$/.test(part) && part.length > 3) return part.slice(0,-1) + "ы";
    return part;
  }).join(" ");
}

function safeValue(value) {
  if (value === null || value === undefined) return "";
  const text = cleanText(String(value));
  return /^(?:undefined|null|nan)$/i.test(text) ? "" : text;
}

function collectiveShortName(fullName) {
  const parts = safeValue(fullName).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return safeValue(fullName);
  return `${parts[0]} ${parts.slice(1).map(part => `${part[0].toUpperCase()}.`).join(" ")}`;
}

function safeCollectiveGenitive(fullName, gender) {
  const original = safeValue(fullName);
  if (!original) return "";
  const declined = declineApplicantName(original, gender);
  if (!declined || /ичич/iu.test(declined) || declined.split(/\s+/).length !== original.split(/\s+/).length) return original;
  return declined;
}

function normalizeCollectiveFiles(rawFiles, evidenceItems) {
  const files = [];
  if (Array.isArray(rawFiles)) files.push(...rawFiles);
  else if (rawFiles && typeof rawFiles === "object") Object.entries(rawFiles).forEach(([label, values]) => {
    const list = Array.isArray(values) ? values : values ? [values] : [];
    list.forEach(file => files.push({ ...file, evidenceLabel: file?.evidenceLabel || label }));
  });
  return files.filter(Boolean).map(file => ({
    ...file,
    url: file.url || file.data || file.base64 || "",
    evidenceLabel: safeValue(file.evidenceLabel || file.evidenceId) || evidenceItems[0] || "Доказательство",
  }));
}

export function normalizeCollectiveMember(member = {}) {
  const claimant = member.claimantData || member.claimData?.workers?.[0] || member.claimData?.claimantData || member;
  const circumstances = member.circumstancesData || member.circumstances || member.claimData?.circumstances || {};
  const evidenceData = member.evidenceData || member.claimData?.evidenceData || {};
  const selectedEvidence = Array.isArray(evidenceData.selected)
    ? evidenceData.selected
    : Array.isArray(member.evidence)
      ? member.evidence
      : Array.isArray(member.claimData?.evidence)
        ? member.claimData.evidence
        : [];
  const evidenceItems = selectedEvidence
    .filter(item => safeValue(typeof item === "string" ? item : item?.label || item?.evidenceLabel))
    .map(item => safeValue(typeof item === "string" ? item : item.label || item.evidenceLabel));
  const fullName = formatNameTitle(claimant.name || claimant.fullName || member.name || "");
  const start = fmtLaborDate(circumstances.workStart || circumstances.workStartDate);
  const end = circumstances.stillWorking ? "по настоящее время" : fmtLaborDate(circumstances.workEnd || circumstances.workEndDate);
  const workPeriod = [start, end].filter(Boolean).join(" — ");
  const legalFlags = [...new Set([
    ...(Array.isArray(member.selectedLegalOptions) ? member.selectedLegalOptions : []),
    ...(Array.isArray(member.claimData?.selectedLegalOptions) ? member.claimData.selectedLegalOptions : []),
    ...(Array.isArray(circumstances.legalFlags) ? circumstances.legalFlags : []),
  ].filter(Boolean))];
  return {
    id: member.id || member.participantId || "",
    slotIndex: Number(member.slotIndex || 0),
    fullName,
    fullNameGenitive: safeCollectiveGenitive(fullName, claimant.gender),
    shortName: collectiveShortName(fullName),
    address: normalizeLaborAddress(claimant.address),
    phone: normalizeLaborPhone(claimant.phone),
    email: safeValue(claimant.email),
    position: normalizeLaborText(claimant.position || circumstances.position || "").replace(/[.!?]+$/, ""),
    workPeriod,
    workStartDate: start,
    workEndDate: end,
    workplaceAddress: normalizeLaborAddress(circumstances.workplace || circumstances.workplaceAddress),
    debtAmount: Number(circumstances.outstandingDebtAmount || circumstances.debtAmount || 0) || 0,
    paymentForm: safeValue(Array.isArray(circumstances.paymentForm) ? circumstances.paymentForm.join(", ") : circumstances.paymentForm),
    description: normalizeLaborText(circumstances.description),
    extraCircumstances: legalFlags.map(flag => safeValue(flag).replace(/[_-]+/g, " ")),
    legalFlags,
    evidenceItems,
    files: normalizeCollectiveFiles(evidenceData.files || member.evidenceFiles || member.claimData?.evidenceFiles || {}, evidenceItems),
  };
}

function getCollectiveLaborMembers(claimData) {
  const hasCollectiveMembersField = Object.prototype.hasOwnProperty.call(claimData || {}, "collectiveMembers");
  const collective = Array.isArray(claimData?.collectiveMembers) ? claimData.collectiveMembers : [];
  const excludedStatuses = new Set(["pending", "invited", "draft", "incomplete"]);
  const isCompletedMember = member => {
    const status = safeValue(member?.status).toLowerCase();
    if (excludedStatuses.has(status)) return false;
    if (status) return status === "completed" || status === "done" || status === "filled";
    return Boolean(member?.completedAt || member?.completed_at) || Boolean(
      safeValue(member?.claimantData?.name || member?.claimantData?.fullName || member?.claim_data?.workers?.[0]?.name)
    );
  };
  const fallbackWorkers = (Array.isArray(claimData?.workers) ? claimData.workers : []).filter((worker, index) => {
    if (!worker) return false;
    const status = safeValue(worker.status).toLowerCase();
    if (excludedStatuses.has(status)) return false;
    if (status) return status === "completed" || status === "done" || status === "filled";
    const claimant = worker.claimantData || worker;
    const circumstances = worker.circumstancesData || worker.circumstances || (index === 0 ? claimData?.circumstances : {}) || {};
    const hasName = Boolean(safeValue(claimant.name || claimant.fullName));
    const hasContact = Boolean(safeValue(claimant.address) || safeValue(claimant.phone));
    const hasCircumstances = Boolean(
      safeValue(circumstances.description || circumstances.workStart || circumstances.workplace) ||
      Number(circumstances.outstandingDebtAmount || circumstances.debtAmount || 0) > 0
    );
    return hasName && hasContact && hasCircumstances;
  });
  const source = hasCollectiveMembersField
    ? collective.filter(isCompletedMember)
    : fallbackWorkers.map((worker, index) => ({
      ...worker,
      slotIndex: worker.slotIndex || index + 1,
      status: "completed",
      claimantData: worker.claimantData || worker,
      circumstancesData: worker.circumstancesData || worker.circumstances || (index === 0 ? claimData.circumstances : {}) || {},
    }));
  return source.map(normalizeCollectiveMember).sort((a, b) => (a.slotIndex || 999) - (b.slotIndex || 999));
}

function isCollectiveLabor(claimData) {
  const type = claimData?.type || claimData?.category;
  return (claimData?.mode || claimData?.claimMode) === "collective" && (type === "labor" || getLegacyPdfType(type) === "labor");
}

function buildCollectiveLaborDocument(claimData, forWord = false) {
  const members = getCollectiveLaborMembers(claimData);
  const employer = claimData.employer || {};
  const unit = forWord ? "pt" : "px";
  const fontSize = forWord ? "12pt" : "12px";
  const row = `font-size:${fontSize};line-height:1.55;margin:0 0 4${unit};color:#111;`;
  const P = text => text ? `<p style="${row}margin-bottom:${forWord ? "9pt" : "10px"};">${text}</p>` : "";
  const H = text => `<p style="font-size:${fontSize};font-weight:700;text-transform:uppercase;margin:${forWord ? "16pt" : "18px"} 0 7${unit};color:#111;">${text}</p>`;
  const field = (label, value) => value ? `<p style="${row}"><b>${label}:</b> ${value}</p>` : "";
  const employerName = getLaborEmployerDisplayName(employer) || "не указано";
  const registrationLabel = isIndividualEntrepreneur(employer) ? "ОГРНИП" : "ОГРН";
  const allFlags = new Set([...(claimData.selectedLegalOptions || []), ...members.flatMap(member => member.legalFlags)]);
  const hasNoContract = allFlags.has("no_employment_contract") || allFlags.has("actual_admission");
  const overTwoMonths = allFlags.has("salary_over_two_months");
  const totalDebt = members.reduce((sum, member) => sum + member.debtAmount, 0);
  let body = "";
  if (forWord) {
    body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18pt;border:none;table-layout:fixed;"><tr>
<td width="50%" style="vertical-align:top;border:none;"></td>
<td width="50%" style="vertical-align:top;border:none;text-align:left;">
<p style="${row}"><b>Работодателю:</b></p><p style="${row}"><b>${employerName}</b></p>
${field("ИНН", safeValue(employer.inn))}${field(registrationLabel, safeValue(employer.ogrn))}${field("Юридический адрес", normalizeLaborAddress(employer.address))}
</td></tr></table>`;
  } else {
    body += `<div style="margin-left:48%;margin-bottom:18${unit};">`;
    body += `<p style="${row}"><b>Работодателю:</b></p><p style="${row}"><b>${employerName}</b></p>`;
    body += field("ИНН", safeValue(employer.inn));
    body += field(registrationLabel, safeValue(employer.ogrn));
    body += field("Юридический адрес", normalizeLaborAddress(employer.address));
    body += `</div>`;
  }
  body += `<div style="margin-bottom:18${unit};"><p style="${row}"><b>От коллективных заявителей:</b></p>`;
  members.forEach((member, index) => {
    body += `<div style="margin:8${unit} 0 12${unit};"><p style="${row}"><b>${index + 1}. ${member.fullName || "ФИО не указано"}</b></p>`;
    body += field("Адрес", member.address) + field("Телефон", member.phone) + field("Email", member.email) + field("Должность", member.position) + `</div>`;
  });
  body += `</div><p style="font-size:${forWord ? "14pt" : "14px"};font-weight:700;text-align:center;margin:18${unit} 0 5${unit};letter-spacing:.5px;">КОЛЛЕКТИВНАЯ ПРЕТЕНЗИЯ</p>`;
  body += `<p style="${row}font-weight:700;text-align:center;margin-bottom:18${unit};">о выплате задолженности по заработной плате</p>`;
  body += P("Мы, нижеподписавшиеся заявители, обращаемся к работодателю в связи с нарушением трудовых прав, невыплатой заработной платы и иными обстоятельствами, указанными ниже.");
  body += H("Сведения о заявителях");
  members.forEach((member, index) => {
    body += `<div style="border-left:2px solid #bbb;padding-left:10${unit};margin-bottom:12${unit};"><p style="${row}"><b>Заявитель №${index + 1}</b></p>`;
    body += field("ФИО", member.fullName) + field("Адрес", member.address) + field("Телефон", member.phone) + field("Email", member.email) + field("Должность", member.position) + field("Период работы", member.workPeriod) + field("Сумма задолженности", member.debtAmount ? fmtAmount(member.debtAmount) : "не указано") + `</div>`;
  });
  body += H("Общие обстоятельства");
  body += P(`Все заявители указывают на трудовые отношения с одним работодателем: ${employerName}. Каждый заявитель сообщает о нарушении его трудовых прав. Индивидуальные обстоятельства, периоды работы, суммы задолженности и доказательства приведены отдельно по каждому заявителю.`);
  body += H("Индивидуальные обстоятельства заявителей");
  members.forEach((member, index) => {
    body += `<div style="margin-bottom:14${unit};"><p style="${row}"><b>Заявитель №${index + 1}: ${member.fullName || "ФИО не указано"}</b></p>`;
    body += field("Период работы", member.workPeriod) + field("Должность", member.position) + field("Место работы / адрес объекта", member.workplaceAddress) + field("Сумма задолженности", member.debtAmount ? fmtAmount(member.debtAmount) : "не указано") + field("Форма оплаты", member.paymentForm);
    if (member.description) body += field("Описание обстоятельств", member.description);
    if (member.extraCircumstances.length) body += field("Дополнительные обстоятельства", member.extraCircumstances.join(", "));
    body += `</div>`;
  });
  body += H("Расчёт требований");
  members.forEach((member, index) => { body += P(`${index + 1}. ${member.fullName || "ФИО не указано"} — задолженность: ${member.debtAmount ? `${member.debtAmount.toLocaleString("ru-RU")} ₽` : "не указана"}.`); });
  if (totalDebt > 0) body += P(`<b>Общая сумма заявленных требований по задолженности: ${totalDebt.toLocaleString("ru-RU")} ₽.</b>`);
  body += H("Правовое обоснование требований");
  const articles = ["Статья 136 ТК РФ — порядок и сроки выплаты заработной платы.", "Статья 236 ТК РФ — денежная компенсация за задержку выплат."];
  if (hasNoContract) articles.unshift("Статьи 16, 61 и 67 ТК РФ — возникновение трудовых отношений, фактический допуск к работе и оформление трудового договора.");
  if (overTwoMonths) articles.push("При наличии предусмотренных законом оснований невыплата свыше двух месяцев может повлечь ответственность по статье 145.1 УК РФ.");
  articles.forEach((article, index) => { body += P(`${index + 1}. ${article}`); });
  body += H("Требования");
  body += P("<b>ТРЕБУЕМ незамедлительно, но не позднее 10 календарных дней со дня получения настоящей претензии:</b>");
  body += P('1) выплатить каждому заявителю задолженность по заработной плате в размере, указанном в разделе «Расчёт требований»;');
  body += P("2) выплатить каждому заявителю денежную компенсацию за задержку выплат по статье 236 ТК РФ;");
  body += P("3) предоставить письменный ответ по существу требований;");
  if (hasNoContract) body += P("4) оформить трудовые отношения и выдать необходимые документы.");
  body += H("В случае отказа");
  body += P("В случае неисполнения требований в установленный срок заявители будут вынуждены обратиться в Государственную инспекцию труда, прокуратуру и суд.");
  body += H("Приложения");
  const membersWithEvidence = members.filter(member => member.evidenceItems.length || member.files.length);
  if (!membersWithEvidence.length) body += P("Приложения не указаны.");
  membersWithEvidence.forEach((member) => {
    const memberIndex = members.indexOf(member);
    body += `<p style="${row}"><b>Приложения заявителя №${memberIndex + 1} ${member.fullNameGenitive || member.fullName}:</b></p>`;
    const labels = [...new Set([...member.evidenceItems, ...member.files.map(file => file.evidenceLabel)])];
    labels.forEach((label, labelIndex) => {
      const files = member.files.filter(file => file.evidenceLabel === label);
      const nonImages = files.filter(file => !isEmbeddableEvidenceImage(file));
      body += P(`${labelIndex + 1}. ${label}.`);
      nonImages.forEach(file => { body += P(`Файл приложен отдельно: ${safeValue(file.name) || label}.`); });
    });
  });
  body += H("Подписи заявителей");
  members.forEach((member, index) => {
    body += `<div style="margin-bottom:16${unit};"><p style="${row}"><b>Заявитель №${index + 1}:</b> ${member.fullName || "ФИО не указано"}</p><p style="${row}">Подпись: __________________ /${member.shortName || member.fullName}/</p><p style="${row}">Дата: ${today()} г.</p></div>`;
  });
  return `<!DOCTYPE html><html lang="ru"${forWord ? " xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'" : ""}><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">${forWord ? "<meta name=ProgId content=Word.Document>" : ""}<style>${forWord ? "@page{margin:2cm 3cm;}" : ""}*{box-sizing:border-box}body{font-family:'Times New Roman',Times,serif;margin:0;padding:${forWord ? "0" : "50px 70px 60px"};background:#fff;color:#111;font-size:${fontSize}}p{word-break:normal;overflow-wrap:normal;white-space:normal}table{border-collapse:collapse}td{border:none}</style></head><body>${body}</body></html>`;
}

export function buildHtml(claimData) { // exported for preview and docx
  if (isCollectiveLabor(claimData) && getCollectiveLaborMembers(claimData).length > 0) return buildCollectiveLaborDocument(claimData, false);
  if (isSoloProduct(claimData)) return buildProductDocument(claimData, false);
  const employer = claimData.employer || {};
  const workers = claimData.workers || [];
  const circ = claimData.circumstances || {};
  const evidence = claimData.evidence || [];
  const witness = claimData.witness;
  const type = claimData.type || "universal";
  const legacyType = getLegacyPdfType(type);
  const law = LAWS[legacyType] || LAWS.universal;

  const ROW = `font-size:12px;margin:0 0 4px;line-height:1.8;color:#111;word-break:normal;overflow-wrap:break-word;`;
  const sp = (n = 12) => `<div style="height:${n}px"></div>`;
  const p = (t) => {
    const cleaned = cleanText(t);
    if (!cleaned) return "";
    return `<p style="font-size:12px;margin:0 0 12px;line-height:1.9;color:#111;word-break:normal;overflow-wrap:normal;white-space:normal;">${cleaned}</p>`;
  };
  const H = (t) => `<p style="font-size:12px;font-weight:700;margin:20px 0 8px;line-height:1.5;color:#111;text-transform:uppercase;word-break:normal;">${t}</p>`;
  const dash = (t) => `<p style="font-size:12px;margin:0 0 6px;line-height:1.8;color:#111;padding-left:12px;word-break:normal;">&#8211;&nbsp;${cleanText(t)};</p>`;

  const w0 = workers[0] || {};
  const gender = w0.gender || "male";
  const forced = gender === "female" ? "вынуждена" : "вынужден";
  const w0Name = formatNameTitle(w0.name);
  const laborEmployerDisplayName = type === "labor" ? getLaborEmployerDisplayName(employer) : employer.name;
  const laborRegistrationLabel = isIndividualEntrepreneur(employer) ? "ОГРНИП:" : "ОГРН:";
  const displayedEmployerAddress = type === "labor" ? normalizeLaborAddress(employer.address) : employer.address;
  const displayedWorkerAddress = type === "labor" ? normalizeLaborAddress(w0.address) : w0.address;

  // ── ШАПКА: ОТВЕТЧИК СПРАВА ──
  let body = type === "labor"
    ? `<div style="width:50%;max-width:360px;margin-left:auto;text-align:left;margin-bottom:0;">`
    : `<div style="text-align:right;margin-bottom:0;">`;
  body += `<p style="${ROW}"><b>${type === "labor" ? "Работодателю:" : "Руководству:"}</b></p>`;
  body += `<p style="${ROW}"><b>${laborEmployerDisplayName || "___"}</b></p>`;
  if (employer.ogrn) body += `<p style="${ROW}"><b>${type === "labor" ? laborRegistrationLabel : "ОГРН:"}</b> ${employer.ogrn}</p>`;
  if (employer.inn) body += `<p style="${ROW}"><b>ИНН:</b> ${employer.inn}</p>`;
  if (employer.kpp) body += `<p style="${ROW}"><b>КПП:</b> ${employer.kpp}</p>`;
  if (displayedEmployerAddress) {
    body += `<p style="${ROW}"><b>Юридический адрес:</b></p>`;
    body += `<p style="${ROW}">${displayedEmployerAddress}</p>`;
  }
  body += `</div>`;

  // ── ЗАЯВИТЕЛЬ СЛЕВА ──
  body += sp(20);
  body += `<div style="text-align:left;">`;
  body += `<p style="${ROW}"><b>От:</b></p>`;
  body += `<p style="${ROW}"><b>${(type === "labor" ? declineApplicantName(w0Name, gender) : toGenitive(w0Name)) || "___"}</b></p>`;
  if (w0.birthDate) body += `<p style="${ROW}"><b>Дата рождения:</b> ${w0.birthDate}</p>`;
  if (displayedWorkerAddress) {
    body += `<p style="${ROW}"><b>Адрес проживания:</b></p>`;
    body += `<p style="${ROW}">${displayedWorkerAddress}</p>`;
  }
  if (w0.phone) body += `<p style="${ROW}"><b>Контактный телефон:</b> ${type === "labor" ? normalizeLaborPhone(w0.phone) : w0.phone}</p>`;
  if (w0.email) body += `<p style="${ROW}"><b>Электронная почта:</b> ${w0.email}</p>`;
  if (workers.length > 1) {
    workers.slice(1).forEach(w => {
      const additionalAddress = type === "labor" ? normalizeLaborAddress(w.address) : w.address;
      body += `<p style="${ROW}">${w.name || "___"}${additionalAddress ? ", " + additionalAddress : ""}${w.phone ? ", тел: " + (type === "labor" ? normalizeLaborPhone(w.phone) : w.phone) : ""}</p>`;
    });
  }
  body += `</div>`;

  // ── ЗАГОЛОВОК ПО ЦЕНТРУ ──
  body += sp(30);
  body += `<div style="text-align:center;margin:30px 0 24px;">`;
  body += `<p style="font-size:14px;font-weight:700;margin:0 0 10px;color:#111;letter-spacing:1px;word-break:normal;">ПРЕТЕНЗИЯ</p>`;
  // subtitle — всё после "ПРЕТЕНЗИЯ" — выводим целиком без разрыва слов
  const documentTitle = type === "labor" ? getLaborTitle(claimData) : law.title;
  const subtitle = (documentTitle || "").replace(/^ПРЕТЕНЗИЯ\s*/i, "").trim();
  if (subtitle) {
    body += `<p style="font-size:12px;font-weight:700;margin:0;color:#111;line-height:1.8;word-break:normal;white-space:normal;">${subtitle}</p>`;
  }
  body += `</div>`;

  // ── ВСТУПЛЕНИЕ И ОБСТОЯТЕЛЬСТВА ──
  if (type === "labor") {
    const laborOptions = new Set(claimData.selectedLegalOptions || []);
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с невыплатой заработной платы, нарушением моих трудовых прав и с целью досудебного урегулирования трудового спора.`);

    body += H("Обстоятельства работы:");
    const workStart = circ.workStart ? fmtLaborDate(circ.workStart) : null;
    const workEnd = circ.stillWorking || !circ.workEnd || circ.workEnd === "настоящее время" ? "настоящее время" : fmtLaborDate(circ.workEnd);
    const workedVerb = gender === "female" ? "выполняла" : "выполнял";
    body += p(`Я, ${w0Name || "___"}, ${workedVerb} трудовые обязанности в интересах ${employer.name || "___"}${workStart ? " в период с " + workStart + " по " + workEnd : ""}.`);

    if (laborOptions.has("no_employment_contract")) {
      body += p("Трудовой договор со мной заключён не был, несмотря на фактический допуск к работе, что является нарушением статьи 67 Трудового кодекса Российской Федерации.");
    }
    if (laborOptions.has("actual_admission")) body += p("Заявитель был фактически допущен к выполнению трудовых обязанностей с ведома и по поручению работодателя.");
    if (circ.supervisor) {
      body += p(`Непосредственный руководитель: ${cleanText(circ.supervisor)}.`);
    }
    if (circ.workplace) {
      body += p(`Трудовые обязанности выполнялись на объекте по адресу: ${normalizeLaborAddress(circ.workplace)}.`);
    }
    if (circ.description && isValidText(circ.description)) {
      body += `<p style="font-size:12px;margin:0 0 6px;line-height:1.8;color:#111;font-weight:700;">Дополнительно заявитель указывает:</p>`;
      body += p(normalizeLaborText(circ.description));
    }
    if (circ.dueDate) body += p(`Плановая дата выплаты заработной платы: ${fmtLaborDate(circ.dueDate)}.${circ.delayDays ? ` Просрочка составляет ${Number(circ.delayDays)} дней.` : ""}`);
    if (circ.dismissalDate) body += p(`Дата увольнения: ${fmtLaborDate(circ.dismissalDate)}.`);
    if (Number(circ.partialPaymentAmount) > 0 || (circ.partialPayments && isValidText(circ.partialPayments))) body += p(`Работодателем произведена частичная выплата${Number(circ.partialPaymentAmount) > 0 ? ` в размере ${fmtAmount(circ.partialPaymentAmount)}` : ""}${circ.lastPartialPaymentDate ? ` ${fmtLaborDate(circ.lastPartialPaymentDate)}` : ""}${circ.partialPayments && isValidText(circ.partialPayments) ? `: ${normalizeLaborText(circ.partialPayments).replace(/[.!?]+$/, "")}` : ""}.`);
    const outstandingDebt = getLaborOutstanding(circ);
    const hasPartialPayments = Number(circ.partialPaymentAmount) > 0 || (circ.partialPayments && isValidText(circ.partialPayments));
    if (outstandingDebt > 0) body += p(hasPartialPayments
      ? `После учёта частичных выплат размер задолженности составляет ${fmtAmount(outstandingDebt)}.`
      : `Размер задолженности по заработной плате составляет ${fmtAmount(outstandingDebt)}.`);
    if (laborOptions.has("salary_over_two_months")) body += p("Период полной невыплаты заработной платы превышает два месяца.");
    if (circ.paymentForm) {
      const forms = Array.isArray(circ.paymentForm) ? circ.paymentForm.join(", ") : circ.paymentForm;
      if (forms) body += p(`Форма оплаты труда: ${forms}.`);
    }

    // ПОДТВЕРЖДЕНИЕ ДОПУСКА — только выбранные доказательства
    const proofItems = [];
    if (evidence.some(e => /перепис/i.test(e))) proofItems.push("перепиской с представителем работодателя, действовавшим от его имени");
    if (evidence.some(e => /перевод|банк/i.test(e))) proofItems.push("переводами денежных средств, осуществлёнными в счёт оплаты выполненных работ");
    if (evidence.some(e => /табел/i.test(e))) proofItems.push("журналом (табелем) учёта рабочего времени");
    if (evidence.some(e => /пропуск|допуск/i.test(e))) proofItems.push("документами о фактическом допуске к работе");
    if (witness?.name) proofItems.push("свидетельскими показаниями работника");

    if (proofItems.length > 0) {
      body += H("Подтверждение фактического допуска к работе:");
      body += `<p style="font-size:12px;margin:0 0 8px;line-height:1.9;color:#111;font-weight:700;">Факт выполнения мной трудовых обязанностей подтверждается:</p>`;
      proofItems.forEach(item => { body += dash(item); });
      body += sp(6);
    }

  } else if (type === "product") {
    const productSeller = cleanText(circ.sellerName) || employer.name || "___";
    body += p(`Настоящая претензия направляется в адрес ${productSeller} в связи с реализацией товара ненадлежащего качества, нарушением прав потребителя и с целью досудебного урегулирования спора.`);
    body += buildProductCircumstances(circ, employer.name, p, H);

  } else if (legacyType === "infoproduct") {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с нарушением условий оказания услуг и с целью досудебного урегулирования спора.`);
    body += buildCourseCircumstances(circ, p, H);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);

  } else if (type === "civil") {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в целях досудебного урегулирования спора о возврате долга.`);
    body += H("Обстоятельства:");
    body += p(`${circ.contractDate ? "«" + fmtDate(circ.contractDate) + "»" : "Ранее"} между мной и ${employer.name || "___"} был заключён договор/расписка. Сумма обязательства: ${circ.debtAmount && Number(circ.debtAmount) > 0 ? fmtAmount(circ.debtAmount) : "___"}.${circ.delayDays ? " Просрочка: " + circ.delayDays + " дней." : ""}`);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);

  } else {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с нарушением прав и законных интересов и с целью досудебного урегулирования спора.`);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);
  }

  // ── СОЦИАЛЬНО ЗНАЧИМЫЕ ПОСЛЕДСТВИЯ ──
  if (circ.socialImpact && isValidText(circ.socialImpact)) {
    body += H("Социально значимые последствия:");
    const socialPrefixes = {
      labor: "Сложившаяся ситуация повлекла следующие социально значимые последствия",
      product: "Приобретение некачественного товара повлекло следующие социально значимые последствия",
      infoproduct: "Сложившаяся ситуация повлекла следующие социально значимые последствия",
      civil: "Невозврат денежных средств повлёк следующие социально значимые последствия",
    };
    const prefix = socialPrefixes[type] || "Сложившаяся ситуация повлекла следующие социально значимые последствия";
    body += p(`${prefix}: ${type === "labor" ? normalizeLaborText(circ.socialImpact).replace(/[.!?]+$/, "") : cleanText(circ.socialImpact)}.`);
  }

  const selectedOptions = claimData.selectedLegalOptions || [];
  const selectedBlocks = getSelectedDocumentBlocks(type, selectedOptions);
  if (selectedBlocks.length) {
    body += H("Дополнительные обстоятельства:");
    selectedBlocks.forEach(block => { body += p(block); });
  }

  // ── НАРУШЕНИЯ ЗАКОНОДАТЕЛЬСТВА ──
  body += H(type === "labor" ? "Правовое обоснование требований:" : "Выявленные нарушения законодательства:");
  const legacyArticles = legacyType === "labor" && law.getArticles ? law.getArticles(claimData) : law.articles;
  const selectedArticles = getSelectedLegalReferences(type, selectedOptions);
  const articles = type === "labor" ? legacyArticles : [...new Set(legacyType === "infoproduct" || (type === "product" && selectedArticles.length) ? selectedArticles : [...(legacyArticles || []), ...selectedArticles])];
  articles.forEach(a => {
    body += `<p style="font-size:12px;margin:0 0 6px;line-height:1.8;color:#111;word-break:normal;white-space:normal;">${a}</p>`;
  });

  // ── ТРЕБОВАНИЯ ──
  body += H("Требования:");
  body += p(legacyType === "infoproduct"
    ? "ТРЕБУЮ:"
    : type === "labor"
      ? "ТРЕБУЮ исполнить следующие требования незамедлительно, но не позднее 10 (десяти) календарных дней со дня получения настоящей претензии:"
      : "ТРЕБУЮ в течение 10 (десяти) календарных дней с момента получения настоящей претензии:");
  const selectedDemands = getSelectedRequirementTexts(type, selectedOptions);
  const productDemands = type === "product" ? getProductDemands(circ) : [];
  const demands = [...new Set(type === "labor" ? law.demands(claimData) : type === "product" ? [...selectedDemands, ...productDemands] : legacyType === "infoproduct" ? selectedDemands : [...(law.demands(claimData) || []), ...selectedDemands])];
  demands.forEach(d => {
    body += `<p style="font-size:12px;margin:0 0 8px;line-height:1.8;color:#111;word-break:normal;">${cleanText(d)}</p>`;
  });

  if (legacyType === "infoproduct" || type === "product") {
    body += H("Срок исполнения:");
    body += p(type === "product"
      ? "Требования подлежат удовлетворению в сроки, установленные Законом РФ «О защите прав потребителей»."
      : "Требования должны быть исполнены в течение 10 (десяти) календарных дней с момента получения настоящей претензии.");
  }

  // ── В СЛУЧАЕ ОТКАЗА ──
  body += H("В случае отказа:");
  body += p(type === "product"
    ? "В случае отказа в добровольном удовлетворении требований заявитель оставляет за собой право обратиться в уполномоченные органы и суд для защиты нарушенных прав потребителя."
    : legacyType === "infoproduct"
    ? `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Роспотребнадзор и суд за защитой прав потребителя.`
    : type === "labor" && (claimData.selectedLegalOptions || []).includes("salary_over_two_months")
    ? `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Государственную инспекцию труда, прокуратуру и суд, а также поставить перед компетентными органами вопрос о проверке обстоятельств по статье 145.1 УК РФ.`
    : `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Государственную инспекцию труда, прокуратуру и суд.`);

  // ── ПРИЛОЖЕНИЯ ──
  const allEv = type === "labor" ? getLaborApplications(claimData) : [...new Set([...evidence.filter(ev => ev && isValidText(ev)), ...getEvidenceHints(type, selectedOptions), ...(type === "product" ? getProductEvidence(circ) : [])])];
  if (allEv.length > 0) {
    body += H("Приложения:");
    allEv.forEach((ev, i) => {
      body += `<p style="font-size:12px;margin:0 0 5px;line-height:1.8;color:#111;">${i + 1}. ${ev}${type === "labor" && !/[.!?]$/.test(ev) ? "." : ""}</p>`;
    });
  }

  // ── СВИДЕТЕЛЬ ──
  const todayFormatted = new Date().toLocaleDateString("ru-RU");
  if (witness?.name) {
    body += sp(20);
    body += H("Свидетель (ознакомлен и подтверждает):");
    body += p(`Я, ${witness.name}${witness.birthDate ? ", дата рождения: " + witness.birthDate : ""}, подтверждаю изложенные обстоятельства фактического допуска к работе и выполнения трудовых обязанностей в интересах ${employer.name || "___"}.`);
    body += sp(36);
    const wInitials = witness.name.split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
    body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;"><b>Свидетель:</b></p>`;
    body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Подпись: _______________________ /${wInitials}/</p>`;
    body += type === "labor"
      ? `<p style="font-size:12px;color:#111;line-height:2.0;margin:0 0 24px;">Дата: ${todayFormatted} г.</p>`
      : `<p style="font-size:12px;color:#111;line-height:2.0;margin:0 0 24px;">Дата: «${todayFormatted}»&nbsp;____________________&nbsp;г.</p>`;
  }

  // ── ПОДПИСИ ──
  body += sp(40);
  const w0Initials = (w0.name || "___").split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
  body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;"><b>Заявитель:</b></p>`;
  body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Подпись: _______________________ /${w0Initials}/</p>`;
  body += type === "labor"
    ? `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Дата: ${todayFormatted} г.</p>`
    : `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Дата: «${todayFormatted}»&nbsp;____________________&nbsp;г.</p>`;

  if (workers.length > 1) {
    workers.slice(1).forEach((w) => {
      body += sp(28);
      const ini = (w.name || "___").split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
      body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;"><b>Заявитель:</b></p>`;
      body += `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Подпись: _______________________ /${ini}/</p>`;
      body += type === "labor"
        ? `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Дата: ${todayFormatted} г.</p>`
        : `<p style="font-size:12px;color:#111;line-height:2.0;margin:0;">Дата: «${todayFormatted}»&nbsp;____________________&nbsp;г.</p>`;
    });
  }

  const htmlWrapper = (bodyContent, forWord = false) => `<!DOCTYPE html>
<html lang="ru"${forWord ? " xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'" : ""}>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
${forWord ? "<meta name=ProgId content=Word.Document><meta name=Generator content='Microsoft Word 15'>" : ""}
<style>
  * { box-sizing: border-box; }
  ${forWord ? "@page { margin: 2cm 3cm; }" : ""}
  body {
    font-family: 'Times New Roman', Times, serif;
    margin: 0;
    padding: ${forWord ? "0" : "50px 70px 60px"};
    background: white;
    color: #111;
    font-size: 12px;
    word-break: normal;
    overflow-wrap: normal;
    white-space: normal;
    ${forWord ? "" : "user-select: none; -webkit-user-select: none;"}
  }
  p { word-break: normal; overflow-wrap: normal; white-space: normal; hyphens: none; margin: 0 0 8px; }
  .spacer { line-height: 1; }
</style>
</head>
<body>${bodyContent}</body>
</html>`;

  return htmlWrapper(body, false);
}

export function buildDocxHtml(claimData) {
  if (isCollectiveLabor(claimData) && getCollectiveLaborMembers(claimData).length > 0) return buildCollectiveLaborDocument(claimData, true);
  if (isSoloProduct(claimData)) return buildProductDocument(claimData, true);
  const employer = claimData.employer || {};
  const workers = claimData.workers || [];
  const circ = claimData.circumstances || {};
  const evidence = claimData.evidence || [];
  const witness = claimData.witness;
  const type = claimData.type || "universal";
  const legacyType = getLegacyPdfType(type);
  const law = LAWS[legacyType] || LAWS.universal;

  const ROW = `font-size:12pt;margin:0 0 4pt;line-height:1.5;color:#000;`;
  const sp = (n = 12) => `<p class="spacer" style="margin:0;line-height:${n/12};">&nbsp;</p>`;
  const p = (t) => {
    const cleaned = cleanText(t);
    if (!cleaned) return "";
    return `<p style="font-size:12pt;margin:0 0 10pt;line-height:1.5;color:#000;">${cleaned}</p>`;
  };
  const H = (t) => `<p style="font-size:12pt;font-weight:700;margin:16pt 0 6pt;line-height:1.5;color:#000;text-transform:uppercase;">${t}</p>`;
  const dash = (t) => `<p style="font-size:12pt;margin:0 0 4pt;line-height:1.5;color:#000;padding-left:12pt;">&#8211;&nbsp;${cleanText(t)};</p>`;

  const w0 = workers[0] || {};
  const gender = w0.gender || "male";
  const forced = gender === "female" ? "вынуждена" : "вынужден";
  const workedVerb = gender === "female" ? "выполняла" : "выполнял";
  const w0NameDocx = formatNameTitle(w0.name);
  const laborEmployerDisplayName = type === "labor" ? getLaborEmployerDisplayName(employer) : employer.name;
  const laborRegistrationLabel = isIndividualEntrepreneur(employer) ? "ОГРНИП:" : "ОГРН:";
  const displayedEmployerAddress = type === "labor" ? normalizeLaborAddress(employer.address) : employer.address;
  const displayedWorkerAddress = type === "labor" ? normalizeLaborAddress(w0.address) : w0.address;

  // Header using table for Word compatibility
  let body = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14pt;border:none;">
<tr>
<td width="50%" style="vertical-align:top;"></td>
<td width="50%" style="text-align:${type === "labor" ? "left" : "right"};vertical-align:top;">
<p style="${ROW}"><b>${type === "labor" ? "Работодателю:" : "Ответчику:"}</b></p>
<p style="${ROW}"><b>${laborEmployerDisplayName || "___"}</b></p>
${employer.inn ? `<p style="${ROW}"><b>ИНН:</b> ${employer.inn}</p>` : ""}
${employer.ogrn ? `<p style="${ROW}"><b>${type === "labor" ? laborRegistrationLabel : "ОГРН:"}</b> ${employer.ogrn}</p>` : ""}
${employer.kpp ? `<p style="${ROW}"><b>КПП:</b> ${employer.kpp}</p>` : ""}
${displayedEmployerAddress ? `<p style="${ROW}"><b>Юридический адрес:</b></p><p style="${ROW}">${displayedEmployerAddress}</p>` : ""}
</td>
</tr>
</table>`;

  // Claimant
  body += sp(14);
  body += `<p style="${ROW}"><b>От:</b></p>`;
  body += `<p style="${ROW}"><b>${(type === "labor" ? declineApplicantName(w0NameDocx, gender) : toGenitive(w0NameDocx)) || "___"}</b></p>`;
  if (w0.birthDate) body += `<p style="${ROW}"><b>Дата рождения:</b> ${w0.birthDate}</p>`;
  if (displayedWorkerAddress) { body += `<p style="${ROW}"><b>Адрес проживания:</b></p><p style="${ROW}">${displayedWorkerAddress}</p>`; }
  if (w0.phone) body += `<p style="${ROW}"><b>Контактный телефон:</b> ${type === "labor" ? normalizeLaborPhone(w0.phone) : w0.phone}</p>`;
  if (w0.email) body += `<p style="${ROW}"><b>Электронная почта:</b> ${w0.email}</p>`;
  if (workers.length > 1) {
    workers.slice(1).forEach(w => {
      const additionalAddress = type === "labor" ? normalizeLaborAddress(w.address) : w.address;
      body += `<p style="${ROW}">${w.name || "___"}${additionalAddress ? ", " + additionalAddress : ""}${w.phone ? ", тел: " + (type === "labor" ? normalizeLaborPhone(w.phone) : w.phone) : ""}</p>`;
    });
  }

  // Title
  body += sp(24);
  body += `<p style="font-size:14pt;font-weight:700;text-align:center;margin:0 0 8pt;color:#000;letter-spacing:1pt;">ПРЕТЕНЗИЯ</p>`;
  const documentTitle = type === "labor" ? getLaborTitle(claimData) : law.title;
  const subtitle = (documentTitle || "").replace(/^ПРЕТЕНЗИЯ\s*/i, "").trim();
  if (subtitle) body += `<p style="font-size:12pt;font-weight:700;text-align:center;margin:0 0 16pt;color:#000;line-height:1.5;">${subtitle}</p>`;

  // Content (reuse same logic)
  if (type === "labor") {
    const laborOptions = new Set(claimData.selectedLegalOptions || []);
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с невыплатой заработной платы, нарушением моих трудовых прав и с целью досудебного урегулирования трудового спора.`);
    body += H("Обстоятельства работы:");
    const workStart = circ.workStart ? fmtLaborDate(circ.workStart) : null;
    const workEnd = circ.stillWorking || !circ.workEnd || circ.workEnd === "настоящее время" ? "настоящее время" : fmtLaborDate(circ.workEnd);
    body += p(`Я, ${w0NameDocx || "___"}, ${workedVerb} трудовые обязанности в интересах ${employer.name || "___"}${workStart ? " в период с " + workStart + " по " + workEnd : ""}.`);
    if (laborOptions.has("no_employment_contract")) body += p("Трудовой договор со мной заключён не был, несмотря на фактический допуск к работе, что является нарушением статьи 67 Трудового кодекса Российской Федерации.");
    if (laborOptions.has("actual_admission")) body += p("Заявитель был фактически допущен к выполнению трудовых обязанностей с ведома и по поручению работодателя.");
    if (circ.supervisor) body += p(`Непосредственный руководитель: ${cleanText(circ.supervisor)}.`);
    if (circ.workplace) body += p(`Трудовые обязанности выполнялись на объекте по адресу: ${normalizeLaborAddress(circ.workplace)}.`);
    if (circ.description && isValidText(circ.description)) {
      body += `<p style="font-size:12pt;margin:0 0 4pt;line-height:1.5;color:#000;font-weight:700;">Дополнительно заявитель указывает:</p>`;
      body += p(normalizeLaborText(circ.description));
    }
    if (circ.dueDate) body += p(`Плановая дата выплаты заработной платы: ${fmtLaborDate(circ.dueDate)}.${circ.delayDays ? ` Просрочка составляет ${Number(circ.delayDays)} дней.` : ""}`);
    if (circ.dismissalDate) body += p(`Дата увольнения: ${fmtLaborDate(circ.dismissalDate)}.`);
    if (Number(circ.partialPaymentAmount) > 0 || (circ.partialPayments && isValidText(circ.partialPayments))) body += p(`Работодателем произведена частичная выплата${Number(circ.partialPaymentAmount) > 0 ? ` в размере ${fmtAmount(circ.partialPaymentAmount)}` : ""}${circ.lastPartialPaymentDate ? ` ${fmtLaborDate(circ.lastPartialPaymentDate)}` : ""}${circ.partialPayments && isValidText(circ.partialPayments) ? `: ${normalizeLaborText(circ.partialPayments).replace(/[.!?]+$/, "")}` : ""}.`);
    const outstandingDebt = getLaborOutstanding(circ);
    const hasPartialPayments = Number(circ.partialPaymentAmount) > 0 || (circ.partialPayments && isValidText(circ.partialPayments));
    if (outstandingDebt > 0) body += p(hasPartialPayments
      ? `После учёта частичных выплат размер задолженности составляет ${fmtAmount(outstandingDebt)}.`
      : `Размер задолженности по заработной плате составляет ${fmtAmount(outstandingDebt)}.`);
    if (laborOptions.has("salary_over_two_months")) body += p("Период полной невыплаты заработной платы превышает два месяца.");
    if (circ.paymentForm) {
      const forms = Array.isArray(circ.paymentForm) ? circ.paymentForm.join(", ") : circ.paymentForm;
      if (forms) body += p(`Форма оплаты труда: ${forms}.`);
    }
    const proofItems = [];
    if (evidence.some(e => /перепис/i.test(e))) proofItems.push("перепиской с представителем работодателя");
    if (evidence.some(e => /перевод|банк/i.test(e))) proofItems.push("переводами денежных средств в счёт оплаты");
    if (evidence.some(e => /табел/i.test(e))) proofItems.push("журналом (табелем) учёта рабочего времени");
    if (evidence.some(e => /пропуск|допуск/i.test(e))) proofItems.push("документами о фактическом допуске к работе");
    if (witness?.name) proofItems.push("свидетельскими показаниями работника");
    if (proofItems.length > 0) {
      body += H("Подтверждение фактического допуска к работе:");
      body += `<p style="font-size:12pt;margin:0 0 6pt;line-height:1.5;color:#000;font-weight:700;">Факт выполнения мной трудовых обязанностей подтверждается:</p>`;
      proofItems.forEach(item => { body += dash(item); });
    }
  } else if (type === "product") {
    const productSeller = cleanText(circ.sellerName) || employer.name || "___";
    body += p(`Настоящая претензия направляется в адрес ${productSeller} в связи с реализацией товара ненадлежащего качества.`);
    body += buildProductCircumstances(circ, employer.name, p, H);
  } else if (legacyType === "infoproduct") {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с нарушением условий оказания услуг.`);
    body += buildCourseCircumstances(circ, p, H);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);
  } else if (type === "civil") {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в целях досудебного урегулирования спора о возврате долга.`);
    body += H("Обстоятельства:");
    body += p(`${circ.contractDate ? "«" + fmtDate(circ.contractDate) + "»" : "Ранее"} между мной и ${employer.name || "___"} был заключён договор/расписка. Сумма обязательства: ${circ.debtAmount && Number(circ.debtAmount) > 0 ? fmtAmount(circ.debtAmount) : "___"}.${circ.delayDays ? " Просрочка: " + circ.delayDays + " дней." : ""}`);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);
  } else {
    body += p(`Настоящая претензия направляется в адрес ${employer.name || "___"} в связи с нарушением прав и законных интересов.`);
    if (circ.description && isValidText(circ.description)) body += p(circ.description);
  }

  if (circ.socialImpact && isValidText(circ.socialImpact)) {
    body += H("Социально значимые последствия:");
    const socialPrefixes2 = {
      labor: "Сложившаяся ситуация повлекла следующие социально значимые последствия",
      product: "Приобретение некачественного товара повлекло следующие социально значимые последствия",
      infoproduct: "Сложившаяся ситуация повлекла следующие социально значимые последствия",
      civil: "Невозврат денежных средств повлёк следующие социально значимые последствия",
    };
    const prefix2 = socialPrefixes2[type] || "Сложившаяся ситуация повлекла следующие социально значимые последствия";
    body += p(`${prefix2}: ${type === "labor" ? normalizeLaborText(circ.socialImpact).replace(/[.!?]+$/, "") : cleanText(circ.socialImpact)}.`);
  }

  const selectedOptions2 = claimData.selectedLegalOptions || [];
  const selectedBlocks2 = getSelectedDocumentBlocks(type, selectedOptions2);
  if (selectedBlocks2.length) {
    body += H("Дополнительные обстоятельства:");
    selectedBlocks2.forEach(block => { body += p(block); });
  }

  body += H(type === "labor" ? "Правовое обоснование требований:" : "Выявленные нарушения законодательства:");
  const legacyArticles2 = legacyType === "labor" && law.getArticles ? law.getArticles(claimData) : law.articles;
  const selectedArticles2 = getSelectedLegalReferences(type, selectedOptions2);
  const articles = type === "labor" ? legacyArticles2 : [...new Set(legacyType === "infoproduct" || (type === "product" && selectedArticles2.length) ? selectedArticles2 : [...(legacyArticles2 || []), ...selectedArticles2])];
  articles.forEach(a => { body += `<p style="font-size:12pt;margin:0 0 4pt;line-height:1.5;color:#000;">${a}</p>`; });

  body += H("Требования:");
  body += p(legacyType === "infoproduct"
    ? "ТРЕБУЮ:"
    : type === "labor"
      ? "ТРЕБУЮ исполнить следующие требования незамедлительно, но не позднее 10 (десяти) календарных дней со дня получения настоящей претензии:"
      : "ТРЕБУЮ в течение 10 (десяти) календарных дней с момента получения настоящей претензии:");
  const selectedDemands2 = getSelectedRequirementTexts(type, selectedOptions2);
  const productDemands2 = type === "product" ? getProductDemands(circ) : [];
  const demands2 = [...new Set(type === "labor" ? law.demands(claimData) : type === "product" ? [...selectedDemands2, ...productDemands2] : legacyType === "infoproduct" ? selectedDemands2 : [...(law.demands(claimData) || []), ...selectedDemands2])];
  demands2.forEach(d => { body += `<p style="font-size:12pt;margin:0 0 6pt;line-height:1.5;color:#000;">${cleanText(d)}</p>`; });

  if (legacyType === "infoproduct" || type === "product") {
    body += H("Срок исполнения:");
    body += p(type === "product"
      ? "Требования подлежат удовлетворению в сроки, установленные Законом РФ «О защите прав потребителей»."
      : "Требования должны быть исполнены в течение 10 (десяти) календарных дней с момента получения настоящей претензии.");
  }

  body += H("В случае отказа:");
  body += p(type === "product"
    ? "В случае отказа в добровольном удовлетворении требований заявитель оставляет за собой право обратиться в уполномоченные органы и суд для защиты нарушенных прав потребителя."
    : legacyType === "infoproduct"
    ? `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Роспотребнадзор и суд за защитой прав потребителя.`
    : type === "labor" && (claimData.selectedLegalOptions || []).includes("salary_over_two_months")
    ? `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Государственную инспекцию труда, прокуратуру и суд, а также поставить перед компетентными органами вопрос о проверке обстоятельств по статье 145.1 УК РФ.`
    : `В случае неисполнения требований в установленный срок буду ${forced} обратиться в Государственную инспекцию труда, прокуратуру и суд.`);

  const allEv = type === "labor" ? getLaborApplications(claimData) : [...new Set([...evidence.filter(ev => ev && isValidText(ev)), ...getEvidenceHints(type, selectedOptions2), ...(type === "product" ? getProductEvidence(circ) : [])])];
  if (allEv.length > 0) {
    body += H("Приложения:");
    allEv.forEach((ev, i) => { body += `<p style="font-size:12pt;margin:0 0 4pt;line-height:1.5;color:#000;">${i + 1}. ${ev}${type === "labor" && !/[.!?]$/.test(ev) ? "." : ""}</p>`; });
    if (type === "labor") body += p("Файлы-доказательства включаются в PDF-версию документа либо прикладываются отдельно при отправке.");
  }

  if (witness?.name) {
    body += sp(20);
    body += H("Свидетель (ознакомлен и подтверждает):");
    body += p(`Я, ${witness.name}${witness.birthDate ? ", дата рождения: " + witness.birthDate : ""}, подтверждаю изложенные обстоятельства.`);
    body += sp(36);
    const wInitials = witness.name.split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
    body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;"><b>Свидетель:</b></p>`;
    body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;">Подпись: _______________________ /${wInitials}/</p>`;
    body += `<p style="font-size:12pt;color:#000;margin:0 0 20pt;">Дата: ${today()} г.</p>`;
  }

  body += sp(40);
  const todayFormattedDocx = new Date().toLocaleDateString("ru-RU");
  const w0InitialsDocx = (w0.name || "___").split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
  body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;"><b>Заявитель:</b></p>`;
  body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;">Подпись: _______________________ /${w0InitialsDocx}/</p>`;
  body += type === "labor"
    ? `<p style="font-size:12pt;color:#000;margin:0;">Дата: ${todayFormattedDocx} г.</p>`
    : `<p style="font-size:12pt;color:#000;margin:0;">Дата: «${todayFormattedDocx}»&nbsp;____________________&nbsp;г.</p>`;

  if (workers.length > 1) {
    workers.slice(1).forEach((w) => {
      body += sp(28);
      const ini = (w.name || "___").split(" ").map((pt, i) => i === 0 ? pt : pt[0] + ".").join(" ");
      body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;"><b>Заявитель:</b></p>`;
      body += `<p style="font-size:12pt;color:#000;margin:0 0 4pt;">Подпись: _______________________ /${ini}/</p>`;
      body += type === "labor"
        ? `<p style="font-size:12pt;color:#000;margin:0;">Дата: ${todayFormattedDocx} г.</p>`
        : `<p style="font-size:12pt;color:#000;margin:0;">Дата: «${todayFormattedDocx}»&nbsp;____________________&nbsp;г.</p>`;
    });
  }

  return `<!DOCTYPE html>
<html lang="ru" xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
<meta charset="UTF-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content='Microsoft Word 15'>
<style>
  @page { margin: 2cm 3cm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0; background: white; color: #000; font-size: 12pt; }
  p { word-break: normal; overflow-wrap: normal; white-space: normal; hyphens: none; }
  table { border-collapse: collapse; }
  td { border: none; }
</style>
</head>
<body>${body}</body>
</html>`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeStoredZip(entries) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const u16 = value => { const bytes = new Uint8Array(2); new DataView(bytes.buffer).setUint16(0, value, true); return bytes; };
  const u32 = value => { const bytes = new Uint8Array(4); new DataView(bytes.buffer).setUint32(0, value >>> 0, true); return bytes; };
  const sizeOf = chunks => chunks.reduce((sum, chunk) => sum + chunk.length, 0);

  for (const [name, content] of entries) {
    const nameBytes = encoder.encode(name);
    const data = typeof content === "string" ? encoder.encode(content) : content;
    const checksum = crc32(data);
    const local = [u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(checksum), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data];
    parts.push(...local);
    const centralEntry = [u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(checksum), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes];
    central.push(...centralEntry);
    offset += sizeOf(local);
  }

  const centralOffset = offset;
  const centralSize = sizeOf(central);
  const end = [u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(centralSize), u32(centralOffset), u16(0)];
  return new Blob([...parts, ...central, ...end], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function buildDocxBlob(claimData) {
  const html = buildDocxHtml(claimData);
  // A UTF-8 BOM makes Word's HTML altChunk encoding detection deterministic,
  // especially for Cyrillic text on systems with a non-UTF-8 locale.
  const encodedHtml = new TextEncoder().encode(html);
  const htmlWithBom = new Uint8Array(encodedHtml.length + 3);
  htmlWithBom.set([0xef, 0xbb, 0xbf], 0);
  htmlWithBom.set(encodedHtml, 3);
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="html" ContentType="text/html"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const packageRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:altChunk r:id="htmlChunk"/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="htmlChunk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.html"/></Relationships>`;
  return makeStoredZip([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", packageRels],
    ["word/document.xml", documentXml],
    ["word/_rels/document.xml.rels", documentRels],
    ["word/afchunk.html", htmlWithBom],
  ]);
}

// ── КОЛЛЕКТИВНЫЙ ДОКУМЕНТ ──

function buildCollectiveBody(room, forWord = false) {
  const employer = room.employer_data || {};
  const ownerData = room.owner_claim_data || {};
  const ownerWorker = (ownerData.workers || [])[0] || {};
  const members = (room.members_data || []).filter(m => m.status === "done");
  const allParticipants = [
    { name: ownerWorker.name, address: ownerWorker.address, phone: ownerWorker.phone, email: ownerWorker.email, debtAmount: (ownerData.circumstances || {}).debtAmount, description: (ownerData.circumstances || {}).description },
    ...members.map(m => ({ name: m.name, address: m.address, phone: m.phone, email: m.email, debtAmount: m.debtAmount, description: m.description }))
  ];

  const pt = forWord ? "pt" : "px";
  const fs = forWord ? "12pt" : "12px";
  const ROW = `font-size:${fs};margin:0 0 4${pt};line-height:1.5;color:#000;`;
  const sp = (n = 12) => `<div style="height:${n}${pt}"></div>`;
  const p = (t) => { const c = cleanText(t); if (!c) return ""; return `<p style="font-size:${fs};margin:0 0 ${forWord ? "10pt" : "12px"};line-height:${forWord ? "1.5" : "1.9"};color:#111;">${c}</p>`; };
  const H = (t) => `<p style="font-size:${fs};font-weight:700;margin:${forWord ? "16pt" : "20px"} 0 ${forWord ? "6pt" : "8px"};line-height:1.5;color:#000;text-transform:uppercase;">${t}</p>`;
  const year = new Date().getFullYear();

  let body = "";

  // Header
  if (forWord) {
    body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14pt;border:none;"><tr>
<td width="50%" style="vertical-align:top;"></td>
<td width="50%" style="text-align:right;vertical-align:top;">
<p style="${ROW}"><b>Руководству:</b></p>
<p style="${ROW}"><b>${employer.name || "___"}</b></p>
${employer.ogrn ? `<p style="${ROW}"><b>ОГРН:</b> ${employer.ogrn}</p>` : ""}
${employer.inn ? `<p style="${ROW}"><b>ИНН:</b> ${employer.inn}</p>` : ""}
${employer.address ? `<p style="${ROW}"><b>Юридический адрес:</b> ${employer.address}</p>` : ""}
</td></tr></table>`;
  } else {
    body += `<div style="text-align:right;margin-bottom:0;">`;
    body += `<p style="${ROW}"><b>Руководству:</b></p>`;
    body += `<p style="${ROW}"><b>${employer.name || "___"}</b></p>`;
    if (employer.ogrn) body += `<p style="${ROW}"><b>ОГРН:</b> ${employer.ogrn}</p>`;
    if (employer.inn) body += `<p style="${ROW}"><b>ИНН:</b> ${employer.inn}</p>`;
    if (employer.address) body += `<p style="${ROW}"><b>Юридический адрес:</b> ${employer.address}</p>`;
    body += `</div>`;
  }

  // Claimants list
  body += sp(16);
  body += `<p style="${ROW}"><b>От:</b></p>`;
  allParticipants.forEach((p2, i) => {
    body += `<p style="${ROW}">${i + 1}. ${toGenitive(p2.name) || "___"}${p2.address ? ", " + p2.address : ""}${p2.phone ? ", тел: " + p2.phone : ""}</p>`;
  });

  // Title
  body += sp(26);
  body += `<p style="font-size:${forWord ? "14pt" : "14px"};font-weight:700;text-align:center;margin:0 0 8${pt};color:#000;letter-spacing:1${pt};">КОЛЛЕКТИВНАЯ ПРЕТЕНЗИЯ</p>`;
  body += `<p style="font-size:${fs};font-weight:700;text-align:center;margin:0 0 ${forWord ? "16pt" : "20px"};color:#000;line-height:1.5;">о выплате задолженности по заработной плате и урегулировании трудового спора в досудебном порядке</p>`;

  // Intro
  body += p(`Настоящая коллективная претензия направляется в адрес ${employer.name || "___"} в связи с невыплатой заработной платы, нарушением трудовых прав работников и с целью досудебного урегулирования трудового спора.`);

  // Each participant block
  allParticipants.forEach((m, i) => {
    body += H(`Участник ${i + 1}: ${m.name || "___"}`);
    if (m.address) body += p(`Адрес: ${m.address}`);
    if (m.phone) body += p(`Телефон: ${m.phone}`);
    if (m.email) body += p(`Email: ${m.email}`);
    if (m.debtAmount && Number(m.debtAmount) > 0) body += p(`Сумма задолженности: ${fmtAmount(m.debtAmount)}`);
    if (m.description && isValidText(m.description)) body += p(m.description);
  });

  // Laws
  body += H("Нарушения законодательства:");
  [
    "Статья 136 ТК РФ — обязанность своевременной выплаты заработной платы",
    "Статья 140 ТК РФ — обязанность полного расчёта при увольнении",
    "Статья 236 ТК РФ — компенсация за каждый день задержки заработной платы",
  ].forEach(a => { body += `<p style="font-size:${fs};margin:0 0 6${pt};line-height:1.8;color:#000;">${a}</p>`; });

  // Demands
  body += H("Требования:");
  body += p("ТРЕБУЕМ в течение 10 (десяти) календарных дней с момента получения настоящей претензии:");
  body += p("1) выплатить задолженность по заработной плате каждому из заявителей в полном объёме;");
  body += p("2) выплатить компенсацию за задержку заработной платы в соответствии со статьёй 236 ТК РФ;");
  body += p("3) предоставить письменный ответ на данную претензию.");

  body += H("В случае отказа:");
  body += p("В случае неисполнения требований в установленный срок мы будем вынуждены обратиться в Государственную инспекцию труда, прокуратуру и судебные органы.");

  // Signatures
  body += sp(40);
  allParticipants.forEach((m, i) => {
    const initials = (m.name || "___").split(" ").map((pt, idx) => idx === 0 ? pt : pt[0] + ".").join(" ");
    body += `<p style="font-size:${fs};color:#000;margin:0 0 4${pt};"><b>Заявитель ${i + 1}:</b> ${m.name || "___"}</p>`;
    body += `<p style="font-size:${fs};color:#000;margin:0 0 4${pt};">Подпись: _______________________ /${initials}/</p>`;
    body += `<p style="font-size:${fs};color:#000;margin:0 0 ${forWord ? "20pt" : "20px"};">Дата: «&nbsp;&nbsp;&nbsp;»&nbsp;____________________&nbsp;${year}&nbsp;г.</p>`;
  });

  return body;
}

export function buildCollectiveDocxHtml(room) {
  const body = buildCollectiveBody(room, true);
  return `<!DOCTYPE html>
<html lang="ru" xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name=ProgId content=Word.Document>
<style>@page{margin:2cm 3cm;} * {box-sizing:border-box;} body{font-family:'Times New Roman',Times,serif;margin:0;padding:0;color:#000;font-size:12pt;} p{word-break:normal;overflow-wrap:normal;white-space:normal;} table{border-collapse:collapse;} td{border:none;}</style>
</head><body>${body}</body></html>`;
}

export async function generateCollectivePDF(room) {
  const body = buildCollectiveBody(room, false);
  const htmlContent = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><style>*{box-sizing:border-box;} body{font-family:'Times New Roman',Times,serif;margin:0;padding:50px 70px 60px;background:white;color:#111;font-size:12px;} p{word-break:normal;overflow-wrap:normal;white-space:normal;hyphens:none;}</style></head><body>${body}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:794px;height:1123px;border:none;background:white;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(htmlContent);
  iframe.contentDocument.close();
  await new Promise(r => setTimeout(r, 500));

  const canvas = await html2canvas(iframe.contentDocument.body, {
    scale: 2, useCORS: true, backgroundColor: "#ffffff",
    width: 794, height: Math.max(iframe.contentDocument.body.scrollHeight, 1123), windowWidth: 794,
  });
  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfW = 210;
  const pdfH = (canvas.height / canvas.width) * pdfW;
  const pageHeight = 297;
  if (pdfH <= pageHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
  } else {
    let remaining = pdfH, position = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, "JPEG", 0, -position, pdfW, pdfH);
      remaining -= pageHeight; position += pageHeight;
      if (remaining > 0) pdf.addPage();
    }
  }
  pdf.save(`pretenziya_kollektivnaya_${Date.now()}.pdf`);
}

function buildApplicationHeaderImage(index, label) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 300;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111111";
  context.font = "700 42px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(`ПРИЛОЖЕНИЕ №${index}`, canvas.width / 2, 72);
  context.textAlign = "left";
  context.font = "32px Arial, sans-serif";
  const maxWidth = canvas.width - 120;
  const words = String(label || "").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((value, lineIndex) => context.fillText(value, 60, 145 + lineIndex * 45));
  return canvas.toDataURL("image/jpeg", 0.82);
}

function buildApplicationCaptionImage(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111111";
  context.font = "30px Arial, sans-serif";
  const maxWidth = canvas.width - 120;
  const words = String(label || "").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((value, index) => context.fillText(value, 60, 55 + index * 42));
  return canvas.toDataURL("image/jpeg", 0.82);
}

function getEvidenceImageSize(file) {
  if (file?.width && file?.height) return Promise.resolve({ width: file.width, height: file.height });
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = file?.url || "";
  });
}

function buildCollectiveApplicationHeaderImage(index, memberName) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 300;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#111111";
  context.textAlign = "center";
  context.font = "700 40px Arial, sans-serif";
  context.fillText(`ПРИЛОЖЕНИЕ №${index}`, canvas.width / 2, 70);
  context.font = "30px Arial, sans-serif";
  const title = `Доказательства заявителя ${memberName || "ФИО не указано"}`;
  const words = title.split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > canvas.width - 120 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  });
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((value, lineIndex) => context.fillText(value, canvas.width / 2, 140 + lineIndex * 42));
  return canvas.toDataURL("image/jpeg", 0.84);
}

async function appendCollectiveLaborApplications(pdf, claimData) {
  const members = getCollectiveLaborMembers(claimData);
  const applications = [];
  members.forEach(member => {
    const labels = [...new Set(member.files.map(file => file.evidenceLabel).filter(Boolean))];
    labels.forEach(label => {
      const files = member.files.filter(file => file.evidenceLabel === label);
      const images = files.filter(isEmbeddableEvidenceImage);
      if (images.length) applications.push({ member, label, images });
    });
  });

  for (let applicationIndex = 0; applicationIndex < applications.length; applicationIndex++) {
    const application = applications[applicationIndex];
    for (let imageIndex = 0; imageIndex < application.images.length; imageIndex++) {
      const file = application.images[imageIndex];
      pdf.addPage();
      pdf.addImage(buildCollectiveApplicationHeaderImage(applicationIndex + 1, application.member.fullNameGenitive || application.member.fullName), "JPEG", 15, 15, 180, 38, undefined, "FAST");
      const caption = `${application.label}${application.images.length > 1 ? ` ${imageIndex + 1}` : ""}`;
      pdf.addImage(buildApplicationCaptionImage(caption), "JPEG", 15, 55, 180, 19, undefined, "FAST");
      try {
        const dimensions = await getEvidenceImageSize(file);
        const maxWidth = 180;
        const maxHeight = 205;
        const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
        const width = dimensions.width * scale;
        const height = dimensions.height * scale;
        const x = (210 - width) / 2;
        const format = file.url.startsWith("data:image/png") ? "PNG" : file.url.startsWith("data:image/webp") ? "WEBP" : "JPEG";
        pdf.addImage(file.url, format, x, 76, width, height, undefined, "FAST");
      } catch {
        console.error(`Не удалось встроить доказательство заявителя: ${safeValue(file.name) || application.label}.`);
      }
    }
  }
}

async function appendLaborApplications(pdf, claimData) {
  if (isCollectiveLabor(claimData)) {
    await appendCollectiveLaborApplications(pdf, claimData);
    return;
  }
  const applications = getLaborEvidenceGroups(claimData)
    .map(group => ({
      ...group,
      images: group.files.map((file, fileIndex) => ({ file, fileIndex })).filter(item => isEmbeddableEvidenceImage(item.file)),
    }))
    .filter(group => group.images.length > 0);
  for (let index = 0; index < applications.length; index++) {
    const application = applications[index];
    for (const imageItem of application.images) {
      const { file, fileIndex } = imageItem;
      pdf.addPage();
      pdf.addImage(buildApplicationHeaderImage(index + 1, application.label), "JPEG", 15, 15, 180, 38, undefined, "FAST");
      const caption = `${application.label}${application.files.length > 1 ? ` ${fileIndex + 1}` : ""}`;
      pdf.addImage(buildApplicationCaptionImage(caption), "JPEG", 15, 55, 180, 19, undefined, "FAST");
      try {
        const dimensions = await getEvidenceImageSize(file);
        const maxWidth = 180;
        const maxHeight = 205;
        const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
        const width = dimensions.width * scale;
        const height = dimensions.height * scale;
        const x = (210 - width) / 2;
        const format = file.url.startsWith("data:image/png") ? "PNG" : file.url.startsWith("data:image/webp") ? "WEBP" : "JPEG";
        pdf.addImage(file.url, format, x, 76, width, height, undefined, "FAST");
      } catch {
        console.error(`Не удалось встроить файл доказательства ${file.name} в PDF.`);
      }
    }
  }
}

async function appendProductApplications(pdf, claimData) {
  const groups = getProductEvidenceGroups(claimData)
    .map(group => ({ ...group, images: group.files.filter(isEmbeddableEvidenceImage) }))
    .filter(group => group.images.length);
  let applicationNumber = 1;
  for (const group of groups) {
    for (let imageIndex = 0; imageIndex < group.images.length; imageIndex++) {
      const file = group.images[imageIndex];
      pdf.addPage();
      const title = group.images.length > 1 ? `${group.label} ${imageIndex + 1}` : group.label;
      pdf.addImage(buildApplicationHeaderImage(applicationNumber++, title), "JPEG", 15, 15, 180, 38, undefined, "FAST");
      pdf.addImage(buildApplicationCaptionImage(file.name || group.label), "JPEG", 15, 55, 180, 19, undefined, "FAST");
      try {
        const dimensions = await getEvidenceImageSize(file);
        const scale = Math.min(180 / dimensions.width, 205 / dimensions.height);
        const width = dimensions.width * scale;
        const height = dimensions.height * scale;
        const x = (210 - width) / 2;
        const format = file.url.startsWith("data:image/png") ? "PNG" : file.url.startsWith("data:image/webp") ? "WEBP" : "JPEG";
        pdf.addImage(file.url, format, x, 76, width, height, undefined, "FAST");
      } catch {
        console.error(`Не удалось встроить файл доказательства ${file.name || group.label} в PDF.`);
      }
    }
  }
}

function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generatePDF(claimData) {
  // Create hidden iframe with HTML content
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:794px;height:1123px;border:none;background:white;";
  document.body.appendChild(iframe);

  const htmlContent = buildHtml(claimData);
  iframe.contentDocument.open();
  iframe.contentDocument.write(htmlContent);
  iframe.contentDocument.close();

  await new Promise(r => setTimeout(r, 500));

  const canvas = await html2canvas(iframe.contentDocument.body, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 794,
    height: Math.max(iframe.contentDocument.body.scrollHeight, 1123),
    windowWidth: 794,
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/jpeg", 0.86);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfW = 210;
  const pdfH = (canvas.height / canvas.width) * pdfW;

  // If content is longer than one page, split into pages
  const pageHeight = 297;
  if (pdfH <= pageHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
  } else {
    let remaining = pdfH;
    let position = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, "JPEG", 0, -position, pdfW, pdfH);
      remaining -= pageHeight;
      position += pageHeight;
      if (remaining > 0) pdf.addPage();
    }
  }

  if (claimData.type === "labor") await appendLaborApplications(pdf, claimData);
  if (isSoloProduct(claimData)) await appendProductApplications(pdf, claimData);

  const blob = pdf.output("blob");
  downloadPdfBlob(blob, `pretenziya_${Date.now()}.pdf`);
  return {
    sizeBytes: blob.size,
    exceedsRecommendedSize: blob.size > 5 * 1024 * 1024,
  };
}
