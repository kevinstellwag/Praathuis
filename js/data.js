// ════════════════════════════════════════════
//  data.js — speldata
// ════════════════════════════════════════════

// CLOCKWISE bord (39 vakjes + GO):
//  GO = rechtsonder [col10,row10]
//  Dan omhoog langs rechterkant (id 1–9)
//  Dan links langs bovenkant  (id 10–18) — hoek id 10 = rechtsboven [10,1]? Nee:
//
//  HOEKEN (elk een apart vak):
//    id 0  = GO        → [10,10] rechtsonder
//    id 9  = id 9      → [10, 2] (9 stappen omhoog)
//    id 10 = Bajes     → [10, 1] rechtsboven
//    id 19 = Gratis    → [ 1, 1] linksboven
//    id 28 = Politie   → [ 1,10] linksonder
//
//  Rijen:
//   Rechterkant omhoog:  id 1–9   col=10, row=9 tot row=1 (niet 10 = GO, niet 1 = hoek)
//     id 1 → [10,9], id 2→[10,8] ... id 9→[10,1]? Nee: rechtsboven hoek is id 10
//     Dus: id 1→[10,9], id 9→[10,2]  — 9 vakjes, row 9 t/m 2  (stap -1 per id)
//     id 10 = Bajes →[10,1]
//
//   Bovenkant rechts→links: id 11–18  row=1, col=9 tot col=2
//     id 11→[9,1], id 18→[2,1]
//     id 19 = Gratis → [1,1]
//
//   Linkerkant omlaag: id 20–27  col=1, row=2 tot row=9
//     id 20→[1,2], id 27→[1,9]
//     id 28 = Politie → [1,10]
//
//   Onderkant links→rechts: id 29–38  row=10, col=2 tot col=9
//     id 29→[2,10], id 38→[9,10]
//     Terug naar id 0 GO → [10,10]

