export const FIELD_TYPES = Object.freeze([
  "text",
  "textarea",
  "number",
  "money",
  "date",
  "email",
  "phone",
  "select",
  "checkbox",
]);

export const TEMPLATE_STATUS = Object.freeze({
  DRAFT: "draft",
  READY: "ready",
});

export const DOCUMENT_TYPES = Object.freeze([
  { id: "pretrial_claim", label: "Досудебная претензия" },
  { id: "contract", label: "Договор" },
  { id: "act", label: "Акт" },
  { id: "application", label: "Заявление" },
  { id: "complaint", label: "Жалоба" },
  { id: "other", label: "Другое" },
]);

export const DOCUMENT_TYPE_LABELS = Object.freeze(Object.fromEntries(DOCUMENT_TYPES.map(type => [type.id, type.label])));

export const SEMANTIC_BLOCKS = Object.freeze([
  { id: "recipient", title: "Адресат / кому", description: "Организация, реквизиты и юридический адрес получателя." },
  { id: "applicant", title: "Заявитель / от кого", description: "Данные заявителя и его контакты." },
  { id: "title", title: "Заголовок", description: "Название и тема документа." },
  { id: "circumstances", title: "Обстоятельства", description: "Факты, даты, суммы и описание ситуации." },
  { id: "demands", title: "Требования", description: "Требования, сроки исполнения и способ ответа." },
  { id: "attachments", title: "Приложения", description: "Перечень приложенных документов." },
  { id: "witness", title: "Свидетель", description: "Данные свидетеля." },
  { id: "signatures", title: "Подписи", description: "Подписи участников и даты подписания." },
  { id: "other", title: "Другое", description: "Данные, которые нужно проверить вручную." },
]);

export const SEMANTIC_BLOCK_LABELS = Object.freeze(Object.fromEntries(SEMANTIC_BLOCKS.map(block => [block.id, block.title])));

export const FIELD_GROUPS = Object.freeze([
  { id: "parties", label: "Стороны документа" },
  { id: "contacts", label: "Контакты" },
  { id: "organization", label: "Реквизиты организации" },
  { id: "amounts", label: "Суммы и требования" },
  { id: "dates", label: "Даты и периоды" },
  { id: "addresses", label: "Адреса" },
  { id: "witnesses", label: "Свидетели" },
  { id: "other", label: "Другое" },
]);

export const FIELD_GROUP_LABELS = Object.freeze(Object.fromEntries(FIELD_GROUPS.map(group => [group.id, group.label])));

export function inferFieldGroup(key = "") {
  const normalized = String(key).toLowerCase();
  if (/phone|email|contact/.test(normalized)) return "contacts";
  if (/inn|ogrn|kpp|registration|organization/.test(normalized)) return "organization";
  if (/amount|sum|debt|claim/.test(normalized)) return "amounts";
  if (/date|period|start|end|birth/.test(normalized)) return "dates";
  if (/address/.test(normalized)) return "addresses";
  if (/witness/.test(normalized)) return "witnesses";
  if (/claimant|applicant|respondent|client|person|fullname|name/.test(normalized)) return "parties";
  return "other";
}

export const DEFAULT_FIELD_LABELS = Object.freeze({
  "client.fullName": "ФИО клиента",
  "client.address": "Адрес клиента",
  "respondent.name": "Наименование получателя",
  "claim.amount": "Сумма требования",
  "claim.description": "Описание ситуации",
  "document.date": "Дата документа",
});

export function defaultLabelForKey(key = "") {
  if (DEFAULT_FIELD_LABELS[key]) return DEFAULT_FIELD_LABELS[key];
  const tail = String(key).split(".").pop() || "Поле";
  return tail
    .replace(/([a-zа-я])([A-ZА-Я])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, character => character.toUpperCase());
}

export function createTemplateField(key, order = 0) {
  return {
    id: `field-${key.replace(/\./g, "-")}`,
    key,
    label: defaultLabelForKey(key),
    type: key.toLowerCase().includes("date") ? "date" : key.toLowerCase().includes("amount") ? "number" : "text",
    required: false,
    hint: "",
    options: [],
    order,
    source: "placeholder",
    searchText: `{{${key}}}`,
    selected: true,
    group: inferFieldGroup(key),
    semanticBlock: "other",
    confidence: 1,
    occurrenceCount: 1,
  };
}
