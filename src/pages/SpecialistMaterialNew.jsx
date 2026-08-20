import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { categories, directions, sections, situations } from "@/data/marketplaceMock";
import { getSpecialistMaterial, saveReadyFileMaterial } from "@/specialist-materials/services/specialistMaterialStorageService";
import { MaterialFrame } from "./SpecialistMaterials";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["docx", "pdf"]);
const EMPTY_FORM = { title:"",description:"",directionSlug:"",sectionSlug:"",categorySlug:"",situationSlug:"",price:"",isFree:true,whatIncluded:"",suitableFor:"",fillInstructions:"" };

export default function SpecialistMaterialNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [existing,setExisting]=useState(null);
  const [mode,setMode]=useState(editId?"ready_file":"");
  const [form,setForm]=useState(EMPTY_FORM);
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(Boolean(editId));
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{let live=true;(async()=>{if(!editId||!user?.id){setLoading(false);return;}try{const item=await getSpecialistMaterial(editId,user.id);if(!live)return;if(!item){setError("Материал не найден.");return;}setExisting(item);setForm({...EMPTY_FORM,...item,price:item.price?String(item.price):""});setMode("ready_file");}catch{if(live)setError("Не удалось загрузить материал.");}finally{if(live)setLoading(false);}})();return()=>{live=false}},[editId,user?.id]);

  const availableSections=useMemo(()=>sections.filter(x=>x.directionSlug===form.directionSlug),[form.directionSlug]);
  const availableCategories=useMemo(()=>categories.filter(x=>x.directionSlug===form.directionSlug&&x.sectionSlug===form.sectionSlug),[form.directionSlug,form.sectionSlug]);
  const availableSituations=useMemo(()=>situations.filter(x=>x.directionSlug===form.directionSlug&&x.sectionSlug===form.sectionSlug&&x.categorySlug===form.categorySlug),[form.directionSlug,form.sectionSlug,form.categorySlug]);

  function update(key,value){setForm(current=>{const next={...current,[key]:value};if(key==="directionSlug")Object.assign(next,{sectionSlug:"",categorySlug:"",situationSlug:""});if(key==="sectionSlug")Object.assign(next,{categorySlug:"",situationSlug:""});if(key==="categorySlug")next.situationSlug="";return next});setError("");}
  function selectFile(event){const selected=event.target.files?.[0];event.target.value="";if(!selected)return;const ext=selected.name.split(".").pop()?.toLowerCase();if(!ALLOWED_EXTENSIONS.has(ext))return setError("Можно загрузить только DOCX или PDF.");if(selected.size>MAX_FILE_SIZE)return setError("Размер файла не должен превышать 5 МБ.");setFile(selected);setError("");}
  function choose(nextMode){if(nextMode==="online_form")return navigate("/template-studio/new");setMode(nextMode);setNotice(nextMode==="ready_file"?"":"Этот тип материала подключим следующим этапом. Сейчас полностью работает загрузка готового файла.");}

  async function submit(event){event.preventDefault();if(!form.title.trim()||!form.description.trim())return setError("Укажите название и краткое описание.");if(!form.directionSlug)return setError("Выберите направление.");if(!existing&&!file)return setError("Загрузите DOCX или PDF.");if(!form.isFree&&(!Number.isFinite(Number(form.price))||Number(form.price)<=0))return setError("Укажите цену материала.");setSaving(true);setError("");try{await saveReadyFileMaterial({ownerId:user.id,material:{...form,id:existing?.id,title:form.title.trim(),description:form.description.trim(),whatIncluded:form.whatIncluded.trim(),suitableFor:form.suitableFor.trim(),fillInstructions:form.fillInstructions.trim()},file});navigate("/specialist/materials",{replace:true});}catch(e){console.error(e);setError("Не удалось сохранить материал на сервере. Проверьте файл и повторите.");setSaving(false);}}

  if(loading)return <MaterialFrame><p className="material-notice">Загружаем материал…</p></MaterialFrame>;

  return <MaterialFrame>
    <header className="material-head"><div><span className="material-kicker">Товары продавца</span><h1 className="material-title">{existing?"Редактировать документ":"Что вы хотите разместить?"}</h1><p className="material-copy">Файлы хранятся в защищённом хранилище ДокМаркета. Сохранённый товар остаётся черновиком до отправки на модерацию.</p></div><Link className="material-secondary" to="/specialist/materials">Мои товары</Link></header>
    {!existing&&<section className="material-choice-grid"><button type="button" className={`material-choice ${mode==="ready_file"?"active":""}`} onClick={()=>choose("ready_file")}><i className="fa-regular fa-file-arrow-down"/><h2>Готовый документ</h2><p>DOCX или PDF для продажи или бесплатной выдачи.</p><b>Загрузить файл →</b></button><button type="button" className="material-choice" onClick={()=>choose("online_form")}><i className="fa-solid fa-wand-magic-sparkles"/><h2>Онлайн-форма</h2><p>Превратите DOCX в форму, которую покупатель заполнит онлайн.</p><b>Открыть конструктор →</b></button><button type="button" className="material-choice" onClick={()=>choose("service")}><i className="fa-solid fa-user-tie"/><h2>Услуга</h2><p>Работа специалиста с заказом и результатом внутри ДокМаркета.</p><b>Добавить услугу →</b></button><button type="button" className="material-choice" onClick={()=>choose("guide")}><i className="fa-regular fa-rectangle-list"/><h2>Инструкция / чек-лист</h2><p>Пошаговый материал или комплект файлов.</p><b>Добавить →</b></button></section>}
    {notice&&<p className="material-notice">{notice}</p>}
    {mode==="ready_file"&&<form className="material-form-panel material-glass" onSubmit={submit}><div className="material-form">
      <label className="material-field"><span>Название</span><input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="Например, договор аренды квартиры"/></label>
      <label className="material-field"><span>Краткое описание</span><input value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Что решает этот документ"/></label>
      <label className="material-field"><span>Направление</span><select value={form.directionSlug} onChange={e=>update("directionSlug",e.target.value)}><option value="">Выберите направление</option>{directions.map(x=><option value={x.slug} key={x.slug}>{x.title}</option>)}</select></label>
      <label className="material-field"><span>Раздел</span><select value={form.sectionSlug} onChange={e=>update("sectionSlug",e.target.value)} disabled={!availableSections.length}><option value="">{availableSections.length?"Выберите раздел":"Разделы пока не настроены"}</option>{availableSections.map(x=><option value={x.slug} key={x.slug}>{x.title}</option>)}</select></label>
      <label className="material-field"><span>Категория</span><select value={form.categorySlug} onChange={e=>update("categorySlug",e.target.value)} disabled={!availableCategories.length}><option value="">{availableCategories.length?"Выберите категорию":"Категории пока не настроены"}</option>{availableCategories.map(x=><option value={x.slug} key={x.slug}>{x.title}</option>)}</select></label>
      <label className="material-field"><span>Ситуация</span><select value={form.situationSlug} onChange={e=>update("situationSlug",e.target.value)} disabled={!availableSituations.length}><option value="">{availableSituations.length?"Выберите ситуацию":"Ситуации пока не настроены"}</option>{availableSituations.map(x=><option value={x.slug} key={x.slug}>{x.title}</option>)}</select></label>
      <label className="material-field wide material-file"><span>Файл DOCX или PDF</span><input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectFile}/><small>{file?`${file.name} · ${(file.size/1024).toFixed(0)} КБ`:existing?.fileName?`Сейчас: ${existing.fileName}. Выберите файл только если хотите заменить его.`:"До 5 МБ"}</small></label>
      <label className="material-check wide"><input type="checkbox" checked={form.isFree} onChange={e=>update("isFree",e.target.checked)}/>Бесплатный документ</label>
      {!form.isFree&&<label className="material-field"><span>Цена, ₽</span><input type="number" min="1" step="1" value={form.price} onChange={e=>update("price",e.target.value)}/></label>}
      <label className="material-field wide"><span>Что получит покупатель</span><textarea rows="3" value={form.whatIncluded} onChange={e=>update("whatIncluded",e.target.value)} placeholder="Что входит в покупку"/></label>
      <label className="material-field wide"><span>Для кого подходит</span><textarea rows="3" value={form.suitableFor} onChange={e=>update("suitableFor",e.target.value)} placeholder="Когда этот документ полезен"/></label>
      <label className="material-field wide"><span>Как использовать</span><textarea rows="4" value={form.fillInstructions} onChange={e=>update("fillInstructions",e.target.value)} placeholder="Что заполнить и что делать дальше"/></label>
    </div><p className="material-notice">Файл хранится на сервере и недоступен посторонним. Публикация в каталоге происходит только после модерации.</p>{error&&<p className="material-error">{error}</p>}<div className="material-actions"><button className="material-primary" disabled={saving}>{saving?"Сохраняем…":"Сохранить черновик"}</button><Link className="material-secondary" to="/specialist/materials">Отмена</Link></div></form>}
  </MaterialFrame>;
}
