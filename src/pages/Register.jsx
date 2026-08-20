import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { AuthShell, Label, ErrorText, fieldStyle, button } from "./Login";
import { ERRORS, isValidRuPhone, normalizePhoneRu, validateEmail, validateFullName, validatePassword, validatePasswordConfirm } from "@/utils/authValidation";

const initial = { fullName: "", email: "", phone: "", password: "", confirmPassword: "", personalData: false, terms: false };

export default function Register() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  function setValue(name, value) {
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: "", form: "" }));
    setNotice("");
  }
  function validate() {
    const next = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: isValidRuPhone(form.phone) ? "" : ERRORS.phone,
      password: validatePassword(form.password),
      confirmPassword: validatePasswordConfirm(form.password, form.confirmPassword),
      personalData: form.personalData ? "" : ERRORS.consent,
      terms: form.terms ? "" : ERRORS.consent,
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  }
  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setNotice("");
    try {
      await registerUser({ ...form, email: form.email.trim().toLowerCase() });
      navigate("/Dashboard", { replace: true });
    } catch (error) {
      if (error.message === "EMAIL_CONFIRMATION_REQUIRED") {
        setNotice("Аккаунт создан. Подтвердите email по письму от сервиса, затем войдите.");
      } else {
        setErrors(current => ({ ...current, form: error.message === "EMAIL_EXISTS" ? "Аккаунт с таким email уже существует." : "Не удалось создать аккаунт. Проверьте данные." }));
      }
    } finally { setBusy(false); }
  }

  return <AuthShell title="Регистрация" subtitle="Личный кабинет физического лица">
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 14 }}>
      <Field name="fullName" label="ФИО" placeholder="Иванов Иван Иванович" value={form.fullName} error={errors.fullName} onChange={setValue} />
      <Field name="email" label="Email" type="email" placeholder="name@example.ru" value={form.email} error={errors.email} onChange={setValue} />
      <Field name="phone" label="Телефон" type="tel" placeholder="+7 (999) 999-99-99" value={form.phone} error={errors.phone} onChange={(name, value) => setValue(name, normalizePhoneRu(value))} />
      <Field name="password" label="Пароль" type="password" placeholder="Минимум 8 символов" value={form.password} error={errors.password} onChange={setValue} hint="Минимум 8 символов, буквы и цифры." />
      <Field name="confirmPassword" label="Повторите пароль" type="password" placeholder="Повторите пароль" value={form.confirmPassword} error={errors.confirmPassword} onChange={setValue} />
      <Consent checked={form.personalData} onChange={value => setValue("personalData", value)} error={errors.personalData}>Я согласен на обработку персональных данных</Consent>
      <Consent checked={form.terms} onChange={value => setValue("terms", value)} error={errors.terms}>Я принимаю пользовательское соглашение</Consent>
      {notice && <p role="status" style={{ color: "#86efac", margin: 0, fontSize: ".8rem", lineHeight: 1.45 }}>{notice}</p>}
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <button style={{ ...button, opacity: busy ? .7 : 1 }} disabled={busy}>{busy ? "Создаём…" : "Создать аккаунт"}</button>
    </form>
    <Link to="/Login" style={{ color: "#67e8f9", display: "inline-block", marginTop: 18, fontSize: ".82rem" }}>Уже есть аккаунт</Link>
  </AuthShell>;
}

export function Field({ name, label, type = "text", placeholder, value, error, onChange, hint, inputMode }) {
  return <Label text={label}><input style={fieldStyle(error)} type={type} inputMode={inputMode} placeholder={placeholder} value={value} onChange={event => onChange(name, event.target.value)} aria-invalid={Boolean(error)} />{hint && !error && <span style={hintStyle}>{hint}</span>}{error && <ErrorText>{error}</ErrorText>}</Label>;
}

export function Consent({ checked, onChange, error, children }) {
  return <div><label style={consentStyle}><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} style={{ width: 17, height: 17, accentColor: "#06b6d4", flex: "0 0 auto", marginTop: 1 }} /><span>{children}</span></label>{error && <ErrorText>{error}</ErrorText>}</div>;
}

const hintStyle = { color: "#64748b", fontSize: ".73rem", lineHeight: 1.35 };
const consentStyle = { display: "flex", alignItems: "flex-start", gap: 9, color: "#cbd5e1", fontSize: ".78rem", lineHeight: 1.4, cursor: "pointer" };