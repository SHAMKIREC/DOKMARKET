import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const rules = [
  { words:["зарплат","увол","работод","работа","расчет","расчёт"], title:"Претензия работодателю", reason:"Похоже на трудовой спор.", to:"/dosudebka", cta:"Собрать претензию", icon:"fa-briefcase" },
  { words:["курс","обуч","инфопродукт","школ"], title:"Возврат денег за онлайн-курс", reason:"Подойдёт сценарий возврата за обучение или инфопродукт.", to:"/dosudebka", cta:"Начать возврат", icon:"fa-graduation-cap" },
  { words:["товар","магазин","покуп","брак","слом","возврат"], title:"Требование о возврате денег", reason:"Похоже на спор из-за товара, покупки или услуги.", to:"/dosudebka", cta:"Подготовить требование", icon:"fa-rotate-left" },
  { words:["долг","должен","расписк","займ","вернуть деньги","не отдает","не отдаёт"], title:"Требование о возврате долга", reason:"Похоже на гражданский спор или долг.", to:"/dosudebka", cta:"Вернуть долг", icon:"fa-hand-holding-dollar" },
  { words:["договор","акт","заявлен","жалоб","доверен","расписк"], title:"Найти готовый документ", reason:"Вы уже примерно знаете тип документа — быстрее открыть каталог.", to:"/market", cta:"Открыть каталог", icon:"fa-file-lines" },
];

export default function SmartDocumentFinder(){
  const [query,setQuery]=useState("");
  const result=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return null;return rules.find(rule=>rule.words.some(word=>q.includes(word)))||{title:"Подберём решение по вашей ситуации",reason:"Точного совпадения пока нет. Посмотрите каталог или выберите жизненную ситуацию ниже.",to:"/market",cta:"Посмотреть варианты",icon:"fa-compass"}},[query]);
  return <section className="dm-smart-find market-panel market-glass" aria-labelledby="smart-find-title">
    <div className="dm-smart-find-copy"><span className="market-kicker"><i className="fa-solid fa-wand-magic-sparkles"/>Не знаете название документа?</span><h2 id="smart-find-title" className="market-heading">Просто напишите, что произошло</h2><p className="market-lead">Например: «не выплатили зарплату», «хочу вернуть деньги за курс» или «мне не отдают долг».</p></div>
    <div className="dm-smart-find-box"><label><i className="fa-solid fa-message"/><textarea value={query} onChange={e=>setQuery(e.target.value)} rows="3" placeholder="Опишите ситуацию своими словами…"/></label>{result&&<article className="dm-smart-result"><span><i className={`fa-solid ${result.icon}`}/></span><div><small>Подходящий следующий шаг</small><h3>{result.title}</h3><p>{result.reason}</p></div><Link className="market-primary" to={result.to}>{result.cta}<i className="fa-solid fa-arrow-right"/></Link></article>}</div>
  </section>;
}
