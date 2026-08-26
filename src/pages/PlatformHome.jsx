import DocMarketHome from "./DocMarketHome";
import PublicSellerShowcase from "@/marketplace/components/PublicSellerShowcase";

export default function PlatformHome(){
  return <div className="dm-platform-home">
    <style>{`
      .dm-platform-home .market-page{min-height:0!important}
      .dm-platform-home .market-content{padding-bottom:10px!important}
      .dm-platform-home{padding-bottom:12px}
      .dm-market-quick a:nth-child(3) strong{font-size:0}
      .dm-market-quick a:nth-child(3) strong:after{content:'Селлер';font-size:.78rem}
      .dm-market-quick a:nth-child(3) small{font-size:0}
      .dm-market-quick a:nth-child(3) small:after{content:'Кабинет селлера';font-size:.62rem}
      @media(max-width:640px){
        .dm-platform-home{padding-bottom:6px}
        .dm-market-quick a:nth-child(3) strong:after{font-size:.68rem}
        .dm-market-quick a:nth-child(3) small:after{display:none}
      }
    `}</style>
    <DocMarketHome/>
    <PublicSellerShowcase/>
  </div>
}
