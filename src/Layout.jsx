import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isLawyer = user?.role === "lawyer";
  const lowerPath = pathname.toLowerCase();
  const alreadyHasMarketFrame = lowerPath.startsWith("/market") || pathname === "/" || lowerPath === "/reviews";
  const isDosudebkaArea = ["/dosudebka", "/generator", "/guide", "/pricing"].some(prefix => lowerPath.startsWith(prefix)) || ["Home","Dosudebka","Generator","Guide","Pricing"].includes(currentPageName);

  return <div className={`app-shell dm-app-shell${isDosudebkaArea ? " dm-dosudebka-area" : ""}`}>
    {!alreadyHasMarketFrame && <DocMarketHeader />}
    {isDosudebkaArea && !alreadyHasMarketFrame && <nav className="dm-service-nav" aria-label="Раздел Досудебка">
      <div className="dm-service-nav-inner">
        <Link className="dm-service-home" to="/dosudebka"><i className="fa-solid fa-gavel" /><span><strong>Досудебка</strong><small>сервис ДокМаркета</small></span></Link>
        <div className="dm-service-links">
          <Link className={currentPageName === "Generator" ? "active" : ""} to={createPageUrl("Generator")}>Создать</Link>
          <Link className={currentPageName === "Guide" ? "active" : ""} to={createPageUrl("Guide")}>Как работает</Link>
          <Link className={currentPageName === "Pricing" ? "active" : ""} to={createPageUrl("Pricing")}>Тарифы</Link>
          <Link to="/reviews">Отзывы</Link>
          <Link to="/market">Каталог</Link>
          <Link to={isLawyer ? createPageUrl("BusinessCabinet") : createPageUrl("Dashboard")}>Кабинет</Link>
        </div>
      </div>
    </nav>}
    <main>{children}</main>
  </div>;
}
