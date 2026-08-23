import React from "react";

const paths={
legal:<><path d="M32 10v39M14 18h36M16 18 7 37h18L16 18Zm32 0-9 19h18L48 18ZM20 50h24"/><circle cx="32" cy="10" r="2"/></>,
contracts:<><path d="M16 8h23l10 10v38H16z"/><path d="M39 8v12h10M23 29h19M23 37h19M23 45h13"/><path d="m39 48 3 3 7-8"/></>,
accounting:<><rect x="15" y="7" width="34" height="50" rx="6"/><path d="M21 14h22v11H21zM22 34h3M31 34h3M40 34h3M22 43h3M31 43h3M40 43h3M22 51h12"/></>,
dosudebka:<><path d="m17 14 18 18M25 7l25 25-9 9-25-25zM11 49l22-22M8 56h36"/><path d="M39 14l5-5M45 20l6-3"/></>,
business:<><path d="M9 21h46v34H9zM23 21v-9h18v9M9 35h46"/><path d="M28 31h8v8h-8zM16 43h10M38 43h10"/></>,
hr:<><circle cx="24" cy="23" r="9"/><circle cx="45" cy="24" r="7"/><path d="M8 55c2-14 9-21 17-21s15 7 17 21M40 37c9 0 14 6 16 17"/></>,
realty:<><path d="m7 30 25-22 25 22M13 27v29h38V27M24 56V40h16v16"/><path d="M19 34h7M43 34h3"/></>,
auto:<><path d="m13 35 6-16h26l6 16M9 35h46v15H9zM17 50v6M47 50v6"/><circle cx="20" cy="43" r="4"/><circle cx="44" cy="43" r="4"/><path d="M18 28h28"/></>,
education:<><path d="m5 24 27-15 27 15-27 15L5 24Z"/><path d="M15 32v12c11 8 23 8 34 0V32M55 25v20"/><circle cx="55" cy="48" r="2"/></>,
medicine:<><rect x="10" y="9" width="44" height="47" rx="7"/><path d="M27 17h10v11h11v10H37v11H27V38H16V28h11z"/><path d="M20 9v-3h24v3"/></>,
freelance:<><path d="M12 10h40v32H12zM6 54h52l-6-12H12z"/><path d="M24 26h16M32 18v16M19 48h26"/></>,
marketplaces:<><path d="M7 13h8l5 30h29l7-21H18"/><circle cx="26" cy="53" r="3"/><circle cx="46" cy="53" r="3"/><path d="M25 28h23M28 35h17"/></>,
guides:<><path d="M8 10h19c5 0 9 4 9 9v37c0-5-4-9-9-9H8zM56 10H37c-5 0-9 4-9 9v37c0-5 4-9 9-9h19z"/><path d="M14 19h14M14 27h14M42 19h9M42 27h9"/></>,
ai:<><rect x="9" y="18" width="46" height="32" rx="8"/><path d="M32 8v10M20 32h3M41 32h3M23 41h18M4 28v12M60 28v12"/><circle cx="32" cy="8" r="2"/></>,
checklists:<><rect x="12" y="7" width="40" height="50" rx="6"/><path d="m19 21 4 4 9-10M19 38l4 4 9-10M38 22h8M38 39h8"/><path d="M24 7v-3h16v3"/></>,
specialists:<><circle cx="27" cy="23" r="9"/><path d="M10 56c2-15 9-22 17-22s15 7 17 22M50 14v17M42 22h16"/><path d="M45 42c4-4 10-4 14 0"/></>,
search:<><circle cx="27" cy="27" r="16"/><path d="m39 39 15 15"/></>,
favorite:<path d="M53 17c-6-7-16-6-21 2-5-8-15-9-21-2-8 9-3 20 4 27l17 13 17-13c7-7 12-18 4-27Z"/>,
cart:<><path d="M7 12h8l5 30h29l7-21H18"/><circle cx="26" cy="53" r="3"/><circle cx="46" cy="53" r="3"/></>,
profile:<><circle cx="32" cy="21" r="11"/><path d="M12 57c2-16 10-24 20-24s18 8 20 24"/></>,
menu:<><path d="M10 17h44M10 32h44M10 47h44"/></>,
home:<><path d="m7 31 25-22 25 22M14 28v28h36V28M25 56V41h14v15"/></>,
documents:<><path d="M17 7h22l10 10v40H17zM39 7v12h10M23 30h19M23 39h19M23 48h13"/></>,
seller:<><path d="M10 22h44l-4-12H14zM14 22v34h36V22M23 56V39h18v17"/><path d="M9 22c0 6 9 8 12 2 3 6 12 6 15 0 3 6 12 6 15 0 3 6 10 4 10-2"/></>,
services:<><path d="M12 13h40v38H12zM20 21h24M20 30h24M20 39h14"/><path d="m42 42 4 4 9-10"/></>,
partners:<><circle cx="21" cy="22" r="8"/><circle cx="43" cy="22" r="8"/><path d="M6 55c2-13 8-20 15-20 5 0 9 3 12 8 3-5 7-8 12-8 7 0 13 7 15 20"/><path d="m25 31 7 7 7-7"/></>,
reviews:<><path d="M8 10h48v35H29L17 55V45H8z"/><path d="m20 27 4 4 9-10M37 25h10M37 33h7"/></>,
analytics:<><path d="M10 54V34h10v20M27 54V22h10v32M44 54V10h10v44M7 54h50"/></>,
construction:<><path d="M10 54h44M16 54V26h32v28M12 26h40L45 12H19z"/><path d="M25 35h14M25 43h14"/></>,
presentation:<><rect x="9" y="9" width="46" height="34" rx="4"/><path d="M32 43v12M21 55h22M17 34l8-9 7 5 10-12 6 6"/></>
};

