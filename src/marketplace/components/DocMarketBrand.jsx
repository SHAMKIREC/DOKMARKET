import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import docmarketIcon from "../../assets/docmarket-icon.png";

export function DocMarketBrand() {
  return <Link className="docmarket-brand" to="/" aria-label="ДокМаркет — на главную">
    <img className="docmarket-brand-icon" src={docmarketIcon} alt="" aria-hidden="true" />
    <span className="docmarket-brand-copy"><strong><span>Док</span><em>Маркет</em></strong><small>Документы · услуги · специалисты</small></span>
  </Link>;
}

function ActionIcon({ children }) {
  return <b aria-hidden="true" style={{ fontSize:"1rem", lineHeight:1, fontFamily:"system-ui,sans-serif", fontWeight:800 }}>{children}</b>;
}

export default function DocMarketHeader() {
  const { user } = useAuth();
  return <header className="docmarket-header"><div className="docmarket-header-inner">
    <DocMarketBrand />
    <nav className="docmarket-main-nav" aria-label="Навигация ДокМаркета">
      <Link to="/market#directions">Документы</Link>
      <Link to="/market#specialists">Специалисты</Link>
      <Link to="/reviews">Отзывы</Link>
      <Link to="/ForLawyers">Продавцам</Link>
    </nav>
    <nav className="docmarket-actions" aria-label="Действия ДокМаркета">
      <Link to="/market/favorites" title="Избранное" aria-label="Избранное"><ActionIcon>♡</ActionIcon><span>Избранное</span></Link>
      <Link to="/market/cart" title="Корзина" aria-label="Корзина"><ActionIcon>▣</ActionIcon><span>Корзина</span></Link>
      <Link to={user ? "/Dashboard" : "/Login"} title={user ? "Кабинет ДокМаркета" : "Войти в ДокМаркет"} aria-label={user ? "Кабинет" : "Войти"}><ActionIcon>○</ActionIcon><span>{user ? "Кабинет" : "Войти"}</span></Link>
    </nav>
  </div></header>;
}
