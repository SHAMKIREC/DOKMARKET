import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { offers, offerTypeLabels } from "@/data/marketplaceMock";
import { listCart, removeFromCart } from "@/marketplace/services/cartService";
import { createDraftOrder } from "@/marketplace/services/orderService";
import { getPlatformService, serviceToCartOffer } from "@/services/platformServices";
import { useAuth } from "@/lib/AuthContext";
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
  const { user } = useAuth();
  const [cart, setCart] = useState(listCart);
  const [checkout, setCheckout] = useState({ open:false, loading:false, order:null, error:"" });
  const items = useMemo(() => cart.map(resolveCartItem).filter(Boolean), [cart]);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  function remove(offerId) { setCart(removeFromCart(offerId)); }

  async function prepareOrder() {
    if (!user?.id) { setCheckout({ open:true, loading:false, order:null, error:"AUTH" }); return; }
    setCheckout({ open:true, loading:true, order:null, error:"" });
    try {
      const order = await createDraftOrder(user.id, items);
      setCheckout({ open:true, loading:false, order, error:"" });
    } catch (error) {
      console.error("Order create failed", error);
      setCheckout({ open:true, loading:false, order:null, error:"Не удалось создать заказ. Обновите страницу и попробуйте ещё раз." });
    }
  }

  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/" }, { label: "Корзина" }]} backTo="/" />
    <h1 className="market-heading">Корзина</h1>
    <p className="market-lead">Готовые документы, умные сервисы и услуги — в одном заказе.</p>
    {!items.length ? <section className="market-empty market-glass"><i className="fa-solid fa-cart-shopping" style={{ color: "#67e8f9", fontSize: "1.5rem" }} /><h2 style={{ color: "#fff" }}>Корзина пуста</h2><p>Добавьте документ, умный сервис или услугу специалиста.</p><div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}><Link className="market-primary" to="/#services">Умные сервисы</Link><Link className="market-action" to="/market">Каталог документов</Link></div></section>
      : <><div className="market-grid">{items.map(item => { const key = item.offerId || item.id; return <article className="market-card market-glass" key={key}><span className="market-offer-type">{typeLabel(item.type)}</span><h2>{item.title}</h2><span className="market-offer-provider"><i className={`fa-solid ${item.providerType === "platform" || item.serviceId ? "fa-cubes" : "fa-user-check"}`} />{item.providerName || "ДокМаркет"}</span>{item.description && <p>{item.description}</p>}<div className="market-offer-meta">{item.formats?.map(format => <span key={format}>{format}</span>)}{item.priceType === "from" && <span>Цена от</span>}</div><strong className="market-price">{item.priceType === "from" ? "от " : ""}{Number(item.price).toLocaleString("ru-RU")} ₽</strong><div className="market-offer-actions"><Link className="market-action primary" to={itemRoute(item)}>{item.type === "platform_generator" ? "Запустить сервис" : "Открыть"}</Link><button className="market-action" type="button" onClick={() => remove(key)}>Удалить</button></div></article>; })}</div>
      <section className="market-panel market-glass" style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}><div><span style={{ color: "#94a3b8", fontSize: ".72rem" }}>Итого</span><h2 className="market-heading" style={{ marginTop: 5 }}>{total.toLocaleString("ru-RU")} ₽</h2><small style={{color:"#64748b"}}>Для услуг с ценой «от» итог уточняется после параметров заказа.</small></div><button className="market-primary" type="button" disabled={checkout.loading} onClick={prepareOrder}>{checkout.loading ? "Создаём заказ…" : "Оформить заказ"}</button></section></>}

    {checkout.open && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.78)", backdropFilter: "blur(7px)" }} onMouseDown={() => !checkout.loading && setCheckout(state => ({...state,open:false}))}><section className="market-panel market-glass" style={{ maxWidth: 520, width:"100%" }} onMouseDown={event => event.stopPropagation()}>
      {checkout.loading ? <><span className="market-icon"><i className="fa-solid fa-spinner fa-spin" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Создаём заказ</h2><p className="market-lead">Сохраняем состав корзины в вашем аккаунте.</p></>
      : checkout.error === "AUTH" ? <><span className="market-icon"><i className="fa-solid fa-user-lock" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Сначала войдите</h2><p className="market-lead">Чтобы заказ не потерялся и был доступен с другого устройства, оформление доступно после входа.</p><div className="market-offer-actions"><Link className="market-primary" to="/Login">Войти</Link><Link className="market-action" to="/Register">Создать аккаунт</Link></div></>
      : checkout.error ? <><span className="market-icon"><i className="fa-solid fa-triangle-exclamation" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Заказ не создан</h2><p className="market-lead">{checkout.error}</p><button className="market-primary" type="button" onClick={prepareOrder}>Попробовать ещё раз</button></>
      : <><span className="market-icon"><i className="fa-solid fa-circle-check" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Заказ сохранён</h2><p className="market-lead">Заказ №{checkout.order?.id?.slice(0,8)?.toUpperCase()} создан в вашем аккаунте. Состав и сумма уже зафиксированы.</p><div className="market-choice" style={{margin:"14px 0"}}><span style={{color:"#64748b",fontSize:".7rem"}}>К оплате</span><h3 style={{margin:"6px 0 0"}}>{total.toLocaleString("ru-RU")} ₽</h3></div><p className="market-note"><i className="fa-solid fa-credit-card" />Платёжный шаг временно отключён по плану запуска. Когда подключим ЮKassa, здесь появится кнопка оплаты этого же заказа — архитектуру переделывать не придётся.</p><div className="market-offer-actions"><Link className="market-primary" to="/Dashboard">В кабинет</Link><button className="market-action" type="button" onClick={() => setCheckout(state => ({...state,open:false}))}>Закрыть</button></div></>}
    </section></div>}
  </MarketFrame>;
}
