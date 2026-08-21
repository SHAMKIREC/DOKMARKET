import { Link, useLocation } from "react-router-dom";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

function GavelIcon(){return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 4 6 6M12 6l6 6M5 15l7-7 4 4-7 7H5v-4ZM3 21h12"/></svg>}

export default function Layout({ children, currentPageName }) {
  const { pathname } = useLocation();
  const lowerPath = pathname.toLowerCase();
  const alreadyHasMarketFrame = lowerPath.startsWith("/market") || pathname === "/" || lowerPath === "/reviews";
  const isDosudebkaArea = ["/dosudebka", "/generator", "/guide", "/pricing"].some(prefix => lowerPath.startsWith(prefix)) || ["Home","Dosudebka","Generator","Guide","Pricing"].includes(currentPageName);
  return <div className={`app-shell dm-app-shell${isDosudebkaArea ? " dm-dosudebka-area" : ""}`}>
    {!alreadyHasMarketFrame && <DocMarketHeader />}
    {isDosudebkaArea && !alreadyHasMarketFrame && <nav className="dm-service-nav" aria-label="Досудебка — сервис ДокМаркета"><div className="dm-service-nav-inner">
      <Link className="dm-service-home" to="/dosudebka"><span className="dm-service-symbol"><GavelIcon/></span><span><strong>Досудебка</strong><small>сервис ДокМаркета</small></span></Link>
      <div className="dm-service-links"><Link className={currentPageName==="Generator"?"active":""} to="/Generator">Создать</Link><Link className={currentPageName==="Guide"?"active":""} to="/Guide">Как работает</Link><Link className={currentPageName==="Pricing"?"active":""} to="/Pricing">Цена</Link></div>
    </div></nav>}
    <main>{children}</main>
  </div>;
}
