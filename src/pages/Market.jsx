import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  categories,
  directions,
  findCategory,
  findDirection,
  findSection,
  findSituation,
  offers,
  offerTypeLabels,
  sections,
  specialists,
  situations,
} from "@/data/marketplaceMock";
import { isCartEligible, isInCart, toggleCart } from "@/marketplace/services/cartService";
import { isFavorite, toggleFavorite } from "@/marketplace/services/favoritesService";
import DocMarketHeader from "@/marketplace/components/DocMarketBrand";

export const marketStyles = `
  .market-page { min-height:100vh; color:#f8f4e8; background:radial-gradient(circle at 78% 5%,rgba(201,153,79,.1),transparent 28rem),radial-gradient(circle at 12% 32%,rgba(34,65,93,.2),transparent 34rem),#07111d; }
  .market-content { padding:16px 10px 44px; }
  .market-shell { width:min(1480px,100%); margin:0 auto; }
  .docmarket-header { position:sticky; top:0; z-index:55; background:rgba(6,16,28,.94); border-bottom:1px solid rgba(218,181,111,.18); box-shadow:0 12px 38px rgba(0,0,0,.22); backdrop-filter:blur(20px); }
  .docmarket-header-inner { width:min(1540px,100%); min-height:84px; margin:0 auto; padding:10px 20px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:24px; }
  .docmarket-brand { display:inline-flex; align-items:center; gap:11px; color:inherit; text-decoration:none; }
  .docmarket-brand-icon { width:52px; height:52px; flex:0 0 52px; object-fit:cover; border-radius:15px; box-shadow:0 7px 18px rgba(0,0,0,.28); }
  .docmarket-brand-copy { display:grid; gap:2px; }
  .docmarket-brand-copy strong { font:850 1.42rem/1 "Space Grotesk",sans-serif; letter-spacing:-.03em; }
  .docmarket-brand-copy strong span { color:#fff; }
  .docmarket-brand-copy strong em { color:#ddb66f; font-style:normal; }
  .docmarket-brand-copy small { color:#fff; opacity:.96; font-size:.75rem; font-weight:700; letter-spacing:.025em; }
  .docmarket-main-nav { display:flex; justify-content:center; gap:clamp(14px,2.2vw,28px); }
  .docmarket-main-nav a { color:#fff; text-decoration:none; font-size:.78rem; font-weight:750; transition:color .2s; }
  .docmarket-main-nav a:hover { color:#e3be77; }
  .docmarket-actions { display:flex; gap:6px; }
  .docmarket-actions a { display:inline-flex; align-items:center; gap:6px; padding:10px 11px; border-radius:10px; color:#fff; text-decoration:none; background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.09); font-size:.72rem; font-weight:800; }
  .docmarket-actions a:hover { color:#f0cd89; border-color:rgba(218,181,111,.3); background:rgba(218,181,111,.06); }
  .market-glass { background:linear-gradient(145deg,rgba(20,28,49,.78),rgba(13,12,29,.82)); border:1px solid rgba(148,163,184,.14); box-shadow:0 18px 52px rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.05); backdrop-filter:blur(16px); }
  .market-hero { position:relative; overflow:hidden; border-radius:25px; padding:clamp(20px,2.4vw,28px); margin-bottom:20px; }
  .market-hero:after { content:""; position:absolute; width:290px; height:290px; right:-90px; top:-120px; border-radius:50%; background:rgba(124,58,237,.2); filter:blur(55px); pointer-events:none; }
  .market-kicker { display:inline-flex; align-items:center; gap:8px; color:#a5f3fc; font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.13em; margin-bottom:14px; }
  .market-title { margin:0; color:#fff; font:700 clamp(2rem,5vw,4rem)/1.05 "Space Grotesk",sans-serif; }
  .market-subtitle { color:#ddd6fe; font-size:clamp(1rem,2vw,1.28rem); font-weight:650; margin:14px 0 8px; }
  .market-copy { color:#aeb9ca; line-height:1.62; max-width:900px; margin:0; }
  .market-note { display:flex; gap:10px; align-items:flex-start; margin-top:18px; color:#94a3b8; font-size:.82rem; line-height:1.55; }
  .market-note i { color:#22d3ee; margin-top:3px; }
  .market-trust-badges { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
  .market-trust-badge { display:inline-flex; align-items:center; gap:7px; padding:7px 10px; border-radius:999px; color:#d9e4f0; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); font-size:.7rem; font-weight:700; }
  .market-trust-badge i { color:#67e8f9; }
  .market-search { position:relative; display:block; max-width:920px; margin-top:22px; }
  .market-search i { position:absolute; left:17px; top:50%; transform:translateY(-50%); color:#67e8f9; }
  .market-search input { width:100%; padding:15px 18px 15px 47px; color:#fff; background:rgba(3,7,18,.55); border:1px solid rgba(103,232,249,.2); border-radius:14px; outline:none; }
  .market-search input:focus { border-color:rgba(103,232,249,.48); box-shadow:0 0 0 3px rgba(34,211,238,.08); }
  .market-search-row { display:flex; align-items:center; gap:10px; margin-top:22px; }
  .market-search-row .market-search { flex:1; max-width:none; margin-top:0; }
  .market-toolbar { display:flex; gap:8px; }
  .market-tool { display:inline-flex; align-items:center; gap:7px; padding:12px 13px; border-radius:12px; color:#cbd5e1; text-decoration:none; white-space:nowrap; background:rgba(3,7,18,.42); border:1px solid rgba(255,255,255,.09); font-size:.73rem; font-weight:750; }
  .market-tool:hover { color:#67e8f9; border-color:rgba(103,232,249,.3); }
  .market-heading { color:#fff; font:700 clamp(1.55rem,3vw,2.35rem)/1.15 "Space Grotesk",sans-serif; margin:0 0 8px; }
  .market-lead { color:#94a3b8; line-height:1.65; margin:0 0 24px; }
  .market-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; align-items:stretch; }
  .market-card { display:flex; flex-direction:column; min-height:190px; border-radius:20px; padding:21px; color:inherit; text-decoration:none; transition:transform .2s,border-color .2s,box-shadow .2s; }
  .market-card:hover { transform:translateY(-3px); border-color:rgba(103,232,249,.3); box-shadow:0 20px 50px rgba(8,145,178,.08); }
  .market-icon { width:44px; height:44px; display:grid; place-items:center; border-radius:13px; color:#a5f3fc; background:linear-gradient(135deg,rgba(8,145,178,.15),rgba(124,58,237,.15)); border:1px solid rgba(103,232,249,.16); margin-bottom:17px; }
  .market-card h2,.market-card h3 { color:#f8fafc; font-size:1.08rem; line-height:1.35; margin:0 0 8px; }
  .market-card p { color:#8f9bad; font-size:.82rem; line-height:1.55; margin:0 0 17px; }
  .market-card-link { color:#67e8f9; font-size:.78rem; font-weight:750; margin-top:auto; }
  .market-direction-card { position:relative; overflow:hidden; min-height:330px; height:100%; border-color:rgba(var(--market-accent),.22); background:radial-gradient(circle at 100% 0%,rgba(var(--market-accent),.14),transparent 42%),linear-gradient(155deg,rgba(25,34,55,.94),rgba(14,13,31,.92)); }
  .market-direction-card:before { content:""; position:absolute; width:135px; height:135px; right:-62px; top:-62px; border-radius:50%; background:rgba(var(--market-accent),.16); filter:blur(28px); transition:opacity .25s,transform .25s; }
  .market-direction-card:hover { border-color:rgba(var(--market-accent),.48); box-shadow:0 22px 55px rgba(var(--market-accent),.1),inset 0 1px rgba(255,255,255,.06); }
  .market-direction-card:hover:before { opacity:.9; transform:scale(1.15); }
  .market-direction-card .market-icon { width:52px; height:52px; font-size:1.08rem; color:rgb(var(--market-accent)); background:rgba(var(--market-accent),.12); border-color:rgba(var(--market-accent),.27); box-shadow:0 10px 28px rgba(var(--market-accent),.12); }
  .market-direction-card h2 { position:relative; font-size:1.25rem; }
  .market-examples { display:flex; flex-wrap:wrap; gap:7px; margin:2px 0 20px; }
  .market-example { color:#b8c5d8; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); border-radius:999px; padding:5px 8px; font-size:.68rem; }
  .market-direction-cta { display:flex; align-items:center; justify-content:space-between; gap:10px; color:#e0f2fe; background:rgba(8,145,178,.1); border:1px solid rgba(103,232,249,.16); border-radius:11px; padding:10px 12px; font-size:.76rem; font-weight:800; margin-top:auto; }
  .market-direction-card .market-direction-cta { background:rgba(var(--market-accent),.09); border-color:rgba(var(--market-accent),.2); }
  .market-direction-card .market-direction-cta i { transition:transform .2s; }
  .market-direction-card:hover .market-direction-cta i { transform:translateX(4px); }
  .market-direction-meta { display:flex; flex-direction:column; align-items:flex-start; gap:5px; margin:-5px 0 14px; color:#7f8ca1; font-size:.68rem; font-weight:700; }
  .market-direction-meta strong { color:#cbd5e1; font-weight:750; }
  .market-navline { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:23px; }
  .market-back { display:inline-flex; align-items:center; gap:8px; color:#cbd5e1; text-decoration:none; font-size:.82rem; }
  .market-back:hover { color:#67e8f9; }
  .market-breadcrumbs { display:flex; align-items:center; flex-wrap:wrap; gap:8px; color:#64748b; font-size:.76rem; }
  .market-breadcrumbs a { color:#94a3b8; text-decoration:none; }
  .market-breadcrumbs a:hover { color:#67e8f9; }
  .market-panel { border-radius:24px; padding:clamp(20px,2.5vw,30px); }
  .market-choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:26px 0; }
  .market-choice { border-radius:17px; padding:20px; background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.08); }
  .market-choice h3 { color:#fff; margin:0 0 8px; font-size:1rem; }
  .market-choice p { color:#94a3b8; margin:0; font-size:.84rem; line-height:1.6; }
  .market-primary { display:inline-flex; align-items:center; justify-content:center; gap:9px; border:0; border-radius:12px; padding:13px 19px; color:#fff; font-weight:750; font-size:.86rem; text-decoration:none; cursor:pointer; background:linear-gradient(135deg,#0891b2,#7c3aed); box-shadow:0 10px 28px rgba(79,70,229,.2); }
  .market-badge { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:5px 9px; color:#c4b5fd; background:rgba(124,58,237,.12); border:1px solid rgba(196,181,253,.18); font-size:.68rem; font-weight:750; }
  .market-offer-card { min-height:255px; }
  .market-offer-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:14px; }
  .market-action { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:36px; padding:8px 10px; border-radius:9px; color:#cbd5e1; text-decoration:none; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.09); font-size:.68rem; font-weight:750; cursor:pointer; }
  .market-action.primary { color:#fff; border-color:rgba(103,232,249,.18); background:linear-gradient(135deg,rgba(8,145,178,.9),rgba(124,58,237,.9)); }
  .market-action.active { color:#fda4af; border-color:rgba(244,114,182,.25); background:rgba(244,114,182,.07); }
  .market-offer-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:15px; }
  .market-offer-type { color:#67e8f9; font-size:.68rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
  .market-offer-provider { display:flex; align-items:center; gap:7px; color:#cbd5e1; font-size:.75rem; font-weight:700; margin:2px 0 11px; }
  .market-offer-provider i { color:#a78bfa; }
  .market-offer-meta { display:flex; flex-wrap:wrap; gap:7px; margin:0 0 13px; }
  .market-offer-meta span { color:#94a3b8; border-radius:999px; padding:5px 8px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); font-size:.67rem; }
  .market-offer-cta { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; padding:10px 12px; border-radius:11px; color:#e0f2fe; background:rgba(8,145,178,.1); border:1px solid rgba(103,232,249,.16); font-size:.76rem; font-weight:800; }
  .market-offer-cta i { transition:transform .2s; }
  .market-offer-card:hover .market-offer-cta i { transform:translateX(4px); }
  .market-price { color:#fff; font-weight:800; margin-top:10px; }
  .market-empty { padding:34px; text-align:center; border-radius:20px; color:#94a3b8; }
  .market-specialist-card { min-height:315px; }
  .market-specialist-head { display:flex; align-items:center; gap:14px; margin-bottom:17px; }
  .market-specialist-avatar { width:58px; height:58px; flex:0 0 auto; border-radius:17px; display:grid; place-items:center; color:#fff; font-size:1rem; font-weight:850; background:linear-gradient(135deg,#0e7490,#6d28d9); box-shadow:0 12px 28px rgba(79,70,229,.18); }
  .market-specialist-stats { display:flex; flex-wrap:wrap; gap:8px 13px; color:#9ca9bb; font-size:.7rem; margin:3px 0 18px; }
  .market-specialist-stats i { color:#67e8f9; margin-right:5px; }
  .market-preview { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(240px,.85fr); gap:24px; align-items:center; margin:28px 0; padding:20px; border-radius:18px; background:rgba(2,6,23,.25); border:1px solid rgba(255,255,255,.07); }
  .market-preview-paper { position:relative; overflow:hidden; min-height:260px; padding:28px; border-radius:12px; color:#293548; background:#eef2f7; box-shadow:0 14px 32px rgba(0,0,0,.2); }
  .market-preview-paper p { position:relative; z-index:1; margin:0 0 15px; font:500 .78rem/1.6 Georgia,serif; }
  .market-preview-watermark { position:absolute; left:50%; top:48%; z-index:0; transform:translate(-50%,-50%) rotate(-24deg); color:rgba(71,85,105,.12); font-size:2.2rem; font-weight:900; letter-spacing:.08em; }
  .market-preview-fade { position:absolute; inset:auto 0 0; z-index:2; height:48%; background:linear-gradient(transparent,rgba(238,242,247,.97) 72%); }
  .market-preview-fade:after { content:"Полный файл будет доступен после оформления"; position:absolute; left:50%; bottom:18px; transform:translateX(-50%); width:max-content; max-width:88%; padding:7px 10px; border-radius:999px; color:#475569; background:rgba(255,255,255,.8); border:1px solid rgba(71,85,105,.14); font-size:.65rem; font-weight:800; }
  .market-profile-head { display:grid; grid-template-columns:auto 1fr; gap:23px; align-items:start; }
  .market-profile-avatar { width:96px; height:96px; display:grid; place-items:center; border-radius:27px; color:#fff; font-size:1.55rem; font-weight:850; background:linear-gradient(135deg,#0e7490,#6d28d9); box-shadow:0 16px 38px rgba(79,70,229,.22); }
  .market-profile-copy .market-heading { margin:12px 0 7px; }
  .market-profile-copy .market-copy { margin-top:12px; }
  .market-profile-copy .market-examples { margin:14px 0 0; }
  .market-profile-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:25px 0 18px; }
  .market-profile-stats div { display:grid; gap:5px; padding:13px; border-radius:12px; background:rgba(255,255,255,.028); border:1px solid rgba(255,255,255,.07); }
  .market-profile-stats span { color:#64748b; font-size:.65rem; }
  .market-profile-stats strong { color:#e2e8f0; font-size:.82rem; }
  .market-tabs { display:flex; gap:8px; overflow-x:auto; margin:25px 0; padding:7px; border-radius:14px; background:rgba(15,23,42,.55); border:1px solid rgba(255,255,255,.07); }
  .market-tabs button { flex:1 0 auto; padding:10px 13px; border-radius:9px; color:#94a3b8; background:transparent; border:0; font-size:.73rem; font-weight:800; cursor:pointer; }
  .market-tabs button.active { color:#e0f2fe; background:linear-gradient(135deg,rgba(8,145,178,.2),rgba(124,58,237,.18)); box-shadow:inset 0 0 0 1px rgba(103,232,249,.13); }
  .market-glass { background:linear-gradient(145deg,rgba(15,31,48,.9),rgba(8,20,34,.94)); border-color:rgba(218,181,111,.14); box-shadow:0 20px 54px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.045); }
  .market-hero { padding:clamp(20px,2.4vw,28px); border-color:rgba(222,184,111,.25); background:radial-gradient(circle at 88% 8%,rgba(215,171,92,.13),transparent 30%),linear-gradient(145deg,rgba(17,36,55,.96),rgba(7,20,34,.98)); }
  .market-hero:after { background:rgba(199,151,76,.12); }
  .market-kicker { color:#e7c47f; margin-bottom:16px; }
  .market-title { max-width:880px; color:#fffdf7; font-size:clamp(2.8rem,3.7vw,3.4rem); line-height:1.1; letter-spacing:-.032em; }
  .market-copy,.market-lead { color:#b9c3cd; }
  .market-hero .market-copy { max-width:760px; color:#e2e7eb; font-size:.94rem; }
  .market-hero-path { display:flex; align-items:center; flex-wrap:wrap; gap:9px; margin:14px 0 0; color:#f4e4c2; font-size:.75rem; font-weight:750; }
  .market-hero-path i { width:4px; height:4px; border-radius:50%; background:#dcb66f; }
  .market-search-row { max-width:930px; margin-top:20px; }
  .market-search input { padding-top:16px; padding-bottom:16px; color:#fffdf7; background:rgba(2,12,22,.72); border-color:rgba(222,184,111,.3); box-shadow:0 12px 28px rgba(0,0,0,.16); }
  .market-search i { color:#dfb96f; }
  .market-search input:focus { border-color:rgba(234,199,133,.68); box-shadow:0 0 0 3px rgba(218,181,111,.1),0 12px 28px rgba(0,0,0,.18); }
  .market-quick-searches { display:flex; align-items:center; flex-wrap:wrap; gap:7px; margin-top:12px; color:#b8c2cc; font-size:.66rem; }
  .market-quick-searches button { padding:6px 9px; border-radius:999px; color:#e9e1d1; background:rgba(255,255,255,.025); border:1px solid rgba(218,181,111,.14); font-size:.65rem; cursor:pointer; }
  .market-quick-searches button:hover { color:#f3ce87; border-color:rgba(218,181,111,.38); background:rgba(218,181,111,.06); }
  .market-heading,.market-card h2,.market-card h3,.market-choice h3 { color:#fffdf7; }
  .market-card { border-color:rgba(218,181,111,.13); background:linear-gradient(150deg,rgba(17,34,51,.96),rgba(8,20,33,.96)); }
  .market-card:hover { border-color:rgba(226,189,117,.42); box-shadow:0 22px 52px rgba(0,0,0,.3),0 0 28px rgba(190,139,63,.06); }
  .market-card p { color:#aeb9c4; }
  .market-icon { color:#f0cc87; background:rgba(218,181,111,.08); border-color:rgba(218,181,111,.23); }
  .market-card-link,.market-back:hover,.market-breadcrumbs a:hover,.market-offer-type { color:#e1b96f; }
  .market-badge { color:#f0d59f; background:rgba(218,181,111,.08); border-color:rgba(218,181,111,.22); }
  .market-price { color:#f5d597; font-size:1rem; }
  .market-offer-provider i,.market-specialist-stats i { color:#dcb46b; }
  .market-offer-meta span,.market-example { color:#c7cdd3; border-color:rgba(218,181,111,.1); background:rgba(255,255,255,.025); }
  .market-action { color:#eee9df; border-color:rgba(255,255,255,.09); background:rgba(255,255,255,.025); }
  .market-action:hover { color:#f2cf8c; border-color:rgba(218,181,111,.3); }
  .market-action.primary,.market-primary { color:#111b25; border-color:rgba(246,218,160,.38); background:linear-gradient(135deg,#f0d79f,#c99548); box-shadow:0 10px 28px rgba(147,99,35,.2); }
  .market-action.active { color:#f2ca82; border-color:rgba(218,181,111,.32); background:rgba(218,181,111,.08); }
  .market-direction-card { border-color:rgba(218,181,111,.16); background:radial-gradient(circle at 100% 0%,rgba(218,181,111,.09),transparent 42%),linear-gradient(155deg,rgba(18,37,55,.96),rgba(8,20,34,.96)); }
  .market-direction-card:before { background:rgba(218,181,111,.1); }
  .market-direction-card:hover { border-color:rgba(226,189,117,.42); box-shadow:0 22px 55px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.05); }
  .market-direction-card .market-icon { color:#e5bd73; background:rgba(218,181,111,.08); border-color:rgba(218,181,111,.22); box-shadow:0 10px 28px rgba(117,77,26,.1); }
  .market-direction-card .market-direction-cta,.market-direction-cta { color:#f1dfbd; background:rgba(218,181,111,.07); border-color:rgba(218,181,111,.18); }
  .market-specialist-avatar,.market-profile-avatar { background:linear-gradient(145deg,#18334c,#091928); border:1px solid rgba(222,184,111,.32); color:#f1d18f; box-shadow:0 14px 34px rgba(0,0,0,.25); }
  .market-tabs { background:rgba(5,16,28,.7); border-color:rgba(218,181,111,.13); }
  .market-tabs button.active { color:#f5dfb4; background:linear-gradient(135deg,rgba(218,181,111,.13),rgba(133,91,35,.1)); box-shadow:inset 0 0 0 1px rgba(218,181,111,.16); }
  .market-preview { background:rgba(3,13,23,.42); border-color:rgba(218,181,111,.13); }
  .market-note i { color:#ddb66f; }
  .market-offer-purchase { margin-top:22px!important; padding:15px; border-radius:14px; background:rgba(218,181,111,.045); border:1px solid rgba(218,181,111,.14); }

  /* DocMarket premium glass polish: dense, readable surfaces over a lighter navy depth. */
  .market-page {
    --dm-bg:#07111d;
    --dm-section:#0d1b2a;
    --dm-card:#102235;
    --dm-card-strong:#132a40;
    --dm-card-hover:#173451;
    --dm-text:#f8fafc;
    --dm-secondary:#d4dee9;
    --dm-muted:#aebccd;
    --dm-gold:#d8b463;
    --dm-gold-light:#f1d58a;
    --dm-cyan:#38d5e8;
    color:var(--dm-text);
    background:
      radial-gradient(circle at 12% 8%,rgba(56,213,232,.10),transparent 28%),
      radial-gradient(circle at 88% 6%,rgba(216,180,99,.14),transparent 32%),
      radial-gradient(circle at 50% 40%,rgba(255,255,255,.035),transparent 35%),
      linear-gradient(180deg,#07111d 0%,#081827 48%,#07111d 100%);
  }
  .docmarket-header {
    background:rgba(7,17,29,.90);
    border-bottom-color:rgba(241,213,138,.16);
    box-shadow:0 14px 42px rgba(0,0,0,.22);
    -webkit-backdrop-filter:blur(14px);
    backdrop-filter:blur(14px);
  }
  .docmarket-main-nav a,.docmarket-actions a { color:#fff; }
  .docmarket-actions a { background:rgba(19,42,64,.48); border-color:rgba(255,255,255,.10); }
  .docmarket-main-nav a:hover,.docmarket-actions a:hover { color:var(--dm-gold-light); }
  .market-glass {
    background:rgba(16,34,53,.72);
    border-color:rgba(241,213,138,.18);
    box-shadow:0 24px 80px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.06);
    -webkit-backdrop-filter:blur(18px);
    backdrop-filter:blur(18px);
  }
  .market-hero {
    background:
      radial-gradient(circle at 86% 18%,rgba(216,180,99,.16),transparent 31%),
      radial-gradient(circle at 12% -8%,rgba(56,213,232,.11),transparent 31%),
      linear-gradient(135deg,rgba(22,47,69,.82) 0%,rgba(13,31,48,.78) 58%,rgba(14,32,47,.80) 100%);
    border-color:rgba(241,213,138,.26);
    box-shadow:0 28px 90px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.10),inset 0 16px 32px rgba(255,255,255,.018);
    -webkit-backdrop-filter:blur(18px);
    backdrop-filter:blur(18px);
  }
  .market-hero:before,.market-hero:after { content:""; position:absolute; z-index:0; pointer-events:none; border:1px solid rgba(241,213,138,.24); box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 22px 50px rgba(0,0,0,.18); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); }
  .market-hero:before { background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(19,42,64,.16)),linear-gradient(rgba(241,213,138,.62),rgba(241,213,138,.62)) 30px 34px/44px 3px no-repeat,linear-gradient(rgba(255,255,255,.36),rgba(255,255,255,.36)) 30px 52px/128px 2px no-repeat,linear-gradient(rgba(255,255,255,.26),rgba(255,255,255,.26)) 30px 66px/102px 2px no-repeat,linear-gradient(rgba(255,255,255,.20),rgba(255,255,255,.20)) 30px 80px/118px 2px no-repeat; }
  .market-hero:before { width:214px; height:136px; right:70px; top:25px; border-radius:25px; transform:rotate(-8deg); opacity:.58; }
  .market-hero:after { width:156px; height:102px; right:28px; bottom:27px; top:auto; border-radius:20px; transform:rotate(9deg); opacity:.42; filter:none; background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(19,42,64,.14)),linear-gradient(rgba(241,213,138,.54),rgba(241,213,138,.54)) 23px 26px/33px 3px no-repeat,linear-gradient(rgba(255,255,255,.30),rgba(255,255,255,.30)) 23px 42px/92px 2px no-repeat,linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.22)) 23px 56px/76px 2px no-repeat; }
  .market-title,.market-heading,.market-card h2,.market-card h3,.market-choice h3 { color:#fff; }
  .market-copy,.market-lead { color:var(--dm-secondary); }
  .market-card p,.market-choice p { color:var(--dm-muted); }
  .market-note { color:var(--dm-muted); }
  .market-search input {
    color:#fff;
    background:rgba(7,17,29,.72);
    border-color:rgba(241,213,138,.32);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 50px rgba(0,0,0,.18);
  }
  .market-search input::placeholder { color:#c9d3df; opacity:1; }
  .market-search i { color:var(--dm-gold-light); }
  .market-search input:focus { border-color:rgba(241,213,138,.72); box-shadow:0 0 0 4px rgba(216,180,99,.14),0 18px 50px rgba(216,180,99,.10); }
  .market-card {
    background:linear-gradient(145deg,rgba(19,42,64,.86),rgba(13,27,42,.80));
    border-color:rgba(241,213,138,.16);
    box-shadow:0 18px 55px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.035);
    -webkit-backdrop-filter:blur(7px);
    backdrop-filter:blur(7px);
  }
  .market-card:hover { transform:translateY(-3px); border-color:rgba(241,213,138,.42); box-shadow:0 24px 70px rgba(0,0,0,.30),0 0 26px rgba(216,180,99,.10),inset 0 1px 0 rgba(255,255,255,.07); }
  .market-direction-card { background:radial-gradient(circle at 100% 0%,rgba(216,180,99,.15),transparent 42%),linear-gradient(145deg,rgba(29,58,82,.84),rgba(16,35,53,.80)); border-color:rgba(241,213,138,.23); box-shadow:0 18px 58px rgba(0,0,0,.23),inset 0 1px 0 rgba(255,255,255,.08); }
  .market-direction-card:after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(255,255,255,.07),transparent 27%); }
  .market-direction-card:hover { background:radial-gradient(circle at 100% 0%,rgba(216,180,99,.20),transparent 44%),linear-gradient(145deg,rgba(27,58,83,.84),rgba(15,34,53,.80)); border-color:rgba(241,213,138,.42); box-shadow:0 26px 75px rgba(0,0,0,.32),0 0 0 1px rgba(216,180,99,.14),inset 0 1px 0 rgba(255,255,255,.10); }
  .market-direction-card .market-icon { color:#f6d990; background:rgba(216,180,99,.15); border-color:rgba(241,213,138,.31); box-shadow:0 12px 28px rgba(216,180,99,.10); }
  .market-direction-cta,.market-direction-card .market-direction-cta { border-color:rgba(241,213,138,.34); box-shadow:inset 0 1px 0 rgba(255,255,255,.06); }
  .market-direction-card .market-direction-cta i { color:#f6d990; }
  .market-direction-card:hover .market-direction-cta { background:rgba(216,180,99,.22); border-color:rgba(241,213,138,.48); }
  .market-icon { color:var(--dm-gold-light); background:rgba(216,180,99,.12); border-color:rgba(241,213,138,.25); }
  .market-example,.market-offer-meta span { color:#d6e0ea; background:rgba(19,42,64,.62); border-color:rgba(255,255,255,.10); }
  .market-direction-cta,.market-direction-card .market-direction-cta { color:#fff4d6; background:rgba(216,180,99,.12); border-color:rgba(241,213,138,.25); }
  .market-direction-card:hover .market-direction-cta { background:rgba(216,180,99,.18); }
  .market-badge { color:#fff0c5; background:rgba(216,180,99,.13); border-color:rgba(241,213,138,.28); }
  .market-action { color:#f8fafc; background:rgba(19,42,64,.68); border-color:rgba(255,255,255,.12); }
  .market-action:hover { color:#fff8e8; background:rgba(23,52,81,.84); border-color:rgba(241,213,138,.36); }
  .market-action.primary,.market-primary { color:#102235; background:linear-gradient(135deg,#f1d58a,#d8b463); border-color:rgba(255,237,184,.52); box-shadow:0 12px 30px rgba(216,180,99,.18); }
  .market-action.primary:hover,.market-primary:hover { background:linear-gradient(135deg,#f8e3a5,#ddb96a); box-shadow:0 16px 38px rgba(216,180,99,.25); }
  .market-panel,.market-empty { background:rgba(19,42,64,.82); border-color:rgba(241,213,138,.20); }
  .market-choice { background:rgba(7,17,29,.38); border-color:rgba(255,255,255,.10); }
  .market-preview { background:rgba(19,42,64,.64); border-color:rgba(241,213,138,.20); }
  .market-preview-paper { background:linear-gradient(145deg,#f8fafc,#e6edf5); box-shadow:0 18px 42px rgba(0,0,0,.26); }
  .market-tabs { background:rgba(7,17,29,.62); border-color:rgba(241,213,138,.18); }
  .market-tabs button { color:#d4dee9; }
  .market-tabs button.active { color:#fff8e8; background:linear-gradient(135deg,rgba(216,180,99,.20),rgba(19,42,64,.74)); box-shadow:inset 0 0 0 1px rgba(241,213,138,.24); }
  @media(max-width:1000px) { .docmarket-main-nav { display:none; } .docmarket-header-inner { grid-template-columns:1fr auto; } }
  @media(min-width:641px) and (max-width:1000px) { .market-title { font-size:clamp(2.625rem,5.5vw,3rem); } }
  @media(max-width:900px) { .market-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media(max-width:640px) {
    .market-page { padding:0; }
    .market-content { padding:14px 14px 40px; }
    .docmarket-header-inner { min-height:74px; padding:9px 13px; gap:10px; }
    .docmarket-brand-icon { width:42px; height:42px; flex-basis:42px; border-radius:12px; }
    .docmarket-brand-copy strong { font-size:1.12rem; }
    .docmarket-brand-copy small { font-size:.62rem; }
    .docmarket-actions a { padding:9px; }
    .docmarket-actions a span { display:none; }
    .market-grid,.market-choice-grid { grid-template-columns:1fr; }
    .market-search-row { align-items:stretch; flex-direction:column; }
    .market-toolbar { display:grid; grid-template-columns:repeat(3,1fr); }
    .market-tool { justify-content:center; padding:10px 7px; }
    .market-card { min-height:0; }
    .market-navline { align-items:flex-start; flex-direction:column; gap:12px; }
    .market-preview { grid-template-columns:1fr; }
    .market-profile-head { grid-template-columns:1fr; }
    .market-profile-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .market-quick-searches span { width:100%; }
    .market-glass { -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); }
    .market-card { -webkit-backdrop-filter:none; backdrop-filter:none; }
    .market-title { font-size:clamp(2rem,9vw,2.35rem); line-height:1.1; }
    .market-hero:before,.market-hero:after { display:none; }
  }
`;