export default function DocMarketIcon({name,size=64,className="",label}){
  return <span className={`dm-premium-icon ${className}`} style={{width:size,height:size}} aria-hidden={label?undefined:"true"} aria-label={label} role={label?"img":undefined}>
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">{paths[name]||paths.contracts}</svg>
  </span>;
}

export const docMarketIconStyles=`
.dm-premium-icon{display:inline-grid;place-items:center;position:relative;box-sizing:border-box;flex:0 0 auto;border:1px solid rgba(214,154,75,.48);border-radius:18px;color:#e1a253;background:radial-gradient(circle at 31% 22%,rgba(244,188,105,.22),transparent 35%),linear-gradient(145deg,#211f1a 0%,#111820 54%,#08121c 100%);box-shadow:inset 0 1px 0 rgba(255,220,165,.10),inset 0 0 0 4px rgba(226,164,78,.035),inset 0 -12px 24px rgba(0,0,0,.22),0 8px 22px rgba(0,0,0,.30),0 0 18px rgba(216,145,53,.08);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.dm-premium-icon:before{content:"";position:absolute;inset:6px;border:1px solid rgba(230,171,92,.16);border-radius:13px;box-shadow:inset 0 0 12px rgba(225,155,62,.045);pointer-events:none}.dm-premium-icon:after{content:"";position:absolute;left:16%;right:16%;top:10%;height:18%;border-radius:999px;background:linear-gradient(180deg,rgba(255,235,199,.09),transparent);pointer-events:none}.dm-premium-icon svg{width:66%;height:66%;filter:drop-shadow(0 2px 5px rgba(225,153,57,.28))}.dm-premium-icon:hover{transform:translateY(-1px);border-color:rgba(235,177,98,.7);box-shadow:inset 0 1px 0 rgba(255,220,165,.12),inset 0 0 0 4px rgba(226,164,78,.04),0 10px 26px rgba(0,0,0,.34),0 0 22px rgba(216,145,53,.12)}
`;
