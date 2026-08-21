import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const docs = [
  ["ППР", "Проект производства работ", "Структура работ, технология, безопасность, ресурсы и последовательность выполнения.", ["Общие сведения об объекте", "Организация и технология работ", "Материалы и техника", "Охрана труда и безопасность", "Контроль качества", "Календарная последовательность"]],
  ["Акты скрытых работ", "Исполнительная документация", "Подготовка данных для оформления скрытых этапов и подтверждающих материалов.", ["Наименование скрытых работ", "Место выполнения", "Дата выполнения", "Исполнитель", "Материалы и подтверждающие документы", "Результат освидетельствования"]],
  ["Дефектная ведомость", "Осмотр и объёмы", "Фиксация дефектов, объёмов и перечня необходимых работ.", ["Объект осмотра", "Описание дефектов", "Местоположение", "Единицы измерения", "Объёмы", "Рекомендуемые работы"]],
  ["Ведомость объёмов", "Расчёт работ", "Структурированный перечень видов и объёмов работ для сметы или задания.", ["Раздел работ", "Наименование работы", "Единица измерения", "Количество", "Примечание"]],
  ["Журнал работ", "Контроль выполнения", "Шаблон и структура записей по выполнению работ, датам и ответственным.", ["Дата", "Выполненные работы", "Объём", "Ответственный", "Условия производства работ", "Замечания"]],
  ["Комплект под объект", "Подбор документов", "Помогаем определить, какой комплект документации нужен под конкретный вид работ.", ["Исходные данные объекта", "Перечень работ", "Обязательные документы", "Исполнительная документация", "Контрольные формы", "Итоговый комплект"]],
];

