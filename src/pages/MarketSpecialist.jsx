import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicSellerProfile } from "@/marketplace/services/sellerProfileService";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { listSellerReviews } from "@/marketplace/services/reviewService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation, OffersGrid } from "./Market";

const TABS = [["store","Витрина"],["reviews","Отзывы"],["about","О продавце"]];
const initialsOf = name => String(name || "Продавец").split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();
const formatDate = value => value ? new Date(value).toLocaleDateString("ru-RU", { day:"2-digit", month:"long", year:"numeric" }) : "";

export default function MarketSpecialist(){
 const {specialistId}=useParams();
 const [activeTab,setActiveTab]=useState("store");
 const [,setRevision]=useState(0);
 const [seller,setSeller]=useState(null);
 const [items,setItems]=useState([]);
 const [reviews,setReviews]=useState([]);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{let active=true;setLoading(true);Promise.all([getPublicSellerProfile(specialistId),loadPublishedCatalog(),listSellerReviews(specialistId)]).then(([profile,catalog,reviewRows])=>{if(!active)return;setSeller(profile);setItems(profile?(catalog||[]).filter(item=>item.providerId===profile.user_id):[]);setReviews(profile?(reviewRows||[]):[])}).catch(()=>{if(active){setSeller(null);setItems([]);setReviews([])}}).finally(()=>active&&setLoading(false));return()=>{active=false}},[specialistId]);

 if(loading)return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавец"}]} backTo="/market"/><section className="market-empty market-glass"><h1 className="market-heading">Загружаем витрину…</h1></section></MarketFrame>;
 if(!seller)return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"}]} backTo="/market"/><section className="market-empty market-glass"><h1 className="market-heading">Профиль не опубликован</h1><p>В каталоге показываются только реальные продавцы, прошедшие модерацию ДокМаркета.</p><Link className="market-primary" to="/market">Вернуться в каталог</Link></section></MarketFrame>;

 const favorite=isFavorite(seller.user_id,"specialist");
 const documents=items.filter(item=>item.type!=="service");
 const services=items.filter(item=>item.type==="service");
 const allStore=[...documents,...services];

 return <MarketFrame>
  <style>{`.seller-review-list{display:grid;gap:12px}.seller-review-card{padding:17px;border-radius:16px}.seller-review-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}.seller-review-stars{color:#f4cf76;letter-spacing:2px}.seller-review-card p{margin:0;color:#cbd5e1;line-height:1.6;font-size:.82rem}.seller-review-card small{color:#64748b}.seller-store-summary{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.seller-store-summary span{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);color:#cbd5e1;font-size:.7rem;font-weight:750}`}</style>
  <MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"},{label:seller.display_name}]} backTo="/market"/>
  <section className="market-panel market-glass seller-hero">
   <div className="market-profile-head"><div className="market-profile-avatar">{initialsOf(seller.display_name)}</div><div className="market-profile-copy"><span className="market-badge">✓ Продавец проверен</span><h1 className="market-heading">{seller.display_name}</h1><p className="market-subtitle" style={{margin:0}}>{seller.headline||"Продавец ДокМаркета"}</p><div className="market-examples">{(seller.specializations||[]).map(x=><span className="market-example" key={x}>{x}</span>)}</div></div></div>
   <div className="market-profile-stats"><div><span>Рейтинг</span><strong>★ {Number(seller.rating||0).toFixed(1)}</strong></div><div><span>Отзывы</span><strong>{Number(seller.reviews_count||0)}</strong></div><div><span>Заказов</span><strong>{Number(seller.completed_orders||0)}</strong></div><div><span>Цена услуг</span><strong>{seller.price_from?`от ${Number(seller.price_from).toLocaleString("ru-RU")} ₽`:"По карточкам"}</strong></div></div>
   <div className="market-offer-actions"><button className="market-action primary" onClick={()=>setActiveTab("store")}>Смотреть товары</button>{services.length>0&&<button className="market-action" onClick={()=>setActiveTab("store")}>Услуги: {services.length}</button>}<button className={`market-action ${favorite?"active":""}`} onClick={()=>{toggleFavorite(seller.user_id,"specialist");setRevision(v=>v+1)}}>{favorite?"♥ В избранном":"♡ В избранное"}</button></div>
  </section>

  <div className="market-deal-note market-glass"><strong>Товары и услуги проходят через ДокМаркет</strong><span>Витрина содержит только позиции после модерации. Для услуг задача, результат и подтверждение клиента фиксируются внутри заказа.</span></div>
  <nav className="market-tabs">{TABS.map(([id,label])=><button className={activeTab===id?"active":""} onClick={()=>setActiveTab(id)} key={id}>{label}</button>)}</nav>

  {activeTab==="store"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Витрина продавца</h2><p className="market-lead">Готовые документы и услуги одного проверенного продавца.</p><div className="seller-store-summary"><span>{documents.length} документов</span><span>{services.length} услуг</span><span>{reviews.length} подтверждённых отзывов</span></div>{allStore.length?<OffersGrid items={allStore}/>:<div className="market-empty market-glass">У продавца пока нет опубликованных товаров.</div>}</section>}
  {activeTab==="reviews"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Отзывы покупателей</h2><p className="market-lead">Оставить отзыв можно только после завершённого заказа услуги.</p>{reviews.length?<div className="seller-review-list">{reviews.map(review=><article className="seller-review-card market-glass" key={review.id}><div className="seller-review-head"><span className="seller-review-stars">{"★".repeat(Number(review.rating||0))}{"☆".repeat(Math.max(0,5-Number(review.rating||0)))}</span><small>{formatDate(review.created_at)}</small></div><p>{review.review_text}</p><small>Подтверждённая покупка · заказ №{String(review.order_id).slice(0,8).toUpperCase()}</small></article>)}</div>:<div className="market-empty market-glass">Пока нет отзывов после завершённых заказов.</div>}</section>}
  {activeTab==="about"&&<section className="market-panel market-glass"><h2 className="market-heading" style={{fontSize:"1.55rem"}}>О продавце</h2><p className="market-copy">{seller.bio||"Продавец пока не добавил подробное описание."}</p><div className="market-choice-grid"><div className="market-choice"><h3>Специализация</h3><p>{(seller.specializations||[]).join(", ")||"Не указана"}</p></div><div className="market-choice"><h3>Проверка</h3><p>Публичный профиль доступен только после одобрения модератором ДокМаркета.</p></div></div></section>}
 </MarketFrame>
}
