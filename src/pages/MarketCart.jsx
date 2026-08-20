import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { offers, offerTypeLabels } from "@/data/marketplaceMock";
import { listCart, removeFromCart } from "@/marketplace/services/cartService";
import { createDraftOrder } from "@/marketplace/services/orderService";
import { getPlatformService, serviceToCartOffer } from "@/services/platformServices";
import { useAuth } from "@/lib/AuthContext";
import { MarketFrame, MarketNavigation } from "./Market";

const typeLabel = type => offerTypeLabels[type] || ({ platform_generator: "Умный сервис", service: "Услуга специалиста" }[type]) || "Документ";

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
    <style>{`
      .dm-cart-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:18px}.dm-cart-head .market-lead{margin:0}.dm-cart-empty{padding:24px!important;text-align:left!important}.dm-cart-empty-top{display:flex;gap:13px;align-items:flex-start}.dm-cart-empty-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,rgba(8,145,178,.16),rgba(124,58,237,.16));color:#67e8f9;border:1px solid rgba(103,232,249,.17)}.dm-cart-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.dm-cart-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.dm-cart-trust div{padding:12px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);color:#94a3b8;font-size:.72rem;line-height:1.45}.dm-cart-trust strong{display:block;color:#e2e8f0;font-size:.76rem;margin-bottom:3px}.dm-order-flow{margin-top:16px;padding:14px;border-radius:14px;background:rgba(34,211,238,.045);border:1px solid rgba(103,232,249,.12);color:#94a3b8;font-size:.75rem;line-height:1.5}.dm-order-flow strong{color:#dbeafe}.dm-cart-summary{margin-top:18px!important}.dm-cart-summary .market-primary{min-width:170px}@media(max-width:640px){.dm-cart-head{align-items:flex-start;flex-direction:column}.dm-cart-empty{padding:18px!important}.dm-cart-trust{grid-template-columns:1fr}.dm-cart-actions>*{flex:1 1 100%}.dm-cart-summary{padding:17px!important}.dm-cart-summary .market-primary{width:100%}}
    `}</style>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/" }, { label: "Корзина" }]} backTo="/" />

    <div className="dm-cart-head"><div><h1 className="market-heading">Корзина</h1><p className="market-lead">Документы и услуги специалистов в одном заказе.</p></div>{items.length > 0 && <Link className="market-action" to="/market">Продолжить покупки</Link>}</div>

    {!items.length ? <section className="market-empty market-glass dm-cart-empty">
      <div className="dm-cart-empty-top"><span className="dm-cart-empty-icon"><i className="fa-solid fa-bag-shopping" /></span><div><h2 style={{ color: "#fff", margin:"0 0 6px" }}>Корзина пока пустая</h2><p style={{margin:0}}>Начните с документа. Если понадобится помощь человека, рядом будут услуги специалистов.</p></div></div>
      <div className="dm-cart-actions"><Link className="market-primary" to="/market"><i className="fa-solid fa-file-lines" />Найти документ</Link><Link className="market-action" to="/market#specialists"><i className="fa-solid fa-user-check" />Услуги специалистов</Link></div>
      <div className="dm-cart-trust"><div><strong>Документы</strong>Покупка и доступ к файлам через кабинет.</div><div><strong>Услуги</strong>Заказ, результат и статус работы остаются внутри ДокМаркета.</div><div><strong>Оплата</strong>Платёжный модуль подключим отдельно; сейчас деньги не списываются.</div></div>
    </section> : <>
      <div className="market-grid">{items.map(item => { const key = item.offerId || item.id; return <article className="market-card market-glass" key={key}>
        <span className="market-offer-type">{typeLabel(item.type)}</span><h2>{item.title}</h2><span className="market-offer-provider"><i className={`fa-solid ${item.providerType === "platform" || item.serviceId ? "fa-cubes" : "fa-user-check"}`} />{item.providerName || "ДокМаркет"}</span>{item.description && <p>{item.description}</p>}
        <div className="market-offer-meta">{item.formats?.map(format => <span key={format}>{format}</span>)}{item.priceType === "from" && <span>Цена от</span>}</div><strong className="market-price">{item.priceType === "from" ? "от " : ""}{Number(item.price).toLocaleString("ru-RU")} ₽</strong>
        <div className="market-offer-actions"><Link className="market-action primary" to={itemRoute(item)}>Открыть карточку</Link><button className="market-action" type="button" onClick={() => remove(key)}>Удалить</button></div>
      </article>; })}</div>

      <section className="market-panel market-glass dm-cart-summary" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap" }}><div><span style={{color:"#94a3b8",fontSize:".72rem"}}>Итого</span><h2 className="market-heading" style={{marginTop:5}}>{total.toLocaleString("ru-RU")} ₽</h2><small style={{color:"#64748b"}}>Для услуг с ценой «от» итог уточняется после параметров заказа.</small></div><button className="market-primary" type="button" disabled={checkout.loading} onClick={prepareOrder}>{checkout.loading ? "Создаём заказ…" : "Оформить заказ"}</button></section>
      <div className="dm-order-flow"><strong>Для услуг специалистов:</strong> заказ и результат фиксируются внутри ДокМаркета. Механику оплаты и выплаты исполнителю подключим вместе с платёжным модулем; до этого интерфейс не обещает удержание денег платформой.</div>
    </>}

    {checkout.open && <div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:80,display:"grid",placeItems:"center",padding:16,background:"rgba(2,6,23,.78)",backdropFilter:"blur(7px)"}} onMouseDown={() => !checkout.loading && setCheckout(state => ({...state,open:false}))}><section className="market-panel market-glass" style={{maxWidth:520,width:"100%"}} onMouseDown={event => event.stopPropagation()}>
      {checkout.loading ? <><span className="market-icon"><i className="fa-solid fa-spinner fa-spin" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Создаём заказ</h2><p className="market-lead">Сохраняем состав корзины в вашем аккаунте.</p></>
      : checkout.error === "AUTH" ? <><span className="market-icon"><i className="fa-solid fa-user-lock" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Сначала войдите</h2><p className="market-lead">Так заказ сохранится в кабинете и будет доступен с другого устройства.</p><div className="market-offer-actions"><Link className="market-primary" to="/Login">Войти</Link><Link className="market-action" to="/Register">Создать аккаунт</Link></div></>
      : checkout.error ? <><span className="market-icon"><i className="fa-solid fa-triangle-exclamation" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Заказ не создан</h2><p className="market-lead">{checkout.error}</p><button className="market-primary" type="button" onClick={prepareOrder}>Попробовать ещё раз</button></>
      : <><span className="market-icon"><i className="fa-solid fa-circle-check" /></span><h2 className="market-heading" style={{fontSize:"1.35rem"}}>Заказ сохранён</h2><p className="market-lead">Заказ №{checkout.order?.id?.slice(0,8)?.toUpperCase()} появился в вашем аккаунте. Состав и сумма зафиксированы.</p><div className="market-choice" style={{margin:"14px 0"}}><span style={{color:"#64748b",fontSize:".7rem"}}>Сумма заказа</span><h3 style={{margin:"6px 0 0"}}>{total.toLocaleString("ru-RU")} ₽</h3></div><p className="market-note"><i className="fa-solid fa-credit-card" />Оплата сейчас отключена. Когда подключим платёжный модуль, этот же заказ можно будет оплатить без переделки корзины.</p><div className="market-offer-actions"><Link className="market-primary" to="/Dashboard">Открыть заказ</Link><button className="market-action" type="button" onClick={() => setCheckout(state => ({...state,open:false}))}>Закрыть</button></div></>}
    </section></div>}
  </MarketFrame>;
}
