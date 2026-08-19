import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { listDocuments } from "@/services/documentService";
import { incrementEarlyAccessCounter } from "@/services/earlyAccessService";
import DatePickerField from "@/components/generator/DatePickerField";
import { isValidRuPhone, normalizePhoneRu, validateEmail, validateFullName } from "@/utils/authValidation";

const initial = { claimant_name: "", claimant_address: "", claimant_phone: "", claimant_email: "", claimant_birthdate: "", claimant_gender: "male" };

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initial);
  const [docCount, setDocCount] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDocCount(listDocuments({ userId: user.id }).length);
    setProfile({
      claimant_name: user.claimant_name || user.fullName || user.full_name || user.name || "",
      claimant_address: user.claimant_address || "",
      claimant_phone: user.claimant_phone || user.phone || "",
      claimant_email: user.claimant_email || user.email || "",
      claimant_birthdate: user.claimant_birthdate || "",
      claimant_gender: user.claimant_gender || "male",
    });
  }, [user]);

  function setValue(name, value) {
    setProfile(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: "", form: "" }));
    setSaved(false);
  }
  function validate() {
    const next = {
      claimant_name: validateFullName(profile.claimant_name),
      claimant_phone: profile.claimant_phone && !isValidRuPhone(profile.claimant_phone) ? "Введите корректный номер телефона РФ." : "",
      claimant_email: validateEmail(profile.claimant_email),
      claimant_birthdate: profile.claimant_birthdate && new Date(profile.claimant_birthdate) > new Date() ? "Дата рождения не может быть в будущем." : "",
    };
    setErrors(next); return !Object.values(next).some(Boolean);
  }
  function saveProfile(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const wasEmpty = !user?.claimant_name;
      updateUser({ ...profile, claimant_email: profile.claimant_email.trim().toLowerCase() });
      if (wasEmpty && profile.claimant_name && profile.claimant_address && profile.claimant_phone) incrementEarlyAccessCounter();
      setSaved(true);
    } catch { setErrors(current => ({ ...current, form: "Не удалось сохранить данные. Попробуйте ещё раз." })); }
    finally { setSaving(false); }
  }
  function exit() { logout(); navigate("/", { replace: true }); }

  const displayName = user?.fullName || user?.full_name || user?.name || "Пользователь";
  const registered = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("ru-RU") : "Дата регистрации пока не указана";

  return <div className="min-h-screen pt-24 pb-14 px-4"><style>{styles}{footerStyles}</style><div className="profile-shell">
    <Link className="back-link" to="/Dashboard"><i className="fa-solid fa-arrow-left"></i> Назад в личный кабинет</Link>
    <header><h1>Профиль</h1><p>Эти данные можно использовать при заполнении будущих претензий.</p></header>
    <section className="account-card"><div className="avatar">{displayName.split(/\s+/).map(word => word[0]).slice(0, 2).join("").toUpperCase()}</div><div className="account-main"><b>{displayName}</b><span>{user?.email || "Email не указан"}</span></div><dl><div><dt>Дата регистрации</dt><dd>{registered}</dd></div><div><dt>Претензий</dt><dd>{docCount}</dd></div></dl></section>
    <form className="profile-form" onSubmit={saveProfile} noValidate><div className="form-head"><div><h2>Личные данные</h2><p>Проверьте информацию перед созданием следующей претензии.</p></div>{saved && <span className="saved"><i className="fa-solid fa-check"></i> Сохранено</span>}</div><div className="form-grid">
      <Field label="ФИО полностью" error={errors.claimant_name} wide><input value={profile.claimant_name} onChange={event => setValue("claimant_name", event.target.value)} placeholder="Иванов Иван Иванович" /></Field>
      <Field label="Адрес регистрации" wide><input value={profile.claimant_address} onChange={event => setValue("claimant_address", event.target.value)} placeholder="г. Москва, ул. Пушкина, д. 1" /></Field>
      <Field label="Телефон" error={errors.claimant_phone}><input type="tel" value={profile.claimant_phone} onChange={event => setValue("claimant_phone", normalizePhoneRu(event.target.value))} placeholder="+7 (999) 999-99-99" /></Field>
      <Field label="Дата рождения" error={errors.claimant_birthdate}><DatePickerField value={profile.claimant_birthdate} onChange={value => setValue("claimant_birthdate", value)} /></Field>
      <Field label="Email" error={errors.claimant_email} wide><input type="email" value={profile.claimant_email} onChange={event => setValue("claimant_email", event.target.value)} placeholder="name@example.ru" /></Field>
      <Field label="Пол" wide><div className="gender-row">{[["male", "Мужской"], ["female", "Женский"]].map(([value, label]) => <button type="button" className={profile.claimant_gender === value ? "active" : ""} onClick={() => setValue("claimant_gender", value)} key={value}>{label}</button>)}</div></Field>
    </div>{errors.form && <p className="form-error">{errors.form}</p>}<button className="save-button" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить данные"}</button></form>
    <section className="logout-card"><div><b>Завершить работу</b><p>После выхода защищённые страницы снова потребуют авторизацию.</p></div><button onClick={exit}><i className="fa-solid fa-right-from-bracket"></i> Выйти из аккаунта</button></section>
    <CabinetFooter />
  </div></div>;
}

