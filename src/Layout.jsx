import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

function GavelIcon(){return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 4 6 6M12 6l6 6M5 15l7-7 4 4-7 7H5v-4ZM3 21h12"/></svg>}

export default function Layout({ children, currentPageName }) {
  const { pathname } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const alreadyHasMarketFrame = lowerPath.startsWith("/market") || pathname === "/" || lowerPath === "/reviews";
  const isDosudebkaArea = ["/dosudebka", "/generator", "/guide", "/pricing"].some(prefix => lowerPath.startsWith(prefix)) || ["Home","Dosudebka","Generator","Guide","Pricing"].includes(currentPageName);

  return <div className={`app-shell dm-app-shell${isDosudebkaArea ? " dm-dosudebka-area" : ""}`}>
    {!alreadyHasMarketFrame && <DocMarketHeader />}
    {isDosudebkaArea && !alreadyHasMarketFrame && <nav className="dm-service-nav" aria-label="Сервис Досудебка">
      <div className="dm-service-nav-inner">
        <Link className="dm-service-home" to="/dosudebka"><span className="dm-service-symbol"><GavelIcon/></span><span><strong>Досудебка</strong><small>сервис ДокМаркета</small></span></Link>
        <div className="dm-service-links">
          <Link className={currentPageName === "Generator" ? "active" : ""} to={createPageUrl("Generator")}><span className="dm-nav-full">Создать претензию</span><span className="dm-nav-short">Создать</span></Link>
          <Link className={currentPageName === "Guide" ? "active" : ""} to={createPageUrl("Guide")}><span className="dm-nav-full">Как работает</span><span className="dm-nav-short">Инструкция</span></Link>
          <Link className={currentPageName === "Pricing" ? "active" : ""} to={createPageUrl("Pricing")}><span className="dm-nav-full">Стоимость</span><span className="dm-nav-short">Цена</span></Link>
          <Link className="dm-service-extra" to="/reviews">Отзывы</Link>
          <Link className="dm-service-extra" to="/market">Каталог</Link>
        </div>
      </div>
    </nav>}
    <main>{children}</main>
  </div>;
}
