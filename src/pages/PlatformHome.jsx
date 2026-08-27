import DocMarketHome from "./DocMarketHome";

export default function PlatformHome(){
  return <div className="dm-platform-home">
    <style>{`
      .dm-platform-home .market-page{min-height:0!important}
      .dm-platform-home .market-content{padding-bottom:10px!important}
      .dm-platform-home{padding-bottom:12px}
      @media(max-width:640px){.dm-platform-home{padding-bottom:6px}}
    `}</style>
    <DocMarketHome/>
  </div>
}
