import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const docs = [
  ["ППР", "Проект производства работ", "Структура работ, технология, безопасность, ресурсы и последовательность выполнения."],
  ["Акты скрытых работ", "Исполнительная документация", "Подготовка данных для оформления скрытых этапов и подтверждающих материалов."],
  ["Дефектная ведомость", "Осмотр и объёмы", "Фиксация дефектов, объёмов и перечня необходимых работ."],
  ["Ведомость объёмов", "Расчёт работ", "Структурированный перечень видов и объёмов работ для сметы или задания."],
  ["Журнал работ", "Контроль выполнения", "Шаблон и структура записей по выполнению работ, датам и ответственным."],
  ["Комплект под объект", "Подбор документов", "Помогаем определить, какой комплект документации нужен под конкретный вид работ."],
];

export default function ConstructionDocs(){
  const [selected,setSelected]=useState("ППР");
  const [objectName,setObjectName]=useState("");
  const [workType,setWorkType]=useState("");
  const [contact,setContact]=useState("");
  const [saved,setSaved]=useState(false);
  const selectedDoc=useMemo(()=>docs.find(([name])=>name===selected),[selected]);
  function submit(e){e.preventDefault();localStorage.setItem("dokmarket_construction_request",JSON.stringify({selected,objectName,workType,contact,createdAt:new Date().toISOString()}));setSaved(true)}
  return <main className="dm-construction-page">
    <section className="dm-construction-hero">
      <span>СЕРВИС ДОКМАРКЕТА × РЕШАЕМ БЫСТРО</span>
      <h1>Строительная документация</h1>
      <p>Отдельное направление внутри ДокМаркета для подготовки и постепенной автоматизации строительных документов. Сейчас сервис помогает собрать исходные данные и выбрать нужный тип документа.</p>
      <div className="dm-construction-actions"><a href="#builder">Подготовить заявку</a><Link to="/partners">О партнёрах</Link></div>
    </section>

    <section className="dm-construction-grid">
      {docs.map(([name,label,text])=><button key={name} className={selected===name?"active":""} type="button" onClick={()=>{setSelected(name);setSaved(false)}}><span>▤</span><div><strong>{name}</strong><small>{label}</small><p>{text}</p></div></button>)}
    </section>

    <section id="builder" className="dm-construction-builder">
      <div><span className="dm-construction-kicker">ПОДГОТОВКА ИСХОДНЫХ ДАННЫХ</span><h2>{selectedDoc?.[0]}</h2><p>{selectedDoc?.[2]}</p><ul><li>Сохраняем черновик заявки на устройстве</li><li>Не обещаем автоматически готовый официальный документ без исходных данных</li><li>Следующий этап — генерация типовых разделов и шаблонов прямо в ДокМаркете</li></ul></div>
      <form onSubmit={submit}><label>Объект<input value={objectName} onChange={e=>setObjectName(e.target.value)} placeholder="Например: ремонт офиса, жилой дом" required/></label><label>Вид работ<textarea value={workType} onChange={e=>setWorkType(e.target.value)} placeholder="Опишите работы и что нужно оформить" required/></label><label>Контакт для связи<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Телефон, Telegram или email" required/></label><button type="submit">Сохранить заявку</button>{saved&&<p className="dm-construction-success">Заявка сохранена. Её можно продолжить с этого устройства.</p>}</form>
    </section>

    <style>{`
      .dm-construction-page{min-height:100vh;padding:34px 16px 82px;background:radial-gradient(circle at 12% 0%,rgba(255,159,28,.10),transparent 28rem),#07111d;color:#f8fafc}.dm-construction-hero,.dm-construction-grid,.dm-construction-builder{width:min(1040px,100%);margin-left:auto;margin-right:auto}.dm-construction-hero{padding:clamp(22px,5vw,42px);border:1px solid #51381d;border-radius:24px;background:linear-gradient(145deg,#111b25,#17120c)}.dm-construction-hero>span,.dm-construction-kicker{color:#ffad42;font-size:.69rem;font-weight:900;letter-spacing:.1em}.dm-construction-hero h1{margin:10px 0;font:850 clamp(2rem,7vw,3.6rem)/1.03 'Space Grotesk',sans-serif}.dm-construction-hero p{max-width:780px;color:#9da8b5;line-height:1.6}.dm-construction-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.dm-construction-actions a{padding:11px 15px;border-radius:11px;text-decoration:none;font-weight:850;border:1px solid #3a4d5e;color:#e6edf5}.dm-construction-actions a:first-child{background:#ff9f1c;color:#07111d;border-color:#ff9f1c}.dm-construction-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}.dm-construction-grid button{text-align:left;padding:16px;border-radius:16px;border:1px solid #21394b;background:#0d1b29;color:#f8fafc;display:flex;gap:10px;cursor:pointer}.dm-construction-grid button.active{border-color:#ff9f1c;background:#18150f}.dm-construction-grid button>span{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#172738;color:#ff9f1c;flex:0 0 34px}.dm-construction-grid strong,.dm-construction-grid small{display:block}.dm-construction-grid strong{font-size:.9rem}.dm-construction-grid small{margin-top:2px;color:#ffb65f;font-size:.64rem}.dm-construction-grid p{margin:8px 0 0;color:#8697a9;font-size:.7rem;line-height:1.45}.dm-construction-builder{display:grid;grid-template-columns:.9fr 1.1fr;gap:16px;margin-top:16px;padding:20px;border-radius:20px;border:1px solid #243c4d;background:#0c1926}.dm-construction-builder h2{margin:7px 0 8px;font-size:1.5rem}.dm-construction-builder>div>p,.dm-construction-builder li{color:#8fa0b2;font-size:.8rem;line-height:1.5}.dm-construction-builder ul{padding-left:18px}.dm-construction-builder form{display:grid;gap:11px}.dm-construction-builder label{display:grid;gap:6px;font-size:.72rem;font-weight:800;color:#cbd5df}.dm-construction-builder input,.dm-construction-builder textarea{width:100%;border:1px solid #294052;border-radius:11px;background:#091521;color:#fff;padding:11px 12px;font:inherit}.dm-construction-builder textarea{min-height:105px;resize:vertical}.dm-construction-builder button{min-height:46px;border:0;border-radius:11px;background:#ff9f1c;color:#07111d;font-weight:900;cursor:pointer}.dm-construction-success{margin:0;color:#86efac;font-size:.75rem}@media(max-width:760px){.dm-construction-page{padding:18px 12px 74px}.dm-construction-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-construction-builder{grid-template-columns:1fr}}@media(max-width:420px){.dm-construction-grid{grid-template-columns:1fr}}
    `}</style>
  </main>
}
