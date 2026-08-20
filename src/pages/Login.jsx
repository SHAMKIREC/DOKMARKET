import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { validateEmail } from "@/utils/authValidation";

export const field = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(148,163,184,.22)", background: "rgba(15,23,42,.75)", color: "white", outline: "none" };
export const fieldStyle = error => ({ ...field, borderColor: error ? "rgba(251,113,133,.8)" : field.border, boxShadow: error ? "0 0 0 1px rgba(251,113,133,.12)" : "none" });
export const button = { width: "100%", minHeight: 48, padding: "12px", border: 0, borderRadius: 12, color: "white", fontWeight: 800, background: "linear-gradient(135deg,#0891b2,#7c3aed)", cursor: "pointer" };

export default function Login() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(false);

  function setValue(name, value) { setForm(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: "", form: "" })); }
  function enter(user) { navigate(user.role === "lawyer" ? "/BusinessCabinet" : "/Dashboard", { replace: true }); }
  async function submit(event) {
    event.preventDefault();
    const next = { email: validateEmail(form.email), password: form.password ? "" : "Введите пароль." };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try { enter(await login(form.email.trim().toLowerCase(), form.password)); }
    catch { setErrors(current => ({ ...current, form: "Неверный email или пароль." })); }
    finally { setBusy(false); }
  }
  async function demo(role) { setErrors({}); try { enter(await loginAsDemo(role)); } catch { setErrors({ form: "Демо-вход недоступен." }); } }

  return <AuthShell title="Вход в ДокМаркет" subtitle="Документы, покупки, заказы и работа со специалистами — в одном аккаунте.">
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: 14 }}>
      <Label text="Email"><input style={fieldStyle(errors.email)} type="email" autoComplete="email" placeholder="Введите email" value={form.email} onChange={event => setValue("email", event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email && <ErrorText>{errors.email}</ErrorText>}</Label>
      <Label text="Пароль"><span style={{ position: "relative", display: "block" }}><input style={{ ...fieldStyle(errors.password), paddingRight: 48 }} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Введите пароль" value={form.password} onChange={event => setValue("password", event.target.value)} aria-invalid={Boolean(errors.password)} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"} style={passwordToggle}><i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`} /></button></span>{errors.password && <ErrorText>{errors.password}</ErrorText>}</Label>
      <button type="button" onClick={() => setRecoveryNotice(true)} style={recoveryButton}>Забыли пароль?</button>
      {recoveryNotice && <p role="status" style={{ color: "#94a3b8", margin: 0, fontSize: ".8rem", lineHeight: 1.45 }}>Восстановление пароля будет доступно через единый аккаунт ДокМаркета.</p>}
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <button style={{ ...button, opacity: busy ? .7 : 1 }} disabled={busy}>{busy ? "Входим…" : "Войти в ДокМаркет"}</button>
    </form>
    <div style={{ display: "grid", gap: 9, marginTop: 18, fontSize: ".84rem" }}><Link to="/Register" style={{ color: "#67e8f9" }}>Нет аккаунта? Зарегистрироваться</Link><Link to="/RegisterLawyer" style={{ color: "#c4b5fd" }}>Продавец документов или специалист? Стать продавцом</Link></div>
    {import.meta.env.DEV && <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}><p style={{ color: "#64748b", fontSize: ".7rem", margin: "0 0 8px" }}>Режим разработки</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><button type="button" onClick={() => demo("user")} style={demoButton}>Войти как покупатель</button><button type="button" onClick={() => demo("lawyer")} style={demoButton}>Войти как продавец</button></div></div>}
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }) { return <section className="dm-auth-shell"><div className="dm-auth-card"><Link to="/" className="dm-auth-kicker"><i className="fa-solid fa-store" /> ДОКМАРКЕТ</Link><h1>{title}</h1><p className="dm-auth-subtitle">{subtitle}</p>{children}<Link to="/" className="dm-auth-home">← Вернуться на главную ДокМаркета</Link></div></section>; }
export function Label({ text, children }) { return <label style={{ color: "#cbd5e1", fontSize: ".82rem", display: "grid", gap: 7 }}>{text}{children}</label>; }
export function ErrorText({ children }) { return <span role="alert" style={{ color: "#fb7185", fontSize: ".75rem", lineHeight: 1.35 }}>{children}</span>; }

const demoButton = { flex: "1 1 165px", padding: "9px", borderRadius: 9, border: "1px solid rgba(148,163,184,.2)", background: "rgba(255,255,255,.04)", color: "#94a3b8", cursor: "pointer" };
const passwordToggle = { position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", width: 36, height: 36, border: 0, borderRadius: 8, background: "transparent", color: "#94a3b8", cursor: "pointer" };
const recoveryButton = { justifySelf: "end", padding: 0, border: 0, background: "transparent", color: "#67e8f9", fontSize: ".8rem", cursor: "pointer" };