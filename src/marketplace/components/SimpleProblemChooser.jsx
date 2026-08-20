import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const problems = [
  { id:"salary", icon:"fa-briefcase", title:"Проблема на работе", text:"Зарплата, увольнение, расчёт, документы.", result:"Начните с Досудебки. Она задаст простые вопросы и соберёт претензию.", to:"/dosudebka", cta:"Начать", active:true },
  { id:"refund", icon:"fa-rotate-left", title:"Хочу вернуть деньги", text:"Товар, услуга, курс или покупка.", result:"Досудебка поможет собрать требование на возврат денег.", to:"/dosudebka", cta:"Начать возврат", active:true },
  { id:"debt", icon:"fa-hand-holding-dollar", title:"Мне должны деньги", text:"Долг, расписка, займ или аренда.", result:"Подготовьте официальное требование через Досудебку.", to:"/dosudebka", cta:"Вернуть долг", active:true },
  { id:"document", icon:"fa-file-signature", title:"Нужен документ", text:"Договор, заявление, жалоба, расписка.", result:"Откройте каталог и выберите нужный документ.", to:"/market", cta:"Открыть каталог", active:true },
  { id:"specialist", icon:"fa-user-tie", title:"Нужен специалист", text:"Проверить, объяснить или сделать под ключ.", result:"Выберите специалиста и подходящую услугу.", to:"/market#specialists", cta:"Найти специалиста", active:true },
  { id:"unknown", icon:"fa-compass", title:"Не знаю, что выбрать", text:"Есть проблема, но непонятно, что делать.", result:"Начните с каталога. Мы покажем варианты по жизненной ситуации.", to:"/market", cta:"Помогите выбрать", active:true },
];

export default function SimpleProblemChooser(){
  const [selected,setSelected]=useState("salary");
  const current=useMemo(()=>problems.find(item=>item.id===selected)||problems[0],[selected]);
  return <section className="dm-chooser market-panel market-glass" id="start">
    <div className="dm-chooser-head"><div><span className="market-kicker"><i className="fa-solid fa-route" />С чего начать</span><h2 className="market-heading">Что у вас случилось?</h2><p className="market-lead">Нажмите на похожую ситуацию. Юридические названия знать не нужно.</p></div><span className="dm-step">1 шаг</span></div>
    <div className="dm-chooser-grid">
      <div className="dm-problem-list" role="list">{problems.map(item=><button key={item.id} type="button" className={`dm-problem ${selected===item.id?"active":""}`} onClick={()=>setSelected(item.id)}><span className="dm-problem-icon"><i className={`fa-solid ${item.icon}`} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span><i className="fa-solid fa-chevron-right" /></button>)}</div>
      <article className="dm-answer"><span className="dm-answer-label">Что делать дальше</span><span className="dm-answer-icon"><i className={`fa-solid ${current.icon}`} /></span><h3>{current.title}</h3><p>{current.result}</p><Link className="market-primary" to={current.to}>{current.cta}<i className="fa-solid fa-arrow-right" /></Link><small><i className="fa-solid fa-circle-check" /> Можно выбрать другой вариант</small></article>
    </div>
  </section>;
}
