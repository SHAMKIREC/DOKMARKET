import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { AuthShell, ErrorText, button } from "./Login";
import { Consent, Field } from "./Register";
import { ERRORS, isValidRuPhone, normalizePhoneRu, validateEmail, validateFullName, validateInn, validateOrganizationName, validatePassword, validatePasswordConfirm } from "@/utils/authValidation";

const initial = { fullName: "", email: "", phone: "", organizationName: "", inn: "", password: "", confirmPassword: "", personalData: false, lawyerTerms: false };

export default function RegisterLawyer() {
  const { registerLawyer } = useAuth();
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
      organizationName: validateOrganizationName(form.organizationName),
      inn: validateInn(form.inn),
      password: validatePassword(form.password),
      confirmPassword: validatePasswordConfirm(form.password, form.confirmPassword),
      personalData: form.personalData ? "" : ERRORS.consent,
      lawyerTerms: form.lawyerTerms ? "" : ERRORS.consent,
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
      await registerLawyer({ ...form, email: form.email.trim().toLowerCase() });
      navigate("/BusinessCabinet", { replace: true });
    } catch (error) {
      if (error.message === "EMAIL_CONFIRMATION_REQUIRED") {
        setNotice("Кабинет создан. Подтвердите email по письму от сервиса, затем войдите.");
      } else {
        setErrors(current => ({ ...current, form: error.message === "EMAIL_EXISTS" ? "Аккаунт с таким email уже существует." : "Не удалось создать кабинет. Проверьте данные." }));
      }
    } finally { setBusy(false); }
  }

  return <AuthShell title="Кабинет юриста" subtitle="Регистрация юриста или юридического кабинета">
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 14 }}>
      <Field name="fullName" label="ФИО" placeholder="Петров Пётр Петрович" value={form.fullName} error={errors.fullName} onChange={setValue} />
      <Field name="email" label="Email" type="email" placeholder="lawyer@example.ru" value={form.email} error={errors.email} onChange={setValue} />
      <Field name="phone" label="Телефон" type="tel" placeholder="+7 (999) 999-99-99" value={form.phone} error={errors.phone} onChange={(name, value) => setValue(name, normalizePhoneRu(value))} />
      <Field name="organizationName" label="Название кабинета / организации" placeholder="Юридический кабинет Петрова" value={form.organizationName} error={errors.organizationName} onChange={setValue} />
      <Field name="inn" label="ИНН, необязательно" inputMode="numeric" placeholder="10 или 12 цифр" value={form.inn} error={errors.inn} onChange={(name, value) => setValue(name, value.replace(/\D/g, "").slice(0, 12))} />
      <Field name="password" label="Пароль" type="password" placeholder="Минимум 8 символов" value={form.password} error={errors.password} onChange={setValue} hint="Минимум 8 символов, буквы и цифры." />
      <Field name="confirmPassword" label="Повторите пароль" type="password" placeholder="Повторите пароль" value={form.confirmPassword} error={errors.confirmPassword} onChange={setValue} />
      <Consent checked={form.personalData} onChange={value => setValue("personalData", value)} error={errors.personalData}>Я согласен на обработку персональных данных</Consent>
      <Consent checked={form.lawyerTerms} onChange={value => setValue("lawyerTerms", value)} error={errors.lawyerTerms}>Я принимаю условия сервиса для юристов</Consent>
      {notice && <p role="status" style={{ color: "#86efac", margin: 0, fontSize: ".8rem", lineHeight: 1.45 }}>{notice}</p>}
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <button style={{ ...button, opacity: busy ? .7 : 1 }} disabled={busy}>{busy ? "Создаём…" : "Создать кабинет"}</button>
    </form>
    <Link to="/Login" style={{ color: "#c4b5fd", display: "inline-block", marginTop: 18, fontSize: ".82rem" }}>Вернуться ко входу</Link>
  </AuthShell>;
}
