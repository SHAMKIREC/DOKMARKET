import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, offerTypeLabels, specialists } from "@/data/marketplaceMock";
import { getOfferQuality } from "@/data/marketplaceQuality";
import { isCartEligible, isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation } from "./Market";

const DEMO_SPECIALISTS = new Set(["elena-morozova", "alexey-volkov"]);
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

  if (!offer) return <MarketFrame><MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Товар не найден" }]} backTo="/market" /><section className="market-empty market-glass"><h1 className="market-heading">Товар не найден</h1><Link className="market-primary" to="/market">Вернуться в каталог</Link></section></MarketFrame>;

  const quality = getOfferQuality(offer.id);
  const rawSpecialist = offer.providerId ? specialists.find(item => item.id === offer.providerId) : null;
  const specialist = rawSpecialist && !DEMO_SPECIALISTS.has(rawSpecialist.id) ? rawSpecialist : null;
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
  const isDocument = offer.type !== "service";

  function refresh(action) { action(); setRevision(value => value + 1); }
  function toggleCurrentCart() { refresh(() => toggleCart(offer)); }

  const primaryAction = offer.type === "platform_generator"
    ? <Link className="market-primary" to={offer.actionUrl || "/Generator"}>Создать документ</Link>
    : offer.type === "online_form"
      ? <Link className="market-primary" to={`/market/demo/${offer.id}`}>Попробовать демо</Link>
      : cartEligible
        ? <button className="market-primary" type="button" onClick={toggleCurrentCart}>{inCart ? "Убрать из корзины" : isDocument ? "Добавить в корзину" : "Заказать услугу"}</button>
        : <button className="market-primary" type="button" onClick={() => setNotice("Этот товар ещё не открыт для оформления.")}>Открыть</button>;

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Документы", to: offersPath }, { label: offer.title }]} backTo={offersPath} />

    <section className="market-product market-glass">
      <div className="market-product-main">
        <div className="market-product-badges">
          <span className="market-badge">{offer.providerType === "platform" ? "От ДокМаркета" : "От продавца"}</span>
          <span className="market-badge">{offerTypeLabels[offer.type] || "Документ"}</span>
          {quality.reviewedAt && <span className="market-badge">Проверено {formatReviewDate(quality.reviewedAt)}</span>}
        </div>
        <h1 className="market-heading market-product-title">{offer.title}</h1>
        <p className="market-lead market-product-description">{offer.description}</p>

        <div className="market-product-facts">
          <div><span>Формат</span><strong>{offer.formats?.join(" / ") || "Онлайн"}</strong></div>
          <div><span>Получите</span><strong>{offer.whatIncluded || "Готовый результат"}</strong></div>
          <div><span>Подходит</span><strong>{offer.suitableFor || "Для ситуации из описания"}</strong></div>
        </div>

        {quality.reviewLabel && <div className="market-trust-line">✓ {quality.reviewLabel}</div>}
        {isDemo && <div className="market-warning-line">Демонстрационная карточка. Купить её нельзя.</div>}
      </div>

      <aside className="market-buybox">
        <span className="market-buybox-label">Цена</span>
        <strong className="market-buybox-price">{formattedPrice}</strong>
        <div className="market-buybox-actions">{primaryAction}{inCart && <Link className="market-action" to="/market/cart">Перейти в корзину</Link>}<button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleFavorite(offer.id, "offer"))}>{favorite ? "♥ В избранном" : "♡ В избранное"}</button></div>
        <div className="market-buybox-note">После оформления товар или созданный документ будет доступен в вашем кабинете.</div>
      </aside>
    </section>

    {isDocument && <section className="market-preview market-glass market-product-preview">
      <div className="market-preview-paper"><span className="market-preview-watermark">ДокМаркет</span>{(offer.previewText || [offer.title, offer.description]).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}<div className="market-preview-fade" /></div>
      <div className="market-preview-copy"><span className="market-kicker">До покупки</span><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Посмотрите, что покупаете</h2><p className="market-lead">Фрагмент показывает структуру документа. Для онлайн-форм доступен тестовый просмотр.</p><div className="market-offer-actions">{primaryAction}{offer.type === "online_form" && cartEligible && <button className="market-action" type="button" onClick={toggleCurrentCart}>{inCart ? "Уже в корзине" : "Добавить полную версию"}</button>}</div></div>
    </section>}

    <section className="market-product-details">
      <article className="market-panel market-glass"><span className="market-kicker">Что внутри</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Что вы получите</h2><p className="market-copy">{offer.whatIncluded || offer.description}</p></article>
      <article className="market-panel market-glass"><span className="market-kicker">Как использовать</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Что делать дальше</h2><p className="market-copy">{offer.usage || "Откройте товар и следуйте инструкции."}</p></article>
      {offer.deliveryTime && <article className="market-panel market-glass"><span className="market-kicker">Срок</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Когда будет готово</h2><p className="market-copy">{offer.deliveryTime}</p></article>}
    </section>

    {warnings.length > 0 && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Важно</span><h2 className="market-heading" style={{fontSize:"1.3rem"}}>Перед использованием</h2>{warnings.map(text => <p className="market-copy" key={text} style={{margin:"8px 0"}}>• {text}</p>)}</section>}

    {specialist && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">Продавец</span><Link className="market-specialist-head" style={{ color: "inherit", textDecoration: "none" }} to={`/market/specialist/${specialist.id}`}><span className="market-specialist-avatar">{specialist.initials}</span><span><strong style={{display:"block",color:"#fff"}}>{specialist.name}</strong><small style={{color:"#94a3b8"}}>{specialist.profession}</small></span></Link><div className="market-offer-actions"><Link className="market-action" to={`/market/specialist/${specialist.id}`}>Открыть витрину продавца</Link></div></section>}

    {quality.nextStep && <section className="market-panel market-glass" style={{marginTop:16}}><span className="market-kicker">После покупки</span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Следующий шаг</h2><p className="market-copy">{quality.nextStep}</p></section>}

    {related.length > 0 && <section className="market-panel market-glass" style={{ marginTop: 16 }}><span className="market-kicker">Ещё по теме</span><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Может пригодиться</h2><div className="market-choice-grid">{related.map(item => <Link key={item.id} to={`/market/offer/${item.id}`} className="market-choice" style={{ textDecoration: "none", color: "inherit" }}><span className="market-badge">{offerTypeLabels[item.type]}</span><h3>{item.title}</h3><p>{item.description}</p><strong style={{ color: "#67e8f9" }}>{item.priceType === "free" ? "Бесплатно" : `${Number(item.price).toLocaleString("ru-RU")} ₽`} →</strong></Link>)}</div></section>}

    <section className="market-panel market-glass" style={{ marginTop: 16 }}><span className="market-kicker">Не нашли нужное?</span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Опишите задачу помощнику</h2><p className="market-lead">Он подберёт документ из каталога или предложит специалиста, когда подходящего товара нет.</p><div className="market-offer-actions"><Link className="market-primary" to="/#smart-find">Подобрать документ</Link><Link className="market-action" to="/market#specialists">Специалисты</Link></div></section>

    {notice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setNotice("")}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Пока недоступно</h2><p className="market-lead">{notice}</p><button className="market-primary" type="button" onClick={() => setNotice("")}>Понятно</button></section></div>}
  </MarketFrame>;
}
