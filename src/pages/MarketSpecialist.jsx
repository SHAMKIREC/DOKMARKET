import { useState } from "react";
import { useParams } from "react-router-dom";
import { offers, specialists } from "@/data/marketplaceMock";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
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
  const [requestOpen, setRequestOpen] = useState(false);
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
        <div><span>Рейтинг</span><strong><i className="fa-solid fa-star" style={{ color: "#fbbf24" }} /> {specialist.rating}</strong></div>
        <div><span>Отзывы</span><strong>{specialist.reviewsCount}</strong></div>
        <div><span>Цены</span><strong>от {Number(specialist.priceFrom || 0).toLocaleString("ru-RU")} ₽</strong></div>
      </div>
      <div className="market-offer-actions">
        <button className="market-action primary" type="button" onClick={() => setRequestOpen(true)}>Обратиться</button>
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={toggleSpecialistFavorite}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "В избранном" : "В избранное"}</button>
      </div>
    </section>

    <nav className="market-tabs" aria-label="Разделы профиля">{TABS.map(([id, label]) => <button className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id)} key={id}>{label}</button>)}</nav>

    {activeTab === "solutions" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Решения специалиста</h2><p className="market-lead">Готовые файлы, онлайн-формы, инструкции и пакеты документов.</p>{solutionOffers.length ? <OffersGrid items={solutionOffers} /> : <div className="market-empty market-glass">Опубликованных решений пока нет.</div>}</section>}

    {activeTab === "services" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Услуги специалиста</h2><p className="market-lead">Индивидуальная помощь по трудовым и связанным с ними вопросам.</p>
      <div className="market-grid">{(specialist.services || []).map(service => <article className="market-card market-glass" key={service.id}><span className="market-offer-type">Услуга специалиста</span><h3>{service.title}</h3><div className="market-offer-meta"><span>от {Number(service.price).toLocaleString("ru-RU")} ₽</span><span><i className="fa-regular fa-clock" /> {service.deliveryTime}</span></div><button className="market-action primary" type="button" onClick={() => setRequestOpen(true)}>Обратиться</button></article>)}</div>
      {serviceOffers.length > 0 && <div style={{ marginTop: 20 }}><OffersGrid items={serviceOffers} /></div>}
    </section>}

    {activeTab === "reviews" && <section><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>Отзывы</h2><div className="market-grid">{(specialist.reviews || []).map(review => <article className="market-card market-glass" key={review.id}><span style={{ color: "#fbbf24" }}>{Array.from({ length: review.rating }, (_, index) => <i className="fa-solid fa-star" key={index} />)}</span><h3>{review.name}</h3><p>{review.text}</p></article>)}</div>{!specialist.reviews?.length && <div className="market-empty market-glass">Отзывы появятся после запуска пользовательских обращений.</div>}</section>}

    {activeTab === "about" && <section className="market-panel market-glass"><h2 className="market-heading" style={{ fontSize: "1.55rem" }}>О специалисте</h2><p className="market-copy">{specialist.bio}</p><div className="market-choice-grid"><div className="market-choice"><h3>Специализация</h3><p>{specialist.specializations.join(", ")}</p></div><div className="market-choice"><h3>Проверка</h3><p>Профиль и профессиональная специализация проверены ДокМаркетом.</p></div></div></section>}

    {requestOpen && <div role="dialog" aria-modal="true" aria-labelledby="market-request-title" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setRequestOpen(false)}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-paper-plane" /></span><h2 id="market-request-title" className="market-heading" style={{ fontSize: "1.4rem" }}>Обращение к специалисту</h2><p className="market-lead">Заявки специалисту будут подключены следующим этапом.</p><button className="market-primary" type="button" onClick={() => setRequestOpen(false)}>Понятно</button></section></div>}
  </MarketFrame>;
}
