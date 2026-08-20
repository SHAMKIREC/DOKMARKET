import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers, specialists } from "@/data/marketplaceMock";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import { isInCart, toggleCart } from "@/marketplace/services/cartService";
import { MarketFrame, MarketNavigation, OffersGrid } from "./Market";

const TABS = [
  ["solutions", "Решения"],
  ["services", "Услуги"],
  ["reviews", "Отзывы"],
  ["about", "О специалисте"],
];

export default function MarketSpecialist() {
  const { specialistId } = useParams();
  const [activeTab, setActiveTab] = useState("solutions");
  const [, setRevision] = useState(0);
  const specialist = specialists.find(item => item.id === specialistId);

  if (!specialist) return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Специалист не найден" }]} backTo="/market" />
    <div className="market-empty market-glass"><h1 className="market-heading">Специалист не найден</h1></div>
  </MarketFrame>;

  const solutionOffers = specialist.documentOfferIds.map(id => offers.find(offer => offer.id === id)).filter(offer => offer && ["ready_file", "online_form", "guide", "bundle"].includes(offer.type));
  const serviceOffers = specialist.serviceOfferIds.map(id => offers.find(offer => offer.id === id)).filter(Boolean);
  const favorite = isFavorite(specialist.id, "specialist");

  function toggleSpecialistFavorite() {
    toggleFavorite(specialist.id, "specialist");
    setRevision(value => value + 1);
  }

  function serviceCartOffer(service) {
    return {
      id: `specialist-${specialist.id}-${service.id}`,
      type: "service",
      providerType: "specialist",
      providerName: specialist.name,
      specialistId: specialist.id,
      title: service.title,
      description: `${specialist.profession}. ${service.deliveryTime || "Срок уточняется"}.`,
      price: Number(service.price || 0),
      priceType: "from",
      formats: ["Услуга специалиста"],
      actionUrl: `/market/specialist/${specialist.id}`,
    };
  }

  function toggleService(service) {
    toggleCart(serviceCartOffer(service));
    setRevision(value => value + 1);
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Специалисты" }, { label: specialist.name }]} backTo="/market" />
    <section className="market-panel market-glass">
      <div className="market-profile-head">
        <div className="market-profile-avatar" aria-label={`Аватар специалиста: ${specialist.name}`}>{specialist.initials}</div>
        <div className="market-profile-copy">
          <span className="market-badge" style={{ color: "#a7f3d0", borderColor: "rgba(52,211,153,.2)", background: "rgba(16,185,129,.08)" }}><i className="fa-solid fa-shield-halved" />Проверен ДокМаркетом</span>
          <h1 className="market-heading">{specialist.name}</h1>
          <p className="market-subtitle" style={{ margin: 0 }}>{specialist.profession}</p>
          <p className="market-copy">{specialist.bio}</p>
          <div className="market-examples">{specialist.specializations.map(item => <span className="market-example" key={item}>{item}</span>)}</div>
        </div>
      </div>

      <div className="market-profile-stats">
        <div><span>Опыт</span><strong>{specialist.experience}</strong></div>
        <div><span>Рейтинг</span><strong><i className="fa-solid fa-star market-rating-star" /> {specialist.rating}</strong></div>
        <div><span>Отзывы</span><strong>{specialist.reviewsCount}</strong></div>
        <div><span>Цены</span><strong>от {Number(specialist.priceFrom || 0).toLocaleString("ru-RU")} ₽</strong></div>
      </div>
      <div className="market-offer-actions">
        <button className="market-action primary" type="button" onClick={() => setActiveTab("services")}><i className="fa-solid fa-briefcase" />Выбрать услугу</button>
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={toggleSpecialistFavorite}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "Убрать из избранного" : "В избранное"}</button>
      </div>
    </section>

    <nav className="market-tabs" aria-label="Разделы профиля">{TABS.map(([id, label]) => <button className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id)} key={id}>{label}</button>)}</nav>

    {activeTab === "solutions" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Решения специалиста</h2><p className="market-lead">Готовые файлы, онлайн-формы, инструкции и пакеты документов.</p>{solutionOffers.length ? <OffersGrid items={solutionOffers} /> : <div className="market-empty market-glass">Опубликованных решений пока нет.</div>}</section>}

    {activeTab === "services" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Услуги специалиста</h2><p className="market-lead">Выберите услугу — она попадёт в общую корзину ДокМаркета вместе с документами и умными сервисами.</p>
      <div className="market-grid">{(specialist.services || []).map(service => { const cartOffer = serviceCartOffer(service); const inCart = isInCart(cartOffer.id); return <article className="market-card market-glass" key={service.id}><span className="market-offer-type">Услуга специалиста</span><h3>{service.title}</h3><div className="market-offer-meta"><span>от {Number(service.price).toLocaleString("ru-RU")} ₽</span><span><i className="fa-regular fa-clock" /> {service.deliveryTime}</span></div><div className="market-offer-actions"><button className={`market-action primary ${inCart ? "active" : ""}`} type="button" onClick={() => toggleService(service)}><i className="fa-solid fa-cart-shopping" />{inCart ? "Убрать из корзины" : "Добавить в корзину"}</button>{inCart && <Link className="market-action" to="/market/cart">Открыть корзину</Link>}</div></article>; })}</div>
      {serviceOffers.length > 0 && <div style={{ marginTop: 20 }}><OffersGrid items={serviceOffers} /></div>}
    </section>}

    {activeTab === "reviews" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Отзывы</h2><div className="market-grid">{(specialist.reviews || []).map(review => <article className="market-card market-glass" key={review.id}><span className="market-rating">{Array.from({ length: review.rating }, (_, index) => <i className="fa-solid fa-star" key={index} />)}</span><h3>{review.name}</h3><p>{review.text}</p></article>)}</div>{!specialist.reviews?.length && <div className="market-empty market-glass">Отзывы появятся после запуска пользовательских обращений.</div>}</section>}

    {activeTab === "about" && <section className="market-panel market-glass"><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>О специалисте</h2><p className="market-copy">{specialist.bio}</p><div className="market-choice-grid"><div className="market-choice"><h3>Специализация</h3><p>{specialist.specializations.join(", ")}</p></div><div className="market-choice"><h3>Проверка</h3><p>Профиль и профессиональная специализация проверены ДокМаркетом.</p></div></div></section>}
  </MarketFrame>;
}