import { Link } from "react-router-dom";
import docmarketIcon from "../../assets/docmarket-icon.png";

export function DocMarketBrand() {
  const content = <>
    <img className="docmarket-brand-icon" src={docmarketIcon} alt="" aria-hidden="true" />
    <span className="docmarket-brand-copy">
      <strong><span>Док</span><em>Маркет</em></strong>
      <small>Документы · сервисы · решения</small>
    </span>
  </>;
  return <Link className="docmarket-brand" to="/" aria-label="ДокМаркет — на главную">{content}</Link>;
}

export default function DocMarketHeader() {
  return <header className="docmarket-header">
    <div className="docmarket-header-inner">
      <DocMarketBrand />
      <nav className="docmarket-main-nav" aria-label="Навигация ДокМаркета">
        <Link to="/market#directions">Документы</Link>
        <Link to="/dosudebka">Сервисы</Link>
        <Link to="/market#specialists">Специалисты</Link>
        <Link to="/ForLawyers">Авторам</Link>
      </nav>
      <nav className="docmarket-actions" aria-label="Действия ДокМаркета">
        <Link to="/dosudebka" title="Досудебка"><i className="fa-solid fa-scale-balanced" /><span>Досудебка</span></Link>
        <Link to="/market/favorites" title="Избранное"><i className="fa-regular fa-heart" /><span>Избранное</span></Link>
        <Link to="/market/cart" title="Корзина"><i className="fa-solid fa-cart-shopping" /><span>Корзина</span></Link>
        <Link to="/Dashboard" title="Кабинет"><i className="fa-regular fa-user" /><span>Кабинет</span></Link>
      </nav>
    </div>
  </header>;
}
