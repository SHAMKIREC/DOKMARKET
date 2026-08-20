import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, offerTypeLabels, specialists } from "@/data/marketplaceMock";
import { isCartEligible, isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation } from "./Market";

export default function MarketOffer() {
  const { offerId } = useParams();
  const [, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const offer = offers.find(item => item.id === offerId);

  if (!offer) return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Решение не найдено" }]} backTo="/market" />
    <div className="market-empty market-glass"><h1 className="market-heading">Решение не найдено</h1></div>
  </MarketFrame>;

  const specialist = offer.providerId ? specialists.find(item => item.id === offer.providerId) : null;
  const offersPath = `/market/${offer.directionSlug}/${offer.sectionSlug}/${offer.categorySlug}/${offer.situationSlug}/offers`;
  const formattedPrice = offer.priceType === "free" ? "Бесплатно" : `${offer.priceType === "from" ? "от " : ""}${Number(offer.price).toLocaleString("ru-RU")} ₽`;
  const favorite = isFavorite(offer.id, "offer");
  const inCart = isInCart(offer.id);
  const cartEligible = isCartEligible(offer);

  function refresh(action) { action(); setRevision(value => value + 1); }
  function toggleCurrentCart() { refresh(() => toggleCart(offer)); }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Решения", to: offersPath }, { label: offer.title }]} backTo={offersPath} />
    <section className="market-panel market-glass">
      <div className="market-offer-top"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><span className="market-badge">{offer.providerType === "platform" ? "От платформы" : "Проверенный специалист"}</span><span className="market-badge">{offerTypeLabels[offer.type]}</span></div><span className="market-rating"><i className="fa-solid fa-star" /> {offer.rating}</span></div>
      <h1 className="market-heading">{offer.title}</h1>
      <p className="market-lead">{offer.description}</p>

      {specialist && <Link className="market-specialist-head" style={{ color: "inherit", textDecoration: "none", width: "fit-content" }} to={`/market/specialist/${specialist.id}`}><span className="market-specialist-avatar">{specialist.initials}</span><span><strong style={{ display: "block", color: "#fff" }}>{specialist.name}</strong><small style={{ color: "#94a3b8" }}>{specialist.profession}</small></span></Link>}

      <div className="market-choice-grid">
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Цена</span><h3 style={{ marginTop: 7 }}>{formattedPrice}</h3></div>
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Форматы</span><h3 style={{ marginTop: 7 }}>{offer.formats?.join(" / ") || "Онлайн"}</h3></div>
        <div className="market-choice"><h3>Для кого подходит</h3><p>{offer.suitableFor || "Для пользователей с задачей, соответствующей описанию решения."}</p></div>
        <div className="market-choice"><h3>Что получите</h3><p>{offer.whatIncluded || offer.description}</p></div>
        <div className="market-choice"><h3>Как это работает</h3><p>{offer.usage || "Откройте решение и следуйте инструкции."}</p></div>
        {offer.deliveryTime && <div className="market-choice"><h3>Срок выполнения</h3><p>{offer.deliveryTime}</p></div>}
      </div>

      {offer.type !== "service" && <section className="market-preview">
        <div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span>{(offer.previewText || [offer.title, offer.description]).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}<div className="market-preview-fade" /></div>
        <div><h2 className="market-heading" style={{ fontSize: "1.4rem" }}>Посмотреть перед покупкой</h2><p className="market-lead">Показан ознакомительный фрагмент. Онлайн-формы можно попробовать в демо без оплаты.</p><p className="market-note"><i className="fa-solid fa-circle-info" />Полная платная версия оформляется через общую корзину ДокМаркета.</p>{offer.type === "platform_generator" ? <Link className="market-action primary" to={offer.actionUrl || "/Generator"}>Заполнить онлайн</Link> : offer.type === "online_form" ? <Link className="market-action primary" to={`/market/demo/${offer.id}`}><i className="fa-solid fa-flask" />Попробовать демо</Link> : cartEligible ? <button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "Убрать из корзины" : "Получить полный документ"}</button> : <button className="market-action" type="button" onClick={() => setNotice("Это бесплатное решение станет доступно здесь сразу после публикации файла автором.")}>Открыть решение</button>}</div>
      </section>}

      <p className="market-note"><i className="fa-solid fa-circle-exclamation" />Перед использованием проверьте документ под вашу ситуацию. При необходимости обратитесь к специалисту.</p>
      <div className="market-offer-actions market-offer-purchase">
        {offer.type === "platform_generator" ? <Link className="market-action primary" to={offer.actionUrl || "/Generator"}>Заполнить онлайн</Link>
          : offer.type === "online_form" ? <Link className="market-action primary" to={`/market/demo/${offer.id}`}><i className="fa-solid fa-flask" />Открыть демо</Link>
          : cartEligible ? <button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "Убрать из корзины" : offer.type === "service" ? "Добавить услугу в корзину" : "Добавить в корзину"}</button>
          : <button className="market-action primary" type="button" onClick={() => setNotice("Решение пока не опубликовано для оформления.")}>Открыть решение</button>}
        {offer.type === "online_form" && cartEligible && <button className={`market-action ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "Добавить полную версию"}</button>}
        {inCart && <Link className="market-action" to="/market/cart"><i className="fa-solid fa-arrow-right" />Перейти в корзину</Link>}
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleFavorite(offer.id, "offer"))}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "Убрать из избранного" : "В избранное"}</button>
        {specialist && <Link className="market-action" to={`/market/specialist/${specialist.id}`}>Посмотреть специалиста</Link>}
      </div>
    </section>

    {notice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setNotice("")}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-circle-info" /></span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Пока недоступно</h2><p className="market-lead">{notice}</p><button className="market-primary" type="button" onClick={() => setNotice("")}>Понятно</button></section></div>}
  </MarketFrame>;
}
