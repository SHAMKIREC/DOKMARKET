import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, offerTypeLabels, specialists } from "@/data/marketplaceMock";
import { getOfferQuality } from "@/data/marketplaceQuality";
import { loadPublishedCatalogItem } from "@/marketplace/services/catalogService";
import { isCartEligible, isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation } from "./Market";

const DEMO_SPECIALISTS = new Set(["elena-morozova", "alexey-volkov"]);
const EMPTY_QUALITY = { warnings: [], relatedIds: [], reviewLabel: "", reviewedAt: "", nextStep: "" };
const typeLabel = type => offerTypeLabels[type] || ({ ready_file:"Готовый документ", guide:"Инструкция", bundle:"Пакет документов", online_form:"Онлайн-форма", platform_generator:"Сервис ДокМаркета", service:"Услуга" }[type]) || "Документ";

export default function MarketOffer() {
  const { offerId } = useParams();
  const [, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);
  const mockOffer = offers.find(item => item.id === offerId) || null;

  useEffect(() => {
    let active = true;
    if (mockOffer) { setLoading(false); setRemote(null); return undefined; }
    setLoading(true);
    loadPublishedCatalogItem(offerId).then(item => { if (active) setRemote(item); }).catch(() => { if (active) setRemote(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offerId, mockOffer]);

  const offer = mockOffer || remote;
  const quality = mockOffer ? getOfferQuality(mockOffer.id) : EMPTY_QUALITY;
  const rawSpecialist = mockOffer?.providerId ? specialists.find(item => item.id === mockOffer.providerId) : null;
  const specialist = rawSpecialist && !DEMO_SPECIALISTS.has(rawSpecialist.id) ? rawSpecialist : null;
  const seller = remote?.seller || null;
  const related = useMemo(() => {
    if (!mockOffer) return [];
    const explicit = (quality.relatedIds || []).map(id => offers.find(item => item.id === id)).filter(Boolean);
    if (explicit.length) return explicit.slice(0, 3);
    return offers.filter(item => item.id !== mockOffer.id && item.categorySlug === mockOffer.categorySlug && item.situationSlug === mockOffer.situationSlug).slice(0, 3);
  }, [mockOffer, quality.relatedIds]);

  if (loading) return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/market"},{label:"Товар"}]} backTo="/market"/><section className="market-empty market-glass"><h1 className="market-heading">Загружаем товар…</h1></section></MarketFrame>;
  if (!offer) return <MarketFrame><MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Товар не найден" }]} backTo="/market" /><section className="market-empty market-glass"><h1 className="market-heading">Товар не найден</h1><p className="market-lead">Он мог быть снят с публикации или ещё не прошёл модерацию.</p><Link className="market-primary" to="/market">Вернуться в каталог</Link></section></MarketFrame>;

  const formattedPrice = offer.priceType === "free" ? "Бесплатно" : `${offer.priceType === "from" ? "от " : ""}${Number(offer.price || 0).toLocaleString("ru-RU")} ₽`;
  const favorite = isFavorite(offer.id, "offer");
  const inCart = isInCart(offer.id);
  const cartEligible = isCartEligible(offer);
  const isDocument = offer.type !== "service";
  const isRemoteSellerItem = Boolean(remote && remote.providerType === "specialist");
  const previewLines = offer.previewText || [offer.title, offer.description].filter(Boolean);

  function refresh(action) { action(); setRevision(value => value + 1); }
  function toggleCurrentCart() { refresh(() => toggleCart(offer)); }

  let primaryAction;
  if (offer.type === "platform_generator") primaryAction = <Link className="market-primary" to={offer.actionUrl || "/Generator"}>Создать документ</Link>;
  else if (offer.type === "online_form" && mockOffer) primaryAction = <Link className="market-primary" to={`/market/demo/${offer.id}`}>Попробовать демо</Link>;
  else if (cartEligible) primaryAction = <button className="market-primary" type="button" onClick={toggleCurrentCart}>{inCart ? "Убрать из корзины" : isDocument ? "Добавить в корзину" : "Заказать услугу"}</button>;
  else if (offer.priceType === "free") primaryAction = <button className="market-primary" type="button" onClick={() => setNotice("Бесплатная выдача файла будет доступна через кабинет покупателя. Карточка уже опубликована, файл защищён от прямого доступа.")}>Получить бесплатно</button>;
  else primaryAction = <button className="market-primary" type="button" onClick={() => setNotice("Этот товар пока недоступен для оформления.")}>Открыть</button>;

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Каталог", to: "/market" }, { label: offer.title }]} backTo="/market" />

    <section className="market-product market-glass">
      <div className="market-product-main">
        <div className="market-product-badges"><span className="market-badge">{offer.providerType === "platform" ? "От ДокМаркета" : "От продавца"}</span><span className="market-badge">{typeLabel(offer.type)}</span>{isRemoteSellerItem && <span className="market-badge">Прошёл модерацию</span>}</div>
        <h1 className="market-heading market-product-title">{offer.title}</h1>
        <p className="market-lead market-product-description">{offer.description}</p>
        <div className="market-product-facts"><div><span>Формат</span><strong>{offer.formats?.join(" / ") || "Онлайн"}</strong></div><div><span>Что получите</span><strong>{offer.whatIncluded || "Готовый результат"}</strong></div><div><span>Кому подходит</span><strong>{offer.suitableFor || "Для ситуации из описания"}</strong></div></div>
        {quality.reviewLabel && <div className="market-trust-line">✓ {quality.reviewLabel}</div>}
        {isRemoteSellerItem && <div className="market-trust-line">✓ Товар опубликован после модерации ДокМаркета</div>}
      </div>
      <aside className="market-buybox"><span className="market-buybox-label">Цена</span><strong className="market-buybox-price">{formattedPrice}</strong><div className="market-buybox-actions">{primaryAction}{inCart && <Link className="market-action" to="/market/cart">Перейти в корзину</Link>}<button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleFavorite(offer.id, "offer"))}>{favorite ? "♥ В избранном" : "♡ В избранное"}</button></div><div className="market-buybox-note">Покупка и доступ к товару будут связаны с вашим аккаунтом ДокМаркета.</div></aside>
    </section>

    {isDocument && <section className="market-preview market-glass market-product-preview"><div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span>{previewLines.map((line,index)=><p key={`${line}-${index}`}>{line}</p>)}<div className="market-preview-fade"/></div><div className="market-preview-copy"><span className="market-kicker">До покупки</span><h2 className="market-heading" style={{fontSize:"1.45rem"}}>Понятно, что вы получаете</h2><p className="market-lead">Карточка показывает назначение, формат и состав товара. Сам файл продавца хранится в закрытом хранилище.</p><div className="market-offer-actions">{primaryAction}</div></div></section>}

    <section className="market-product-details"><article className="market-panel market-glass"><span className="market-kicker">Состав</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Что входит</h2><p className="market-copy">{offer.whatIncluded || offer.description}</p></article><article className="market-panel market-glass"><span className="market-kicker">Применение</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Как использовать</h2><p className="market-copy">{offer.usage || "Скачайте товар из кабинета и следуйте инструкции автора."}</p></article></section>

    {seller && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Продавец</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>{seller.display_name || offer.providerName}</h2><p className="market-copy">{seller.headline || "Проверенный продавец ДокМаркета"}</p><div className="market-offer-meta"><span>★ {Number(seller.rating || 0).toFixed(1)}</span><span>{Number(seller.reviews_count || 0)} отзывов</span></div></section>}
    {specialist && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Продавец</span><Link className="market-specialist-head" style={{color:"inherit",textDecoration:"none"}} to={`/market/specialist/${specialist.id}`}><span className="market-specialist-avatar">{specialist.initials}</span><span><strong style={{display:"block",color:"#fff"}}>{specialist.name}</strong><small style={{color:"#94a3b8"}}>{specialist.profession}</small></span></Link></section>}

    {related.length > 0 && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Ещё по теме</span><h2 className="market-heading" style={{fontSize:"1.45rem"}}>Может пригодиться</h2><div className="market-choice-grid">{related.map(item=><Link key={item.id} to={`/market/offer/${item.id}`} className="market-choice" style={{textDecoration:"none",color:"inherit"}}><span className="market-badge">{typeLabel(item.type)}</span><h3>{item.title}</h3><p>{item.description}</p><strong style={{color:"#67e8f9"}}>{item.priceType==="free"?"Бесплатно":`${Number(item.price).toLocaleString("ru-RU")} ₽`} →</strong></Link>)}</div></section>}

    <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Нужна помощь?</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Опишите задачу помощнику</h2><p className="market-lead">Он подберёт подходящий товар или направит к специалисту.</p><div className="market-offer-actions"><Link className="market-primary" to="/#smart-find">Подобрать документ</Link></div></section>

    {notice && <div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:80,display:"grid",placeItems:"center",padding:20,background:"rgba(2,6,23,.78)",backdropFilter:"blur(7px)"}} onMouseDown={()=>setNotice("")}><section className="market-panel market-glass" style={{maxWidth:470}} onMouseDown={event=>event.stopPropagation()}><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Информация</h2><p className="market-lead">{notice}</p><button className="market-primary" type="button" onClick={()=>setNotice("")}>Понятно</button></section></div>}
  </MarketFrame>;
}
