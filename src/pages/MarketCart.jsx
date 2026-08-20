import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { offers, offerTypeLabels } from "@/data/marketplaceMock";
import { listCart, removeFromCart } from "@/marketplace/services/cartService";
import { getPlatformService, serviceToCartOffer } from "@/services/platformServices";
import { MarketFrame, MarketNavigation } from "./Market";

const typeLabel = type => offerTypeLabels[type] || ({ platform_generator: "Умный сервис", service: "Услуга специалиста" }[type]) || "Решение";

function resolveCartItem(entry) {
  const catalogOffer = offers.find(offer => offer.id === entry.offerId);
  if (catalogOffer) return { ...catalogOffer, ...entry };
  if (entry.serviceId) {
    const service = getPlatformService(entry.serviceId);
    const serviceOffer = serviceToCartOffer(service);
    if (serviceOffer) return { ...serviceOffer, ...entry };
  }
  return entry?.title ? entry : null;
}

function itemRoute(item) {
  if (item.actionUrl) return item.actionUrl;
  if (item.type === "service" && item.specialistId) return `/market/specialist/${item.specialistId}`;
  if (offers.some(offer => offer.id === item.offerId || offer.id === item.id)) return `/market/offer/${item.offerId || item.id}`;
  return "/market";
}

export default function MarketCart() {
  const [cart, setCart] = useState(listCart);
  const [checkoutNotice, setCheckoutNotice] = useState(false);
  const items = useMemo(() => cart.map(resolveCartItem).filter(Boolean), [cart]);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  function remove(offerId) {
    setCart(removeFromCart(offerId));
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/" }, { label: "Корзина" }]} backTo="/" />
    <h1 className="market-heading">Единая корзина ДокМаркет</h1>
    <p className="market-lead">Здесь собираются готовые документы, онлайн-формы, умные сервисы и услуги специалистов.</p>
    {!items.length ? <section className="market-empty market-glass"><i className="fa-solid fa-cart-shopping" style={{ color: "#67e8f9", fontSize: "1.5rem" }} /><h2 style={{ color: "#fff" }}>Корзина пуста</h2><p>Добавьте документ, умный сервис или услугу специалиста.</p><div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}><Link className="market-primary" to="/#services">Умные сервисы</Link><Link className="market-action" to="/market">Каталог документов</Link></div></section>
      : <><div className="market-grid">{items.map(item => { const key = item.offerId || item.id; return <article className="market-card market-glass" key={key}><span className="market-offer-type">{typeLabel(item.type)}</span><h2>{item.title}</h2><span className="market-offer-provider"><i className={`fa-solid ${item.providerType === "platform" || item.serviceId ? "fa-cubes" : "fa-user-check"}`} />{item.providerName || "ДокМаркет"}</span>{item.description && <p>{item.description}</p>}<div className="market-offer-meta">{item.formats?.map(format => <span key={format}>{format}</span>)}{item.priceType === "from" && <span>Цена от</span>}</div><strong className="market-price">{item.priceType === "from" ? "от " : ""}{Number(item.price).toLocaleString("ru-RU")} ₽</strong><div className="market-offer-actions"><Link className="market-action primary" to={itemRoute(item)}>{item.type === "platform_generator" ? "Запустить сервис" : "Открыть"}</Link><button className="market-action" type="button" onClick={() => remove(key)}>Удалить</button></div></article>; })}</div>
      <section className="market-panel market-glass" style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}><div><span style={{ color: "#94a3b8", fontSize: ".72rem" }}>Итого по текущей корзине</span><h2 className="market-heading" style={{ marginTop: 5 }}>{total.toLocaleString("ru-RU")} ₽</h2><small style={{color:"#64748b"}}>Для позиций «от» итоговая сумма уточняется по параметрам заказа.</small></div><button className="market-primary" type="button" onClick={() => setCheckoutNotice(true)}>Перейти к оформлению</button></section></>}
    {checkoutNotice && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => setCheckoutNotice(false)}><section className="market-panel market-glass" style={{ maxWidth: 500 }} onMouseDown={event => event.stopPropagation()}><span className="market-icon"><i className="fa-solid fa-credit-card" /></span><h2 className="market-heading" style={{ fontSize: "1.35rem" }}>Корзина уже единая</h2><p className="market-lead">Оплатный контур ЮKassa подготовлен отдельно, но пока не активирован. Поэтому оформление сейчас не списывает деньги. После подключения ЮKassa эта корзина станет общей точкой оплаты ДокМаркета.</p><button className="market-primary" type="button" onClick={() => setCheckoutNotice(false)}>Понятно</button></section></div>}
  </MarketFrame>;
}
