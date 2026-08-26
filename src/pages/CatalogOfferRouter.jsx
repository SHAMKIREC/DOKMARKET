import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { loadPublishedCatalogItem } from "@/marketplace/services/catalogService";
import { isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation } from "./Market";
import LegacyMarketOffer from "./MarketOffer";

export default function CatalogOfferRouter(){
 const {offerId}=useParams(); const [item,setItem]=useState(undefined); const [,setRevision]=useState(0);
 useEffect(()=>{let live=true;loadPublishedCatalogItem(offerId).then(value=>{if(live)setItem(value)}).catch(()=>{if(live)setItem(null)});return()=>{live=false}},[offerId]);
 if(item===undefined)return <MarketFrame><div className="market-empty market-glass">Загружаем карточку…</div></MarketFrame>;
 if(!item)return <LegacyMarketOffer/>;
 const inCart=isInCart(item.id),favorite=isFavorite(item.id,"offer"); const price=item.priceType==="free"?"Бесплатно":`${item.priceType==="from"?"от ":""}${item.price.toLocaleString("ru-RU")} ₽`;
 return <MarketFrame>
  <MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Документы",to:"/market"},{label:item.title}]} backTo="/market"/>
  <section className="market-product-layout">
   <div className="market-panel market-glass market-product-main"><div className="market-offer-top"><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><span className="market-badge">{item.providerType==="platform"?"От ДокМаркета":"От селлера"}</span>{item.formats.map(x=><span className="market-badge" key={x}>{x}</span>)}</div></div><h1 className="market-heading">{item.title}</h1><p className="market-lead">{item.description}</p>
    <div className="market-product-mobile-buy market-glass"><strong>{price}</strong>{item.priceType!=="free"&&<button className="market-primary" onClick={()=>{toggleCart(item);setRevision(v=>v+1)}}>{inCart?"В корзине":"Добавить в корзину"}</button>}</div>
    <div className="market-choice-grid"><div className="market-choice"><h3>Что получите</h3><p>{item.whatIncluded||`${item.formats.join(" / ")||"Готовый файл"} после оформления.`}</p></div><div className="market-choice"><h3>Кому подходит</h3><p>{item.suitableFor||"Покупателю, чья задача соответствует описанию документа."}</p></div><div className="market-choice"><h3>Как использовать</h3><p>{item.usage||"Скачайте документ, внесите свои данные и используйте по назначению."}</p></div><div className="market-choice"><h3>Селлер</h3><p>{item.providerName}{item.seller?.headline?` · ${item.seller.headline}`:""}</p></div></div>
    <section className="market-preview"><div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span><p>{item.title}</p><p>{item.description}</p><p>Формат: {item.formats.join(" / ")||"указан в карточке"}</p><div className="market-preview-fade"/></div><div><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Понятно до покупки</h2><p className="market-lead">Карточка показывает назначение, состав, формат, цену и селлера. Сам файл хранится в закрытом хранилище.</p></div></section>
   </div>
   <aside className="market-product-buy market-glass"><span>Цена</span><strong>{price}</strong><p>{item.providerName}</p>{item.priceType!=="free"?<button className="market-primary" onClick={()=>{toggleCart(item);setRevision(v=>v+1)}}>{inCart?"Убрать из корзины":"Добавить в корзину"}</button>:<button className="market-primary">Получить бесплатно</button>}{inCart&&<Link className="market-action" to="/market/cart">Открыть корзину</Link>}<button className={`market-action ${favorite?"active":""}`} onClick={()=>{toggleFavorite(item.id,"offer");setRevision(v=>v+1)}}>{favorite?"♥ В избранном":"♡ В избранное"}</button><small>Файл не выдаётся напрямую из публичной ссылки. Доступ покупателя будет проверяться через заказ.</small></aside>
  </section>
 </MarketFrame>;
}
