import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicSellerProfile } from "@/marketplace/services/sellerProfileService";
import { loadPublishedCatalog } from "@/marketplace/services/catalogService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation, OffersGrid } from "./Market";

const TABS = [["store","Витрина"],["reviews","Отзывы"],["about","О продавце"]];
const initialsOf = name => String(name || "Продавец").split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();

export default function MarketSpecialist(){
 const {specialistId}=useParams();
 const [activeTab,setActiveTab]=useState("store");
 const [,setRevision]=useState(0);
 const [seller,setSeller]=useState(null);
 const [items,setItems]=useState([]);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{let active=true;setLoading(true);Promise.all([getPublicSellerProfile(specialistId),loadPublishedCatalog()]).then(([profile,catalog])=>{if(!active)return;setSeller(profile);setItems(profile?(catalog||[]).filter(item=>item.providerId===profile.user_id):[])}).catch(()=>{if(active){setSeller(null);setItems([])}}).finally(()=>active&&setLoading(false));return()=>{active=false}},[specialistId]);

 if(loading)return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавец"}]} backTo="/market"/><section className="market-empty market-glass"><h1 className="market-heading">Загружаем витрину…</h1></section></MarketFrame>;
 if(!seller)return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"}]} backTo="/market"/><section className="market-empty market-glass"><h1 className="market-heading">Профиль не опубликован</h1><p>В каталоге показываются только реальные продавцы, прошедшие модерацию ДокМаркета.</p><Link className="market-primary" to="/market">Вернуться в каталог</Link></section></MarketFrame>;

 const favorite=isFavorite(seller.user_id,"specialist");
 const documents=items.filter(item=>item.type!=="service");
 const services=items.filter(item=>item.type==="service");
 const allStore=[...documents,...services];

 return <MarketFrame>
  <MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Продавцы"},{label:seller.display_name}]} backTo="/market"/>
  <section className="market-panel market-glass seller-hero">
   <div className="market-profile-head"><div className="market-profile-avatar">{initialsOf(seller.display_name)}</div><div className="market-profile-copy"><span className="market-badge">✓ Продавец проверен</span><h1 className="market-heading">{seller.display_name}</h1><p className="market-subtitle" style={{margin:0}}>{seller.headline||"Продавец ДокМаркета"}</p><div className="market-examples">{(seller.specializations||[]).map(x=><span className="market-example" key={x}>{x}</span>)}</div></div></div>
   <div className="market-profile-stats"><div><span>Рейтинг</span><strong>★ {Number(seller.rating||0).toFixed(1)}</strong></div><div><span>Отзывы</span><strong>{Number(seller.reviews_count||0)}</strong></div><div><span>Заказов</span><strong>{Number(seller.completed_orders||0)}</strong></div><div><span>Цена услуг</span><strong>{seller.price_from?`от ${Number(seller.price_from).toLocaleString("ru-RU")} ₽`:"По карточкам"}</strong></div></div>
   <div className="market-offer-actions"><button className="market-action primary" onClick={()=>setActiveTab("store")}>Смотреть товары</button><button className={`market-action ${favorite?"active":""}`} onClick={()=>{toggleFavorite(seller.user_id,"specialist");setRevision(v=>v+1)}}>{favorite?"♥ В избранном":"♡ В избранное"}</button></div>
  </section>

  <div className="market-deal-note market-glass"><strong>Товары и услуги проходят через ДокМаркет</strong><span>Витрина содержит только опубликованные после модерации позиции. Для услуг задача и результат фиксируются внутри заказа.</span></div>
  <nav className="market-tabs">{TABS.map(([id,label])=><button className={activeTab===id?"active":""} onClick={()=>setActiveTab(id)} key={id}>{label}</button>)}</nav>

  {activeTab==="store"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Витрина продавца</h2><p className="market-lead">Документы, онлайн-формы и услуги этого продавца.</p>{allStore.length?<OffersGrid items={allStore}/>:<div className="market-empty market-glass">У продавца пока нет опубликованных товаров.</div>}</section>}
  {activeTab==="reviews"&&<section><h2 className="market-heading" style={{fontSize:"1.55rem"}}>Отзывы покупателей</h2><div className="market-empty market-glass">Отзывы будут появляться только после завершённых заказов. Сейчас у продавца {Number(seller.reviews_count||0)} отзывов.</div></section>}
  {activeTab==="about"&&<section className="market-panel market-glass"><h2 className="market-heading" style={{fontSize:"1.55rem"}}>О продавце</h2><p className="market-copy">{seller.bio||"Продавец пока не добавил подробное описание."}</p><div className="market-choice-grid"><div className="market-choice"><h3>Специализация</h3><p>{(seller.specializations||[]).join(", ")||"Не указана"}</p></div><div className="market-choice"><h3>Проверка</h3><p>Публичный профиль доступен только после одобрения модератором ДокМаркета.</p></div></div></section>}
 </MarketFrame>
}
