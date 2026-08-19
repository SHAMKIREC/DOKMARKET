import PizZip from "pizzip";
import { SEMANTIC_BLOCKS, createTemplateField } from "../models/templateSchema.js";

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-zА-Яа-я][\wА-Яа-я]*(?:\.[A-Za-zА-Яа-я][\wА-Яа-я]*)*)\s*\}\}/g;
const WORD_XML_PATTERN = /^word\/(?:document|header\d+|footer\d+)\.xml$/;
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

export const SPLIT_PLACEHOLDER_WARNING = "Если поле не найдено, возможно Word разбил placeholder на несколько частей. Попробуйте удалить и набрать placeholder заново в Word.";

export function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function normalizePlaceholderKey(value = "") {
  const normalized = String(value).trim().replace(/^\{\{\s*|\s*\}\}$/g, "");
  const segments = normalized.split(".");
  if (!segments.length || segments.some(segment => !/^[A-Za-zА-Яа-я][\wА-Яа-я]*$/.test(segment) || FORBIDDEN_SEGMENTS.has(segment))) return "";
  return segments.join(".");
}

export function extractPlaceholdersFromDocx(arrayBuffer) {
  let zip;
  try {
    zip = new PizZip(arrayBuffer);
  } catch {
    const error = new Error("Файл не удалось открыть как DOCX. Проверьте, что документ не повреждён.");
    error.code = "INVALID_DOCX";
    throw error;
  }

  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
    const error = new Error("В файле не найдена структура документа Word.");
    error.code = "INVALID_DOCX_STRUCTURE";
    throw error;
  }

  const found = new Set();
  Object.keys(zip.files)
    .filter(path => WORD_XML_PATTERN.test(path))
    .forEach(path => {
      const xml = zip.file(path)?.asText() || "";
      for (const match of xml.matchAll(PLACEHOLDER_PATTERN)) {
        const key = normalizePlaceholderKey(match[1]);
        if (key) found.add(key);
      }
    });
  return [...found];
}

export function createFieldsFromPlaceholders(placeholders = []) {
  return [...new Set(placeholders.map(normalizePlaceholderKey).filter(Boolean))]
    .map((key, index) => createTemplateField(key, index));
}

function decodeXmlEntities(value = "") {
  const entities = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => entities[name]);
}

