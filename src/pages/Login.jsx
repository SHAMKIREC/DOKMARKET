import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { validateEmail } from "@/utils/authValidation";

function EyeIcon({off=false}){return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{off&&<path d="M4 4 20 20"/>}</svg>}
function StoreIcon(){return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 20v-5h8v5"/></svg>}

export const field = { width:"100%",padding:"13px 14px",borderRadius:12,border:"1px solid #294052",background:"#0a1724",color:"white",outline:"none" };
export const fieldStyle = error => ({...field,borderColor:error?"#7c2d36":field.border,boxShadow:error?"0 0 0 1px rgba(251,113,133,.10)":"none"});
export const button = { width:"100%",minHeight:48,padding:"12px",border:0,borderRadius:12,color:"#07111d",fontWeight:900,background:"#ff9f1c",cursor:"pointer" };

export default function Login(){
 const{login,loginAsDemo}=useAuth();const navigate=useNavigate();const[form,setForm]=useState({email:"",password:""});const[errors,setErrors]=useState({});const[busy,setBusy]=useState(false);const[showPassword,setShowPassword]=useState(false);const[recoveryNotice,setRecoveryNotice]=useState(false);
 function setValue(name,value){setForm(c=>({...c,[name]:value}));setErrors(c=>({...c,[name]:"",form:""}))}
 function enter(user){navigate(user.role==="lawyer"?"/BusinessCabinet":"/Dashboard",{replace:true})}
 async function submit(e){e.preventDefault();const next={email:validateEmail(form.email),password:form.password?"":"Введите пароль."};setErrors(next);if(Object.values(next).some(Boolean))return;setBusy(true);try{enter(await login(form.email.trim().toLowerCase(),form.password))}catch{setErrors(c=>({...c,form:"Неверный email или пароль."}))}finally{setBusy(false)}}
 async function demo(role){setErrors({});try{enter(await loginAsDemo(role))}catch{setErrors({form:"Демо-вход недоступен."})}}
 return <AuthShell title="Вход в ДокМаркет" subtitle="Один аккаунт для покупок, документов, заказов и кабинета селлера.">
  <form onSubmit={submit} noValidate style={{display:"grid",gap:14}}>
   <Label text="Email"><input style={fieldStyle(errors.email)} type="email" autoComplete="email" placeholder="Введите email" value={form.email} onChange={e=>setValue("email",e.target.value)} aria-invalid={Boolean(errors.email)}/>{errors.email&&<ErrorText>{errors.email}</ErrorText>}</Label>
   <Label text="Пароль"><span style={{position:"relative",display:"block"}}><input style={{...fieldStyle(errors.password),paddingRight:48}} type={showPassword?"text":"password"} autoComplete="current-password" placeholder="Введите пароль" value={form.password} onChange={e=>setValue("password",e.target.value)} aria-invalid={Boolean(errors.password)}/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Скрыть пароль":"Показать пароль"} style={passwordToggle}><EyeIcon off={showPassword}/></button></span>{errors.password&&<ErrorText>{errors.password}</ErrorText>}</Label>
   <button type="button" onClick={()=>setRecoveryNotice(true)} style={recoveryButton}>Забыли пароль?</button>
   {recoveryNotice&&<p role="status" style={{color:"#91a1b3",margin:0,fontSize:".78rem",lineHeight:1.45}}>Восстановление пароля подключается к единому аккаунту ДокМаркета. До запуска этой функции можно войти по действующим данным аккаунта.</p>}
   {errors.form&&<ErrorText>{errors.form}</ErrorText>}
   <button style={{...button,opacity:busy?.7:1}} disabled={busy}>{busy?"Входим…":"Войти"}</button>
  </form>
  <div className="dm-auth-links"><Link to="/Register">Создать аккаунт покупателя</Link><Link to="/RegisterLawyer">Стать селлером</Link></div>
  {import.meta.env.DEV&&<div className="dm-dev-auth"><p>Режим разработки</p><div><button type="button" onClick={()=>demo("user")} style={demoButton}>Покупатель</button><button type="button" onClick={()=>demo("lawyer")} style={demoButton}>Селлер</button></div></div>}
 </AuthShell>;
}
export function AuthShell({title,subtitle,children}){return <section className="dm-auth-shell"><style>{authCss}</style><div className="dm-auth-card"><Link to="/" className="dm-auth-kicker"><StoreIcon/><span><b>Док</b>Маркет</span></Link><h1>{title}</h1><p className="dm-auth-subtitle">{subtitle}</p>{children}<Link to="/" className="dm-auth-home">← На главную</Link></div></section>}
export function Label({text,children}){return <label style={{color:"#d6dee7",fontSize:".8rem",display:"grid",gap:7,fontWeight:700}}>{text}{children}</label>}
export function ErrorText({children}){return <span role="alert" style={{color:"#fb7185",fontSize:".74rem",lineHeight:1.35}}>{children}</span>}
const demoButton={flex:"1 1 140px",padding:"9px",borderRadius:9,border:"1px solid #294052",background:"#0b1825",color:"#91a1b3",cursor:"pointer"};
const passwordToggle={position:"absolute",top:"50%",right:7,transform:"translateY(-50%)",width:36,height:36,border:0,borderRadius:8,background:"transparent",color:"#91a1b3",cursor:"pointer",display:"grid",placeItems:"center"};
const recoveryButton={justifySelf:"end",padding:0,border:0,background:"transparent",color:"#ffad42",fontSize:".78rem",fontWeight:700,cursor:"pointer"};
const authCss=`.dm-auth-shell{min-height:100vh;padding:92px 14px 84px;display:grid;place-items:start center;background:radial-gradient(circle at 50% 0%,rgba(255,159,28,.09),transparent 25rem),#07111d}.dm-auth-card{width:min(470px,100%);padding:24px;border-radius:22px;border:1px solid #263d4f;background:#0d1b29;color:#fff;box-shadow:0 24px 80px rgba(0,0,0,.28)}.dm-auth-kicker{display:inline-flex;align-items:center;gap:8px;color:#ff9f1c;text-decoration:none;font-weight:900;font-size:.75rem}.dm-auth-kicker span{font-size:.92rem;color:#ff9f1c}.dm-auth-kicker b{color:#fff}.dm-auth-card h1{margin:13px 0 7px;font:850 1.8rem/1.08 'Space Grotesk',sans-serif}.dm-auth-subtitle{margin:0 0 20px;color:#91a1b3;font-size:.82rem;line-height:1.5}.dm-auth-links{display:grid;gap:8px;margin-top:16px}.dm-auth-links a{color:#ffb65f;text-decoration:none;font-size:.82rem;font-weight:750}.dm-auth-home{display:block;margin-top:22px;padding-top:16px;border-top:1px solid #1f3445;color:#7f90a4;text-decoration:none;font-size:.76rem}.dm-dev-auth{margin-top:18px;padding-top:14px;border-top:1px solid #1f3445}.dm-dev-auth p{color:#617386;font-size:.68rem;margin:0 0 8px}.dm-dev-auth>div{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:600px){.dm-auth-shell{padding:78px 10px 76px}.dm-auth-card{padding:18px;border-radius:18px}.dm-auth-card h1{font-size:1.55rem}}`;
