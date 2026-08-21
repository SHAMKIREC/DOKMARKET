import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

export default function Layout({ children, currentPageName }) {
  const { pathname } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const alreadyHasMarketFrame = lowerPath.startsWith("/market") || pathname === "/" || lowerPath === "/reviews";
  const isDosudebkaArea = ["/dosudebka", "/generator", "/guide", "/pricing"].some(prefix => lowerPath.startsWith(prefix)) || ["Home","Dosudebka","Generator","Guide","Pricing"].includes(currentPageName);

  return <div className={`app-shell dm-app-shell${isDosudebkaArea ? " dm-dosudebka-area" : ""}`}>
    {!alreadyHasMarketFrame && <DocMarketHeader />}
    {isDosudebkaArea && !alreadyHasMarketFrame && <nav className="dm-service-nav" aria-label="Сервис Досудебка">
      <div className="dm-service-nav-inner">
        <Link className="dm-service-home" to="/dosudebka"><i className="fa-solid fa-gavel" /><span><strong>Досудебка</strong><small>сервис ДокМаркета</small></span></Link>
        <div className="dm-service-links">
          <Link className={currentPageName === "Generator" ? "active" : ""} to={createPageUrl("Generator")}>Создать претензию</Link>
          <Link className={currentPageName === "Guide" ? "active" : ""} to={createPageUrl("Guide")}>Как работает</Link>
          <Link className={currentPageName === "Pricing" ? "active" : ""} to={createPageUrl("Pricing")}>Стоимость</Link>
          <Link to="/reviews">Отзывы</Link>
          <Link to="/market">Вернуться в каталог</Link>
        </div>
      </div>
    </nav>}
    <main>{children}</main>
  </div>;
}
