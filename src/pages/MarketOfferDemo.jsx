import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { offers } from "@/data/marketplaceMock";
import { addToCart, isInCart } from "@/marketplace/services/cartService";
import { MarketFrame, MarketNavigation } from "./Market";

export default function MarketOfferDemo() {
  const { offerId } = useParams();
  const offer = useMemo(() => offers.find(item => item.id === offerId), [offerId]);
  const [name, setName] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState(null);
  const [, setRevision] = useState(0);

  if (!offer) return <MarketFrame><MarketNavigation crumbs={[{label:"ДокМаркет",to:"/"},{label:"Демо не найдено"}]} backTo="/market"/><div className="market-empty market-glass">Демо для этого решения не найдено.</div></MarketFrame>;

  function build(event) {
    event.preventDefault();
    setResult({ name:name.trim() || "Ваши данные", counterparty:counterparty.trim() || "Вторая сторона", situation:situation.trim() || offer.description });
  }

  function cart() { addToCart(offer); setRevision(value => value + 1); }

  return <MarketFrame>
    <MarketNavigation crumbs={[{label:"ДокМаркет",to:"/"},{label:offer.title,to:`/market/offer/${offer.id}`},{label:"Демо"}]} backTo={`/market/offer/${offer.id}`} />
    <section className="market-panel market-glass dm-demo-head"><span className="market-kicker"><i className="fa-solid fa-flask" />Демо без оплаты</span><h1 className="market-heading">Попробуйте, как работает онлайн-заполнение</h1><p className="market-lead">Демо ничего не покупает и не создаёт юридически готовый документ. Оно показывает сам принцип: вводите данные → получаете собранный черновик.</p></section>
    <div className="dm-demo-layout">
      <form className="market-panel market-glass dm-demo-form" onSubmit={build}>
        <label>Ваше имя<input value={name} onChange={e=>setName(e.target.value)} placeholder="Иван Иванов" /></label>
        <label>Кому или с кем связан документ<input value={counterparty} onChange={e=>setCounterparty(e.target.value)} placeholder="Компания, человек или организация" /></label>
        <label>Коротко опишите ситуацию<textarea value={situation} onChange={e=>setSituation(e.target.value)} rows={6} placeholder="Что произошло и какого результата вы хотите?" /></label>
        <button className="market-primary" type="submit">Собрать демо-черновик</button>
      </form>
      <section className="market-panel market-glass dm-demo-result">
        <span className="market-kicker">Результат</span>
        {!result ? <div className="market-empty"><p>Заполните три поля слева — здесь появится черновик.</p></div> : <div className="market-preview-paper"><span className="market-preview-watermark">ДЕМО</span><p><strong>{offer.title}</strong></p><p>От: {result.name}</p><p>Для: {result.counterparty}</p><p>{result.situation}</p><p>Далее платная версия использует полную структуру выбранного решения и формирует итоговый документ.</p></div>}
        <div className="market-offer-actions">{isInCart(offer.id) ? <Link className="market-action primary" to="/market/cart">Уже в корзине · перейти</Link> : <button className="market-action primary" type="button" onClick={cart}><i className="fa-solid fa-cart-shopping" />Добавить полную версию</button>}<Link className="market-action" to={`/market/offer/${offer.id}`}>Вернуться к карточке</Link></div>
      </section>
    </div>
  </MarketFrame>;
}
