import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, specialists } from "@/data/marketplaceMock";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { isInCart, toggleCart } from "@/marketplace/services/cartService";
import { MarketFrame, MarketNavigation, OffersGrid } from "./Market";

const TABS = [["store","Витрина"],["services","Услуги"],["reviews","Отзывы"],["about","О продавце"]];
const DEMO_SPECIALISTS = new Set(["elena-morozova", "alexey-volkov"]);

export default function MarketSpecialist(){
 const {specialistId}=useParams(); const [activeTab,setActiveTab]=useState("store"); const [,setRevision]=useState(0);
 const specialist=DEMO_SPECIALISTS.has(specialistId) ? null : specialists.find(item=>item.id===specialistId);
 if(!specialist)return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"}]} backTo="/market"/><section className="market-empty market-glass"><div className="market-icon" style={{margin:"0 auto 14px"}}>✓</div><h1 className="market-heading">Профиль ещё не опубликован</h1><p>В ДокМаркете показываются только реальные продавцы, прошедшие модерацию. Демонстрационные профили скрыты.</p><Link className="market-primary" to="/market">Вернуться в каталог</Link></section></MarketFrame>;
 const solutionOffers=specialist.documentOfferIds.map(id=>offers.find(o=>o.id===id)).filter(Boolean);
 const favorite=isFavorite(specialist.id,"specialist");
 const serviceCartOffer=s=>({id:`specialist-${specialist.id}-${s.id}`,type:"service",providerType:"specialist",providerName:specialist.name,specialistId:specialist.id,title:s.title,description:`${specialist.profession}. ${s.deliveryTime||"Срок уточняется"}.`,price:Number(s.price||0),priceType:"from",formats:["Услуга специалиста"],actionUrl:`/market/specialist/${specialist.id}`});
 const toggleService=s=>{toggleCart(serviceCartOffer(s));setRevision(v=>v+1)};
 return <MarketFrame>
  <MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"},{label:specialist.name}]} backTo="/market"/>
  <section className="market-panel market-glass seller-hero">
   <div className="market-profile-head"><div className="market-profile-avatar">{specialist.initials}</div><div className="market-profile-copy"><span className="market-badge">✓ Продавец проверен</span><h1 className="market-heading">{specialist.name}</h1><p className="market-subtitle" style={{margin:0}}>{specialist.profession}</p><div className="market-examples">{specialist.specializations.map(x=><span className="market-example" key={x}>{x}</span>)}</div></div></div>
   <div className="market-profile-stats"><div><span>Рейтинг</span><strong>★ {specialist.rating}</strong></div><div><span>Отзывы</span><strong>{specialist.reviewsCount}</strong></div><div><span>Опыт</span><strong>{specialist.experience}</strong></div><div><span>Услуги</span><strong>от {Number(specialist.priceFrom||0).toLocaleString("ru-RU")} ₽</strong></div></div>
   <div className="market-offer-actions"><button className="market-action primary" onClick={()=>setActiveTab("store")}>Смотреть документы</button><button className="market-action" onClick={()=>setActiveTab("services")}>Заказать услугу</button><button className={`market-action ${favorite?"active":""}`} onClick={()=>{toggleFavorite(specialist.id,"specialist");setRevision(v=>v+1)}}>{favorite?"♥ В избранном":"♡ В избранное"}</button></div>
  </section>
  <div className="market-deal-note market-glass"><strong>Заказ проходит через ДокМаркет</strong><span>Задача, сообщения и результат остаются в заказе. После подключения платёжного модуля расчёт с исполнителем будет связан с подтверждением результата покупателем.</span></div>
  <nav className="market-tabs">{TABS.map(([id,label])=><button className={activeTab===id?"active":""} onClick={()=>setActiveTab(id)} key={id}>{label}</button>)}</nav>
  {activeTab==="store"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Документы продавца</h2><p className="market-lead">Готовые документы и сервисы этого специалиста. Перед покупкой можно открыть карточку и посмотреть, что входит.</p>{solutionOffers.length?<OffersGrid items={solutionOffers}/>:<div className="market-empty market-glass">Документы готовятся к публикации.</div>}</section>}
  {activeTab==="services"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Услуги</h2><p className="market-lead">Выберите конкретную работу. Она попадёт в корзину как отдельный заказ специалисту.</p><div className="market-grid">{(specialist.services||[]).map(s=>{const item=serviceCartOffer(s),inCart=isInCart(item.id);return <article className="market-card market-glass" key={s.id}><span className="market-offer-type">Услуга</span><h3>{s.title}</h3><div className="market-offer-meta"><span>от {Number(s.price).toLocaleString("ru-RU")} ₽</span><span>{s.deliveryTime}</span></div><div className="market-offer-actions"><button className="market-action primary" onClick={()=>toggleService(s)}>{inCart?"Убрать из корзины":"Добавить в корзину"}</button>{inCart&&<Link className="market-action" to="/market/cart">Перейти к заказу</Link>}</div></article>})}</div></section>}
  {activeTab==="reviews"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Отзывы покупателей</h2><div className="market-grid">{(specialist.reviews||[]).map(r=><article className="market-card market-glass" key={r.id}><span className="market-rating">{"★".repeat(r.rating)}</span><h3>{r.name}</h3><p>{r.text}</p></article>)}</div>{!specialist.reviews?.length&&<div className="market-empty market-glass">Отзывы появятся после выполненных заказов.</div>}</section>}
  {activeTab==="about"&&<section className="market-panel market-glass"><h2 className="market-heading" style={{fontSize:"1.55rem"}}>О продавце</h2><p className="market-copy">{specialist.bio}</p><div className="market-choice-grid"><div className="market-choice"><h3>Специализация</h3><p>{specialist.specializations.join(", ")}</p></div><div className="market-choice"><h3>Проверка профиля</h3><p>Профиль и заявленная специализация прошли модерацию ДокМаркета.</p></div></div></section>}
 </MarketFrame>
}