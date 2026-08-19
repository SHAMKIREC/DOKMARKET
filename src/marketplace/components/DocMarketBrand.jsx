import { Link } from "react-router-dom";
import docmarketIcon from "../../assets/docmarket-icon.png";

export function DocMarketBrand() {
  const content = <>
    <img className="docmarket-brand-icon" src={docmarketIcon} alt="" aria-hidden="true" />
    <span className="docmarket-brand-copy">
      <strong><span>Док</span><em>Маркет</em></strong>
      <small>Маркетплейс документов</small>
    </span>
  </>;
  return <Link className="docmarket-brand" to="/market" aria-label="ДокМаркет — каталог">{content}</Link>;
}

export default function DocMarketHeader() {
  return <header className="docmarket-header">
    <div className="docmarket-header-inner">
      <DocMarketBrand />
      <nav className="docmarket-main-nav" aria-label="Навигация ДокМаркета">
        <Link to="/market#directions">Каталог</Link>
        <Link to="/market#specialists">Специалисты</Link>
        <Link to="/market/legal/pretenzii/labor/salary-not-paid/offers">Готовые документы</Link>
        <Link to="/market/legal/pretenzii/labor/salary-not-paid/offers">Услуги</Link>
      </nav>
      <nav className="docmarket-actions" aria-label="Действия ДокМаркета">
        <Link to="/market/favorites" title="Избранное"><i className="fa-regular fa-heart" /><span>Избранное</span></Link>
        <Link to="/market/cart" title="Корзина"><i className="fa-solid fa-cart-shopping" /><span>Корзина</span></Link>
        <Link to="/Dashboard" title="Кабинет"><i className="fa-regular fa-user" /><span>Кабинет</span></Link>
      </nav>
    </div>
  </header>;
}
