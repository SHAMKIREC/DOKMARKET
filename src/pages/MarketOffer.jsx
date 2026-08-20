import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, offerTypeLabels, specialists } from "@/data/marketplaceMock";
import { getOfferQuality } from "@/data/marketplaceQuality";
import { isCartEligible, isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation } from "./Market";

const formatReviewDate = value => {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

export default function MarketOffer() {
  const { offerId } = useParams();
  const [, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const offer = offers.find(item => item.id === offerId);

  if (!offer) return <MarketFrame><MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Решение не найдено" }]} backTo="/market" /><div className="market-empty market-glass"><h1 className="market-heading">Решение не найдено</h1></div></MarketFrame>;

  const quality = getOfferQuality(offer.id);
  const specialist = offer.providerId ? specialists.find(item => item.id === offer.providerId) : null;
  const offersPath = `/market/${offer.directionSlug}/${offer.sectionSlug}/${offer.categorySlug}/${offer.situationSlug}/offers`;
  const formattedPrice = offer.priceType === "free" ? "Бесплатно" : `${offer.priceType === "from" ? "от " : ""}${Number(offer.price).toLocaleString("ru-RU")} ₽`;
  const favorite = isFavorite(offer.id, "offer");
  const inCart = isInCart(offer.id);
  const cartEligible = isCartEligible(offer);
  const related = useMemo(() => {
    const explicit = (quality.relatedIds || []).map(id => offers.find(item => item.id === id)).filter(Boolean);
    if (explicit.length) return explicit.slice(0, 3);
    return offers.filter(item => item.id !== offer.id && item.categorySlug === offer.categorySlug && item.situationSlug === offer.situationSlug).slice(0, 3);
  }, [offer, quality.relatedIds]);
  const warnings = quality.warnings || [];
  const isDemo = String(quality.version || "").toLowerCase().includes("демо");

  function refresh(action) { action(); setRevision(value => value + 1); }
  function toggleCurrentCart() { refresh(() => toggleCart(offer)); }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Решения", to: offersPath }, { label: offer.title }]} backTo={offersPath} />
    <section className="market-panel market-glass">
      <div className="market-offer-top"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><span className="market-badge">{offer.providerType === "platform" ? "Сервис ДокМаркета" : isDemo ? "Демо каталога" : "Автор / специалист"}</span><span className="market-badge">{offerTypeLabels[offer.type]}</span>{quality.version && <span className="market-badge">Версия: {quality.version}</span>}{quality.reviewedAt && <span className="market-badge"><i className="fa-solid fa-clock-rotate-left" /> Проверено {formatReviewDate(quality.reviewedAt)}</span>}</div></div>
      <h1 className="market-heading">{offer.title}</h1>
      <p className="market-lead">{offer.description}</p>

      {quality.reviewLabel && <p className="market-note" style={{ marginTop: 0 }}><i className="fa-solid fa-shield-halved" />{quality.reviewLabel}</p>}
      {isDemo && <p className="market-note" style={{ marginTop: 0 }}><i className="fa-solid fa-flask" />Эта карточка показывает механику каталога и не считается опубликованным товаром или услугой.</p>}

      {specialist && <Link className="market-specialist-head" style={{ color: "inherit", textDecoration: "none", width: "fit-content" }} to={`/market/specialist/${specialist.id}`}><span className="market-specialist-avatar">{specialist.initials}</span><span><strong style={{ display: "block", color: "#fff" }}>{specialist.name}</strong><small style={{ color: "#94a3b8" }}>{isDemo ? "Демонстрационный профиль" : specialist.profession}</small></span></Link>}

      <div className="market-choice-grid">
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Цена</span><h3 style={{ marginTop: 7 }}>{formattedPrice}</h3></div>
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Что получите</span><h3 style={{ marginTop: 7 }}>{offer.formats?.join(" / ") || "Онлайн-результат"}</h3></div>
        <div className="market-choice"><h3>Когда подходит</h3><p>{offer.suitableFor || "Когда ваша ситуация соответствует описанию решения."}</p></div>
        <div className="market-choice"><h3>Что входит</h3><p>{offer.whatIncluded || offer.description}</p></div>
        <div className="market-choice"><h3>Что делать</h3><p>{offer.usage || "Откройте решение и следуйте шагам."}</p></div>
        {offer.deliveryTime && <div className="market-choice"><h3>Когда будет готово</h3><p>{offer.deliveryTime}</p></div>}
      </div>

      {warnings.length > 0 && <section className="market-choice" style={{ marginTop: 14, borderColor: "rgba(251,191,36,.18)" }}><h3><i className="fa-solid fa-triangle-exclamation" style={{ color: "#fbbf24", marginRight: 8 }} />Перед использованием</h3>{warnings.map(text => <p key={text} style={{ margin: "7px 0" }}>• {text}</p>)}</section>}

      {offer.type !== "service" && <section className="market-preview"><div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span>{(offer.previewText || [offer.title, offer.description]).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}<div className="market-preview-fade" /></div><div><h2 className="market-heading" style={{ fontSize: "1.4rem" }}>Сначала посмотрите</h2><p className="market-lead">Ознакомьтесь с фрагментом до покупки. Для онлайн-форм доступно демо.</p><p className="market-note"><i className="fa-solid fa-circle-info" />После покупки документ останется в вашем кабинете ДокМаркета.</p>{offer.type === "platform_generator" ? <Link className="market-action primary" to={offer.actionUrl || "/Generator"}>Заполнить онлайн</Link> : offer.type === "online_form" ? <Link className="market-action primary" to={`/market/demo/${offer.id}`}><i className="fa-solid fa-flask" />Попробовать демо</Link> : cartEligible ? <button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "Убрать из корзины" : "Добавить полный документ"}</button> : <button className="market-action" type="button" onClick={() => setNotice("Файл ещё не опубликован автором.")}>Открыть решение</button>}</div></section>}

      {quality.nextStep && <section className="market-choice" style={{ marginTop: 16 }}><h3>После подготовки</h3><p>{quality.nextStep}</p></section>}

      <div className="market-offer-actions market-offer-purchase">
        {offer.type === "platform_generator" ? <Link className="market-action primary" to={offer.actionUrl || "/Generator"}>Заполнить онлайн</Link> : offer.type === "online_form" ? <Link className="market-action primary" to={`/market/demo/${offer.id}`}><i className="fa-solid fa-flask" />Открыть демо</Link> : cartEligible ? <button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "Убрать из корзины" : offer.type === "service" ? "Добавить услугу" : "Добавить в корзину"}</button> : <button className="market-action primary" type="button" onClick={() => setNotice("Решение пока не опубликовано для оформления.")}>Открыть решение</button>}
        {offer.type === "online_form" && cartEligible && <button className={`market-action ${inCart ? "active" : ""}`} type="button" onClick={toggleCurrentCart}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "Добавить полную версию"}</button>}
        {inCart && <Link className="market-action" to="/market/cart">Перейти в корзину <i className="fa-solid fa-arrow-right" /></Link>}
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleFavorite(offer.id, "offer"))}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "Убрать из избранного" : "В избранное"}</button>
        {specialist && <Link className="market-action" to={`/market/specialist/${specialist.id}`}>Помощь специалиста</Link>}
      </div>
    </section>

    {related.length > 0 && <section className="market-panel market-glass" style={{ marginTop: 16 }}><span className="market-kicker">СЛЕДУЮЩИЙ ШАГ</span><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Может понадобиться дальше</h2><p className="market-lead">Связанные решения по той же ситуации.</p><div className="market-choice-grid">{related.map(item => <Link key={item.id} to={`/market/offer/${item.id}`} className="market-choice" style={{ textDecoration: "none", color: "inherit" }}><span className="market-badge">{offerTypeLabels[item.type]}</span><h3>{item.title}</h3><p>{item.description}</p><strong style={{ color: "#67e8f9" }}>{item.priceType === "free" ? "Бесплатно" : `${Number(item.price).toLocaleString("ru-RU")} ₽`} →</strong></Link>)}</div></section>}

    <section className="market-panel market-glass" style={{ marginTop: 16 }}><span className="market-kicker">НЕ УВЕРЕНЫ?</span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Проверьте выбор до оплаты</h2><p className="market-lead">Опишите ситуацию или откройте специалистов, если карточка не совпадает с вашим случаем.</p><div className="market-offer-actions"><Link className="market-action primary" to="/#problem-finder">Описать ситуацию</Link><Link className="market-action" to="/market#specialists">Найти специалиста</Link></div></section>

    {notice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setNotice("")}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-circle-info" /></span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Пока недоступно</h2><p className="market-lead">{notice}</p><button className="market-primary" type="button" onClick={() => setNotice("")}>Понятно</button></section></div>}
  </MarketFrame>;
}
