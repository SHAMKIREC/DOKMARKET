import React from "react";

const paths={
legal:<><path d="M32 12v36M16 20h32M18 20 9 38h18L18 20Zm28 0-9 18h18L46 20ZM22 49h20"/></>,
contracts:<><path d="M17 9h22l9 9v37H17z"/><path d="M39 9v11h9M23 29h18M23 37h18M23 45h12"/></>,
accounting:<><rect x="16" y="8" width="32" height="48" rx="5"/><path d="M22 15h20v10H22zM23 34h2M31 34h2M39 34h2M23 43h2M31 43h2M39 43h2"/></>,
dosudebka:<><path d="m18 13 17 17M25 7l25 25-9 9-25-25zM11 49l22-22M8 55h34"/></>,
business:<><path d="M10 21h44v32H10zM24 21v-8h16v8M10 34h44"/><path d="M28 31h8v7h-8z"/></>,
hr:<><circle cx="25" cy="24" r="9"/><circle cx="44" cy="25" r="7"/><path d="M9 54c2-13 9-20 17-20s15 7 17 20M39 37c9 0 14 6 16 16"/></>,
realty:<><path d="m8 30 24-21 24 21M14 27v29h36V27M25 56V40h14v16"/></>,
auto:<><path d="m14 35 5-15h26l5 15M10 35h44v14H10zM17 50v5M47 50v5"/><circle cx="20" cy="43" r="3"/><circle cx="44" cy="43" r="3"/></>,
education:<><path d="m6 24 26-14 26 14-26 14L6 24Z"/><path d="M16 31v12c10 8 22 8 32 0V31M54 25v18"/></>,
medicine:<><rect x="11" y="9" width="42" height="46" rx="6"/><path d="M27 18h10v10h10v10H37v10H27V38H17V28h10z"/></>,
freelance:<><path d="M13 11h38v31H13zM7 52h50l-6-10H13z"/><path d="M27 25h10M32 20v10"/></>,
marketplaces:<><path d="M8 13h7l5 29h28l7-20H18"/><circle cx="25" cy="51" r="3"/><circle cx="45" cy="51" r="3"/></>,
guides:<><path d="M9 11h18c5 0 9 4 9 9v35c0-5-4-9-9-9H9zM55 11H37c-5 0-9 4-9 9v35c0-5 4-9 9-9h18z"/></>,
ai:<><rect x="10" y="18" width="44" height="31" rx="7"/><path d="M32 9v9M20 32h2M42 32h2M23 41h18M5 28v12M59 28v12"/></>,
checklists:<><rect x="13" y="8" width="38" height="48" rx="5"/><path d="m20 21 4 4 8-9M20 37l4 4 8-9M37 22h8M37 38h8"/></>,
specialists:<><circle cx="28" cy="24" r="9"/><path d="M11 55c2-14 9-21 17-21s15 7 17 21M49 15v15M42 22h14"/></>
};
export default function DocMarketIcon({name,size=64,className=""}){return <span className={`dm-premium-icon ${className}`} style={{width:size,height:size}} aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]||paths.contracts}</svg></span>}
export const docMarketIconStyles=`
.dm-premium-icon{display:inline-grid;place-items:center;position:relative;box-sizing:border-box;border:1px solid rgba(214,154,75,.42);border-radius:18px;color:#e3a451;background:radial-gradient(circle at 35% 25%,rgba(238,177,91,.2),transparent 38%),linear-gradient(145deg,#20201d,#0b121a 72%);box-shadow:inset 0 0 0 4px rgba(226,164,78,.045),inset 0 0 22px rgba(219,148,55,.08),0 8px 20px rgba(0,0,0,.25),0 0 18px rgba(216,145,53,.08)}
.dm-premium-icon:before{content:"";position:absolute;inset:6px;border:1px solid rgba(230,171,92,.14);border-radius:13px;pointer-events:none}.dm-premium-icon svg{width:68%;height:68%;filter:drop-shadow(0 2px 5px rgba(225,153,57,.25))}
`;
