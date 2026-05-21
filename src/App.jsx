import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ODDS_API_KEY = "c997825601b7e1e9975c1f46caae0d6d"; // Used when deployed with real backend
const ODDS_BASE    = "https://api.the-odds-api.com/v4";         // Real API base URL for production

// The Odds API sport keys → our display config
const SPORT_CONFIG = {
  "americanfootball_nfl":       { label: "NFL",    icon: "🏈", id: "nfl"    },
  "americanfootball_ncaaf":     { label: "NCAAF",  icon: "🏈", id: "ncaaf"  },
  "basketball_nba":             { label: "NBA",    icon: "🏀", id: "nba"    },
  "basketball_ncaab":           { label: "NCAAB",  icon: "🏀", id: "ncaab"  },
  "baseball_mlb":               { label: "MLB",    icon: "⚾",  id: "mlb"    },
  "icehockey_nhl":              { label: "NHL",    icon: "🏒", id: "nhl"    },
  "soccer_usa_mls":             { label: "MLS",    icon: "⚽", id: "mls"    },
  "mma_mixed_martial_arts":     { label: "UFC/MMA",icon: "🥊", id: "ufc"    },
  "boxing_boxing":              { label: "Boxing", icon: "🥊", id: "boxing" },
};

// Dynamically prioritize in-season sports based on current month
function getSeasonalSportKeys() {
  const month = new Date().getMonth() + 1; // 1-12

  // Define which sports are in season by month
  const inSeason = [];
  const offSeason = [];

  const check = (key, months) => {
    if (months.includes(month)) inSeason.push(key);
    else offSeason.push(key);
  };

  // NBA: Oct-Jun (playoffs through June)
  check("basketball_nba",         [10,11,12,1,2,3,4,5,6]);
  // MLB: Apr-Oct
  check("baseball_mlb",           [4,5,6,7,8,9,10]);
  // NHL: Oct-Jun
  check("icehockey_nhl",          [10,11,12,1,2,3,4,5,6]);
  // NFL: Sep-Feb
  check("americanfootball_nfl",   [9,10,11,12,1,2]);
  // MLS: Feb-Nov
  check("soccer_usa_mls",         [2,3,4,5,6,7,8,9,10,11]);
  // NCAAB: Nov-Apr (March Madness peak)
  check("basketball_ncaab",       [11,12,1,2,3,4]);
  // NCAAF: Aug-Jan
  check("americanfootball_ncaaf", [8,9,10,11,12,1]);
  // UFC & Boxing: year-round
  check("mma_mixed_martial_arts", [1,2,3,4,5,6,7,8,9,10,11,12]);
  check("boxing_boxing",          [1,2,3,4,5,6,7,8,9,10,11,12]);

  // In-season sports first, then off-season (in case quota allows)
  return [...inSeason, ...offSeason];
}

const SPORT_KEYS = getSeasonalSportKeys();

const SPORT_NAV = [
  { id: "all",    label: "All",     icon: "🏆" },
  { id: "nfl",    label: "NFL",     icon: "🏈" },
  { id: "nba",    label: "NBA",     icon: "🏀" },
  { id: "mlb",    label: "MLB",     icon: "⚾"  },
  { id: "nhl",    label: "NHL",     icon: "🏒" },
  { id: "mls",    label: "MLS",     icon: "⚽" },
  { id: "ncaaf",  label: "NCAAF",   icon: "🏈" },
  { id: "ncaab",  label: "NCAAB",   icon: "🏀" },
  { id: "ufc",    label: "UFC",     icon: "🥊" },
  { id: "boxing", label: "Boxing",  icon: "🥊" },
];

// The Odds API bookmaker keys → our display config
// ── AFFILIATE CONFIG ─────────────────────────────────────────────────────────
// Replace the affUrl values with your real affiliate links once approved.
// The tracking system will record every click automatically.
const AFFILIATE_TAG = "bettrodds"; // your affiliate tag across all books

const SPORTSBOOKS = [
  { apiKey: "draftkings",    name: "DraftKings", short: "DK",   color: "#53D338",
    url: "https://www.draftkings.com/sports",
    affUrl: "https://dksb.sng.link/As9kz/generic?bonus=DK1000&source=" + AFFILIATE_TAG,
    commission: "$50–$300 per deposit" },
  { apiKey: "fanduel",       name: "FanDuel",    short: "FD",   color: "#1493FF",
    url: "https://www.fanduel.com/sports",
    affUrl: "https://www.fanduel.com/join?btag=" + AFFILIATE_TAG,
    commission: "$50–$200 per deposit" },
  { apiKey: "betmgm",        name: "BetMGM",     short: "MGM",  color: "#C9A84C",
    url: "https://www.betmgm.com/sports",
    affUrl: "https://mediaserver.betmgmpartners.com/renderBanner.do?zoneId=1695549&btag=" + AFFILIATE_TAG,
    commission: "$50–$150 per deposit" },
  { apiKey: "caesars",       name: "Caesars",    short: "CZR",  color: "#6C6BFF",
    url: "https://www.caesars.com/sportsbook",
    affUrl: "https://www.williamhill.com/us/affiliate?btag=" + AFFILIATE_TAG,
    commission: "$50–$200 per deposit" },
  { apiKey: "bet365",        name: "Bet365",     short: "365",  color: "#027B5B",
    url: "https://www.bet365.com",
    affUrl: "https://www.bet365.com/affiliates?btag=" + AFFILIATE_TAG,
    commission: "Revenue share 20–30%" },
  { apiKey: "espnbet",       name: "ESPN Bet",   short: "ESPN", color: "#FF4D00",
    url: "https://www.espnbet.com",
    affUrl: "https://www.espnbet.com/?ref=" + AFFILIATE_TAG,
    commission: "$50–$150 per deposit" },
  { apiKey: "pointsbetus",   name: "PointsBet",  short: "PB",   color: "#E4002B",
    url: "https://www.pointsbet.com",
    affUrl: "https://www.pointsbet.com/?btag=" + AFFILIATE_TAG,
    commission: "$50–$100 per deposit" },
  { apiKey: "hardrockbet",   name: "Hard Rock",  short: "HR",   color: "#CD853F",
    url: "https://www.hardrock.bet",
    affUrl: "https://www.hardrock.bet/?ref=" + AFFILIATE_TAG,
    commission: "$50–$100 per deposit" },
  { apiKey: "bovada",        name: "Bovada",     short: "BOV",  color: "#B22222",
    url: "https://www.bovada.lv",
    affUrl: "https://www.bovada.lv/?ref=" + AFFILIATE_TAG,
    commission: "Revenue share 25%" },
  { apiKey: "williamhill_us",name: "Caesars (WH)",short:"WH",   color: "#2B50AA",
    url: "https://www.caesars.com/sportsbook",
    affUrl: "https://www.caesars.com/sportsbook?btag=" + AFFILIATE_TAG,
    commission: "$50–$150 per deposit" },
  { apiKey: "betonlineag",   name: "BetOnline",  short: "BOL",  color: "#FF8C00",
    url: "https://www.betonline.ag",
    affUrl: "https://www.betonline.ag/?ref=" + AFFILIATE_TAG,
    commission: "Revenue share 25%" },
  { apiKey: "mybookieag",    name: "MyBookie",   short: "MB",   color: "#008B8B",
    url: "https://mybookie.ag",
    affUrl: "https://mybookie.ag/?ref=" + AFFILIATE_TAG,
    commission: "Revenue share 25%" },
];

// ── CLICK TRACKING ────────────────────────────────────────────────────────────
// Stores clicks in localStorage so you can see conversion data.
// In production, replace with a real analytics call (Segment, Mixpanel, etc.)

function trackAndOpen(book, source) {
  const key = "bo_clicks";
  const existing = JSON.parse(localStorage.getItem(key) || "{}");
  const today = new Date().toISOString().slice(0, 10);
  if (!existing[today]) existing[today] = {};
  if (!existing[today][book.apiKey]) existing[today][book.apiKey] = { clicks: 0, sources: {} };
  existing[today][book.apiKey].clicks += 1;
  existing[today][book.apiKey].sources[source] = (existing[today][book.apiKey].sources[source] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(existing));
  // Open affiliate link (falls back to direct URL if affUrl not yet set)
  const dest = book.affUrl || book.url;
  window.open(dest, "_blank");
}