function DocIcon(){return <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3h11l5 5v21H8z"/><path d="M19 3v6h6M12 15h8M12 20h8M12 25h6"/></svg>}

export default function ConstructionDocs(){
  const [selected,setSelected]=useState("ППР");
  const [objectName,setObjectName]=useState("");
  const [workType,setWorkType]=useState("");
  const [contact,setContact]=useState("");
  const [saved,setSaved]=useState(false);
  const [generated,setGenerated]=useState(null);
  const [copied,setCopied]=useState(false);
  const selectedDoc=useMemo(()=>docs.find(([name])=>name===selected),[selected]);

  function buildDraft(){
    const draft={type:selected,object:objectName.trim(),works:workType.trim(),contact:contact.trim(),sections:selectedDoc?.[3]||[],createdAt:new Date().toLocaleString("ru-RU")};
    localStorage.setItem("dokmarket_construction_request",JSON.stringify(draft));
    setSaved(true);setGenerated(draft);setCopied(false);
  }
  function submit(e){e.preventDefault();buildDraft()}
  async function copyDraft(){if(!generated)return;const text=[`Черновик: ${generated.type}`,`Объект: ${generated.object}`,`Виды работ: ${generated.works}`,"",...generated.sections.map((s,i)=>`${i+1}. ${s}`)].join("\n");try{await navigator.clipboard.writeText(text);setCopied(true)}catch{setCopied(false)}}

  return <main className="dm-construction-page">
    <section className="dm-construction-hero">
      <span>СЕРВИС ДОКМАРКЕТА × РЕШАЕМ БЫСТРО</span>
      <h1>Строительная документация</h1>
      <p>Отдельный сервис внутри ДокМаркета: ППР, исполнительные документы, ведомости и журналы. Первый этап автоматизации уже работает — сервис собирает исходные данные и формирует структуру черновика под выбранный документ.</p>
      <div className="dm-construction-actions"><a href="#builder">Собрать черновик</a><Link to="/partners">О партнёрах</Link></div>
    </section>

    <section className="dm-construction-grid">
      {docs.map(([name,label,text])=><button key={name} className={selected===name?"active":""} type="button" onClick={()=>{setSelected(name);setSaved(false);setGenerated(null)}}><span><DocIcon/></span><div><strong>{name}</strong><small>{label}</small><p>{text}</p></div></button>)}
    </section>

    <section id="builder" className="dm-construction-builder">
      <div><span className="dm-construction-kicker">АВТОМАТИЧЕСКАЯ ПОДГОТОВКА</span><h2>{selectedDoc?.[0]}</h2><p>{selectedDoc?.[2]}</p><ul>{selectedDoc?.[3]?.map(item=><li key={item}>{item}</li>)}</ul><p className="dm-construction-note">Сейчас формируется структурированный черновик. Для официального документа всё равно нужны корректные исходные данные, реквизиты и проверка специалистом.</p></div>
      <form onSubmit={submit}><label>Объект<input value={objectName} onChange={e=>setObjectName(e.target.value)} placeholder="Например: ремонт офиса, жилой дом" required/></label><label>Вид работ<textarea value={workType} onChange={e=>setWorkType(e.target.value)} placeholder="Опишите работы, этапы и что нужно оформить" required/></label><label>Контакт для связи<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Телефон, Telegram или email" required/></label><button type="submit">Сформировать структуру</button>{saved&&<p className="dm-construction-success">Черновик сформирован и сохранён на этом устройстве.</p>}</form>
    </section>

    {generated&&<section className="dm-generated-draft"><div className="dm-generated-head"><div><span>ЧЕРНОВИК СТРУКТУРЫ</span><h2>{generated.type}</h2></div><button type="button" onClick={copyDraft}>{copied?"Скопировано":"Скопировать"}</button></div><p><strong>Объект:</strong> {generated.object}</p><p><strong>Работы:</strong> {generated.works}</p><ol>{generated.sections.map(section=><li key={section}>{section}</li>)}</ol><div className="dm-generated-actions"><Link to="/partners">Связаться с партнёром</Link><a href="https://www.rb-24.ru/" target="_blank" rel="noreferrer">Решаем Быстро</a></div></section>}

    <style>{`
      .dm-construction-page{min-height:100vh;padding:34px 16px 82px;background:radial-gradient(circle at 12% 0%,rgba(255,159,28,.10),transparent 28rem),#07111d;color:#f8fafc}.dm-construction-hero,.dm-construction-grid,.dm-construction-builder,.dm-generated-draft{width:min(1040px,100%);margin-left:auto;margin-right:auto}.dm-construction-hero{padding:clamp(22px,5vw,42px);border:1px solid #51381d;border-radius:24px;background:linear-gradient(145deg,#111b25,#17120c)}.dm-construction-hero>span,.dm-construction-kicker,.dm-generated-head span{color:#ffad42;font-size:.69rem;font-weight:900;letter-spacing:.1em}.dm-construction-hero h1{margin:10px 0;font:850 clamp(2rem,7vw,3.6rem)/1.03 'Space Grotesk',sans-serif}.dm-construction-hero p{max-width:780px;color:#9da8b5;line-height:1.6}.dm-construction-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.dm-construction-actions a{padding:11px 15px;border-radius:11px;text-decoration:none;font-weight:850;border:1px solid #3a4d5e;color:#e6edf5}.dm-construction-actions a:first-child{background:#ff9f1c;color:#07111d;border-color:#ff9f1c}.dm-construction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}.dm-construction-grid button{text-align:left;padding:16px;border-radius:16px;border:1px solid #21394b;background:#0d1b29;color:#f8fafc;display:flex;gap:10px;cursor:pointer}.dm-construction-grid button.active{border-color:#ff9f1c;background:#18150f}.dm-construction-grid button>span{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#172738;color:#ff9f1c;flex:0 0 38px}.dm-construction-grid strong,.dm-construction-grid small{display:block}.dm-construction-grid strong{font-size:.9rem}.dm-construction-grid small{margin-top:2px;color:#ffb65f;font-size:.64rem}.dm-construction-grid p{margin:8px 0 0;color:#8697a9;font-size:.7rem;line-height:1.45}.dm-construction-builder{display:grid;grid-template-columns:.9fr 1.1fr;gap:16px;margin-top:16px;padding:20px;border-radius:20px;border:1px solid #243c4d;background:#0c1926}.dm-construction-builder h2,.dm-generated-draft h2{margin:7px 0 8px;font-size:1.5rem}.dm-construction-builder>div>p,.dm-construction-builder li,.dm-generated-draft p,.dm-generated-draft li{color:#8fa0b2;font-size:.8rem;line-height:1.5}.dm-construction-builder ul,.dm-generated-draft ol{padding-left:18px}.dm-construction-note{padding:11px;border-radius:11px;background:#17130d;border:1px solid #4d3b22}.dm-construction-builder form{display:grid;gap:11px}.dm-construction-builder label{display:grid;gap:6px;font-size:.72rem;font-weight:800;color:#cbd5df}.dm-construction-builder input,.dm-construction-builder textarea{width:100%;border:1px solid #294052;border-radius:11px;background:#091521;color:#fff;padding:11px 12px;font:inherit}.dm-construction-builder textarea{min-height:105px;resize:vertical}.dm-construction-builder button,.dm-generated-head button{min-height:46px;border:0;border-radius:11px;background:#ff9f1c;color:#07111d;font-weight:900;cursor:pointer;padding:0 15px}.dm-construction-success{margin:0;color:#86efac;font-size:.75rem}.dm-generated-draft{margin-top:16px;padding:20px;border-radius:20px;border:1px solid #4e3a20;background:linear-gradient(145deg,#0d1b29,#15120d)}.dm-generated-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.dm-generated-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.dm-generated-actions a{padding:9px 12px;border-radius:10px;border:1px solid #33495a;color:#e8eef5;text-decoration:none;font-size:.76rem;font-weight:850}.dm-generated-actions a:first-child{background:#ff9f1c;border-color:#ff9f1c;color:#07111d}@media(max-width:760px){.dm-construction-page{padding:18px 12px 74px}.dm-construction-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-construction-builder{grid-template-columns:1fr}.dm-generated-head{align-items:stretch;flex-direction:column}.dm-generated-head button{width:100%}}@media(max-width:420px){.dm-construction-grid{grid-template-columns:1fr}}
    `}</style>
  </main>
}
