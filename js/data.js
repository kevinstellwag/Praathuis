// ════════════════════════════════════════════
//  data.js — alle speldata
// ════════════════════════════════════════════

const BOARD = [
  // Onderste rij (0–9), van links naar rechts
  { id:0,  name:"GO",           type:"start",     price:0,   rent:0,   color:null,     emoji:"🚀" },
  { id:1,  name:"Weed Lane",    type:"property",  price:60,  rent:12,  color:"#2d7a2d", emoji:"🌿" },
  { id:2,  name:"Blunt Tax",    type:"tax",       price:0,   rent:50,  color:null,     emoji:"💸" },
  { id:3,  name:"Crack Alley",  type:"property",  price:80,  rent:16,  color:"#2d7a2d", emoji:"💊" },
  { id:4,  name:"Belasting",    type:"tax",       price:0,   rent:100, color:null,     emoji:"🏛️" },
  { id:5,  name:"Station N",    type:"station",   price:200, rent:50,  color:"#555",   emoji:"🚂" },
  { id:6,  name:"MDMA St",      type:"property",  price:100, rent:20,  color:"#5599cc", emoji:"💉" },
  { id:7,  name:"Kans",         type:"chance",    price:0,   rent:0,   color:null,     emoji:"🃏" },
  { id:8,  name:"Pil Plein",    type:"property",  price:120, rent:24,  color:"#5599cc", emoji:"💊" },
  { id:9,  name:"Glock St",     type:"property",  price:140, rent:28,  color:"#5599cc", emoji:"🔫" },

  // Rechterkolom (10–19), van onder naar boven
  { id:10, name:"Bajes",        type:"jail",      price:0,   rent:0,   color:null,     emoji:"🔒" },
  { id:11, name:"AK-47 Ave",    type:"property",  price:160, rent:32,  color:"#c45cc4", emoji:"🎯" },
  { id:12, name:"Stroom",       type:"utility",   price:150, rent:0,   color:"#e6b800", emoji:"⚡" },
  { id:13, name:"Uzi Blvd",     type:"property",  price:180, rent:36,  color:"#c45cc4", emoji:"🔫" },
  { id:14, name:"TT-33 Rd",     type:"property",  price:200, rent:40,  color:"#c45cc4", emoji:"🔫" },
  { id:15, name:"Station O",    type:"station",   price:200, rent:50,  color:"#555",   emoji:"🚂" },
  { id:16, name:"Xanax Blvd",   type:"property",  price:220, rent:44,  color:"#e67a00", emoji:"💊" },
  { id:17, name:"Gemeen.",      type:"community", price:0,   rent:0,   color:null,     emoji:"🏘️" },
  { id:18, name:"Oxy Ave",      type:"property",  price:240, rent:48,  color:"#e67a00", emoji:"💊" },
  { id:19, name:"Kalash Ct",    type:"property",  price:260, rent:52,  color:"#e67a00", emoji:"💣" },

  // Bovenste rij (20–29), van rechts naar links
  { id:20, name:"Gratis!",      type:"free",      price:0,   rent:0,   color:null,     emoji:"☮️" },
  { id:21, name:"Coke Way",     type:"property",  price:280, rent:56,  color:"#cc3333", emoji:"🤍" },
  { id:22, name:"Kans",         type:"chance",    price:0,   rent:0,   color:null,     emoji:"🃏" },
  { id:23, name:"Hero St",      type:"property",  price:300, rent:60,  color:"#cc3333", emoji:"💉" },
  { id:24, name:"Water Mij",    type:"utility",   price:150, rent:0,   color:"#e6b800", emoji:"💧" },
  { id:25, name:"Station W",    type:"station",   price:200, rent:50,  color:"#555",   emoji:"🚂" },
  { id:26, name:"Crackpand",    type:"property",  price:320, rent:64,  color:"#8B0000", emoji:"🏚️" },
  { id:27, name:"Gemeen.",      type:"community", price:0,   rent:0,   color:null,     emoji:"🏘️" },
  { id:28, name:"Speedlab",     type:"property",  price:340, rent:68,  color:"#8B0000", emoji:"🧪" },
  { id:29, name:"Trap Man.",    type:"property",  price:360, rent:72,  color:"#8B0000", emoji:"🏠" },

  // Linkerkolom (30–39), van boven naar onder
  { id:30, name:"POLITIE",      type:"go-jail",   price:0,   rent:0,   color:null,     emoji:"🚔" },
  { id:31, name:"Safehouse",    type:"property",  price:380, rent:76,  color:"#6633cc", emoji:"🏡" },
  { id:32, name:"Drugslab",     type:"property",  price:400, rent:80,  color:"#6633cc", emoji:"⚗️" },
  { id:33, name:"Kans",         type:"chance",    price:0,   rent:0,   color:null,     emoji:"🃏" },
  { id:34, name:"Traphouse",    type:"property",  price:420, rent:84,  color:"#6633cc", emoji:"🏘️" },
  { id:35, name:"Station Z",    type:"station",   price:200, rent:50,  color:"#555",   emoji:"🚂" },
  { id:36, name:"Gemeen.",      type:"community", price:0,   rent:0,   color:null,     emoji:"🏘️" },
  { id:37, name:"Penthouse",    type:"property",  price:500, rent:100, color:"#b8860b", emoji:"🏙️" },
  { id:38, name:"Luxe Tax",     type:"tax",       price:0,   rent:200, color:null,     emoji:"💸" },
  { id:39, name:"Mega Man.",    type:"property",  price:600, rent:120, color:"#b8860b", emoji:"👑" },
];