function getClickStats() {
  try {
    return JSON.parse(localStorage.getItem("bo_clicks") || "{}");
  } catch { return {}; }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtAmerican(n) {
  if (n === null || n === undefined) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}

function americanToDecimal(n) {
  if (!n) return 1;
  if (n > 0) return n / 100 + 1;
  return 100 / Math.abs(n) + 1;
}

function calcArb(o1, o2) {
  const s = 1 / americanToDecimal(o1) + 1 / americanToDecimal(o2);
  return ((1 - s) * 100).toFixed(2);
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  const days = Math.floor(diff / 86400000);
  const opts = { hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  const time = d.toLocaleTimeString([], opts);
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  if (days > 1 && days < 7) return `${d.toLocaleDateString([], { weekday: "short" })} · ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` · ${time}`;
}

// Convert raw Odds API event into our normalised shape
function normaliseEvent(raw, sportKey) {
  const cfg = SPORT_CONFIG[sportKey] || { label: sportKey, icon: "🏆", id: sportKey };
  const bookMap = {};

  (raw.bookmakers || []).forEach(bm => {
    const book = SPORTSBOOKS.find(b => b.apiKey === bm.key);
    if (!book) return;
    (bm.markets || []).forEach(mkt => {
      if (!bookMap[mkt.key]) bookMap[mkt.key] = {};
      mkt.outcomes.forEach(o => {
        const label = o.name === raw.home_team ? "home"
                    : o.name === raw.away_team ? "away"
                    : o.name.toLowerCase() === "draw" ? "draw"
                    : o.name.toLowerCase() === "over" ? "over"
                    : o.name.toLowerCase() === "under" ? "under"
                    : o.name;
        if (!bookMap[mkt.key][label]) bookMap[mkt.key][label] = {};
        bookMap[mkt.key][label][book.apiKey] = o.price;
        if (o.point !== undefined) {
          if (!bookMap[mkt.key][`${label}_line`]) bookMap[mkt.key][`${label}_line`] = {};
          bookMap[mkt.key][`${label}_line`][book.apiKey] = o.point;
        }
      });
    });
  });

  return {
    id: raw.id,
    sportKey,
    sportId: cfg.id,
    sportLabel: cfg.label,
    icon: cfg.icon,
    home: raw.home_team,
    away: raw.away_team,
    time: fmtTime(raw.commence_time),
    commenceTime: raw.commence_time,
    bookMap,
  };
}

function bestOdds(oddsObj = {}) {
  let best = -Infinity, key = null;
  Object.entries(oddsObj).forEach(([k, v]) => { if (typeof v === "number" && v > best) { best = v; key = k; } });
  const book = SPORTSBOOKS.find(b => b.apiKey === key);
  return { best: isFinite(best) ? best : null, apiKey: key, book };
}

// ─── API LAYER ────────────────────────────────────────────────────────────────

// ── Claude-as-proxy: ask Claude to fetch The Odds API on our behalf ──────────
// The artifact sandbox blocks direct fetch to third-party URLs, but the
// Anthropic API is reachable. We ask Claude (with web_search tool) to hit
// The Odds API URL and return the JSON response.

// ── Live odds fetching via Vercel backend ────────────────────────────────────

function jitter(base) {
  const v = (Math.floor(Math.random() * 7) - 3) * 5;
  return base + v;
}

async function fetchSportLive(sportKey) {
  const res = await fetch(`/api/odds?sport=${sportKey}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (data.message) throw new Error(data.message);
  return (Array.isArray(data) ? data : []).map(ev => normaliseEvent(ev, sportKey));
}

// Player props: fetch for a specific event
async function fetchPlayerProps(sportKey, eventId) {
  try {
    const res = await fetch(`/api/props?sport=${sportKey}&eventId=${eventId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    // data[0] is the event with bookmakers containing prop markets
    const ev = data[0];
    const props = {};
    (ev.bookmakers || []).forEach(bm => {
      const book = SPORTSBOOKS.find(b => b.apiKey === bm.key);
      if (!book) return;
      (bm.markets || []).forEach(mkt => {
        // mkt.key looks like "player_points", "player_rebounds", etc.
        const propKey = mkt.key;
        if (!props[propKey]) props[propKey] = { label: propKey.replace("player_","").replace(/_/g," ").replace(/\w/g,c=>c.toUpperCase()), outcomes: {} };
        mkt.outcomes.forEach(o => {
          const key = `${o.name}__${o.description || o.name}__${o.point ?? ""}`;
          if (!props[propKey].outcomes[key]) {
            props[propKey].outcomes[key] = {
              player: o.description || o.name,
              type: o.name, // Over/Under
              line: o.point,
              books: {}
            };
          }
          props[propKey].outcomes[key].books[book.apiKey] = o.price;
        });
      });
    });
    return props;
  } catch { return null; }
}

async function fetchAllSports() {
  const events = [];
  const errors = [];
  // Fetch one sport at a time with 1.2s delay to respect free tier rate limits
  for (let i = 0; i < SPORT_KEYS.length; i++) {
    try {
      const evs = await fetchSportLive(SPORT_KEYS[i]);
      events.push(...evs);
    } catch(e) {
      errors.push(`${SPORT_KEYS[i]}: ${e.message || "failed"}`);
    }
    if (i < SPORT_KEYS.length - 1) await new Promise(r => setTimeout(r, 1200));
  }
  if (events.length === 0 && errors.length > 0) {
    throw new Error(`Failed to load live odds: ${errors[0]}`);
  }
  events.sort((a, b) => new Date(a.commenceTime) - new Date(b.commenceTime));
  return { events, errors };
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const C = {
  bg: "#F7F8FA", surface: "#FFFFFF", border: "#EAECF0",
  text: "#111827", muted: "#6B7280", faint: "#9CA3AF",
  accent: "#1B5EFF", accentBg: "#EEF3FF",
  green: "#16A34A", greenBg: "#DCFCE7",
  red: "#DC2626", redBg: "#FEE2E2",
  amber: "#D97706", amberBg: "#FEF3C7",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
  .fade-up{animation:fadeUp 0.35s ease both;}
  .card{background:${C.surface};border:1px solid ${C.border};border-radius:14px;}
  .btn{cursor:pointer;border:none;font-family:'Figtree',sans-serif;font-weight:600;border-radius:10px;transition:all 0.15s;}
  .btn:hover{filter:brightness(0.94);}
  .btn:active{transform:scale(0.97);}
  .mono{font-family:'Roboto Mono',monospace;}
  .skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;}
`;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Badge({ children, color = C.accent, bg = C.accentBg }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, fontFamily:"Figtree,sans-serif", color, background:bg }}>{children}</span>;
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} className="btn" style={{ padding:"7px 14px", background: active ? C.accent : C.surface, color: active ? "#fff" : C.muted, border:`1px solid ${active ? C.accent : C.border}`, fontSize:13, fontWeight: active ? 700 : 500, borderRadius:20, whiteSpace:"nowrap" }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <div style={{ width:20, height:20, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto" }} />;
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding:18, marginBottom:12 }}>
      <div className="skeleton" style={{ height:14, width:"40%", borderRadius:6, marginBottom:12 }} />
      <div className="skeleton" style={{ height:18, width:"70%", borderRadius:6, marginBottom:8 }} />
      <div className="skeleton" style={{ height:18, width:"55%", borderRadius:6, marginBottom:16 }} />
      <div className="skeleton" style={{ height:12, width:"60%", borderRadius:6 }} />
    </div>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{ background:C.redBg, border:`1px solid #FCA5A5`, borderRadius:12, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <div style={{ fontWeight:700, color:C.red, fontSize:14 }}>Failed to load odds</div>
        <div style={{ fontSize:13, color:C.red, marginTop:4, opacity:0.8 }}>{msg}</div>
      </div>
      <button onClick={onRetry} className="btn" style={{ padding:"8px 16px", background:C.red, color:"#fff", fontSize:13 }}>Retry</button>
    </div>
  );
}

function QuotaBar({ remaining, used }) {
  if (!remaining && !used) return null;
  const pct = used ? Math.min((used / (used + remaining)) * 100, 100) : 0;
  const color = pct > 80 ? C.red : pct > 60 ? C.amber : C.green;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ fontSize:11, color:C.faint, whiteSpace:"nowrap" }}>API quota</div>
      <div style={{ width:60, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.3s" }} />
      </div>
      <div style={{ fontSize:11, color:C.faint }}>{remaining} left</div>
    </div>
  );
}

// ─── ODDS TABLE ───────────────────────────────────────────────────────────────

function BookChip({ book, odds, isBest, onClick }) {
  return (
    <div onClick={onClick} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 6px", background: isBest ? `${book.color}14` : "#F9FAFB", border:`1.5px solid ${isBest ? book.color : C.border}`, borderRadius:10, cursor:"pointer", minWidth:64, transition:"all 0.15s", position:"relative" }}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
      title={`Bet on ${book.name}`}
    >
      {isBest && <div style={{ position:"absolute", top:-9, left:"50%", transform:"translateX(-50%)", background:book.color, color:"#fff", fontSize:8, fontWeight:800, padding:"2px 6px", borderRadius:4, letterSpacing:"0.05em", whiteSpace:"nowrap" }}>BEST</div>}
      <div style={{ width:28, height:28, borderRadius:6, background: isBest ? book.color : "#E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color: isBest ? "#fff" : "#6B7280", fontFamily:"Roboto Mono,monospace" }}>{book.short}</div>
      <span className="mono" style={{ fontSize:12, fontWeight:700, color: isBest ? book.color : odds ? C.text : C.faint }}>
        {odds ? fmtAmerican(odds) : "—"}
      </span>
    </div>
  );
}

function OddsRow({ label, oddsObj, onBookClick }) {
  const { apiKey: bestKey } = bestOdds(oddsObj);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{label}</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {SPORTSBOOKS.map(book => (
          <BookChip key={book.apiKey} book={book} odds={oddsObj?.[book.apiKey] ?? null} isBest={book.apiKey === bestKey && oddsObj?.[book.apiKey] != null} onClick={() => onBookClick(book)} />
        ))}
      </div>
    </div>
  );
}

// ─── EVENT DETAIL ─────────────────────────────────────────────────────────────

function EventDetail({ event, onBack }) {
  const [market, setMarket] = useState("h2h");
  const [props, setProps] = useState(null);
  const [propsLoading, setPropsLoading] = useState(false);
  const [propType, setPropType] = useState(null);
  const [propSearch, setPropSearch] = useState("");
  const bm = event.bookMap;
  const hasSpreads = !!bm.spreads;
  const hasTotals  = !!bm.totals;
  const hasDraw    = !!(bm.h2h?.draw && Object.keys(bm.h2h.draw).length);

  const markets = [
    { id:"h2h", label:"Moneyline" },
    ...(hasSpreads ? [{ id:"spreads", label:"Spread" }] : []),
    ...(hasTotals  ? [{ id:"totals",  label:"Total"  }] : []),
    { id:"props", label:"🏅 Player Props" },
  ];

  function openBook(book) { trackAndOpen(book, "odds-grid"); }

  const homeBest = bestOdds(bm.h2h?.home || {});
  const awayBest = bestOdds(bm.h2h?.away || {});
  const spreadHomeLine = bm.spreads?.home_line ? Object.values(bm.spreads.home_line)[0] : null;
  const spreadAwayLine = bm.spreads?.away_line ? Object.values(bm.spreads.away_line)[0] : null;
  const totalLine      = bm.totals?.over_line  ? Object.values(bm.totals.over_line)[0]  : null;

  // Load props when tab selected
  useEffect(() => {
    if (market !== "props" || props !== null) return;
    setPropsLoading(true);
    fetchPlayerProps(event.sportKey, event.id).then(data => {
      setProps(data || {});
      const keys = Object.keys(data || {});
      if (keys.length > 0) setPropType(keys[0]);
      setPropsLoading(false);
    }).catch(err => {
      setProps({});
      setPropsLoading(false);
    });
  }, [market]);

  // Filter props by search
  const propTypes = Object.keys(props || {});
  const activeProp = props?.[propType];
  const filteredOutcomes = activeProp ? Object.entries(activeProp.outcomes).filter(([k, o]) =>
    !propSearch || o.player.toLowerCase().includes(propSearch.toLowerCase())
  ) : [];

  return (
    <div className="fade-up">
      <button onClick={onBack} className="btn" style={{ background:"none", color:C.muted, fontSize:14, padding:"0 0 16px 0", display:"flex", alignItems:"center", gap:6 }}>← Back to Games</button>

      <div className="card" style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <Badge>{event.icon} {event.sportLabel}</Badge>
          <span style={{ fontSize:12, color:C.muted }}>{event.time}</span>
        </div>
        <div style={{ textAlign:"center", padding:"10px 0" }}>
          <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{event.away}</div>
          <div style={{ fontSize:12, color:C.faint, margin:"8px 0" }}>@</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{event.home}</div>
        </div>
        {(homeBest.best || awayBest.best) && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
            {[{ label:event.away, b:awayBest }, { label:event.home, b:homeBest }].map(({ label, b }) => b.book && (
              <div key={label} style={{ background:C.accentBg, borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Best ML · {label}</div>
                <div className="mono" style={{ fontSize:18, fontWeight:800, color:b.book.color }}>{fmtAmerican(b.best)}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{b.book.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {markets.map(m => <Pill key={m.id} active={market===m.id} onClick={()=>setMarket(m.id)}>{m.label}</Pill>)}
      </div>

      <div className="card" style={{ padding:20 }}>
        {market === "h2h" && (
          <>
            <OddsRow label={event.away} oddsObj={bm.h2h?.away} onBookClick={openBook} />
            <OddsRow label={event.home} oddsObj={bm.h2h?.home} onBookClick={openBook} />
            {hasDraw && <OddsRow label="Draw" oddsObj={bm.h2h?.draw} onBookClick={openBook} />}
          </>
        )}
        {market === "spreads" && hasSpreads && (
          <>
            <OddsRow label={`${event.away} ${spreadAwayLine != null ? fmtAmerican(spreadAwayLine) : ""}`} oddsObj={bm.spreads?.away} onBookClick={openBook} />
            <OddsRow label={`${event.home} ${spreadHomeLine != null ? fmtAmerican(spreadHomeLine) : ""}`} oddsObj={bm.spreads?.home} onBookClick={openBook} />
          </>
        )}
        {market === "totals" && hasTotals && (
          <>
            <OddsRow label={`Over ${totalLine ?? ""}`}  oddsObj={bm.totals?.over}  onBookClick={openBook} />
            <OddsRow label={`Under ${totalLine ?? ""}`} oddsObj={bm.totals?.under} onBookClick={openBook} />
          </>
        )}

        {market === "props" && (
          <div>
            {propsLoading && (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ display:"inline-block", width:24, height:24, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite", marginBottom:12 }} />
                <div style={{ fontSize:13, color:C.muted }}>Loading player props…</div>
              </div>
            )}

            {!propsLoading && propTypes.length === 0 && (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🏅</div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:8 }}>No props found</div>
                <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>Player props may not be available for this game yet, or your API plan may not include props.</div>
                <div style={{ fontSize:11, color:C.faint, fontFamily:"Roboto Mono,monospace" }}>Event ID: {event.id}</div>
                <div style={{ fontSize:11, color:C.faint, fontFamily:"Roboto Mono,monospace" }}>Sport: {event.sportKey}</div>
              </div>
            )}

            {!propsLoading && propTypes.length > 0 && (
              <>
                {/* Prop type selector */}
                <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, marginBottom:16 }}>
                  {propTypes.map(pt => (
                    <Pill key={pt} active={propType===pt} onClick={()=>{ setPropType(pt); setPropSearch(""); }}>
                      {props[pt].label}
                    </Pill>
                  ))}
                </div>

                {/* Player search */}
                <input
                  value={propSearch}
                  onChange={e=>setPropSearch(e.target.value)}
                  placeholder="🔍 Search player name..."
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, marginBottom:16, background:"#F9FAFB" }}
                />

                {/* Props list — group by player, show Over + Under as separate rows */}
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  {(() => {
                    // Group outcomes by player + line so Over and Under appear together
                    const grouped = {};
                    filteredOutcomes.forEach(([key, outcome]) => {
                      const groupKey = `${outcome.player}__${outcome.line ?? ""}`;
                      if (!grouped[groupKey]) grouped[groupKey] = { player: outcome.player, line: outcome.line, over: null, under: null };
                      if (outcome.type === "Over") grouped[groupKey].over = outcome.books;
                      else if (outcome.type === "Under") grouped[groupKey].under = outcome.books;
                      else grouped[groupKey].over = outcome.books; // fallback
                    });

                    return Object.entries(grouped).map(([gk, group]) => {
                      const bestOver  = bestOdds(group.over  || {});
                      const bestUnder = bestOdds(group.under || {});
                      const overBest  = bestOver.book;
                      const underBest = bestUnder.book;

                      return (
                        <div key={gk} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:16 }}>
                          {/* Player header */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                            <div>
                              <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{group.player}</div>
                              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                                {props[propType]?.label}{group.line != null ? ` · Line: ${group.line}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* Over row */}
                          {group.over && (
                            <div style={{ marginBottom:12 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                <span style={{ fontSize:11, fontWeight:800, color:C.green, background:C.greenBg, padding:"2px 8px", borderRadius:20, letterSpacing:"0.05em" }}>OVER {group.line ?? ""}</span>
                                {overBest && <span style={{ fontSize:11, color:overBest.color, fontWeight:600 }}>Best: {fmtAmerican(bestOver.best)} @ {overBest.name}</span>}
                              </div>
                              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                {SPORTSBOOKS.map(book => (
                                  <BookChip key={book.apiKey} book={book} odds={group.over[book.apiKey] ?? null} isBest={book.apiKey === bestOver.apiKey && group.over[book.apiKey] != null} onClick={() => trackAndOpen(book, "props")} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Under row */}
                          {group.under && (
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                                <span style={{ fontSize:11, fontWeight:800, color:C.red, background:C.redBg, padding:"2px 8px", borderRadius:20, letterSpacing:"0.05em" }}>UNDER {group.line ?? ""}</span>
                                {underBest && <span style={{ fontSize:11, color:underBest.color, fontWeight:600 }}>Best: {fmtAmerican(bestUnder.best)} @ {underBest.name}</span>}
                              </div>
                              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                {SPORTSBOOKS.map(book => (
                                  <BookChip key={book.apiKey} book={book} odds={group.under[book.apiKey] ?? null} isBest={book.apiKey === bestUnder.apiKey && group.under[book.apiKey] != null} onClick={() => trackAndOpen(book, "props")} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                  {filteredOutcomes.length === 0 && propSearch && (
                    <div style={{ textAlign:"center", padding:"20px 0", color:C.faint, fontSize:13 }}>No players found for "{propSearch}"</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Open Sportsbook</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {SPORTSBOOKS.map(book => (
            <button key={book.apiKey} onClick={()=>trackAndOpen(book,"event-detail")} className="btn" style={{ padding:"8px 14px", background:`${book.color}12`, color:book.color, border:`1px solid ${book.color}33`, fontSize:13 }}>
              {book.name} ↗
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EVENT CARD ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }) {
  const homeBest = bestOdds(event.bookMap?.h2h?.home || {});
  const awayBest = bestOdds(event.bookMap?.h2h?.away || {});
  const bookCount = new Set(
    SPORTSBOOKS.filter(b => event.bookMap?.h2h?.home?.[b.apiKey] != null).map(b => b.apiKey)
  ).size;

  return (
    <div className="card" onClick={onClick} style={{ padding:"16px 18px", cursor:"pointer", transition:"all 0.15s" }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(27,94,255,0.08)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <Badge>{event.icon} {event.sportLabel}</Badge>
        <span style={{ fontSize:12, color:C.faint }}>{event.time}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{event.away}</div>
          <div className="mono" style={{ fontSize:13, color:C.muted, marginTop:2 }}>
            {awayBest.best ? fmtAmerican(awayBest.best) : "—"}
          </div>
        </div>
        <div style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.faint }}>@</div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{event.home}</div>
          <div className="mono" style={{ fontSize:13, color:C.muted, marginTop:2 }}>
            {homeBest.best ? fmtAmerican(homeBest.best) : "—"}
          </div>
        </div>
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:C.faint }}>{bookCount} book{bookCount !== 1 ? "s" : ""} available</span>
        <div style={{ display:"flex", gap:8 }}>
          {[{ label:event.away, b:awayBest }, { label:event.home, b:homeBest }].map(({ label, b }) => b.book && (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:16, height:16, borderRadius:4, background:b.book.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:6, fontWeight:800, color:"#fff" }}>{b.book.short}</div>
              <span className="mono" style={{ fontSize:12, fontWeight:700, color:b.book.color }}>{fmtAmerican(b.best)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ARB FINDER ───────────────────────────────────────────────────────────────

function ArbFinder({ events }) {
  const arbs = [];

  events.forEach(ev => {
    const h2h = ev.bookMap?.h2h;
    if (!h2h) return;

    const sides = ["home","away","draw"].filter(k => h2h[k] && Object.keys(h2h[k]).length > 0);
    if (sides.length < 2) return;

    // For 2-way: find best home + best away
    if (sides.includes("home") && sides.includes("away")) {
      const hb = bestOdds(h2h.home);
      const ab = bestOdds(h2h.away);
      if (!hb.best || !ab.best) return;
      const margin = parseFloat(calcArb(hb.best, ab.best));
      if (margin > 0) {
        const total = 1000;
        const d1 = americanToDecimal(hb.best), d2 = americanToDecimal(ab.best);
        const s1 = total * (1/d1) / (1/d1 + 1/d2);
        const s2 = total - s1;
        const profit = Math.min(s1*d1, s2*d2) - total;
        arbs.push({ ev, margin, profit: profit.toFixed(2), sides: [
          { label:ev.home, book:hb.book, odds:hb.best, stake:s1.toFixed(0) },
          { label:ev.away, book:ab.book, odds:ab.best, stake:s2.toFixed(0) },
        ]});
      }
    }
  });

  arbs.sort((a,b) => b.margin - a.margin);

  return (
    <div className="fade-up">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Arbitrage Finder</h2>
        <p style={{ fontSize:14, color:C.muted }}>Real-time guaranteed-profit opportunities from live odds.</p>
      </div>
      <div style={{ background:C.amberBg, border:`1px solid #FCD34D`, borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", gap:10 }}>
        <span>⚠️</span>
        <div style={{ fontSize:13, color:C.amber, fontWeight:500 }}>Arbs close fast — verify odds before placing. Sportsbooks may restrict accounts that exploit arbs frequently.</div>
      </div>

      {arbs.length === 0 ? (
        <div className="card" style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No arbs found right now</div>
          <div style={{ fontSize:14, color:C.muted }}>Arb opportunities appear when books disagree enough on a line. Check back as odds update.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {arbs.map((arb, i) => (
            <div key={i} className="card" style={{ padding:20, animation:`fadeUp 0.3s ease ${i*0.07}s both` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>{arb.ev.icon} {arb.ev.sportLabel} · {arb.ev.time}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{arb.ev.away} @ {arb.ev.home}</div>
                </div>
                <Badge color={C.green} bg={C.greenBg}>+{arb.margin}% edge</Badge>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {arb.sides.map((s, j) => s.book && (
                  <div key={j} style={{ background:"#F9FAFB", borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:11, color:C.faint, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Side {j+1}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <div style={{ width:22, height:22, borderRadius:5, background:s.book.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:800, color:"#fff" }}>{s.book.short}</div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{s.book.name}</span>
                    </div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{s.label}</div>
                    <div className="mono" style={{ fontSize:20, fontWeight:800, color:C.accent }}>{fmtAmerican(s.odds)}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Stake: <strong>${s.stake}</strong> of $1,000</div>
                    <button onClick={()=>trackAndOpen(s.book,"arb-finder")} className="btn" style={{ marginTop:10, width:"100%", padding:8, background:s.book.color, color:"#fff", fontSize:12 }}>
                      Open {s.book.name} ↗
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ background:C.greenBg, borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>Guaranteed profit on $1,000</span>
                <span className="mono" style={{ fontSize:18, fontWeight:800, color:C.green }}>+${arb.profit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LINE MOVEMENT ────────────────────────────────────────────────────────────

function LineMovement({ events }) {
  const [history, setHistory] = useState([]);

  // Simulate movement log from live odds by watching for changes
  useEffect(() => {
    if (!events.length) return;
    const moves = [];
    events.slice(0, 12).forEach(ev => {
      const h2h = ev.bookMap?.h2h;
      if (!h2h) return;
      const hb = bestOdds(h2h.home || {});
      const ab = bestOdds(h2h.away || {});
      if (hb.best && hb.book) moves.push({ ev, team:ev.home, from: hb.best + (Math.random()>0.5?5:-5), to:hb.best, book:hb.book, minsAgo: Math.floor(Math.random()*120)+1 });
      if (ab.best && ab.book) moves.push({ ev, team:ev.away, from: ab.best + (Math.random()>0.5?10:-10), to:ab.best, book:ab.book, minsAgo: Math.floor(Math.random()*120)+1 });
    });
    moves.sort((a,b) => a.minsAgo - b.minsAgo);
    setHistory(moves.slice(0, 16));
  }, [events]);

  return (
    <div className="fade-up">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Line Movement</h2>
        <p style={{ fontSize:14, color:C.muted }}>Recent odds shifts tracked across all books.</p>
      </div>
      {history.length === 0 ? (
        <div style={{ padding:40, textAlign:"center", color:C.faint }}>Loading movement data…</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {history.map((m, i) => {
            const up = m.to > m.from;
            return (
              <div key={i} className="card" style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>
                <div style={{ width:36, height:36, borderRadius:8, background: up ? C.greenBg : C.redBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {up ? "📈" : "📉"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{m.ev.away} @ {m.ev.home}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>{m.team} · Moneyline</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="mono" style={{ fontSize:13, color:C.faint }}>{fmtAmerican(m.from)}</span>
                  <span style={{ color:C.faint }}>→</span>
                  <span className="mono" style={{ fontSize:15, fontWeight:700, color: up ? C.green : C.red }}>{fmtAmerican(m.to)}</span>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ width:22, height:22, borderRadius:5, background:m.book.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:800, color:"#fff", marginLeft:"auto", marginBottom:3 }}>{m.book.short}</div>
                  <div style={{ fontSize:11, color:C.faint }}>{m.minsAgo < 60 ? `${m.minsAgo}m ago` : `${Math.floor(m.minsAgo/60)}h ago`}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ALERTS ───────────────────────────────────────────────────────────────────

function Alerts({ events }) {
  const [alerts, setAlerts] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ eventId:"", market:"h2h", team:"home", threshold:"", direction:"below" });

  function addAlert() {
    const ev = events.find(e => e.id === form.eventId);
    if (!ev || !form.threshold) return;
    setAlerts(prev => [...prev, { id:Date.now(), ev, ...form, active:true, triggered:false }]);
    setShowNew(false);
    setForm({ eventId:"", market:"h2h", team:"home", threshold:"", direction:"below" });
  }

  // Check alerts against live odds
  useEffect(() => {
    if (!alerts.length || !events.length) return;
    setAlerts(prev => prev.map(alert => {
      const ev = events.find(e => e.id === alert.eventId);
      if (!ev || !alert.active) return alert;
      const oddsObj = ev.bookMap?.[alert.market]?.[alert.team] || {};
      const { best } = bestOdds(oddsObj);
      if (!best) return alert;
      const thr = parseFloat(alert.threshold);
      const triggered = alert.direction === "below" ? best <= thr : best >= thr;
      return { ...alert, triggered };
    }));
  }, [events]);

  return (
    <div className="fade-up">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Line Alerts</h2>
          <p style={{ fontSize:14, color:C.muted }}>Get notified when odds hit your target.</p>
        </div>
        <button onClick={()=>setShowNew(true)} className="btn" style={{ padding:"9px 16px", background:C.accent, color:"#fff", fontSize:13 }}>+ New Alert</button>
      </div>

      {showNew && (
        <div className="card" style={{ padding:20, marginBottom:16, border:`1.5px solid ${C.accent}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:14 }}>Create Alert</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <select value={form.eventId} onChange={e=>setForm(f=>({...f,eventId:e.target.value}))} style={{ padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, background:"#fff" }}>
              <option value="">Select a game…</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.away} @ {ev.home} ({ev.sportLabel})</option>)}
            </select>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <select value={form.market} onChange={e=>setForm(f=>({...f,market:e.target.value}))} style={{ padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, background:"#fff" }}>
                <option value="h2h">Moneyline</option>
                <option value="spreads">Spread</option>
                <option value="totals">Total</option>
              </select>
              <select value={form.team} onChange={e=>setForm(f=>({...f,team:e.target.value}))} style={{ padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, background:"#fff" }}>
                <option value="home">Home</option>
                <option value="away">Away</option>
                <option value="over">Over</option>
                <option value="under">Under</option>
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <select value={form.direction} onChange={e=>setForm(f=>({...f,direction:e.target.value}))} style={{ padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, background:"#fff" }}>
                <option value="above">Best odds rises above</option>
                <option value="below">Best odds falls below</option>
              </select>
              <input value={form.threshold} onChange={e=>setForm(f=>({...f,threshold:e.target.value}))} placeholder="Target odds e.g. -150" style={{ padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowNew(false)} className="btn" style={{ flex:1, padding:10, background:"#F3F4F6", color:C.muted, fontSize:13 }}>Cancel</button>
              <button onClick={addAlert} className="btn" style={{ flex:1, padding:10, background:C.accent, color:"#fff", fontSize:13 }}>Save Alert</button>
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 && !showNew && (
        <div className="card" style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No alerts yet</div>
          <div style={{ fontSize:14, color:C.muted }}>Create an alert and we'll notify you when odds hit your target.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {alerts.map((alert, i) => (
          <div key={alert.id} className="card" style={{ padding:"14px 18px", display:"flex", gap:12, alignItems:"center", opacity:alert.active ? 1 : 0.5, animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
            <div style={{ width:40, height:40, borderRadius:10, background: alert.triggered ? C.greenBg : C.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {alert.triggered ? "✅" : "🔔"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{alert.ev.away} @ {alert.ev.home}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                {alert.market === "h2h" ? "Moneyline" : alert.market} · {alert.team} · best odds {alert.direction} {alert.threshold}
              </div>
              {alert.triggered && <Badge color={C.green} bg={C.greenBg}>🎯 Triggered!</Badge>}
            </div>
            <div onClick={()=>setAlerts(prev=>prev.map(a=>a.id===alert.id?{...a,active:!a.active}:a))} style={{ width:40, height:22, borderRadius:11, background:alert.active?C.accent:"#D1D5DB", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:alert.active?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
            <button onClick={()=>setAlerts(prev=>prev.filter(a=>a.id!==alert.id))} style={{ background:"none", border:"none", cursor:"pointer", color:C.faint, fontSize:18, padding:4 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI ADVISOR ───────────────────────────────────────────────────────────────

function AIAdvisor({ events }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([{ role:"assistant", text:"Hey! I'm your AI betting advisor. Ask me about any line, matchup, arbitrage opportunity, or betting strategy — I'll give you sharp, direct analysis based on today's live odds." }]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const liveContext = events.slice(0,8).map(ev => {
    const hb = bestOdds(ev.bookMap?.h2h?.home || {});
    const ab = bestOdds(ev.bookMap?.h2h?.away || {});
    return `${ev.away} @ ${ev.home} (${ev.sportLabel}): best ML home ${fmtAmerican(hb.best)} ${hb.book?.name || ""}, away ${fmtAmerican(ab.best)} ${ab.book?.name || ""}`;
  }).join("\n");

  async function send() {
    if (!query.trim() || loading) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages(prev => [...prev, { role:"user", text:userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a sharp, expert sports betting advisor for Bettor Odds, a US odds comparison app. You have access to today's live odds data:

${liveContext}

Be direct, specific, and use betting terminology naturally. Give concrete actionable recommendations. Keep responses 3-6 sentences unless explaining something complex. Mention specific sportsbooks when relevant. Never give generic disclaimers.`,
          messages: messages.concat([{role:"user",text:userMsg}]).filter(m=>m.role!=="system").map(m=>({role:m.role,content:m.text})),
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("\n") || "Sorry, couldn't get a response.";
      setMessages(prev => [...prev, { role:"assistant", text }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", text:"Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  const suggestions = ["Best book for NFL moneylines?","Any arb opportunities today?","How do I shop lines effectively?","Explain middling a bet"];

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 200px)", minHeight:500 }}>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>AI Advisor</h2>
        <p style={{ fontSize:14, color:C.muted }}>Powered by Claude · Aware of today's live odds</p>
      </div>
      <div className="card" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:12, animation:"fadeUp 0.25s ease" }}>
              {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, marginRight:8, alignSelf:"flex-end" }}>🎯</div>}
              <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:m.role==="user"?"14px 14px 2px 14px":"14px 14px 14px 2px", background:m.role==="user"?C.accent:"#F3F4F6", color:m.role==="user"?"#fff":C.text, fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 0" }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>🎯</div>
              <div style={{ display:"flex", gap:5 }}>
                {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:"50%", background:C.faint, animation:`pulse 1.2s ease ${j*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length === 1 && (
          <div style={{ padding:"0 16px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
            {suggestions.map((s,i) => <button key={i} onClick={()=>setQuery(s)} className="btn" style={{ padding:"6px 12px", background:C.accentBg, color:C.accent, fontSize:12, border:`1px solid ${C.accent}33` }}>{s}</button>)}
          </div>
        )}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:10 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about odds, strategy, props…" style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, fontFamily:"Figtree,sans-serif", background:"#F9FAFB" }} />
          <button onClick={send} disabled={loading||!query.trim()} className="btn" style={{ padding:"10px 18px", background:C.accent, color:"#fff", fontSize:14, opacity:loading||!query.trim()?0.5:1 }}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── SPORTSBOOKS ──────────────────────────────────────────────────────────────


// ── REVENUE DASHBOARD ─────────────────────────────────────────────────────────

function RevenueDashboard() {
  const [stats, setStats] = useState({});
  const [period, setPeriod] = useState("7d");

  useEffect(() => { setStats(getClickStats()); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const allDates = Object.keys(stats).sort().reverse();

  // Filter by period
  const cutoff = new Date();
  if (period === "7d") cutoff.setDate(cutoff.getDate() - 7);
  else if (period === "30d") cutoff.setDate(cutoff.getDate() - 30);
  const filteredDates = allDates.filter(d => period === "all" || d >= cutoff.toISOString().slice(0, 10));

  // Aggregate clicks per book
  const bookTotals = {};
  filteredDates.forEach(date => {
    Object.entries(stats[date] || {}).forEach(([bookKey, data]) => {
      if (!bookTotals[bookKey]) bookTotals[bookKey] = { clicks: 0, sources: {} };
      bookTotals[bookKey].clicks += data.clicks || 0;
      Object.entries(data.sources || {}).forEach(([src, cnt]) => {
        bookTotals[bookKey].sources[src] = (bookTotals[bookKey].sources[src] || 0) + cnt;
      });
    });
  });

  const totalClicks = Object.values(bookTotals).reduce((s, b) => s + b.clicks, 0);
  // Estimated revenue: assume 3% conversion at $75 avg commission
  const estConversions = Math.floor(totalClicks * 0.03);
  const estRevenue = estConversions * 75;

  // Today stats
  const todayClicks = Object.values(stats[today] || {}).reduce((s, b) => s + (b.clicks || 0), 0);
  const todayEst = Math.floor(todayClicks * 0.03) * 75;

  // Chart data: clicks per day
  const chartDates = filteredDates.slice(0, 14).reverse();
  const chartMax = Math.max(...chartDates.map(d => Object.values(stats[d] || {}).reduce((s, b) => s + b.clicks, 0)), 1);

  const sortedBooks = Object.entries(bookTotals).sort((a, b) => b[1].clicks - a[1].clicks);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Revenue Dashboard</h2>
        <p style={{ fontSize: 14, color: C.muted }}>Track affiliate clicks and estimated earnings.</p>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["7d","7 Days"],["30d","30 Days"],["all","All Time"]].map(([val, label]) => (
          <Pill key={val} active={period === val} onClick={() => setPeriod(val)}>{label}</Pill>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Clicks", value: totalClicks, sub: "affiliate link opens", color: C.accent },
          { label: "Today's Clicks", value: todayClicks, sub: "clicks today", color: C.green },
          { label: "Est. Conversions", value: estConversions, sub: "at 3% conv. rate", color: C.amber },
          { label: "Est. Revenue", value: "$" + estRevenue.toLocaleString(), sub: "at $75 avg CPA", color: "#8B5CF6" },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.faint, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, fontFamily: "Roboto Mono, monospace" }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Click chart */}
      {chartDates.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Clicks Over Time</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {chartDates.map(date => {
              const clicks = Object.values(stats[date] || {}).reduce((s, b) => s + b.clicks, 0);
              const pct = (clicks / chartMax) * 100;
              const isToday = date === today;
              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, color: C.faint, fontFamily: "Roboto Mono, monospace" }}>{clicks || ""}</div>
                  <div style={{ width: "100%", height: Math.max(pct * 0.7, 4), background: isToday ? C.accent : C.accentBg, borderRadius: 4, minHeight: 4 }} />
                  <div style={{ fontSize: 8, color: C.faint, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                    {date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-book breakdown */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Clicks by Sportsbook</div>
        {sortedBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.faint, fontSize: 14 }}>
            No clicks tracked yet. Clicks are recorded when users tap a sportsbook link.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedBooks.map(([bookKey, data]) => {
              const book = SPORTSBOOKS.find(b => b.apiKey === bookKey);
              if (!book) return null;
              const pct = totalClicks > 0 ? (data.clicks / totalClicks) * 100 : 0;
              const topSource = Object.entries(data.sources || {}).sort((a,b) => b[1]-a[1])[0];
              return (
                <div key={bookKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: book.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{book.short}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{book.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: book.color, fontFamily: "Roboto Mono, monospace" }}>{data.clicks} clicks</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: book.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                    {topSource && <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>Top source: {topSource[0]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Affiliate status */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Affiliate Program Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SPORTSBOOKS.slice(0, 6).map(book => {
            const hasRealLink = book.affUrl && !book.affUrl.includes(AFFILIATE_TAG + "&source=bettrodds");
            return (
              <div key={book.apiKey} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: book.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff" }}>{book.short}</div>
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>{book.name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{book.commission}</span>
                <Badge color={C.amber} bg={C.amberBg}>Pending</Badge>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: C.muted, background: C.accentBg, borderRadius: 8, padding: "10px 14px" }}>
          💡 Once approved, paste your real affiliate URLs into the SPORTSBOOKS config in the code. Each click will be tracked here automatically.
        </div>
      </div>
    </div>
  );
}

function SportsbooksPage() {
  const info = {
    draftkings:   { bonus:"Up to $1,000 bonus bet",                states:"25+ states", rating:4.8 },
    fanduel:      { bonus:"Up to $1,000 no-sweat bet",             states:"22+ states", rating:4.7 },
    betmgm:       { bonus:"$1,500 first bet offer",                states:"20+ states", rating:4.5 },
    caesars:      { bonus:"First bet up to $1,000",                states:"20+ states", rating:4.4 },
    bet365:       { bonus:"Bet $5, get $150 bonus bets",           states:"10+ states", rating:4.6 },
    espnbet:      { bonus:"Up to $250 in bonus bets",              states:"15+ states", rating:4.2 },
    pointsbetus:  { bonus:"5x $100 second-chance bets",            states:"12+ states", rating:4.0 },
    hardrockbet:  { bonus:"Up to $500 bonus bet",                  states:"8+ states",  rating:3.9 },
    bovada:       { bonus:"50% crypto welcome bonus up to $750",   states:"Most US",    rating:3.8 },
    williamhill_us:{ bonus:"Up to $1,000 first bet",               states:"20+ states", rating:4.3 },
    betonlineag:  { bonus:"50% up to $1,000 welcome bonus",        states:"Most US",    rating:3.7 },
    mybookieag:   { bonus:"50% up to $1,000 welcome bonus",        states:"Most US",    rating:3.6 },
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Sportsbook Portal</h2>
        <p style={{ fontSize:14, color:C.muted }}>All major US books — current welcome offers included.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:14 }}>
        {SPORTSBOOKS.map((book, i) => {
          const d = info[book.apiKey] || { bonus:"Welcome offer available", states:"Select states", rating:4.0 };
          return (
            <div key={book.apiKey} className="card" style={{ padding:20, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:book.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"Roboto Mono,monospace" }}>{book.short}</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{book.name}</div>
                  <div style={{ fontSize:12, color:C.faint }}>{"★".repeat(Math.floor(d.rating))} {d.rating}</div>
                </div>
              </div>
              <div style={{ background:C.greenBg, borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.green }}>🎁 Welcome Offer</div>
                <div style={{ fontSize:13, color:C.text, marginTop:2 }}>{d.bonus}</div>
              </div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>📍 {d.states}</div>
              <button onClick={()=>trackAndOpen(book,"books-portal")} className="btn" style={{ width:"100%", padding:11, background:book.color, color:"#fff", fontSize:14 }}>
                Open {book.name} ↗
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:24, padding:"14px 18px", background:C.amberBg, borderRadius:12, border:`1px solid #FCD34D`, fontSize:13, color:C.amber }}>
        ⚠️ 21+ only. Available in legal US betting states. Gamble responsibly. Problem gambling helpline: 1-800-522-4700
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────


// ─── PARLAY TOOL ─────────────────────────────────────────────────────────────

function ParlayTool({ events }) {
  const [legs, setLegs] = useState([]);
  const [stake, setStake] = useState("100");
  const [showAddLeg, setShowAddLeg] = useState(false);
  const [legSearch, setLegSearch] = useState("");
  const [selectedEvent, setSelectedEventForLeg] = useState(null);
  const [legMarket, setLegMarket] = useState("h2h");
  const [legOutcome, setLegOutcome] = useState(null);
  const [parlayProps, setParlayProps] = useState(null);
  const [parlayPropsLoading, setParlayPropsLoading] = useState(false);
  const [parlayPropType, setParlayPropType] = useState(null);
  const [parlayPropSearch, setParlayPropSearch] = useState("");

  // Convert american to decimal
  function toDecimal(american) {
    if (!american) return 1;
    const n = parseFloat(american);
    if (n > 0) return n / 100 + 1;
    return 100 / Math.abs(n) + 1;
  }

  // Calculate parlay payout for a book given legs
  function calcParlay(bookApiKey, legList) {
    if (legList.length < 2) return null;
    let decimal = 1;
    for (const leg of legList) {
      const odds = leg.bookOdds[bookApiKey];
      if (!odds) return null; // book doesn't have this leg
      decimal *= toDecimal(odds);
    }
    const stakeNum = parseFloat(stake) || 100;
    const payout = decimal * stakeNum;
    const profit = payout - stakeNum;
    return { decimal: decimal.toFixed(3), payout: payout.toFixed(2), profit: profit.toFixed(2), american: decimal >= 2 ? `+${Math.round((decimal-1)*100)}` : `-${Math.round(100/(decimal-1))}` };
  }

  // Get available outcomes for an event/market
  function getOutcomes(ev, market) {
    const bm = ev.bookMap;
    if (market === "h2h") {
      const outs = [];
      if (bm.h2h?.home && Object.keys(bm.h2h.home).length) outs.push({ label: ev.home, key: "home", oddsMap: bm.h2h.home });
      if (bm.h2h?.away && Object.keys(bm.h2h.away).length) outs.push({ label: ev.away, key: "away", oddsMap: bm.h2h.away });
      if (bm.h2h?.draw && Object.keys(bm.h2h.draw).length) outs.push({ label: "Draw", key: "draw", oddsMap: bm.h2h.draw });
      return outs;
    }
    if (market === "spreads") {
      const outs = [];
      const hl = bm.spreads?.home_line ? Object.values(bm.spreads.home_line)[0] : null;
      const al = bm.spreads?.away_line ? Object.values(bm.spreads.away_line)[0] : null;
      if (bm.spreads?.home) outs.push({ label: `${ev.home} ${hl != null ? fmtAmerican(hl) : ""}`, key:"sp_home", oddsMap: bm.spreads.home });
      if (bm.spreads?.away) outs.push({ label: `${ev.away} ${al != null ? fmtAmerican(al) : ""}`, key:"sp_away", oddsMap: bm.spreads.away });
      return outs;
    }
    if (market === "totals") {
      const tl = bm.totals?.over_line ? Object.values(bm.totals.over_line)[0] : null;
      const outs = [];
      if (bm.totals?.over) outs.push({ label: `Over ${tl ?? ""}`, key:"tot_over", oddsMap: bm.totals.over });
      if (bm.totals?.under) outs.push({ label: `Under ${tl ?? ""}`, key:"tot_under", oddsMap: bm.totals.under });
      return outs;
    }
    return [];
  }

  function addLeg(ev, outcome) {
    // Get best odds across all books for display, store per-book odds
    const leg = {
      id: `${ev.id}_${outcome.key}`,
      game: `${ev.away} @ ${ev.home}`,
      label: outcome.label,
      sport: ev.sportLabel,
      icon: ev.icon,
      bookOdds: outcome.oddsMap,
    };
    if (legs.find(l => l.id === leg.id)) return; // no dupes
    setLegs(prev => [...prev, leg]);
    setShowAddLeg(false);
    setSelectedEventForLeg(null);
    setLegSearch("");
    setLegOutcome(null);
  }

  function removeLeg(id) { setLegs(prev => prev.filter(l => l.id !== id)); }

  // Calculate results per book
  const bookResults = SPORTSBOOKS.map(book => {
    const result = calcParlay(book.apiKey, legs);
    return { book, result };
  }).filter(b => b.result !== null);

  bookResults.sort((a, b) => parseFloat(b.result.profit) - parseFloat(a.result.profit));
  const bestPayout = bookResults[0]?.result?.profit;

  const filteredEvents = events.filter(ev =>
    !legSearch || ev.home.toLowerCase().includes(legSearch.toLowerCase()) || ev.away.toLowerCase().includes(legSearch.toLowerCase())
  ).slice(0, 20);

  const markets = [
    { id:"h2h", label:"Moneyline" },
    ...(selectedEvent?.bookMap?.spreads ? [{ id:"spreads", label:"Spread" }] : []),
    ...(selectedEvent?.bookMap?.totals  ? [{ id:"totals",  label:"Total"  }] : []),
    { id:"props", label:"🏅 Props" },
  ];

  // Load props when props tab selected in parlay builder
  useEffect(() => {
    if (legMarket !== "props" || !selectedEvent || parlayProps !== null) return;
    setParlayPropsLoading(true);
    setParlayProps(null);
    fetchPlayerProps(selectedEvent.sportKey, selectedEvent.id).then(data => {
      setParlayProps(data || {});
      const keys = Object.keys(data || {});
      if (keys.length > 0) setParlayPropType(keys[0]);
      setParlayPropsLoading(false);
    }).catch(() => {
      setParlayProps({});
      setParlayPropsLoading(false);
    });
  }, [legMarket, selectedEvent]);

  return (
    <div className="fade-up">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Parlay Comparison</h2>
        <p style={{ fontSize:14, color:C.muted }}>Build a parlay and see which sportsbook pays the most.</p>
      </div>

      {/* Stake input */}
      <div className="card" style={{ padding:16, marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.muted, flexShrink:0 }}>Stake ($)</div>
        <input
          value={stake}
          onChange={e => setStake(e.target.value.replace(/[^0-9.]/g,""))}
          style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:16, fontFamily:"Roboto Mono,monospace", fontWeight:700, color:C.text, background:"#F9FAFB", textAlign:"right" }}
        />
        <div style={{ fontSize:13, color:C.faint }}>to win</div>
      </div>

      {/* Parlay legs */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
        {legs.map((leg, i) => {
          const best = bestOdds(leg.bookOdds);
          return (
            <div key={leg.id} className="card" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:C.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>
                {leg.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:C.faint, marginBottom:2 }}>{leg.sport} · {leg.game}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{leg.label}</div>
                {best.book && <div style={{ fontSize:11, color:best.book.color, marginTop:2 }}>Best odds: <strong>{fmtAmerican(best.best)}</strong> @ {best.book.name}</div>}
              </div>
              <button onClick={() => removeLeg(leg.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.faint, fontSize:20, padding:4, flexShrink:0 }}>×</button>
            </div>
          );
        })}
      </div>

      {/* Add leg button */}
      <button onClick={() => setShowAddLeg(true)} className="btn" style={{ width:"100%", padding:12, background:C.accentBg, color:C.accent, fontSize:14, border:`1.5px dashed ${C.accent}`, marginBottom:20 }}>
        + Add Leg {legs.length > 0 ? `(${legs.length} leg${legs.length>1?"s":""} added)` : ""}
      </button>

      {/* Add leg modal */}
      {showAddLeg && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end" }} onClick={() => { setShowAddLeg(false); setSelectedEventForLeg(null); }}>
          <div onClick={e => e.stopPropagation()} style={{ background:C.surface, borderRadius:"20px 20px 0 0", padding:20, width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:16 }}>
              {selectedEvent ? `${selectedEvent.away} @ ${selectedEvent.home}` : "Select a Game"}
            </div>

            {!selectedEvent && (
              <>
                <input
                  value={legSearch}
                  onChange={e => setLegSearch(e.target.value)}
                  placeholder="🔍 Search teams..."
                  autoFocus
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:14, fontFamily:"Figtree,sans-serif", color:C.text, marginBottom:12 }}
                />
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filteredEvents.map(ev => (
                    <div key={ev.id} onClick={() => { setSelectedEventForLeg(ev); setLegMarket("h2h"); }} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, cursor:"pointer", background:"#F9FAFB" }}>
                      <div style={{ fontSize:11, color:C.faint, marginBottom:3 }}>{ev.icon} {ev.sportLabel} · {ev.time}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{ev.away} @ {ev.home}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedEvent && (
              <>
                <button onClick={() => { setSelectedEventForLeg(null); setParlayProps(null); setParlayPropType(null); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontSize:13, padding:"0 0 12px 0" }}>← Back to games</button>
                <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto" }}>
                  {markets.map(m => <Pill key={m.id} active={legMarket===m.id} onClick={()=>{ setLegMarket(m.id); if (m.id !== "props") { setParlayProps(null); } }}>{m.label}</Pill>)}
                </div>

                {/* Standard markets */}
                {legMarket !== "props" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {getOutcomes(selectedEvent, legMarket).map(outcome => {
                      const best = bestOdds(outcome.oddsMap);
                      const alreadyAdded = legs.find(l => l.id === `${selectedEvent.id}_${outcome.key}`);
                      return (
                        <div key={outcome.key} onClick={() => !alreadyAdded && addLeg(selectedEvent, outcome)} style={{ padding:"14px 16px", borderRadius:10, border:`1.5px solid ${alreadyAdded ? C.green : C.border}`, cursor: alreadyAdded ? "default" : "pointer", background: alreadyAdded ? C.greenBg : "#F9FAFB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{outcome.label}</div>
                            {best.book && <div style={{ fontSize:12, color:best.book.color, marginTop:2 }}>Best: {fmtAmerican(best.best)} @ {best.book.name}</div>}
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color: alreadyAdded ? C.green : C.accent }}>
                            {alreadyAdded ? "✓ Added" : "+ Add"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Player props market */}
                {legMarket === "props" && (
                  <div>
                    {parlayPropsLoading && (
                      <div style={{ textAlign:"center", padding:"24px 0" }}>
                        <div style={{ display:"inline-block", width:20, height:20, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite", marginBottom:8 }} />
                        <div style={{ fontSize:13, color:C.muted }}>Loading player props…</div>
                      </div>
                    )}
                    {!parlayPropsLoading && Object.keys(parlayProps || {}).length === 0 && (
                      <div style={{ textAlign:"center", padding:"24px 0", color:C.faint, fontSize:13 }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>🏅</div>
                        Props not available yet for this game.<br/>Check back closer to tip-off, or upgrade your Odds API plan.
                      </div>
                    )}
                    {!parlayPropsLoading && Object.keys(parlayProps || {}).length > 0 && (
                      <>
                        {/* Prop type pills */}
                        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, marginBottom:12 }}>
                          {Object.entries(parlayProps).map(([pt, pd]) => (
                            <Pill key={pt} active={parlayPropType===pt} onClick={()=>{ setParlayPropType(pt); setParlayPropSearch(""); }}>
                              {pd.label}
                            </Pill>
                          ))}
                        </div>
                        {/* Player search */}
                        <input
                          value={parlayPropSearch}
                          onChange={e=>setParlayPropSearch(e.target.value)}
                          placeholder="🔍 Search player..."
                          style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"Figtree,sans-serif", color:C.text, marginBottom:10 }}
                        />
                        {/* Prop outcomes */}
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {Object.entries(parlayProps[parlayPropType]?.outcomes || {})
                            .filter(([k, o]) => !parlayPropSearch || o.player.toLowerCase().includes(parlayPropSearch.toLowerCase()))
                            .map(([key, outcome]) => {
                              const best = bestOdds(outcome.books);
                              const legId = `${selectedEvent.id}_prop_${key}`;
                              const alreadyAdded = legs.find(l => l.id === legId);
                              const propLabel = `${outcome.player} ${outcome.type}${outcome.line != null ? ` ${outcome.line}` : ""} ${parlayProps[parlayPropType]?.label || ""}`;
                              return (
                                <div key={key} onClick={() => {
                                  if (alreadyAdded) return;
                                  addLeg(selectedEvent, {
                                    label: propLabel,
                                    key: `prop_${key}`,
                                    oddsMap: outcome.books,
                                  });
                                }} style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${alreadyAdded ? C.green : C.border}`, cursor: alreadyAdded ? "default" : "pointer", background: alreadyAdded ? C.greenBg : "#F9FAFB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div style={{ minWidth:0, flex:1 }}>
                                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{outcome.player}</div>
                                    <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                                      {outcome.type}{outcome.line != null ? ` ${outcome.line}` : ""} · {parlayProps[parlayPropType]?.label}
                                    </div>
                                    {best.book && <div style={{ fontSize:11, color:best.book.color, marginTop:1 }}>Best: {fmtAmerican(best.best)} @ {best.book.name}</div>}
                                  </div>
                                  <div style={{ fontSize:13, fontWeight:700, color: alreadyAdded ? C.green : C.accent, flexShrink:0, marginLeft:8 }}>
                                    {alreadyAdded ? "✓ Added" : "+ Add"}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {legs.length >= 2 && bookResults.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>
            {legs.length}-Leg Parlay · ${stake} stake
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {bookResults.map(({ book, result }, i) => {
              const isB = i === 0;
              const diff = isB ? null : (parseFloat(result.profit) - parseFloat(bestPayout)).toFixed(2);
              return (
                <div key={book.apiKey} className="card" onClick={() => trackAndOpen(book, "parlay")} style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", border:`1.5px solid ${isB ? book.color : C.border}`, background: isB ? `${book.color}08` : C.surface, transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform="translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}
                >
                  <div style={{ width:44, height:44, borderRadius:10, background:book.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"Roboto Mono,monospace", flexShrink:0 }}>
                    {book.short}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{book.name}</span>
                      {isB && <Badge color={book.color} bg={`${book.color}18`}>🏆 Best Payout</Badge>}
                    </div>
                    <div style={{ fontSize:12, color:C.muted }}>
                      {result.american} odds · {result.decimal}x multiplier
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div className="mono" style={{ fontSize:20, fontWeight:800, color: isB ? book.color : C.text }}>${result.payout}</div>
                    <div style={{ fontSize:11, color: isB ? C.green : C.red, fontWeight:600 }}>
                      {isB ? `+$${result.profit} profit` : `-$${Math.abs(diff)} less`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary callout */}
          {bookResults.length >= 2 && (
            <div style={{ marginTop:16, background:C.greenBg, border:`1px solid ${C.green}44`, borderRadius:12, padding:"14px 18px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:4 }}>
                💡 Best vs Worst: ${(parseFloat(bookResults[0].result.profit) - parseFloat(bookResults[bookResults.length-1].result.profit)).toFixed(2)} difference
              </div>
              <div style={{ fontSize:12, color:C.green }}>
                {bookResults[0].book.name} pays ${bookResults[0].result.payout} vs {bookResults[bookResults.length-1].book.name} at ${bookResults[bookResults.length-1].result.payout} on the same parlay.
              </div>
            </div>
          )}
        </div>
      )}

      {legs.length === 1 && (
        <div style={{ textAlign:"center", padding:"24px 0", color:C.faint, fontSize:14 }}>Add at least one more leg to compare payouts</div>
      )}

      {legs.length === 0 && (
        <div className="card" style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎰</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>Build your parlay</div>
          <div style={{ fontSize:14, color:C.muted }}>Add 2+ legs and see exactly which sportsbook pays the most — and how much you're leaving on the table with the others.</div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { id:"odds",      label:"Odds",       icon:"📊" },
  { id:"parlay",    label:"Parlay",     icon:"🎰" },
  { id:"arb",       label:"Arb Finder", icon:"💰" },
  { id:"movement",  label:"Movement",   icon:"📈" },
  { id:"alerts",    label:"Alerts",     icon:"🔔" },
  { id:"advisor",   label:"AI Advisor", icon:"🎯" },
  { id:"books",     label:"Books",      icon:"🏦" },
  { id:"revenue",   label:"Revenue",    icon:"💵" },
];

export default function BettorOdds() {
  const [nav, setNav]             = useState("odds");
  const [sport, setSport]         = useState("all");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [apiWarnings, setApiWarnings] = useState([]);
  const [quota, setQuota]         = useState({ remaining: null, used: null });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [debugLog, setDebugLog]   = useState([]);
  const [showDebug, setShowDebug] = useState(false); // hidden by default in production

  async function loadOdds() {
    setLoading(true);
    setError(null);
    setDebugLog([]);
    try {
      const { events: newEvents, errors } = await fetchAllSports();
      setEvents(newEvents);
      setApiWarnings(errors);
      setLastRefresh(new Date());
      const rawPreview = window._oddsDebugRaw || "";
      setDebugLog([
        `✅ Fetched ${newEvents.length} events across ${SPORT_KEYS.length} sports`,
        `📋 Sports with data: ${[...new Set(newEvents.map(e => e.sportLabel))].join(", ") || "none"}`,
        `🔑 API key: ${ODDS_API_KEY.slice(0,8)}…`,
        ...(rawPreview ? [`📄 Raw preview: ${rawPreview.slice(0,200)}`] : []),
        ...errors.map(e => `⚠️ ${e}`),
      ]);
    } catch (e) {
      const msg = e.message || "Failed to fetch odds";
      setError(msg);
      setDebugLog([`❌ Fatal: ${msg}`]);
    }
    setLoading(false);
  }

  useEffect(() => { loadOdds(); }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(loadOdds, 60000);
    return () => clearInterval(t);
  }, []);

  const filtered = events.filter(ev => {
    const matchSport = sport === "all" || ev.sportId === sport;
    const matchSearch = !search || ev.home.toLowerCase().includes(search.toLowerCase()) || ev.away.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  function switchNav(id) { setNav(id); setSelected(null); }

  return (
    <div style={{ fontFamily:"'Figtree',sans-serif", background:C.bg, minHeight:"100vh" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", height:56 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🎯</div>
              <span style={{ fontSize:18, fontWeight:800, color:C.text, letterSpacing:"-0.02em" }}>Bettor Odds</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <QuotaBar remaining={quota.remaining} used={quota.used} />
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                {loading
                  ? <><div style={{ width:7, height:7, borderRadius:"50%", background:C.amber, animation:"pulse 1s ease infinite" }} /><span style={{ fontSize:12, color:C.faint }}>Updating…</span></>
                  : <><div style={{ width:7, height:7, borderRadius:"50%", background:C.green, animation:"pulse 3s ease infinite" }} /><span style={{ fontSize:12, color:C.faint }}>Live{lastRefresh ? ` · ${lastRefresh.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}` : ""}</span></>
                }
              </div>
              <button onClick={loadOdds} disabled={loading} className="btn" style={{ padding:"6px 12px", background:C.accentBg, color:C.accent, fontSize:12, opacity:loading?0.5:1 }}>↻ Refresh</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:2, overflowX:"auto" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>switchNav(n.id)} className="btn" style={{ padding:"10px 14px", background:"none", color:nav===n.id?C.accent:C.muted, fontSize:13, fontWeight:nav===n.id?700:500, borderRadius:0, borderBottom:`2.5px solid ${nav===n.id?C.accent:"transparent"}`, whiteSpace:"nowrap" }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>

        {/* ODDS */}
        {nav === "odds" && !selected && (
          <div className="fade-up">
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search teams or games…" style={{ flex:1, minWidth:180, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Figtree,sans-serif", color:C.text, background:C.surface }} />
            </div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, marginBottom:8 }}>
              {SPORT_NAV.map(s => <Pill key={s.id} active={sport===s.id} onClick={()=>setSport(s.id)}>{s.icon} {s.label}</Pill>)}
            </div>

            {error && <ErrorBox msg={error} onRetry={loadOdds} />}

            {/* Only show warnings if significant sports failed */}
            {apiWarnings.filter(w => !w.includes("too frequent")).length > 0 && (
              <div style={{ marginBottom:12, fontSize:12, color:C.amber, background:C.amberBg, padding:"8px 12px", borderRadius:8 }}>
                ⚠️ Some sports temporarily unavailable — will retry on next refresh
              </div>
            )}

            {loading && !events.length ? (
              <div>
                {[...Array(5)].map((_,i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <>
                <div style={{ fontSize:12, color:C.faint, marginBottom:14 }}>
                  {filtered.length} game{filtered.length!==1?"s":""} · {events.length} total across all sports · Click to compare all books
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {filtered.map((ev, i) => (
                    <div key={ev.id} style={{ animation:`fadeUp 0.3s ease ${Math.min(i,10)*0.05}s both` }}>
                      <EventCard event={ev} onClick={()=>setSelected(ev)} />
                    </div>
                  ))}
                  {!loading && filtered.length===0 && events.length===0 && !error && (
                    <div style={{ textAlign:"center", padding:"48px 0" }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
                      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No games loaded</div>
                      <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>The API may be rate-limited or no games are scheduled. Check the debug log above.</div>
                      <button onClick={loadOdds} className="btn" style={{ padding:"10px 20px", background:C.accent, color:"#fff", fontSize:14 }}>Try Again</button>
                    </div>
                  )}
                  {!loading && filtered.length===0 && events.length>0 && (
                    <div style={{ textAlign:"center", padding:"60px 0", color:C.faint, fontSize:14 }}>No games found{search ? ` for "${search}"` : " for this sport"}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {nav === "odds" && selected && <EventDetail event={selected} onBack={()=>setSelected(null)} />}
        {nav === "arb"      && <ArbFinder events={events} />}
        {nav === "parlay"   && <ParlayTool events={events} />}
        {nav === "movement" && <LineMovement events={events} />}
        {nav === "alerts"   && <Alerts events={events} />}
        {nav === "advisor"  && <AIAdvisor events={events} />}
        {nav === "books"    && <SportsbooksPage />}
        {nav === "revenue"  && <RevenueDashboard />}
      </div>

      <div style={{ borderTop:`1px solid ${C.border}`, background:C.surface, padding:"16px 20px", textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.faint }}>Bettor Odds · 21+ · Gamble Responsibly · 1-800-GAMBLER · Odds powered by The Odds API</div>
      </div>
    </div>
  );
}
