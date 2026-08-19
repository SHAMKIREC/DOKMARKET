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

  function refresh(action) {
    action();
    setRevision(value => value + 1);
  }

  function mainAction() {
    if (offer.type === "service") return setNotice("Заявки специалисту будут подключены следующим этапом.");
    if (offer.type === "online_form") return setNotice("В MVP показан сценарий онлайн-формы. Подключение опубликованного шаблона специалиста будет следующим этапом.");
    setNotice("В MVP скачивание доступно в демо-режиме. В production полный файл будет доступен после оплаты.");
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Решения", to: offersPath }, { label: offer.title }]} backTo={offersPath} />
    <section className="market-panel market-glass">
      <div className="market-offer-top"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><span className="market-badge">{offer.providerType === "platform" ? "От платформы" : "Проверенный специалист"}</span><span className="market-badge">{offerTypeLabels[offer.type]}</span></div><span style={{ color: "#fbbf24" }}><i className="fa-solid fa-star" /> {offer.rating}</span></div>
      <h1 className="market-heading">{offer.title}</h1>
      <p className="market-lead">{offer.description}</p>

      {specialist && <Link className="market-specialist-head" style={{ color: "inherit", textDecoration: "none", width: "fit-content" }} to={`/market/specialist/${specialist.id}`}><span className="market-specialist-avatar">{specialist.initials}</span><span><strong style={{ display: "block", color: "#fff" }}>{specialist.name}</strong><small style={{ color: "#94a3b8" }}>{specialist.profession}</small></span></Link>}

      <div className="market-choice-grid">
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Цена</span><h3 style={{ marginTop: 7 }}>{formattedPrice}</h3></div>
        <div className="market-choice"><span style={{ color: "#64748b", fontSize: ".7rem" }}>Форматы</span><h3 style={{ marginTop: 7 }}>{offer.formats?.join(" / ") || "Онлайн"}</h3></div>
        <div className="market-choice"><h3>Для кого подходит</h3><p>{offer.suitableFor || "Для пользователей с задачей, соответствующей описанию решения."}</p></div>
        <div className="market-choice"><h3>Что входит</h3><p>{offer.whatIncluded || offer.description}</p></div>
        <div className="market-choice"><h3>Как использовать</h3><p>{offer.usage || "Откройте решение и следуйте инструкции."}</p></div>
        {offer.deliveryTime && <div className="market-choice"><h3>Срок выполнения</h3><p>{offer.deliveryTime}</p></div>}
      </div>

      {offer.type !== "service" && <section className="market-preview">
        <div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span>{(offer.previewText || [offer.title, offer.description]).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}<div className="market-preview-fade" /></div>
        <div><h2 className="market-heading" style={{ fontSize: "1.4rem" }}>Превью документа</h2><p className="market-lead">Показан ознакомительный фрагмент без возможности скачать полный файл.</p><p className="market-note"><i className="fa-solid fa-circle-info" />Демо-режим: оформление будет подключено позже.</p><button className="market-secondary market-action" type="button" onClick={() => setNotice("В MVP скачивание доступно в демо-режиме. В production полный файл будет доступен после оплаты.")}>Получить полный документ</button></div>
      </section>}

      <p className="market-note"><i className="fa-solid fa-circle-exclamation" />Перед использованием проверьте документ под вашу ситуацию. При необходимости обратитесь к специалисту.</p>
      <div className="market-offer-actions market-offer-purchase">
        {offer.type === "platform_generator" ? <Link className="market-action primary" to={offer.actionUrl || "/Generator"}>Заполнить онлайн</Link>
          : ["ready_file", "guide", "bundle"].includes(offer.type) && isCartEligible(offer) ? <button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleCart(offer))}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "В корзину"}</button>
            : <button className="market-action primary" type="button" onClick={mainAction}>{offer.type === "service" ? "Обратиться к специалисту" : "Заполнить онлайн"}</button>}
        {offer.type === "online_form" && isCartEligible(offer) && <button className={`market-action ${inCart ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleCart(offer))}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "В корзину"}</button>}
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleFavorite(offer.id, "offer"))}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "В избранном" : "В избранное"}</button>
        {specialist && <Link className="market-action" to={`/market/specialist/${specialist.id}`}>Посмотреть специалиста</Link>}
      </div>
    </section>

    {notice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setNotice("")}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-circle-info" /></span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Демонстрационный режим</h2><p className="market-lead">{notice}</p><button className="market-primary" type="button" onClick={() => setNotice("")}>Понятно</button></section></div>}
  </MarketFrame>;
}