const BOARD = [
  { id:0,  name:"GO",           type:"start",    price:0,      rent:0,     color:null,      emoji:"🚀" },
  { id:1,  name:"Weed Lane",    type:"property", price:1000,   rent:200,   color:"#2e8b2e", emoji:"🌿" },
  { id:2,  name:"Belasting",    type:"tax",      price:0,      rent:500,   color:null,      emoji:"💸" },
  { id:3,  name:"Crack Alley",  type:"property", price:1500,   rent:300,   color:"#2e8b2e", emoji:"💊" },
  { id:4,  name:"Kans",         type:"chance",   price:0,      rent:0,     color:null,      emoji:"🃏" },
  { id:5,  name:"Station Noord",type:"station",  price:3000,   rent:750,   color:"#444",    emoji:"🚂" },
  { id:6,  name:"MDMA Street",  type:"property", price:2000,   rent:400,   color:"#4488cc", emoji:"💉" },
  { id:7,  name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:null,      emoji:"🏘️" },
  { id:8,  name:"Pil Plein",    type:"property", price:2500,   rent:500,   color:"#4488cc", emoji:"💊" },
  { id:9,  name:"Glock Street", type:"property", price:2800,   rent:560,   color:"#4488cc", emoji:"🔫" },
  { id:10, name:"Bajes",        type:"jail",     price:0,      rent:0,     color:null,      emoji:"🔒" },
  { id:11, name:"AK-47 Avenue", type:"property", price:3200,   rent:640,   color:"#aa44aa", emoji:"🎯" },
  { id:12, name:"Stroom Mij",   type:"utility",  price:2500,   rent:0,     color:"#cc9900", emoji:"⚡" },
  { id:13, name:"Uzi Blvd",     type:"property", price:3600,   rent:720,   color:"#aa44aa", emoji:"🔫" },
  { id:14, name:"TT-33 Road",   type:"property", price:4000,   rent:800,   color:"#aa44aa", emoji:"🔫" },
  { id:15, name:"Station Oost", type:"station",  price:3000,   rent:750,   color:"#444",    emoji:"🚂" },
  { id:16, name:"Xanax Blvd",   type:"property", price:4400,   rent:880,   color:"#cc6600", emoji:"💊" },
  { id:17, name:"Kans",         type:"chance",   price:0,      rent:0,     color:null,      emoji:"🃏" },
  { id:18, name:"Oxy Avenue",   type:"property", price:4800,   rent:960,   color:"#cc6600", emoji:"💊" },
  { id:19, name:"Gratis!",      type:"free",     price:0,      rent:0,     color:null,      emoji:"☮️" },
  { id:20, name:"Coke Way",     type:"property", price:5200,   rent:1040,  color:"#bb2222", emoji:"🤍" },
  { id:21, name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:null,      emoji:"🏘️" },
  { id:22, name:"Hero Street",  type:"property", price:5600,   rent:1120,  color:"#bb2222", emoji:"💉" },
  { id:23, name:"Water Mij",    type:"utility",  price:2500,   rent:0,     color:"#cc9900", emoji:"💧" },
  { id:24, name:"Station West", type:"station",  price:3000,   rent:750,   color:"#444",    emoji:"🚂" },
  { id:25, name:"Crackpand",    type:"property", price:6000,   rent:1200,  color:"#880000", emoji:"🏚️" },
  { id:26, name:"Kans",         type:"chance",   price:0,      rent:0,     color:null,      emoji:"🃏" },
  { id:27, name:"Speedlab",     type:"property", price:6400,   rent:1280,  color:"#880000", emoji:"🧪" },
  { id:28, name:"Politie",      type:"go-jail",  price:0,      rent:0,     color:null,      emoji:"🚔" },
  { id:29, name:"Traphouse",    type:"property", price:7000,   rent:1400,  color:"#5522bb", emoji:"🏘️" },
  { id:30, name:"Station Zuid", type:"station",  price:3000,   rent:750,   color:"#444",    emoji:"🚂" },
  { id:31, name:"Drugslab",     type:"property", price:7500,   rent:1500,  color:"#5522bb", emoji:"⚗️" },
  { id:32, name:"Luxe Tax",     type:"tax",      price:0,      rent:2000,  color:null,      emoji:"🏛️" },
  { id:33, name:"Safehouse",    type:"property", price:8000,   rent:1600,  color:"#5522bb", emoji:"🏡" },
  { id:34, name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:null,      emoji:"🏘️" },
  { id:35, name:"Kalash Court", type:"property", price:8500,   rent:1700,  color:"#997700", emoji:"💣" },
  { id:36, name:"Kans",         type:"chance",   price:0,      rent:0,     color:null,      emoji:"🃏" },
  { id:37, name:"Penthouse",    type:"property", price:10000,  rent:2000,  color:"#997700", emoji:"🏙️" },
  { id:38, name:"Mega Mansion", type:"property", price:12000,  rent:2400,  color:"#997700", emoji:"👑" },
];

// ── Grid positie (clockwise) ──────────────
function gridPosFixed(id) {
  if (id === 0)  return [10,10]; // GO rechtsonder
  if (id === 10) return [10, 1]; // Bajes rechtsboven
  if (id === 19) return [1,  1]; // Gratis linksboven
  if (id === 28) return [1, 10]; // Politie linksonder
  if (id >= 1  && id <= 9)  return [10, 10 - id];         // rechts omhoog
  if (id >= 11 && id <= 18) return [10-(id-10), 1];        // boven rechts→links
  if (id >= 20 && id <= 27) return [1, 2+(id-20)];         // links omlaag
  if (id >= 29 && id <= 38) return [2+(id-29), 10];        // onder links→rechts
  return [1,1];
}

function spaceFromGrid(col, row) {
  if (col===10 && row===10) return 0;
  if (col===10 && row===1)  return 10;
  if (col===1  && row===1)  return 19;
  if (col===1  && row===10) return 28;
  if (col===10 && row>=2 && row<=9) return 10 - row;
  if (row===1  && col>=2 && col<=9) return 10 + (10-col);
  if (col===1  && row>=2 && row<=9) return 20 + (row-2);
  if (row===10 && col>=2 && col<=9) return 29 + (col-2);
  return -1;
}