export function extractPlainTextFromDocx(arrayBuffer) {
  let zip;
  try {
    zip = new PizZip(arrayBuffer);
  } catch {
    const error = new Error("Файл не удалось открыть как DOCX. Проверьте, что документ не повреждён.");
    error.code = "INVALID_DOCX";
    throw error;
  }
  if (!zip.file("word/document.xml")) throw new Error("В файле не найдена структура документа Word.");
  return Object.keys(zip.files)
    .filter(path => WORD_XML_PATTERN.test(path))
    .map(path => {
      const xml = zip.file(path)?.asText() || "";
      return decodeXmlEntities(xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, ""));
    })
    .join("\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const FIELD_HINTS = [
  { pattern: /[\w.+-]+@[\w.-]+\.[A-Za-zА-Яа-я]{2,}/g, label: "Email заявителя", key: "claimant.email", type: "email", group: "contacts", confidence: .98 },
  { pattern: /(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g, label: "Телефон заявителя", key: "claimant.phone", type: "phone", group: "contacts", confidence: .97 },
  { pattern: /\b\d{10}\b|\b\d{12}\b/g, label: "ИНН", key: "respondent.inn", type: "text", group: "organization", confidence: .94 },
  { pattern: /\b\d{13}\b|\b\d{15}\b/g, label: "ОГРН / ОГРНИП", key: "respondent.ogrn", type: "text", group: "organization", confidence: .94 },
  { pattern: /\b\d{9}\b/g, label: "КПП", key: "respondent.kpp", type: "text", group: "organization", confidence: .88 },
  { pattern: /(?<!\d)\d{1,3}(?:[ \u00a0]\d{3})*(?:[,.]\d{1,2})?\s*(?:₽|руб(?:\.|лей|ля)?)(?![А-Яа-яЁё])/gi, label: "Сумма задолженности", key: "claim.amount", type: "money", group: "amounts", confidence: .95 },
  { pattern: /\b(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])\.(?:19|20)\d{2}\b/g, label: "Дата", key: "document.date", type: "date", group: "dates", confidence: .9 },
  { pattern: /(?<![А-Яа-яЁё\d])(?:0?[1-9]|[12]\d|3[01])\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(?:19|20)\d{2}(?:\s+года)?(?![А-Яа-яЁё\d])/gi, label: "Дата", key: "document.date", type: "date", group: "dates", confidence: .9 },
  { pattern: /(?<![А-Яа-яЁё])(?:ООО|АО|ПАО)[ \t]+[«"][^»"]{2,120}[»"]|(?<![А-Яа-яЁё])ИП[ \t]+[А-ЯЁ][а-яё-]+(?:[ \t]+[А-ЯЁ][а-яё-]+){1,3}/g, label: "Название организации", key: "respondent.name", type: "text", group: "parties", confidence: .96 },
  { pattern: /(?<![А-Яа-яЁё-])[А-ЯЁ][а-яё-]+(?:[ \t]+[А-ЯЁ][а-яё-]+){1,3}(?![А-Яа-яЁё-])/g, label: "ФИО", key: "person.fullName", type: "text", group: "parties", confidence: .64 },
];

const MARKER_HINTS = [
  ["От", "ФИО заявителя", "claimant.fullName", "text", "parties"],
  ["Руководству", "Название организации", "respondent.name", "text", "parties"],
  ["ИНН", "ИНН", "respondent.inn", "text", "organization"],
  ["ОГРН", "ОГРН", "respondent.ogrn", "text", "organization"],
  ["ОГРНИП", "ОГРНИП", "respondent.ogrnip", "text", "organization"],
  ["КПП", "КПП", "respondent.kpp", "text", "organization"],
  ["Юридический адрес", "Юридический адрес", "respondent.legalAddress", "textarea", "addresses"],
  ["Адрес проживания", "Адрес проживания", "claimant.address", "textarea", "addresses"],
  ["Контактный телефон", "Телефон заявителя", "claimant.phone", "phone", "contacts"],
  ["Электронная почта", "Email заявителя", "claimant.email", "email", "contacts"],
  ["Размер задолженности", "Сумма задолженности", "claim.amount", "money", "amounts"],
  ["Период работы", "Период работы", "employment.period", "text", "dates"],
  ["Дата рождения", "Дата рождения", "claimant.birthDate", "date", "dates"],
  ["Дата документа", "Дата документа", "document.date", "date", "dates"],
];

function uniqueCandidateKey(baseKey, counters) {
  const count = (counters.get(baseKey) || 0) + 1;
  counters.set(baseKey, count);
  return count === 1 ? baseKey : `${baseKey}${count}`;
}

function detectBaseCandidateFields(text = "") {
  const candidates = [];
  const seen = new Map();
  const counters = new Map();
  const fullText = String(text);
  const add = ({ detectedText, suggestedLabel, suggestedKey, type, group = "other", confidence }) => {
    const clean = String(detectedText).trim().replace(/\s+/g, " ");
    if (!clean || clean.length > 240) return;
    if (type === "text" && /^(?:Российск(?:ая|ой)\s+Федераци(?:я|и)|Трудового\s+кодекса|Уголовного\s+кодекса|Государственная\s+инспекция\s+труда)$/i.test(clean)) return;
    if (suggestedKey === "person.fullName" && /(?:\sДата|\sАдрес|\sТелефон|\sПериод|\sТребования)$|(?:Российск|Федераци|кодекса|инспекци|министерств|правительств|суд)/i.test(clean)) return;
    const identity = clean.toLowerCase();
    const existing = seen.get(identity);
    if (existing) {
      if (confidence > existing.confidence) Object.assign(existing, { suggestedLabel, label: suggestedLabel, suggestedKey: existing.key, type, group, confidence });
      return;
    }
    const key = uniqueCandidateKey(suggestedKey, counters);
    const candidate = {
      id: `candidate-${candidates.length + 1}`,
      detectedText: clean,
      searchText: clean,
      suggestedLabel,
      suggestedKey: key,
      key,
      label: suggestedLabel,
      type,
      required: false,
      hint: "",
      options: [],
      order: candidates.length,
      confidence,
      group,
      source: "detected",
      selected: confidence >= .85,
      occurrenceCount: Math.max(1, fullText.split(clean).length - 1),
    };
    candidates.push(candidate);
    seen.set(identity, candidate);
  };

  const lines = fullText.split(/\n+/);
  lines.forEach((line, lineIndex) => {
    MARKER_HINTS.forEach(([marker, label, key, type, group]) => {
      const match = line.match(new RegExp(`^\\s*${marker}\\s*:\\s*(.+)$`, "i"));
      if (match) add({ detectedText: match[1], suggestedLabel: label, suggestedKey: key, type, group, confidence: .99 });
      else if (new RegExp(`^\\s*${marker}\\s*:\\s*$`, "i").test(line) && lines[lineIndex + 1]) {
        add({ detectedText: lines[lineIndex + 1], suggestedLabel: label, suggestedKey: key, type, group, confidence: .96 });
      }
    });
    if (/(?:область|город|г\.|ул\.|улица|дом|д\.|проспект)/i.test(line) && line.trim().length <= 220) {
      add({ detectedText: line, suggestedLabel: "Адрес", suggestedKey: "contact.address", type: "textarea", group: "addresses", confidence: .78 });
    }
    const selfReference = line.match(/(?:^|[.!?]\s*)Я,\s*([А-ЯЁ][а-яё-]+(?:[ \t]+[А-ЯЁ][а-яё-]+){1,3})/);
    if (selfReference) add({ detectedText: selfReference[1], suggestedLabel: "ФИО заявителя", suggestedKey: "claimant.fullName", type: "text", group: "parties", confidence: .99 });
  });

  const witnessNamePattern = /[А-ЯЁ][а-яё-]+(?:[ \t]+[А-ЯЁ][а-яё-]+){1,3}/g;
  lines.forEach((line, lineIndex) => {
    if (!/свидетел/i.test(line)) return;
    const sourceLines = [line.replace(/^.*?свидетел[ьяи]*\s*:?\s*/i, ""), lines[lineIndex + 1], lines[lineIndex + 2]].filter(Boolean);
    sourceLines.forEach(sourceLine => {
      for (const match of sourceLine.matchAll(witnessNamePattern)) add({ detectedText: match[0], suggestedLabel: "ФИО свидетеля", suggestedKey: "witness.fullName", type: "text", group: "witnesses", confidence: .9 });
    });
  });

  FIELD_HINTS.forEach(hint => {
    for (const match of fullText.matchAll(hint.pattern)) add({ detectedText: match[0], suggestedLabel: hint.label, suggestedKey: hint.key, type: hint.type, group: hint.group, confidence: hint.confidence });
  });
  return candidates;
}

const BLOCK_MARKERS = [
  { id: "recipient", pattern: /^(?:Руководству|Кому)\s*:/i },
  { id: "applicant", pattern: /^От\s*:/i },
  { id: "title", pattern: /^ПРЕТЕНЗИЯ(?:\s|$)/i },
  { id: "circumstances", pattern: /^ОБСТОЯТЕЛЬСТВА(?:\s|$)/i },
  { id: "demands", pattern: /^(?:ТРЕБОВАНИЯ|ТРЕБУЮ)(?:\s|$)/i },
  { id: "attachments", pattern: /^ПРИЛОЖЕНИЯ(?:\s|$)/i },
  { id: "witness", pattern: /^СВИДЕТЕЛЬ(?:\s|$)/i },
  { id: "signatures", pattern: /^(?:ПОДПИСИ|Заявитель\s*:|Подпись\s*:|Дата\s*:)/i },
];

const HEADING_PATTERN = /^(?:ПРЕТЕНЗИЯ|ОБСТОЯТЕЛЬСТВА|ТРЕБОВАНИЯ|ТРЕБУЮ|ПРИЛОЖЕНИЯ|СВИДЕТЕЛЬ|ПОДПИСИ)(?:\s|$)/i;
const DATE_NUMBER_PATTERN = /\b(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])\.(?:19|20)\d{2}\b/g;
const DATE_TEXT_PATTERN = /(?<![А-Яа-яЁё\d])(?:0?[1-9]|[12]\d|3[01])\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(?:19|20)\d{2}(?:\s+года)?(?![А-Яа-яЁё\d])/gi;

function detectDocumentType(text) {
  if (/(?:^|\s)ПРЕТЕНЗИЯ(?:\s|$)|(?:^|\s)ТРЕБУЮ(?:\s|$)/i.test(text)) return "pretrial_claim";
  if (/(?:^|\s)ДОГОВОР(?:\s|$)/i.test(text)) return "contract";
  if (/(?:^|\s)АКТ(?:\s|$)/i.test(text)) return "act";
  if (/(?:^|\s)ЗАЯВЛЕНИЕ(?:\s|$)/i.test(text)) return "application";
  if (/(?:^|\s)ЖАЛОБА(?:\s|$)/i.test(text)) return "complaint";
  return "other";
}

function blockDefinition(id) {
  return SEMANTIC_BLOCKS.find(block => block.id === id) || SEMANTIC_BLOCKS.at(-1);
}

function createSemanticBlocks(text) {
  const lines = String(text).split(/\n/).map(line => line.trim()).filter(Boolean);
  const starts = [];
  lines.forEach((line, index) => {
    const marker = BLOCK_MARKERS.find(item => item.pattern.test(line));
    if (!marker) return;
    if (marker.id === "signatures" && index < Math.floor(lines.length * .6)) return;
    if (!starts.some(item => item.id === marker.id)) starts.push({ id: marker.id, index, marker: line });
  });

  const titleIndex = starts.find(item => item.id === "title")?.index;
  if (titleIndex !== undefined && !starts.some(item => item.id === "circumstances")) {
    starts.push({ id: "circumstances", index: Math.min(titleIndex + 2, lines.length), marker: "После заголовка" });
  }
  starts.sort((a, b) => a.index - b.index);

  const blocks = starts.map((start, position) => {
    const next = starts[position + 1];
    const definition = blockDefinition(start.id);
    return {
      id: start.id,
      title: definition.title,
      description: definition.description,
      startMarker: start.marker,
      endMarker: next?.marker || "",
      textFragment: lines.slice(start.index, next?.index ?? lines.length).join("\n"),
      order: position,
    };
  });
  const used = new Set(blocks.map(block => block.id));
  SEMANTIC_BLOCKS.forEach(definition => {
    if (!used.has(definition.id)) blocks.push({ ...definition, startMarker: "", endMarker: "", textFragment: "", order: blocks.length });
  });
  return blocks.sort((a, b) => SEMANTIC_BLOCKS.findIndex(item => item.id === a.id) - SEMANTIC_BLOCKS.findIndex(item => item.id === b.id));
}

function collectMarkerValue(fragment, marker, stopMarkers = []) {
  const lines = String(fragment).split(/\n/).map(line => line.trim()).filter(Boolean);
  const start = lines.findIndex(line => new RegExp(`^${marker}\\s*:`, "i").test(line));
  if (start < 0) return "";
  const first = lines[start].replace(new RegExp(`^${marker}\\s*:\\s*`, "i"), "").trim();
  const parts = first ? [first] : [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (HEADING_PATTERN.test(line) || stopMarkers.some(stop => new RegExp(`^${stop}(?:\\s*:|\\s)`, "i").test(line))) break;
    parts.push(line);
  }
  return parts.join(", ").replace(/,\s*,/g, ",").trim();
}

function refineFieldsForBlocks(text, blocks) {
  const base = detectBaseCandidateFields(text);
  const fields = [];
  const identities = new Map();
  const counters = new Map();
  const add = field => {
    const clean = String(field.searchText || field.detectedText || "").trim().replace(/\s+/g, " ");
    if (!clean) return;
    const identity = `${clean.toLowerCase()}::${field.semanticBlock || "other"}`;
    const existing = identities.get(identity);
    if (existing) {
      existing.occurrenceCount = Math.max(existing.occurrenceCount || 1, field.occurrenceCount || 1);
      if ((field.confidence || 0) > (existing.confidence || 0)) {
        Object.assign(existing, field, { id: existing.id, order: existing.order });
        existing.selected = field.confidence >= .85;
      }
      return;
    }
    const baseKey = field.key || "document.field";
    const count = (counters.get(baseKey) || 0) + 1;
    counters.set(baseKey, count);
    const key = count === 1 ? baseKey : `${baseKey}${count}`;
    const next = {
      ...field,
      id: field.id || `candidate-${fields.length + 1}`,
      detectedText: clean,
      searchText: clean,
      key,
      suggestedKey: key,
      order: fields.length,
      selected: (field.confidence || 0) >= .85,
      occurrenceCount: field.occurrenceCount || Math.max(1, String(text).split(clean).length - 1),
    };
    fields.push(next);
    identities.set(identity, next);
  };

  base.forEach(field => {
    const matching = blocks.find(block => block.textFragment && block.textFragment.includes(field.searchText));
    const semanticBlock = field.confidence < .65 ? "other" : matching?.id || "other";
    let updates = { semanticBlock };
    if (semanticBlock === "witness" && /fullName/.test(field.key)) updates = { ...updates, label: "ФИО свидетеля", suggestedLabel: "ФИО свидетеля", key: "witness.fullName", group: "witnesses", confidence: Math.max(field.confidence, .9) };
    if (semanticBlock === "applicant" && field.type === "date") updates = { ...updates, label: "Дата рождения заявителя", suggestedLabel: "Дата рождения заявителя", key: "claimant.birthDate", confidence: .96 };
    if (semanticBlock === "signatures" && field.type === "date") updates = { ...updates, label: "Дата подписи", suggestedLabel: "Дата подписи", key: "signature.date", confidence: .86 };
    add({ ...field, ...updates });
  });

  const recipient = blocks.find(block => block.id === "recipient")?.textFragment || "";
  const applicant = blocks.find(block => block.id === "applicant")?.textFragment || "";
  const circumstances = blocks.find(block => block.id === "circumstances")?.textFragment || "";
  const demands = blocks.find(block => block.id === "demands")?.textFragment || "";
  const attachments = blocks.find(block => block.id === "attachments")?.textFragment || "";
  const witness = blocks.find(block => block.id === "witness")?.textFragment || "";
  const signatures = blocks.find(block => block.id === "signatures")?.textFragment || "";
  const title = blocks.find(block => block.id === "title")?.textFragment || "";

  const contextual = (searchText, label, key, type, semanticBlock, group, confidence = .98) => add({
    searchText, detectedText: searchText, label, suggestedLabel: label, key, type, semanticBlock, group,
    confidence, required: false, hint: "", options: [], source: "detected",
  });

  const legalAddress = collectMarkerValue(recipient, "Юридический адрес", ["ИНН", "ОГРН", "ОГРНИП", "КПП", "От"]);
  if (legalAddress) contextual(legalAddress, "Юридический адрес", "respondent.legalAddress", "textarea", "recipient", "addresses");
  const homeAddress = collectMarkerValue(applicant, "Адрес проживания", ["Контактный телефон", "Телефон", "Электронная почта", "Email", "Дата рождения"]);
  if (homeAddress) contextual(homeAddress, "Адрес проживания", "claimant.address", "textarea", "applicant", "addresses");
  [
    ["recipient", legalAddress, "respondent.legalAddress"],
    ["applicant", homeAddress, "claimant.address"],
  ].forEach(([semanticBlock, address, keeperKey]) => {
    if (!address) return;
    for (let index = fields.length - 1; index >= 0; index -= 1) {
      const field = fields[index];
      if (field.semanticBlock === semanticBlock && field.group === "addresses" && field.searchText !== address) {
        fields.splice(index, 1);
      }
    }
    const keeper = fields.find(field => field.semanticBlock === semanticBlock && field.searchText === address);
    if (keeper) {
      keeper.key = keeperKey;
      keeper.suggestedKey = keeperKey;
    }
  });

  const titleLines = title.split(/\n/).map(line => line.trim()).filter(Boolean);
  if (titleLines[0]) contextual(titleLines[0], "Название документа", "document.title", "text", "title", "other", .99);
  if (titleLines[1] && !HEADING_PATTERN.test(titleLines[1])) contextual(titleLines[1], "Тема документа", "document.subject", "text", "title", "other", .92);

  const circumstanceDates = [...circumstances.matchAll(DATE_TEXT_PATTERN), ...circumstances.matchAll(DATE_NUMBER_PATTERN)].map(match => match[0]);
  if (circumstanceDates[0]) contextual(circumstanceDates[0], "Дата начала работы", "employment.startDate", "date", "circumstances", "dates", .92);
  if (circumstanceDates[1]) contextual(circumstanceDates[1], "Дата окончания работы", "employment.endDate", "date", "circumstances", "dates", .92);
  const shiftPay = circumstances.match(/(?:оплат[аы]|ставк[аи])\s+(?:за\s+смену\s*)?(?:составлял[аи]?\s*)?(\d{1,3}(?:[ \u00a0]\d{3})*(?:[,.]\d{1,2})?\s*(?:₽|руб(?:\.|лей|ля)?))/i);
  if (shiftPay) contextual(shiftPay[1], "Оплата за смену", "employment.shiftPay", "money", "circumstances", "amounts", .99);
  const workAddress = collectMarkerValue(circumstances, "Адрес объекта", ["Оплата за смену", "Размер задолженности"]);
  if (workAddress) contextual(workAddress, "Адрес объекта", "employment.workAddress", "textarea", "circumstances", "addresses");
  const representative = circumstances.match(/(?:[Пп]редставитель работодателя|[Рр]уководитель)[ \t]*:?[ \t]*([А-ЯЁ][а-яё-]+(?:[ \t]+[А-ЯЁ][а-яё-]+){1,3})/);
  if (representative) contextual(representative[1], "Представитель работодателя", "respondent.representative", "text", "circumstances", "parties", .94);
  const circumstancesBody = circumstances.split(/\n/).slice(1).join("\n").trim();
  if (circumstancesBody) contextual(circumstancesBody, "Описание обстоятельств", "claim.circumstances", "textarea", "circumstances", "other", .72);

  const demandDeadline = demands.match(/(?:в течение|срок(?: исполнения)?\s*:?)\s*(\d+\s*(?:рабочих|календарных)?\s*(?:дней|дня|день))/i);
  if (demandDeadline) contextual(demandDeadline[1], "Срок исполнения требований", "claim.deadline", "text", "demands", "dates", .9);
  const compensation = demands.match(/(?:компенсаци[юя])[^.\n]{0,50}?(\d{1,3}(?:[ \u00a0]\d{3})*(?:[,.]\d{1,2})?\s*(?:₽|руб(?:\.|лей|ля)?))/i);
  if (compensation) contextual(compensation[1], "Компенсация", "claim.compensation", "money", "demands", "amounts", .92);
  const attachmentLines = attachments.split(/\n/).slice(1).filter(line => line.trim());
  if (attachmentLines.length) contextual(attachmentLines.join("\n"), "Список приложений", "attachments.list", "textarea", "attachments", "other", .9);
  const sheetCount = attachments.match(/(\d+)\s*(?:л\.|лист(?:ах|а|ов)?)/i);
  if (sheetCount) contextual(sheetCount[1], "Количество листов", "attachments.sheetCount", "number", "attachments", "other", .9);

  const witnessBirth = witness.match(/(?:дата рождения\s*:?\s*)?(\d{2}\.\d{2}\.\d{4})/i);
  if (witnessBirth) contextual(witnessBirth[1], "Дата рождения свидетеля", "witness.birthDate", "date", "witness", "dates", .995);
  for (const match of signatures.matchAll(/(?:Заявитель|Свидетель)\s*:?\s*([А-ЯЁ][а-яё-]+\s+[А-ЯЁ]\.[А-ЯЁ](?:\.[А-ЯЁ])?\.?)/g)) {
    const isWitness = /^Свидетель/i.test(match[0]);
    contextual(match[1], isWitness ? "ФИО в подписи свидетеля" : "ФИО в подписи заявителя", isWitness ? "signature.witnessName" : "signature.claimantName", "text", "signatures", isWitness ? "witnesses" : "parties", .94);
  }
  for (let index = fields.length - 1; index >= 0; index -= 1) {
    const field = fields[index];
    if (field.confidence < .65 && fields.some(other => other !== field && other.searchText === field.searchText && other.confidence >= .85)) fields.splice(index, 1);
  }
  return fields.sort((a, b) => a.order - b.order);
}

export function detectDocumentStructure(text = "") {
  const normalized = String(text).trim();
  const blocks = createSemanticBlocks(normalized);
  return {
    documentType: detectDocumentType(normalized),
    blocks,
    fields: refineFieldsForBlocks(normalized, blocks),
  };
}

export function detectCandidateFieldsFromText(text = "") {
  return detectDocumentStructure(text).fields;
}