function CabinetFooter() { return <footer className="cabinet-footer"><span>© 2026 Досудебка — генерация юридических документов по законодательству РФ</span><a href="https://t.me/+mxSPQZosRBAwMTMy" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-telegram"></i> Telegram</a></footer>; }

function Field({ label, error, wide, children }) { return <label className={`field ${wide ? "wide" : ""} ${error ? "invalid" : ""}`}><span>{label}</span>{children}{error && <small>{error}</small>}</label>; }

const styles = `
.profile-shell{max-width:820px;margin:0 auto;color:#e2e8f0}.back-link{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;color:#67e8f9;text-decoration:none;font-size:.78rem;margin-bottom:20px;border-radius:999px;border:1px solid rgba(34,211,238,.25);background:rgba(15,23,42,.58);transition:.2s}.back-link:hover{color:#a5f3fc;border-color:rgba(103,232,249,.5);box-shadow:0 0 22px rgba(34,211,238,.09)}.profile-shell header{margin-bottom:22px}.profile-shell h1{font:800 clamp(1.7rem,4vw,2.2rem) 'Space Grotesk',sans-serif;color:white;margin:0 0 7px}.profile-shell header p,.form-head p,.logout-card p{color:#94a3b8;margin:0;line-height:1.5;font-size:.84rem}.account-card,.profile-form,.logout-card{background:rgba(15,23,42,.64);border:1px solid rgba(148,163,184,.12);box-shadow:0 14px 45px rgba(2,6,23,.18);backdrop-filter:blur(14px);border-radius:17px}.account-card{padding:18px;display:flex;align-items:center;gap:14px;margin-bottom:14px}.avatar{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;font-weight:800}.account-main{display:grid;gap:4px;min-width:0;flex:1}.account-main b{color:white}.account-main span{color:#64748b;font-size:.77rem;overflow-wrap:anywhere}.account-card dl{display:flex;gap:22px;margin:0}.account-card dl>div{display:grid;gap:3px}.account-card dt{color:#64748b;font-size:.67rem}.account-card dd{color:#cbd5e1;font-size:.77rem;margin:0}.profile-form{padding:21px;margin-bottom:14px}.form-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:20px}.form-head h2{color:white;font-size:1.05rem;margin:0 0 5px}.saved{color:#86efac;font-size:.73rem;white-space:nowrap}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.field{display:grid;gap:6px;color:#cbd5e1;font-size:.76rem}.field.wide{grid-column:1/-1}.field input,.field select{width:100%;padding:11px 13px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.14);color:white;outline:none}.field input:focus{border-color:rgba(34,211,238,.4);box-shadow:0 0 0 2px rgba(34,211,238,.06)}.field.invalid input{border-color:rgba(251,113,133,.65)}.field small,.form-error{color:#fb7185;font-size:.7rem;margin:0}.gender-row{display:flex;gap:8px}.gender-row button{flex:1;padding:10px;border-radius:9px;border:1px solid rgba(148,163,184,.13);background:rgba(255,255,255,.035);color:#94a3b8;cursor:pointer}.gender-row button.active{color:#67e8f9;border-color:rgba(34,211,238,.3);background:rgba(34,211,238,.07)}.save-button{margin-top:19px;padding:11px 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#0891b2,#7c3aed);color:white;font-weight:750;cursor:pointer}.save-button:disabled{opacity:.65}.logout-card{padding:17px 19px;display:flex;justify-content:space-between;align-items:center;gap:15px}.logout-card b{color:white;font-size:.88rem}.logout-card button{display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:9px;border:1px solid rgba(251,113,133,.2);background:rgba(244,63,94,.055);color:#fda4af;cursor:pointer}.logout-card button:hover{border-color:rgba(251,113,133,.4);background:rgba(244,63,94,.09)}@media(max-width:650px){.account-card{align-items:flex-start;flex-wrap:wrap}.account-card dl{width:100%;justify-content:space-between;border-top:1px solid rgba(255,255,255,.06);padding-top:12px}.form-grid{grid-template-columns:1fr}.field.wide{grid-column:auto}.logout-card{align-items:flex-start;flex-direction:column}.logout-card button{width:100%;justify-content:center}}`;

const footerStyles = `.cabinet-footer{display:flex;justify-content:space-between;gap:16px;margin-top:38px;padding-top:18px;border-top:1px solid rgba(148,163,184,.1);color:#64748b;font-size:.68rem}.cabinet-footer a{color:#64748b;text-decoration:none}.cabinet-footer a:hover{color:#67e8f9}@media(max-width:620px){.cabinet-footer{flex-direction:column}}`;