const CHANCE_CARDS = [
  { text: "Politie-inval! Ga direct naar de bajes 🚔", action:"jail" },
  { text: "Succesvolle deal 💰 Ontvang €200!", action:"gain", amount:200 },
  { text: "Schuld ingelost. Ontvang €150!", action:"gain", amount:150 },
  { text: "Beroofd! Betaal €100 💸", action:"lose", amount:100 },
  { text: "Rijbewijs kwijt. Betaal €50 boete", action:"lose", amount:50 },
  { text: "Traphouse afgebrand 🔥 Betaal €120", action:"lose", amount:120 },
  { text: "Grote zending 📦 Ontvang €250!", action:"gain", amount:250 },
  { text: "Ga terug naar GO. Ontvang €200 🚀", action:"goto", target:0, bonus:200 },
  { text: "Vrij-uit-bajes kaart! Bewaar hem 🎉", action:"free-jail" },
  { text: "Belastingteruggave. Ontvang €75 💸", action:"gain", amount:75 },
];

const COMMUNITY_CARDS = [
  { text: "Gemeentefonds uitkering. Ontvang €100!", action:"gain", amount:100 },
  { text: "Ziekenhuisrekening 🏥 Betaal €150", action:"lose", amount:150 },
  { text: "Loterij gewonnen! 🎰 Ontvang €300!", action:"gain", amount:300 },
  { text: "Straatfeest 🎉 Elke speler betaalt jou €30!", action:"collect-all", amount:30 },
  { text: "Illegale vondst 🚔 Betaal €200", action:"lose", amount:200 },
  { text: "Crackpand winstgevend! Ontvang €180", action:"gain", amount:180 },
  { text: "Auto gestolen teruggevonden. Ontvang €50", action:"gain", amount:50 },
  { text: "Schoolkosten voor alle kids 🎒 Betaal €50 per speler", action:"pay-all", amount:50 },
];

// Grid positie [col, row] voor elk vakje (1-gebaseerd)
function gridPos(id) {
  if (id <= 9)  return [id + 1, 10];         // onderste rij
  if (id <= 19) return [10, 10 - (id - 10)]; // rechterkolom
  if (id <= 29) return [10 - (id - 20), 1];  // bovenste rij
  return [1, 2 + (id - 30)];                 // linkerkolom
}

// Omgekeerd: grid → spaceId
function spaceFromGrid(col, row) {
  if (row === 10) return col - 1;
  if (col === 10) return 10 + (9 - row);
  if (row === 1)  return 20 + (9 - col);
  if (col === 1)  return 30 + (row - 2);
  return -1; // center
}

const PLAYER_COLORS = ["#E74C3C","#2980B9","#27AE60","#F39C12"];
