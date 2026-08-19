import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { offers, offerTypeLabels } from "@/data/marketplaceMock";
import { listCart, removeFromCart } from "@/marketplace/services/cartService";
import { MarketFrame, MarketNavigation } from "./Market";

export default function MarketCart() {
  const [cart, setCart] = useState(listCart);
  const [checkoutNotice, setCheckoutNotice] = useState(false);
  const items = useMemo(() => cart.map(entry => offers.find(offer => offer.id === entry.offerId)).filter(Boolean), [cart]);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  function remove(offerId) {
    setCart(removeFromCart(offerId));
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Корзина" }]} backTo="/market" />
    <h1 className="market-heading">Корзина</h1>
    <p className="market-lead">Материалы, которые вы выбрали для оформления.</p>
    {!items.length ? <section className="market-empty market-glass"><i className="fa-solid fa-cart-shopping" style={{ color: "#ddb66f", fontSize: "1.5rem" }} /><h2 style={{ color: "#fff" }}>Корзина пуста</h2><p>Добавьте готовый файл, онлайн-форму, инструкцию или пакет документов.</p><Link className="market-primary" to="/market">Перейти в каталог</Link></section>
      : <><div className="market-grid">{items.map(item => <article className="market-card market-glass" key={item.id}><span className="market-offer-type">{offerTypeLabels[item.type]}</span><h2>{item.title}</h2><span className="market-offer-provider"><i className="fa-solid fa-user-check" />{item.providerName}</span><div className="market-offer-meta">{item.formats?.map(format => <span key={format}>{format}</span>)}</div><strong className="market-price">{Number(item.price).toLocaleString("ru-RU")} ₽</strong><div className="market-offer-actions"><Link className="market-action primary" to={`/market/offer/${item.id}`}>Открыть карточку</Link><button className="market-action" type="button" onClick={() => remove(item.id)}>Удалить</button></div></article>)}</div>
      <section className="market-panel market-glass" style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}><div><span style={{ color: "#94a3b8", fontSize: ".72rem" }}>Итого</span><h2 className="market-heading" style={{ marginTop: 5 }}>{total.toLocaleString("ru-RU")} ₽</h2></div><button className="market-primary" type="button" onClick={() => setCheckoutNotice(true)}>Перейти к оформлению</button></section></>}
    {checkoutNotice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setCheckoutNotice(false)}><section className="market-panel market-glass" style={{ maxWidth: 470 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-credit-card" /></span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Демонстрационный сценарий</h2><p className="market-lead">Оплата будет подключена позже. Сейчас это демонстрационный сценарий MVP.</p><button className="market-primary" type="button" onClick={() => setCheckoutNotice(false)}>Понятно</button></section></div>}
  </MarketFrame>;
}
