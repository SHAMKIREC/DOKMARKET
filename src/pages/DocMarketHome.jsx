import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SmartServices from "@/marketplace/components/SmartServices";
import SmartDocumentFinder from "@/marketplace/components/SmartDocumentFinder";
import SimpleProblemChooser from "@/marketplace/components/SimpleProblemChooser";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { MarketFrame } from "./Market";

const quickEntries=[
 {title:"Готовые документы",text:"Договоры, претензии, заявления, жалобы и другие файлы.",to:"/market",cta:"Открыть каталог"},
 {title:"Создать по ответам",text:"Ответьте на вопросы — сервис соберёт документ из ваших данных.",to:"/dosudebka",cta:"Открыть Досудебку"},
 {title:"Услуги специалистов",text:"Закажите работу специалиста внутри ДокМаркета, когда готового документа недостаточно.",to:"/market#specialists",cta:"Найти специалиста"},
];
const howItWorks=[["1","Найдите документ","По названию, категории или обычному описанию ситуации."],["2","Посмотрите карточку","Состав, формат, цена, продавец и то, что вы получите."],["3","Получите результат","Покупки, файлы и заказы сохраняются в кабинете ДокМаркета."]];

export default function DocMarketHome(){
 const [products,setProducts]=useState([]); const [catalogLoading,setCatalogLoading]=useState(true);
 useEffect(()=>{let live=true;loadPublishedCatalog().then(items=>{if(live)setProducts(items.slice(0,8))}).catch(()=>{}).finally(()=>{if(live)setCatalogLoading(false)});return()=>{live=false}},[]);
 return <MarketFrame>
  <section className="market-hero market-glass dm-home-hero"><div className="dm-home-copy"><span className="market-kicker">Маркетплейс документов и услуг</span><h1 className="market-title">Нужный документ — сразу в каталоге</h1><p className="market-subtitle">Сначала готовые документы. Если нужен индивидуальный результат — автоматические сервисы и специалисты работают внутри того же ДокМаркета.</p><div className="dm-hero-actions"><Link className="market-primary" to="/market"><i className="fa-solid fa-file-lines"/>Каталог документов</Link><a className="market-action" href="#smart-find"><i className="fa-solid fa-magnifying-glass"/>Помочь выбрать</a></div><div className="market-trust-badges"><span className="market-trust-badge">Цена и состав до покупки</span><span className="market-trust-badge">PDF / DOCX</span><span className="market-trust-badge">Покупки в кабинете</span><span className="market-trust-badge">Проверенные продавцы</span></div></div><aside className="dm-hero-result"><span>Сервис ДокМаркета</span><p>Досудебная претензия</p><strong>Досудебка</strong><small>Ответьте на вопросы и получите документ под свою ситуацию.</small><Link to="/dosudebka">Создать документ <i className="fa-solid fa-arrow-right"/></Link></aside></section>

  <section id="directions" className="dm-catalog-preview"><div className="dm-section-title"><span className="market-kicker">Витрина</span><h2 className="market-heading">Документы в продаже</h2><p className="market-lead">Здесь показываются только опубликованные товары из настоящего каталога.</p></div>
   {catalogLoading?<div className="market-empty market-glass">Загружаем каталог…</div>:products.length?<div className="market-grid">{products.map(item=><Link className="market-card market-glass market-offer-card" to={`/market/offer/${item.id}`} key={item.id}><div className="market-offer-top"><span className="market-offer-type">{item.type==="service"?"Услуга":"Документ"}</span>{item.featured&&<span className="market-badge">Популярное</span>}</div><h2>{item.title}</h2><span className="market-offer-provider">{item.providerName}</span><p>{item.description}</p><div className="market-offer-meta">{item.formats.slice(0,3).map(x=><span key={x}>{x}</span>)}</div><div className="market-offer-cta"><strong>{item.priceType==="free"?"Бесплатно":`${item.priceType==="from"?"от ":""}${item.price.toLocaleString("ru-RU")} ₽`}</strong><span>Открыть →</span></div></Link>)}</div>:<div className="market-empty market-glass">Пока опубликована только Досудебка. Товары продавцов появятся здесь сразу после модерации.</div>}
   <div className="dm-center-action"><Link className="market-primary" to="/market">Открыть весь каталог</Link></div>
  </section>

  <div id="smart-find"><SmartDocumentFinder/></div><SimpleProblemChooser/>
  <section className="dm-choice-section"><div className="dm-section-title"><span className="market-kicker">Если нужен другой путь</span><h2 className="market-heading">Документ, сервис или специалист</h2><p className="market-lead">Начинайте с готового документа. Более сложную работу можно передать специалисту.</p></div><div className="market-grid">{quickEntries.map(item=><Link className="market-card market-glass dm-choice-card" to={item.to} key={item.title}><h2>{item.title}</h2><p>{item.text}</p><span className="market-card-link">{item.cta} <i className="fa-solid fa-arrow-right"/></span></Link>)}</div></section>
  <SmartServices/>
  <section className="dm-how market-panel market-glass"><span className="market-kicker">Как купить</span><h2 className="market-heading">Три понятных шага</h2><div className="dm-how-grid">{howItWorks.map(([number,title,text])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
  <section className="dm-business-model market-panel market-glass"><div><span className="market-kicker">Услуги специалистов</span><h2 className="market-heading">Вся работа остаётся в заказе</h2><p className="market-lead">Задача, результат и статус фиксируются в ДокМаркете. После подключения платёжного модуля этот же заказ будет управлять оплатой и выплатой исполнителю.</p></div><div className="dm-flow"><span>Заказ</span><i className="fa-solid fa-arrow-right"/><span>Работа</span><i className="fa-solid fa-arrow-right"/><span>Результат</span><i className="fa-solid fa-arrow-right"/><span>Подтверждение</span></div></section>
 </MarketFrame>
}
