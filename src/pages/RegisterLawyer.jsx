import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { AuthShell, ErrorText, button } from "./Login";
import { Consent, Field } from "./Register";
import { ERRORS, isValidRuPhone, normalizePhoneRu, validateEmail, validateFullName, validateInn, validateOrganizationName, validatePassword, validatePasswordConfirm } from "@/utils/authValidation";

const initial={fullName:"",email:"",phone:"",organizationName:"",inn:"",password:"",confirmPassword:"",personalData:false,sellerTerms:false};
export default function RegisterLawyer(){
 const{registerLawyer}=useAuth();const navigate=useNavigate();const[form,setForm]=useState(initial);const[errors,setErrors]=useState({});const[busy,setBusy]=useState(false);const[notice,setNotice]=useState("");
 function setValue(name,value){setForm(c=>({...c,[name]:value}));setErrors(c=>({...c,[name]:"",form:""}));setNotice("")}
 function validate(){const next={fullName:validateFullName(form.fullName),email:validateEmail(form.email),phone:isValidRuPhone(form.phone)?"":ERRORS.phone,organizationName:form.organizationName.trim()?validateOrganizationName(form.organizationName):"",inn:form.inn?validateInn(form.inn):"",password:validatePassword(form.password),confirmPassword:validatePasswordConfirm(form.password,form.confirmPassword),personalData:form.personalData?"":ERRORS.consent,sellerTerms:form.sellerTerms?"":ERRORS.consent};setErrors(next);return!Object.values(next).some(Boolean)}
 async function submit(e){e.preventDefault();if(!validate())return;setBusy(true);try{await registerLawyer({...form,email:form.email.trim().toLowerCase()});navigate("/BusinessCabinet",{replace:true})}catch(error){if(error.message==="EMAIL_CONFIRMATION_REQUIRED")setNotice("Аккаунт селлера создан. Подтвердите email, затем войдите — кабинет будет доступен автоматически.");else setErrors(c=>({...c,form:error.message==="EMAIL_EXISTS"?"Аккаунт с таким email уже существует.":"Не удалось создать аккаунт. Проверьте данные."}))}finally{setBusy(false)}}
 return <AuthShell title="Стать селлером" subtitle="Загружайте документы, публикуйте услуги и получайте заказы покупателей внутри ДокМаркета.">
  <form onSubmit={submit} noValidate style={{display:"grid",gap:11}}>
   <Field name="fullName" label="ФИО" placeholder="Петров Пётр Петрович" value={form.fullName} error={errors.fullName} onChange={setValue}/>
   <Field name="email" label="Email" type="email" placeholder="seller@example.ru" value={form.email} error={errors.email} onChange={setValue}/>
   <Field name="phone" label="Телефон" type="tel" placeholder="+7 (999) 999-99-99" value={form.phone} error={errors.phone} onChange={(n,v)=>setValue(n,normalizePhoneRu(v))}/>
   <Field name="organizationName" label="Название магазина или бренда, необязательно" placeholder="Например: Бюро документов" value={form.organizationName} error={errors.organizationName} onChange={setValue} hint="Если продаёте от своего имени — оставьте пустым."/>
   <Field name="inn" label="ИНН, необязательно" inputMode="numeric" placeholder="10 или 12 цифр" value={form.inn} error={errors.inn} onChange={(n,v)=>setValue(n,v.replace(/\D/g,"").slice(0,12))}/>
   <Field name="password" label="Пароль" type="password" placeholder="Минимум 8 символов" value={form.password} error={errors.password} onChange={setValue} hint="Минимум 8 символов, буквы и цифры."/>
   <Field name="confirmPassword" label="Повторите пароль" type="password" placeholder="Повторите пароль" value={form.confirmPassword} error={errors.confirmPassword} onChange={setValue}/>
   <Consent checked={form.personalData} onChange={v=>setValue("personalData",v)} error={errors.personalData}>Я согласен на обработку персональных данных</Consent>
   <Consent checked={form.sellerTerms} onChange={v=>setValue("sellerTerms",v)} error={errors.sellerTerms}>Я принимаю правила ДокМаркета для селлеров</Consent>
   {notice&&<p role="status" style={{color:"#86efac",margin:0,fontSize:".78rem"}}>{notice}</p>}{errors.form&&<ErrorText>{errors.form}</ErrorText>}
   <button style={{...button,opacity:busy?.7:1}} disabled={busy}>{busy?"Создаём…":"Создать кабинет селлера"}</button>
  </form>
  <section className="dm-seller-steps"><span><b>1</b>Создайте аккаунт</span><span><b>2</b>Заполните витрину</span><span><b>3</b>Добавьте документ или услугу</span><span><b>4</b>После модерации предложение появится в каталоге</span></section>
  <style>{`.dm-seller-steps{display:grid;gap:7px;margin-top:16px;padding:13px;border-radius:12px;background:#0a1724;border:1px solid #24394a}.dm-seller-steps span{display:flex;align-items:center;gap:8px;color:#91a1b3;font-size:.75rem}.dm-seller-steps b{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:#21170c;color:#ffad42;font-size:.66rem}`}</style>
  <Link to="/Login" style={{color:"#ffb65f",display:"inline-block",marginTop:16,fontSize:".82rem",fontWeight:750}}>Уже зарегистрированы? Войти</Link>
 </AuthShell>
}
