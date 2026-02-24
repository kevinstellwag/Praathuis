// ═══════════════════════════════════════
//  data.js — bord data (frontend copy)
// ═══════════════════════════════════════

const BOARD = [
  { id:0,  name:"GO",           type:"start",    price:0,      rent:0,     color:"#22c55e", emoji:"🚀" },
  { id:1,  name:"Weed Lane",    type:"property", price:1000,   rent:200,   color:"#166534", emoji:"🌿" },
  { id:2,  name:"Belasting",    type:"tax",      price:0,      rent:500,   color:"#dc2626", emoji:"💸" },
  { id:3,  name:"Crack Alley",  type:"property", price:1500,   rent:300,   color:"#166534", emoji:"💊" },
  { id:4,  name:"Kans",         type:"chance",   price:0,      rent:0,     color:"#ca8a04", emoji:"🃏" },
  { id:5,  name:"Station Noord",type:"station",  price:3000,   rent:750,   color:"#374151", emoji:"🚂" },
  { id:6,  name:"MDMA Street",  type:"property", price:2000,   rent:400,   color:"#1d4ed8", emoji:"💉" },
  { id:7,  name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:"#0369a1", emoji:"🏘️" },
  { id:8,  name:"Pil Plein",    type:"property", price:2500,   rent:500,   color:"#1d4ed8", emoji:"💊" },
  { id:9,  name:"Glock Street", type:"property", price:2800,   rent:560,   color:"#1d4ed8", emoji:"🔫" },
  { id:10, name:"Bajes",        type:"jail",     price:0,      rent:0,     color:"#92400e", emoji:"🔒" },
  { id:11, name:"AK-47 Avenue", type:"property", price:3200,   rent:640,   color:"#7e22ce", emoji:"🎯" },
  { id:12, name:"Stroom Mij",   type:"utility",  price:2500,   rent:0,     color:"#ca8a04", emoji:"⚡" },
  { id:13, name:"Uzi Blvd",     type:"property", price:3600,   rent:720,   color:"#7e22ce", emoji:"🔫" },
  { id:14, name:"TT-33 Road",   type:"property", price:4000,   rent:800,   color:"#7e22ce", emoji:"🔫" },
  { id:15, name:"Station Oost", type:"station",  price:3000,   rent:750,   color:"#374151", emoji:"🚂" },
  { id:16, name:"Xanax Blvd",   type:"property", price:4400,   rent:880,   color:"#c2410c", emoji:"💊" },
  { id:17, name:"Kans",         type:"chance",   price:0,      rent:0,     color:"#ca8a04", emoji:"🃏" },
  { id:18, name:"Oxy Avenue",   type:"property", price:4800,   rent:960,   color:"#c2410c", emoji:"💊" },
  { id:19, name:"Gratis!",      type:"free",     price:0,      rent:0,     color:"#0369a1", emoji:"☮️" },
  { id:20, name:"Coke Way",     type:"property", price:5200,   rent:1040,  color:"#991b1b", emoji:"🤍" },
  { id:21, name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:"#0369a1", emoji:"🏘️" },
  { id:22, name:"Hero Street",  type:"property", price:5600,   rent:1120,  color:"#991b1b", emoji:"💉" },
  { id:23, name:"Water Mij",    type:"utility",  price:2500,   rent:0,     color:"#ca8a04", emoji:"💧" },
  { id:24, name:"Station West", type:"station",  price:3000,   rent:750,   color:"#374151", emoji:"🚂" },
  { id:25, name:"Crackpand",    type:"property", price:6000,   rent:1200,  color:"#7f1d1d", emoji:"🏚️" },
  { id:26, name:"Kans",         type:"chance",   price:0,      rent:0,     color:"#ca8a04", emoji:"🃏" },
  { id:27, name:"Speedlab",     type:"property", price:6400,   rent:1280,  color:"#7f1d1d", emoji:"🧪" },
  { id:28, name:"Politie",      type:"go-jail",  price:0,      rent:0,     color:"#dc2626", emoji:"🚔" },
  { id:29, name:"Traphouse",    type:"property", price:7000,   rent:1400,  color:"#4c1d95", emoji:"🏘️" },
  { id:30, name:"Station Zuid", type:"station",  price:3000,   rent:750,   color:"#374151", emoji:"🚂" },
  { id:31, name:"Drugslab",     type:"property", price:7500,   rent:1500,  color:"#4c1d95", emoji:"⚗️" },
  { id:32, name:"Luxe Tax",     type:"tax",      price:0,      rent:2000,  color:"#dc2626", emoji:"🏛️" },
  { id:33, name:"Safehouse",    type:"property", price:8000,   rent:1600,  color:"#4c1d95", emoji:"🏡" },
  { id:34, name:"Gemeensch.",   type:"community",price:0,      rent:0,     color:"#0369a1", emoji:"🏘️" },
  { id:35, name:"Kalash Court", type:"property", price:8500,   rent:1700,  color:"#78350f", emoji:"💣" },
  { id:36, name:"Kans",         type:"chance",   price:0,      rent:0,     color:"#ca8a04", emoji:"🃏" },
  { id:37, name:"Penthouse",    type:"property", price:10000,  rent:2000,  color:"#78350f", emoji:"🏙️" },
  { id:38, name:"Mega Mansion", type:"property", price:12000,  rent:2400,  color:"#78350f", emoji:"👑" },
];

// Clockwise grid: id → [col, row]
function gridPos(id) {
  if (id === 0)  return [10, 10];
  if (id === 10) return [10,  1];
  if (id === 19) return [ 1,  1];
  if (id === 28) return [ 1, 10];
  if (id >= 1  && id <= 9)  return [10, 10 - id];
  if (id >= 11 && id <= 18) return [10 - (id-10), 1];
  if (id >= 20 && id <= 27) return [1, 2 + (id-20)];
  if (id >= 29 && id <= 38) return [2 + (id-29), 10];
  return [1, 1];
}

function spaceFromGrid(col, row) {
  if (col===10&&row===10) return 0;
  if (col===10&&row===1)  return 10;
  if (col===1 &&row===1)  return 19;
  if (col===1 &&row===10) return 28;
  if (col===10&&row>=2&&row<=9) return 10 - row;
  if (row===1 &&col>=2&&col<=9) return 10 + (10-col);
  if (col===1 &&row>=2&&row<=9) return 20 + (row-2);
  if (row===10&&col>=2&&col<=9) return 29 + (col-2);
  return -1;
}

// Valuta formattering
function fmt(n) {
  return '€' + Math.abs(Number(n)).toLocaleString('nl-NL');
}

// Beschrijving per type
function typeLabel(type) {
  const map = {
    property: 'Eigendom', station: 'Station', utility: 'Nutsbedrijf',
    tax: 'Belasting', chance: 'Kanskaart', community: 'Gemeenschapskas',
    start: 'GO — Startpunt', jail: 'Bajes (bezoek)', 'go-jail': 'Ga naar Bajes!', free: 'Gratis Parkeren',
  };
  return map[type] || type;
}
