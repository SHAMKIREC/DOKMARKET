import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const problems = [
  { id:"salary", icon:"fa-briefcase", title:"Проблема с работой", text:"Не выплатили зарплату, не рассчитали, уволили или не выдали документы.", result:"Лучше начать с Досудебки — она задаст вопросы и соберёт претензию.", to:"/dosudebka", cta:"Решить через Досудебку", active:true },
  { id:"refund", icon:"fa-rotate-left", title:"Хочу вернуть деньги", text:"Товар, услуга, онлайн-курс или другая покупка.", result:"Досудебка уже умеет собирать претензии по товарам и онлайн-курсам.", to:"/dosudebka", cta:"Начать возврат", active:true },
  { id:"debt", icon:"fa-hand-holding-dollar", title:"Мне должны деньги", text:"Долг, расписка, займ, аренда или другое обязательство.", result:"Можно собрать досудебное требование через Досудебку.", to:"/dosudebka", cta:"Подготовить требование", active:true },
  { id:"document", icon:"fa-file-signature", title:"Нужен готовый документ", text:"Договор, заявление, жалоба, расписка, инструкция или шаблон.", result:"Откройте каталог и выберите документ по жизненной ситуации.", to:"/market", cta:"Открыть каталог", active:true },
  { id:"specialist", icon:"fa-user-tie", title:"Нужен человек, а не шаблон", text:"Хочу, чтобы специалист проверил, объяснил или подготовил всё под ключ.", result:"Откройте раздел специалистов и выберите подходящую услугу.", to:"/market#specialists", cta:"Найти специалиста", active:true },
  { id:"unknown", icon:"fa-compass", title:"Не знаю, что мне нужно", text:"Есть проблема, но непонятно, какой документ или услуга поможет.", result:"Начните с каталога по понятным жизненным ситуациям. Позже здесь появится автоматический подбор по описанию проблемы.", to:"/market", cta:"Помогите выбрать", active:true },
];

export default function SimpleProblemChooser(){
  const [selected,setSelected]=useState("salary");
  const current=useMemo(()=>problems.find(item=>item.id===selected)||problems[0],[selected]);
  return <section className="dm-chooser market-panel market-glass" id="start">
    <div className="dm-chooser-head"><div><span className="market-kicker"><i className="fa-solid fa-route" />Начните не с документа, а с проблемы</span><h2 className="market-heading">Что у вас случилось?</h2><p className="market-lead">Не нужно знать юридические названия. Выберите обычными словами — ДокМаркет покажет подходящий путь.</p></div><span className="dm-step">1 шаг</span></div>
    <div className="dm-chooser-grid">
      <div className="dm-problem-list" role="list">{problems.map(item=><button key={item.id} type="button" className={`dm-problem ${selected===item.id?"active":""}`} onClick={()=>setSelected(item.id)}><span className="dm-problem-icon"><i className={`fa-solid ${item.icon}`} /></span><span><strong>{item.title}</strong><small>{item.text}</small></span><i className="fa-solid fa-chevron-right" /></button>)}</div>
      <article className="dm-answer"><span className="dm-answer-label">Подходящий следующий шаг</span><span className="dm-answer-icon"><i className={`fa-solid ${current.icon}`} /></span><h3>{current.title}</h3><p>{current.result}</p><Link className="market-primary" to={current.to}>{current.cta}<i className="fa-solid fa-arrow-right" /></Link><small><i className="fa-solid fa-circle-check" /> Можно вернуться и выбрать другой вариант</small></article>
    </div>
  </section>;
}