export function MarketFrame({ children }) {
  return <div className="market-page"><style>{marketStyles}</style><DocMarketHeader /><div className="market-content"><div className="market-shell">{children}</div></div></div>;
}

export function MarketNavigation({ crumbs, backTo }) {
  return <div className="market-navline">
    <div className="market-breadcrumbs" aria-label="Хлебные крошки">
      {crumbs.map((crumb, index) => <span key={`${crumb.label}-${index}`}>
        {index > 0 && <span style={{ marginRight: 8 }}>/</span>}
        {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
      </span>)}
    </div>
    <Link className="market-back" to={backTo}><i className="fa-solid fa-arrow-left" />Назад</Link>
  </div>;
}

export function MarketplaceToolbar() {
  return <nav className="market-toolbar" aria-label="Действия ДокМаркета">
    <Link className="market-tool" to="/market/favorites"><i className="fa-regular fa-heart" />Избранное</Link>
    <Link className="market-tool" to="/market/cart"><i className="fa-solid fa-cart-shopping" />Корзина</Link>
    <Link className="market-tool" to="/Dashboard"><i className="fa-regular fa-user" />Кабинет</Link>
  </nav>;
}

function formatCount(value, forms) {
  const remainder = Math.abs(value) % 100;
  const lastDigit = remainder % 10;
  const form = remainder > 10 && remainder < 20 ? forms[2] : lastDigit === 1 ? forms[0] : lastDigit >= 2 && lastDigit <= 4 ? forms[1] : forms[2];
  return `${value} ${form}`;
}

function CatalogGrid({ items, basePath, kind, directionCards = false, pathSuffix = "", emptyText = "Раздел пополняется" }) {
  if (!items.length) return <div className="market-empty market-glass">{emptyText}</div>;
  const accentPalette = ["218,181,111", "231,205,152", "190,143,72", "226,194,132", "173,126,61", "240,215,165"];
  return <div className="market-grid">
    {items.map((item, index) => <Link className={`market-card market-glass ${directionCards ? "market-direction-card" : ""}`} style={directionCards ? { "--market-accent": accentPalette[index % accentPalette.length] } : undefined} to={`${basePath}/${item.slug}${pathSuffix}`} key={item.slug}>
      <span className="market-icon"><i className={`fa-solid ${item.icon || "fa-file-lines"}`} /></span>
      <h2>{item.title}</h2>
      <p>{item.description || `Открыть ${kind.toLowerCase()} и посмотреть доступные решения.`}</p>
      {directionCards && <><span style={{ color: "#718096", fontSize: ".66rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Популярное</span><div className="market-examples" aria-label="Популярные примеры">{item.examples?.map(example => <span className="market-example" key={example}>{example}</span>)}</div></>}
      {directionCards && <div className="market-direction-meta"><strong>{item.materialsCount ? formatCount(item.materialsCount, ["решение", "решения", "решений"]) : "Раздел пополняется"}</strong><span>Документы · Онлайн-заполнение · Услуги</span></div>}
      <span className={directionCards ? "market-direction-cta" : "market-card-link"}>{directionCards ? "Смотреть решения" : "Открыть"} <i className="fa-solid fa-arrow-right" /></span>
    </Link>)}
  </div>;
}

export function OffersGrid({ items, onFavoritesChange }) {
  const [, setRevision] = useState(0);
  if (!items.length) return <div className="market-empty market-glass">Раздел пополняется</div>;
  return <div className="market-grid">
    {items.map(offer => {
      const price = offer.priceType === "free" ? "Бесплатно" : `${offer.priceType === "from" ? "от " : ""}${Number(offer.price).toLocaleString("ru-RU")} ₽`;
      const favorite = isFavorite(offer.id, "offer");
      const inCart = isInCart(offer.id);
      const refresh = action => { action(); setRevision(value => value + 1); };
      const primaryTarget = offer.type === "platform_generator" ? offer.actionUrl : offer.type === "service" && offer.specialistId ? `/market/specialist/${offer.specialistId}` : `/market/offer/${offer.id}`;
      const primaryLabel = offer.type === "service" ? "Обратиться" : ["online_form", "platform_generator"].includes(offer.type) ? "Заполнить онлайн" : offer.type === "bundle" ? "Открыть пакет" : offer.type === "guide" ? "Открыть" : "Открыть карточку";
      return <article className="market-card market-offer-card market-glass" key={offer.id}>
      <div className="market-offer-top">
        <span className="market-badge">{offer.providerType === "platform" && <i className="fa-solid fa-building" />}{offer.badge}</span>
        <span style={{ color: "#fbbf24", fontSize: ".76rem" }}><i className="fa-solid fa-star" /> {offer.rating}</span>
      </div>
      <span className="market-offer-type">{offerTypeLabels[offer.type]}</span>
      <h2>{offer.title}</h2>
      <span className="market-offer-provider"><i className={`fa-solid ${offer.providerType === "platform" ? "fa-building" : "fa-user-check"}`} />{offer.providerName}</span>
      <p>{offer.description}</p>
      <div className="market-offer-meta">
        {offer.formats?.map(format => <span key={format}>{format}</span>)}
        {offer.deliveryTime && <span><i className="fa-regular fa-clock" /> {offer.deliveryTime}</span>}
        {offer.providerType === "specialist" && <span><i className="fa-solid fa-shield-halved" /> Проверен ДокМаркетом</span>}
      </div>
      <strong className="market-price">{price}</strong>
      <div className="market-offer-actions">
        <Link className="market-action primary" to={primaryTarget}>{primaryLabel}</Link>
        <button className={`market-action ${favorite ? "active" : ""}`} type="button" onClick={() => refresh(() => { const next = toggleFavorite(offer.id, "offer"); onFavoritesChange?.(next); })}><i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`} />{favorite ? "В избранном" : "В избранное"}</button>
        {isCartEligible(offer) && <button className={`market-action ${inCart ? "active" : ""}`} type="button" onClick={() => refresh(() => toggleCart(offer))}><i className="fa-solid fa-cart-shopping" />{inCart ? "В корзине" : "В корзину"}</button>}
      </div>
    </article>;
    })}
  </div>;
}

function MissingLevel({ backTo = "/market" }) {
  return <MarketFrame>
    <MarketNavigation crumbs={[{ label: "ДокМаркет", to: "/market" }, { label: "Раздел не найден" }]} backTo={backTo} />
    <div className="market-empty market-glass"><h1 className="market-heading">Раздел не найден</h1><p>Проверьте адрес или вернитесь в каталог ДокМаркета.</p></div>
  </MarketFrame>;
}

export default function Market() {
  const { direction, section, category, situation } = useParams();
  const [query, setQuery] = useState("");
  const [, setFavoriteRevision] = useState(0);
  const directionItem = direction ? findDirection(direction) : null;
  const sectionItem = section ? findSection(direction, section) : null;
  const categoryItem = category ? findCategory(direction, section, category) : null;
  const situationItem = situation ? findSituation(direction, section, category, situation) : null;

  const filteredDirections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? directions.filter(item => `${item.title} ${item.description} ${(item.examples || []).join(" ")}`.toLowerCase().includes(normalized)) : directions;
  }, [query]);
  const searchOffers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return offers.filter(offer => {
      const categoryTitle = findCategory(offer.directionSlug, offer.sectionSlug, offer.categorySlug)?.title || "";
      const situationTitle = findSituation(offer.directionSlug, offer.sectionSlug, offer.categorySlug, offer.situationSlug)?.title || "";
      return [
        offer.title,
        offer.description,
        categoryTitle,
        situationTitle,
        offer.providerName,
        offer.type,
        offerTypeLabels[offer.type],
        ...(offer.tags || []),
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [query]);
  const searchSpecialists = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return specialists.filter(item => [item.name, item.profession, item.bio, ...(item.specializations || [])].join(" ").toLowerCase().includes(normalized));
  }, [query]);

  if (direction && !directionItem) return <MissingLevel />;
  if (section && !sectionItem) return <MissingLevel backTo={`/market/${direction}`} />;
  if (category && !categoryItem) return <MissingLevel backTo={`/market/${direction}/${section}`} />;
  if (situation && !situationItem) return <MissingLevel backTo={`/market/${direction}/${section}/${category}`} />;

  if (!direction) return <MarketFrame>
    <section className="market-hero market-glass">
      <div style={{ position: "relative", zIndex: 1 }}>
        <span className="market-kicker"><i className="fa-solid fa-shield-halved" />Проверенные материалы</span>
        <h1 className="market-title">Документы, онлайн-формы и услуги специалистов в одном месте</h1>
        <p className="market-copy">Найдите готовый документ, заполните форму онлайн или обратитесь к проверенному специалисту.</p>
        <p className="market-hero-path">Скачать <i /> Заполнить онлайн <i /> Обратиться</p>
        <div className="market-search-row">
          <label className="market-search"><i className="fa-solid fa-magnifying-glass" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти документ, онлайн-форму, услугу или специалиста" /></label>
        </div>
        <div className="market-quick-searches"><span>Быстрый поиск:</span>{["не выплатили зарплату", "договор аренды", "открыть ИП", "акт сверки", "жалоба"].map(item => <button type="button" onClick={() => setQuery(item)} key={item}>{item}</button>)}</div>
      </div>
    </section>

    {query.trim() ? <section>
      <h2 className="market-heading">Результаты поиска</h2>
      <p className="market-lead">Найдено решений: {searchOffers.length}. Направлений: {filteredDirections.length}. Специалистов: {searchSpecialists.length}.</p>
      {searchOffers.length > 0 && <OffersGrid items={searchOffers} />}
      {filteredDirections.length > 0 && <div style={{ marginTop: searchOffers.length ? 34 : 0 }}><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Направления</h2><CatalogGrid items={filteredDirections} basePath="/market" kind="Направление" /></div>}
      {searchSpecialists.length > 0 && <div style={{ marginTop: 34 }}><h2 className="market-heading" style={{ fontSize: "1.45rem" }}>Специалисты</h2><div className="market-grid">{searchSpecialists.map(item => <Link className="market-card market-glass" to={`/market/specialist/${item.id}`} key={item.id}><span className="market-specialist-avatar">{item.initials}</span><h3 style={{ marginTop: 15 }}>{item.name}</h3><p>{item.profession}</p><span className="market-card-link">Смотреть профиль <i className="fa-solid fa-arrow-right" /></span></Link>)}</div></div>}
      {!searchOffers.length && !searchSpecialists.length && !filteredDirections.length && <div className="market-empty market-glass">По вашему запросу пока ничего не найдено.</div>}
    </section> : <><section id="directions">
      <h2 className="market-heading">Выберите направление</h2>
      <p className="market-lead">Начните с нужной сферы, а дальше выберите документ, онлайн-заполнение или специалиста.</p>
      <CatalogGrid items={filteredDirections} basePath="/market" kind="Направление" directionCards />
    </section>

    <section id="specialists" style={{ marginTop: 34 }}>
      <h2 className="market-heading">Проверенные специалисты</h2>
      <p className="market-lead">Документы, онлайн-формы и услуги размещают специалисты, прошедшие проверку ДокМаркета.</p>
      <div className="market-grid">
        {specialists.map(specialist => <article className="market-card market-specialist-card market-glass" key={specialist.id}>
          <div className="market-specialist-head">
            <span className="market-specialist-avatar">{specialist.initials}</span>
            <div><span className="market-badge"><i className="fa-solid fa-shield-halved" />Проверен ДокМаркетом</span><h3 style={{ margin: "9px 0 0" }}>{specialist.name}</h3></div>
          </div>
          <p style={{ color: "#e5c787", fontWeight: 700, marginBottom: 5 }}>{specialist.profession}</p>
          <p style={{ marginBottom: 12 }}>{specialist.experience}</p>
          <div className="market-examples">{specialist.specializations.slice(0, 3).map(item => <span className="market-example" key={item}>{item}</span>)}</div>
          <div className="market-specialist-stats">
            <span><i className="fa-solid fa-star" style={{ color: "#fbbf24" }} />{specialist.rating} · {specialist.reviewsCount} отзывов</span>
            <span><i className="fa-solid fa-file-lines" />{formatCount(specialist.documentOfferIds.length, ["решение", "решения", "решений"])}</span>
            <span><i className="fa-solid fa-briefcase" />{formatCount(specialist.serviceOfferIds.length, ["услуга", "услуги", "услуг"])}</span>
          </div>
          <div className="market-offer-actions"><Link className="market-action primary" to={`/market/specialist/${specialist.id}`}>Смотреть профиль</Link><button className={`market-action ${isFavorite(specialist.id, "specialist") ? "active" : ""}`} type="button" onClick={() => { toggleFavorite(specialist.id, "specialist"); setFavoriteRevision(value => value + 1); }}><i className={`${isFavorite(specialist.id, "specialist") ? "fa-solid" : "fa-regular"} fa-heart`} />В избранное</button></div>
        </article>)}
      </div>
    </section></>}
  </MarketFrame>;

  const commonCrumbs = [
    { label: "ДокМаркет", to: "/market" },
    { label: directionItem.title, to: section ? `/market/${direction}` : null },
    ...(sectionItem ? [{ label: sectionItem.title, to: category ? `/market/${direction}/${section}` : null }] : []),
    ...(categoryItem ? [{ label: categoryItem.title, to: situation ? `/market/${direction}/${section}/${category}` : null }] : []),
    ...(situationItem ? [{ label: situationItem.title }] : []),
  ];

  if (situationItem) {
    const matchingOffers = offers.filter(item => item.directionSlug === direction && item.sectionSlug === section && item.categorySlug === category && item.situationSlug === situation);
    return <MarketFrame>
      <MarketNavigation crumbs={commonCrumbs} backTo={`/market/${direction}/${section}/${category}`} />
      <h1 className="market-heading">{situationItem.title}</h1>
      <p className="market-lead">Выберите подходящее решение: онлайн-форму от платформы, шаблон специалиста, услугу специалиста, пакет документов или инструкцию.</p>
      <OffersGrid items={matchingOffers} />
    </MarketFrame>;
  }

  if (categoryItem) {
    const items = situations.filter(item => item.directionSlug === direction && item.sectionSlug === section && item.categorySlug === category);
    return <MarketFrame>
      <MarketNavigation crumbs={commonCrumbs} backTo={`/market/${direction}/${section}`} />
      <h1 className="market-heading">{categoryItem.title}</h1>
      <p className="market-lead">Выберите ситуацию, чтобы увидеть подходящие способы решения.</p>
      <CatalogGrid items={items} basePath={`/market/${direction}/${section}/${category}`} pathSuffix="/offers" kind="Ситуация" />
    </MarketFrame>;
  }

  if (sectionItem) {
    const items = categories.filter(item => item.directionSlug === direction && item.sectionSlug === section);
    return <MarketFrame>
      <MarketNavigation crumbs={commonCrumbs} backTo={`/market/${direction}`} />
      <h1 className="market-heading">{sectionItem.title}</h1>
      <p className="market-lead">{sectionItem.description}</p>
      <CatalogGrid items={items} basePath={`/market/${direction}/${section}`} kind="Категория" />
    </MarketFrame>;
  }

  const items = sections.filter(item => item.directionSlug === direction);
  return <MarketFrame>
    <MarketNavigation crumbs={commonCrumbs} backTo="/market" />
    <h1 className="market-heading">{directionItem.title}</h1>
    <p className="market-lead">{directionItem.description}</p>
    <CatalogGrid items={items} basePath={`/market/${direction}`} kind="Раздел" emptyText="Раздел пополняется" />
  </MarketFrame>;
}
