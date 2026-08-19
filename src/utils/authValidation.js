export const ERRORS = {
  fullName: "Укажите ФИО минимум из двух слов.",
  email: "Введите корректный email.",
  phone: "Введите корректный номер телефона РФ.",
  password: "Пароль должен содержать минимум 8 символов, буквы и цифры.",
  passwordConfirm: "Пароли не совпадают.",
  inn: "ИНН должен содержать 10 или 12 цифр.",
  organizationName: "Укажите название кабинета или организации.",
  consent: "Необходимо принять согласие.",
};

function phoneDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizePhoneRu(value = "") {
  let digits = phoneDigits(value).slice(0, 11);
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) return digits;
  const local = digits.slice(1);
  let result = "+7";
  if (local.length) result += ` (${local.slice(0, 3)}`;
  if (local.length >= 3) result += ")";
  if (local.length > 3) result += ` ${local.slice(3, 6)}`;
  if (local.length > 6) result += `-${local.slice(6, 8)}`;
  if (local.length > 8) result += `-${local.slice(8, 10)}`;
  return result;
}

export function isValidRuPhone(value = "") {
  const digits = phoneDigits(value);
  return digits.length === 10 || (digits.length === 11 && /^[78]/.test(digits));
}

export function validateFullName(value = "") {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every(word => /^[A-Za-zА-Яа-яЁё-]{2,}$/.test(word)) ? "" : ERRORS.fullName;
}

export function validateEmail(value = "") {
  const email = String(value).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "" : ERRORS.email;
}

export function validatePassword(value = "") {
  const password = String(value);
  return password.length >= 8 && /[A-Za-zА-Яа-яЁё]/.test(password) && /\d/.test(password) ? "" : ERRORS.password;
}

export function validatePasswordConfirm(password = "", confirmPassword = "") {
  return confirmPassword && password === confirmPassword ? "" : ERRORS.passwordConfirm;
}

export function validateInn(value = "", required = false) {
  const inn = String(value).trim();
  if (!inn && !required) return "";
  return /^\d{10}(\d{2})?$/.test(inn) ? "" : ERRORS.inn;
}

export function validateOrganizationName(value = "") {
  const name = String(value).trim();
  return name.length >= 3 && !/^\d+$/.test(name) ? "" : ERRORS.organizationName;
}
