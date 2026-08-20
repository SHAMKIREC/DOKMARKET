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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      if (error.message === "EMAIL_CONFIRMATION_REQUIRED") setNotice("Аккаунт создан. Подтвердите email по письму, затем войдите.");
      else setErrors(current => ({ ...current, form: error.message === "EMAIL_EXISTS" ? "Аккаунт с таким email уже существует." : "Не удалось создать аккаунт. Проверьте данные." }));
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Регистрация" subtitle="Создайте аккаунт, чтобы покупать документы, сохранять покупки и заказывать услуги продавцов.">
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 10 }}>
      <Field name="fullName" label="ФИО" placeholder="Иванов Иван Иванович" value={form.fullName} error={errors.fullName} onChange={setValue} />
      <Field name="email" label="Email" type="email" placeholder="name@example.ru" value={form.email} error={errors.email} onChange={setValue} />
      <Field name="phone" label="Телефон" type="tel" inputMode="tel" placeholder="+7 (999) 999-99-99" value={form.phone} error={errors.phone} onChange={(name, value) => setValue(name, normalizePhoneRu(value))} />
      <PasswordField name="password" label="Пароль" placeholder="Минимум 8 символов" value={form.password} error={errors.password} onChange={setValue} visible={showPassword} onToggle={() => setShowPassword(value => !value)} hint="Минимум 8 символов, буквы и цифры." />
      <PasswordField name="confirmPassword" label="Повторите пароль" placeholder="Повторите пароль" value={form.confirmPassword} error={errors.confirmPassword} onChange={setValue} visible={showConfirm} onToggle={() => setShowConfirm(value => !value)} />

      <div className="dm-auth-consents">
        <Consent checked={form.personalData} onChange={value => setValue("personalData", value)} error={errors.personalData}>Я согласен на <Link to="/privacy" target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>обработку персональных данных</Link></Consent>
        <Consent checked={form.terms} onChange={value => setValue("terms", value)} error={errors.terms}>Я принимаю <Link to="/terms" target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>пользовательское соглашение ДокМаркета</Link></Consent>
      </div>

      {notice && <p role="status" style={{ color: "#86efac", margin: 0, fontSize: ".76rem", lineHeight: 1.4 }}>{notice}</p>}
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <button style={{ ...button, minHeight: 46, marginTop: 2, opacity: busy ? .7 : 1 }} disabled={busy}>{busy ? "Создаём…" : "Создать аккаунт"}</button>
    </form>
    <Link to="/Login" style={{ color: "#67e8f9", display: "inline-block", marginTop: 14, fontSize: ".82rem" }}>Уже есть аккаунт? Войти</Link>
  </AuthShell>;
}

export function Field({ name, label, type = "text", placeholder, value, error, onChange, hint, inputMode }) {
  return <Label text={label}><input style={{ ...fieldStyle(error), padding: "11px 13px" }} type={type} inputMode={inputMode} placeholder={placeholder} value={value} onChange={event => onChange(name, event.target.value)} aria-invalid={Boolean(error)} />{hint && !error && <span style={hintStyle}>{hint}</span>}{error && <ErrorText>{error}</ErrorText>}</Label>;
}

function PasswordField({ name, label, placeholder, value, error, onChange, visible, onToggle, hint }) {
  return <Label text={label}><div style={{ position: "relative" }}><input style={{ ...fieldStyle(error), padding: "11px 46px 11px 13px" }} type={visible ? "text" : "password"} placeholder={placeholder} value={value} onChange={event => onChange(name, event.target.value)} aria-invalid={Boolean(error)} /><button type="button" aria-label={visible ? "Скрыть пароль" : "Показать пароль"} onClick={onToggle} style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, border: 0, borderRadius: 9, background: "transparent", color: "#94a3b8", cursor: "pointer" }}><i className={`fa-regular ${visible ? "fa-eye-slash" : "fa-eye"}`} /></button></div>{hint && !error && <span style={hintStyle}>{hint}</span>}{error && <ErrorText>{error}</ErrorText>}</Label>;
}

export function Consent({ checked, onChange, error, children }) {
  return <div><label style={consentStyle}><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} style={{ width: 18, height: 18, accentColor: "#06b6d4", flex: "0 0 auto", marginTop: 1 }} /><span>{children}</span></label>{error && <ErrorText>{error}</ErrorText>}</div>;
}

const hintStyle = { color: "#64748b", fontSize: ".69rem", lineHeight: 1.3 };
const consentStyle = { display: "flex", alignItems: "flex-start", gap: 8, color: "#cbd5e1", fontSize: ".75rem", lineHeight: 1.4, cursor: "pointer" };
