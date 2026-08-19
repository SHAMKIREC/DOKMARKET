// Detects gibberish / random character sequences in Russian text
// Returns { isSuspicious: boolean, message: string|null, fields: string[] }

const GIBBERISH_PATTERNS = [
  // Long sequences without spaces (30+ chars without a space)
  /[^\s]{30,}/,
  // Mix of upper/lower case in unnatural patterns (5+ alternating case changes)
  /[а-я]{2,}[А-Я]{2,}[а-я]{2,}/,
  // Random consonant clusters (5+ consonants in a row, excluding common Russian clusters)
  /[бвгджзйклмнпрстфхцчшщ]{6,}/i,
  // Too many uppercase letters ratio (>40% uppercase in a word)
  // Same letter repeated 4+ times consecutively (e.g. "аааа")
  /(.)\1{3,}/i,
];

const CONSONANTS = "бвгджзйклмнпрстфхцчшщ";
const VOWELS = "аеёиоуыэюя";

function isGibberish(text) {
  if (!text || text.trim().length < 8) return false;

  const cleaned = text.replace(/\s+/g, " ").trim();

  // Check patterns
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(cleaned)) return true;
  }

  // Check consonant/vowel ratio for Russian text
  const letters = cleaned.toLowerCase().replace(/[^а-яё]/g, "");
  if (letters.length >= 10) {
    let consonants = 0;
    let vowels = 0;
    for (const ch of letters) {
      if (CONSONANTS.includes(ch)) consonants++;
      if (VOWELS.includes(ch)) vowels++;
    }
    // If consonant ratio is >80%, likely gibberish
    if (vowels === 0 || consonants / (consonants + vowels) > 0.8) return true;
  }

  // Check for random character distribution (entropy-like check)
  // Many unique characters in a short string suggests gibberish
  const uniqueChars = new Set(letters);
  if (letters.length > 10 && uniqueChars.size > letters.length * 0.7) return true;

  return false;
}

// Fields we want to check for gibberish
const FIELDS_TO_CHECK = [
  { key: "name", label: "ФИО", source: "workers" },
  { key: "address", label: "Адрес", source: "workers" },
  { key: "description", label: "Описание ситуации", source: "circumstances" },
  { key: "supervisor", label: "ФИО руководителя", source: "circumstances" },
  { key: "workplace", label: "Место работы", source: "circumstances" },
  { key: "productName", label: "Наименование товара/курса", source: "circumstances" },
  { key: "defectDescription", label: "Описание недостатков", source: "circumstances" },
  { key: "partialPayments", label: "Частичные выплаты", source: "circumstances" },
  { key: "socialImpact", label: "Социальные последствия", source: "circumstances" },
];

export function checkGarbledText(claimData) {
  const suspiciousFields = [];

  for (const field of FIELDS_TO_CHECK) {
    let value = "";

    if (field.source === "workers" && claimData.workers) {
      for (const w of claimData.workers) {
        if (w[field.key] && isGibberish(w[field.key])) {
          suspiciousFields.push(`${field.label} (${w.name || "заявитель"})`);
        }
      }
    } else if (field.source === "circumstances" && claimData.circumstances) {
      value = claimData.circumstances[field.key] || "";
      if (value && isGibberish(value)) {
        suspiciousFields.push(field.label);
      }
    }
  }

  return {
    isSuspicious: suspiciousFields.length > 0,
    fields: suspiciousFields,
    message: suspiciousFields.length > 0
      ? "Обнаружен подозрительный текст. Проверьте данные перед генерацией документа."
      : null,
  };
}

export { isGibberish };