// ── Kans kaarten ─────────────────────────
const CHANCE_CARDS = [
  { text:"Politie-inval! Ga direct naar de bajes.",     action:"jail",        emoji:"🚔" },
  { text:"Grote deal geslaagd. Ontvang €3.000!",        action:"gain",        amount:3000,  emoji:"💰" },
  { text:"Schuld ingelost. Ontvang €1.500!",            action:"gain",        amount:1500,  emoji:"🤝" },
  { text:"Je werd beroofd! Betaal €1.000.",             action:"lose",        amount:1000,  emoji:"🔫" },
  { text:"Rijbewijs ingetrokken. Betaal €500 boete.",   action:"lose",        amount:500,   emoji:"🚗" },
  { text:"Traphouse afgebrand. Betaal €2.000.",         action:"lose",        amount:2000,  emoji:"🔥" },
  { text:"Zending aangekomen. Ontvang €4.000!",        action:"gain",        amount:4000,  emoji:"📦" },
  { text:"Ga terug naar GO. Ontvang €2.000.",           action:"goto",        target:0, bonus:2000, emoji:"🚀" },
  { text:"Vrij-uit-bajes kaart! Bewaar hem.",           action:"free-jail",   emoji:"🎉" },
  { text:"Belastingteruggave. Ontvang €750.",           action:"gain",        amount:750,   emoji:"💸" },
  { text:"Politierazzia. Betaal elke speler €500.",     action:"pay-all",     amount:500,   emoji:"🚨" },
  { text:"Loterij gewonnen! Ontvang €5.000!",           action:"gain",        amount:5000,  emoji:"🎰" },
  { text:"Vrij-uit-bajes kaart! Bewaar hem.",           action:"free-jail",   emoji:"🎉" },
];

// ── Gemeenschap kaarten ───────────────────
const COMMUNITY_CARDS = [
  { text:"Gemeentefonds uitkering. Ontvang €1.000!",        action:"gain",        amount:1000,  emoji:"🏘️" },
  { text:"Ziekenhuisrekening. Betaal €2.000.",              action:"lose",        amount:2000,  emoji:"🏥" },
  { text:"Straatfeest! Elke speler betaalt jou €500.",      action:"collect-all", amount:500,   emoji:"🎉" },
  { text:"Illegale vondst. Betaal €3.000.",                 action:"lose",        amount:3000,  emoji:"🚔" },
  { text:"Crackpand winstgevend! Ontvang €2.500.",          action:"gain",        amount:2500,  emoji:"🏚️" },
  { text:"Auto gestolen teruggevonden. Ontvang €500.",      action:"gain",        amount:500,   emoji:"🚗" },
  { text:"Schoolgeld. Betaal €500 per medespeler.",         action:"pay-all",     amount:500,   emoji:"🎒" },
  { text:"Vrij-uit-bajes kaart! Bewaar hem.",               action:"free-jail",   emoji:"🎉" },
];

// ── Politie Rad van Fortuin ───────────────
const POLICE_WHEEL = [
  { label:"Waarschuwing ⚠️",   weight:4, action:"warning", fine:0,    emoji:"⚠️",  desc:"Waarschuwing. Je mag gaan — dit keer." },
  { label:"€2.000 Boete",      weight:3, action:"fine",    fine:2000, emoji:"💸",  desc:"Betaal €2.000 boete en je bent vrij." },
  { label:"€5.000 Boete",      weight:2, action:"fine",    fine:5000, emoji:"💸",  desc:"Betaal €5.000 boete en je bent vrij." },
  { label:"Gevangenis 🔒",     weight:2, action:"jail",    fine:0,    emoji:"🔒",  desc:"Gevangenis in! Direct naar de bajes." },
  { label:"Agent vriendelijk 🕺",weight:1,action:"warning", fine:0,   emoji:"🕺",  desc:"De agent was in een goed humeur. Ga gerust!" },
];

// ── Kleuren per speler ────────────────────
const PLAYER_COLORS = ["#E74C3C","#2980B9","#27AE60","#F39C12"];

// ── Valuta helper ─────────────────────────
function fmt(n) {
  return '€' + Math.abs(Number(n)).toLocaleString('nl-NL');
}
