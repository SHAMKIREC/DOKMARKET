import { useState } from "react";
import { Link } from "react-router-dom";
import { offers, specialists } from "@/data/marketplaceMock";
import { listFavorites, removeFavorite } from "@/marketplace/services/favoritesService";
import { MarketFrame, MarketNavigation, OffersGrid } from "./Market";

export default function MarketFavorites() {
  const [favorites, setFavorites] = useState(listFavorites);
  const favoriteOffers = favorites.filter(item => item.type === "offer").map(item => offers.find(offer => offer.id === item.id)).filter(Boolean);
  const favoriteSpecialists = favorites.filter(item => item.type === "specialist").map(item => specialists.find(specialist => specialist.id === item.id)).filter(Boolean);

  function remove(id, type) {
    setFavorites(removeFavorite(id, type));
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Избранное" }]} backTo="/market" />
    <h1 className="market-heading">Избранное</h1>
    <p className="market-lead">Сохранённые решения и специалисты ДокМаркета.</p>
    {!favoriteOffers.length && !favoriteSpecialists.length ? <section className="market-empty market-glass"><i className="fa-regular fa-heart" style={{ color: "#ddb66f", fontSize: "1.5rem" }} /><h2 style={{ color: "#fff" }}>В избранном пока пусто</h2><p>Сохраняйте документы, услуги и специалистов, чтобы вернуться к ним позже.</p><Link className="market-primary" to="/market">Перейти в каталог</Link></section> : <>
      {favoriteOffers.length > 0 && <section><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Решения</h2><OffersGrid items={favoriteOffers} onFavoritesChange={setFavorites} /></section>}
      {favoriteSpecialists.length > 0 && <section style={{ marginTop: 28 }}><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Специалисты</h2><div className="market-grid">{favoriteSpecialists.map(item => <article className="market-card market-glass" key={item.id}><span className="market-specialist-avatar">{item.initials}</span><h3 style={{ marginTop: 15 }}>{item.name}</h3><p>{item.profession}</p><div className="market-offer-actions"><Link className="market-action primary" to={`/market/specialist/${item.id}`}>Смотреть профиль</Link><button className="market-action active" type="button" onClick={() => remove(item.id, "specialist")}><i className="fa-solid fa-heart" />Удалить</button></div></article>)}</div></section>}
    </>}
  </MarketFrame>;
}
