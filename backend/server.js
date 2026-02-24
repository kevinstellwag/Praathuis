// ═══════════════════════════════════════════════
//  Shankroll — Backend Server
//  Express + WebSockets
//  Gratis te deployen op Railway.app
// ═══════════════════════════════════════════════

const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const bcrypt    = require('bcryptjs');
const { v4: uuid } = require('uuid');
const cors      = require('cors');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// ── In-memory opslag (data blijft zolang server draait) ──
const USERS = {};   // key → { key, name, password(hashed), friends, played, won }
const ROOMS = {};   // roomId → RoomState
const CLIENTS = {}; // wsId → { ws, userKey, roomId }

// ── Health check ─────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Shankroll server online 🎲' }));

// ════════════════════════════════════════════
//  WebSocket handler
// ════════════════════════════════════════════
wss.on('connection', (ws) => {
  const wsId = uuid();
  CLIENTS[wsId] = { ws, userKey: null, roomId: null };

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    handleMessage(wsId, msg);
  });

  ws.on('close', () => handleDisconnect(wsId));

  send(ws, { type: 'connected', wsId });
});

// ════════════════════════════════════════════
//  Message Router
// ════════════════════════════════════════════
function handleMessage(wsId, msg) {
  const { type, data } = msg;
  switch (type) {
    case 'auth:register':   return authRegister(wsId, data);
    case 'auth:login':      return authLogin(wsId, data);
    case 'auth:logout':     return authLogout(wsId);
    case 'friends:search':  return friendsSearch(wsId, data);
    case 'friends:request': return friendsRequest(wsId, data);
    case 'friends:accept':  return friendsAccept(wsId, data);
    case 'friends:decline': return friendsDecline(wsId, data);
    case 'room:create':     return roomCreate(wsId, data);
    case 'room:join':       return roomJoin(wsId, data);
    case 'room:invite':     return roomInvite(wsId, data);
    case 'room:leave':      return roomLeave(wsId);
    case 'room:ready':      return roomReady(wsId);
    case 'room:start':      return roomStart(wsId);
    case 'chat:message':    return chatMessage(wsId, data);
    case 'game:roll':       return gameRoll(wsId);
    case 'game:buy':        return gameBuy(wsId);
    case 'game:skip':       return gameSkip(wsId);
    case 'game:pay':        return gamePay(wsId);
    case 'game:dash':       return gameDash(wsId);
    case 'game:end-turn':   return gameEndTurn(wsId);
    case 'game:card-action':return gameCardAction(wsId, data);
    default: sendErr(wsId, 'Onbekend bericht type');
  }
}

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
function authRegister(wsId, { name, password }) {
  if (!name || !password) return sendErr(wsId, 'Vul alles in.');
  name = name.trim();
  if (name.length < 2 || name.length > 16) return sendErr(wsId, 'Naam: 2–16 tekens.');
  if (password.length < 4) return sendErr(wsId, 'Wachtwoord min. 4 tekens.');
  const key = name.toLowerCase().replace(/\s+/g,'_');
  if (USERS[key]) return sendErr(wsId, 'Naam al in gebruik.');
  const hashed = bcrypt.hashSync(password, 8);
  USERS[key] = { key, name, password: hashed, friends: [], requests: [], played: 0, won: 0, online: false };
  send(CLIENTS[wsId].ws, { type: 'auth:registered', data: { name } });
}

function authLogin(wsId, { name, password }) {
  if (!name || !password) return sendErr(wsId, 'Vul alles in.');
  const key = name.trim().toLowerCase().replace(/\s+/g,'_');
  const user = USERS[key];
  if (!user || !bcrypt.compareSync(password, user.password)) return sendErr(wsId, 'Verkeerde naam of wachtwoord.');
  CLIENTS[wsId].userKey = key;
  user.online = true;
  // Stuur user data terug (zonder wachtwoord)
  const safeUser = getUserSafe(key);
  send(CLIENTS[wsId].ws, { type: 'auth:loggedin', data: { user: safeUser } });
  // Stuur vriend verzoeken mee
  sendPendingInvites(wsId);
}

function authLogout(wsId) {
  const key = CLIENTS[wsId].userKey;
  if (key && USERS[key]) USERS[key].online = false;
  CLIENTS[wsId].userKey = null;
}

// ════════════════════════════════════════════
//  FRIENDS
// ════════════════════════════════════════════
function friendsSearch(wsId, { query }) {
  if (!query || query.length < 1) return;
  const me = CLIENTS[wsId].userKey;
  const q  = query.toLowerCase();
  const results = Object.values(USERS)
    .filter(u => u.key !== me && u.key.includes(q))
    .slice(0, 8)
    .map(u => ({ key: u.key, name: u.name, online: u.online }));
  send(CLIENTS[wsId].ws, { type: 'friends:results', data: { results } });
}

function friendsRequest(wsId, { toKey }) {
  const fromKey = CLIENTS[wsId].userKey;
  if (!USERS[toKey]) return sendErr(wsId, 'Gebruiker niet gevonden.');
  if ((USERS[toKey].friends||[]).includes(fromKey)) return sendErr(wsId, 'Al vrienden.');
  if (!(USERS[toKey].requests||[]).includes(fromKey)) {
    if (!USERS[toKey].requests) USERS[toKey].requests = [];
    USERS[toKey].requests.push(fromKey);
  }
  send(CLIENTS[wsId].ws, { type: 'friends:sent', data: { toKey } });
  // Stuur notificatie als doelgebruiker online is
  broadcastToUser(toKey, { type: 'friends:incoming', data: { fromKey, fromName: USERS[fromKey].name } });
}

function friendsAccept(wsId, { fromKey }) {
  const me = CLIENTS[wsId].userKey;
  if (!USERS[fromKey]) return;
  if (!USERS[me].friends) USERS[me].friends = [];
  if (!USERS[fromKey].friends) USERS[fromKey].friends = [];
  if (!USERS[me].friends.includes(fromKey)) USERS[me].friends.push(fromKey);
  if (!USERS[fromKey].friends.includes(me)) USERS[fromKey].friends.push(me);
  USERS[me].requests = (USERS[me].requests||[]).filter(k=>k!==fromKey);
  send(CLIENTS[wsId].ws, { type: 'friends:updated', data: { friends: getFriendsList(me), requests: USERS[me].requests } });
  broadcastToUser(fromKey, { type: 'friends:accepted', data: { byKey: me, byName: USERS[me].name } });
}

function friendsDecline(wsId, { fromKey }) {
  const me = CLIENTS[wsId].userKey;
  USERS[me].requests = (USERS[me].requests||[]).filter(k=>k!==fromKey);
  send(CLIENTS[wsId].ws, { type: 'friends:updated', data: { friends: getFriendsList(me), requests: USERS[me].requests } });
}

function getFriendsList(key) {
  return (USERS[key]?.friends||[]).map(k => ({
    key: k, name: USERS[k]?.name||k, online: USERS[k]?.online||false
  }));
}

function sendPendingInvites(wsId) {
  const key = CLIENTS[wsId].userKey;
  const user = USERS[key];
  send(CLIENTS[wsId].ws, {
    type: 'friends:updated',
    data: { friends: getFriendsList(key), requests: (user.requests||[]).map(k=>({ key:k, name:USERS[k]?.name||k })) }
  });
}

// ════════════════════════════════════════════
//  ROOMS
// ════════════════════════════════════════════
function roomCreate(wsId, { token }) {
  const key = CLIENTS[wsId].userKey;
  if (!key) return sendErr(wsId, 'Niet ingelogd.');
  // Verlaat huidige kamer
  if (CLIENTS[wsId].roomId) roomLeave(wsId);
  const roomId = generateCode();
  ROOMS[roomId] = {
    id: roomId,
    hostKey: key,
    players: [{ key, name: USERS[key].name, token, ready: false, wsId }],
    state: 'lobby',  // lobby | playing | finished
    chat: [],
    game: null,
  };
  CLIENTS[wsId].roomId = roomId;
  sendRoom(wsId);
}

function roomJoin(wsId, { code, token }) {
  const key    = CLIENTS[wsId].userKey;
  const roomId = code.toUpperCase();
  const room   = ROOMS[roomId];
  if (!key) return sendErr(wsId, 'Niet ingelogd.');
  if (!room) return sendErr(wsId, 'Kamer niet gevonden.');
  if (room.state !== 'lobby') return sendErr(wsId, 'Spel al bezig.');
  if (room.players.length >= 4) return sendErr(wsId, 'Kamer vol (max 4).');
  if (room.players.some(p=>p.key===key)) return sendErr(wsId, 'Je zit al in deze kamer.');
  if (room.players.some(p=>p.token===token)) return sendErr(wsId, 'Token al in gebruik.');
  if (CLIENTS[wsId].roomId) roomLeave(wsId);
  room.players.push({ key, name: USERS[key].name, token, ready: false, wsId });
  CLIENTS[wsId].roomId = roomId;
  broadcastRoom(roomId);
}

function roomInvite(wsId, { toKey }) {
  const key    = CLIENTS[wsId].userKey;
  const roomId = CLIENTS[wsId].roomId;
  if (!roomId) return sendErr(wsId, 'Je zit niet in een kamer.');
  broadcastToUser(toKey, {
    type: 'room:invited',
    data: { roomId, fromName: USERS[key].name, fromKey: key }
  });
  send(CLIENTS[wsId].ws, { type: 'room:invite-sent', data: { toKey } });
}

function roomLeave(wsId) {
  const roomId = CLIENTS[wsId].roomId;
  if (!roomId || !ROOMS[roomId]) return;
  const room = ROOMS[roomId];
  const key  = CLIENTS[wsId].userKey;
  room.players = room.players.filter(p => p.key !== key);
  CLIENTS[wsId].roomId = null;
  if (room.players.length === 0) { delete ROOMS[roomId]; return; }
  // Geef host door als host weg is
  if (room.hostKey === key) room.hostKey = room.players[0].key;
  broadcastRoom(roomId);
}

function roomReady(wsId) {
  const roomId = CLIENTS[wsId].roomId;
  const key    = CLIENTS[wsId].userKey;
  if (!roomId || !ROOMS[roomId]) return;
  const player = ROOMS[roomId].players.find(p=>p.key===key);
  if (player) player.ready = !player.ready;
  broadcastRoom(roomId);
}

function roomStart(wsId) {
  const roomId = CLIENTS[wsId].roomId;
  const key    = CLIENTS[wsId].userKey;
  const room   = ROOMS[roomId];
  if (!room) return;
  if (room.hostKey !== key) return sendErr(wsId, 'Alleen de host kan starten.');
  if (room.players.length < 2) return sendErr(wsId, 'Minimaal 2 spelers nodig.');
  room.state = 'playing';
  room.game  = createGameState(room.players);
  broadcastRoom(roomId);
  broadcastGame(roomId);
}

// ════════════════════════════════════════════
//  CHAT
// ════════════════════════════════════════════
function chatMessage(wsId, { text }) {
  const key    = CLIENTS[wsId].userKey;
  const roomId = CLIENTS[wsId].roomId;
  if (!key || !roomId || !ROOMS[roomId]) return;
  if (!text || text.trim().length === 0) return;
  const msg = {
    id: uuid(),
    key,
    name: USERS[key].name,
    text: text.trim().slice(0, 200),
    ts: Date.now(),
  };
  ROOMS[roomId].chat.push(msg);
  if (ROOMS[roomId].chat.length > 100) ROOMS[roomId].chat.shift();
  broadcastToRoom(roomId, { type: 'chat:message', data: { msg } });
}

// ════════════════════════════════════════════
//  GAME STATE
// ════════════════════════════════════════════
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

const CHANCE_CARDS = [
  { text:"Politie-inval! Ga naar de bajes.",          action:"jail",        emoji:"🚔" },
  { text:"Grote deal geslaagd. Ontvang €3.000!",      action:"gain",        amount:3000,  emoji:"💰" },
  { text:"Schuld ingelost. Ontvang €1.500!",          action:"gain",        amount:1500,  emoji:"🤝" },
  { text:"Beroofd! Betaal €1.000.",                   action:"lose",        amount:1000,  emoji:"🔫" },
  { text:"Rijbewijs kwijt. Betaal €500.",             action:"lose",        amount:500,   emoji:"🚗" },
  { text:"Traphouse afgebrand. Betaal €2.000.",       action:"lose",        amount:2000,  emoji:"🔥" },
  { text:"Zending binnen. Ontvang €4.000!",           action:"gain",        amount:4000,  emoji:"📦" },
  { text:"Terug naar GO. Ontvang €2.000.",            action:"goto",        target:0, bonus:2000, emoji:"🚀" },
  { text:"Vrij-uit-bajes kaart!",                     action:"free-jail",   emoji:"🎉" },
  { text:"Belastingteruggave. Ontvang €750.",         action:"gain",        amount:750,   emoji:"💸" },
  { text:"Politierazzia. Betaal elke speler €500.",   action:"pay-all",     amount:500,   emoji:"🚨" },
  { text:"Loterij gewonnen! Ontvang €5.000!",         action:"gain",        amount:5000,  emoji:"🎰" },
  { text:"Vrij-uit-bajes kaart!",                     action:"free-jail",   emoji:"🎉" },
];

const COMMUNITY_CARDS = [
  { text:"Gemeentefonds. Ontvang €1.000!",            action:"gain",        amount:1000,  emoji:"🏘️" },
  { text:"Ziekenhuisrekening. Betaal €2.000.",        action:"lose",        amount:2000,  emoji:"🏥" },
  { text:"Straatfeest! Iedereen betaalt jou €500.",   action:"collect-all", amount:500,   emoji:"🎉" },
  { text:"Illegale vondst. Betaal €3.000.",           action:"lose",        amount:3000,  emoji:"🚔" },
  { text:"Crackpand winstgevend! Ontvang €2.500.",    action:"gain",        amount:2500,  emoji:"🏚️" },
  { text:"Auto terug. Ontvang €500.",                 action:"gain",        amount:500,   emoji:"🚗" },
  { text:"Schoolgeld. Betaal €500 per speler.",       action:"pay-all",     amount:500,   emoji:"🎒" },
  { text:"Vrij-uit-bajes kaart!",                     action:"free-jail",   emoji:"🎉" },
];

const POLICE_WHEEL = [
  { label:"Waarschuwing",     weight:4, action:"warning",  fine:0,    emoji:"⚠️" },
  { label:"€2.000 Boete",     weight:3, action:"fine",     fine:2000, emoji:"💸" },
  { label:"€5.000 Boete",     weight:2, action:"fine",     fine:5000, emoji:"💸" },
  { label:"Gevangenis",       weight:2, action:"jail",     fine:0,    emoji:"🔒" },
  { label:"Agent vriendelijk",weight:1, action:"warning",  fine:0,    emoji:"🕺" },
];

function createGameState(players) {
  return {
    players: players.map((p, i) => ({
      key: p.key, name: p.name, token: p.token,
      money: 15000, position: 0,
      properties: [], cards: [],
      inJail: false, jailTurns: 0,
      doubles: 0, bankrupt: false,
      passedGo: 0, color: ['#ef4444','#3b82f6','#22c55e','#f59e0b'][i],
    })),
    current: 0,
    properties: {},
    npc: { active: false, position: 0 },
    goPassThreshold: false,
    phase: 'roll',  // roll | card | police-wheel | done
    pendingCard: null,
    pendingRent: null,
    dice: [1, 1],
    log: [],
  };
}

// ── Game actions ──────────────────────────
function gameRoll(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId];
  if (!room || room.state !== 'playing') return;
  const gs = room.game;
  if (gs.phase !== 'roll') return;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey) return sendErr(wsId, 'Niet jouw beurt.');

  const d1 = Math.ceil(Math.random() * 6);
  const d2 = Math.ceil(Math.random() * 6);
  const total   = d1 + d2;
  const doubles = d1 === d2;
  gs.dice = [d1, d2];

  if (cp.inJail) {
    handleJailRoll(gs, cp, doubles, total, roomId);
    return;
  }

  if (doubles) {
    cp.doubles++;
    if (cp.doubles >= 3) {
      addLog(gs, `🚔 ${cp.name} gooit 3× doubles — bajes!`);
      sendToJail(gs, cp);
      gs.phase = 'roll';
      nextTurn(gs, roomId);
      return;
    }
    addLog(gs, `🎲 ${cp.name}: ${d1}+${d2}=${total} — DOUBLES!`);
  } else {
    cp.doubles = 0;
    addLog(gs, `🎲 ${cp.name}: ${d1}+${d2}=${total}`);
  }

  movePlayer(gs, cp, total, roomId);
  if (doubles && gs.phase === 'roll') {
    // mag opnieuw gooien (pas na kaart-afhandeling)
  }
  broadcastGame(roomId);
}

function handleJailRoll(gs, cp, doubles, total, roomId) {
  if (cp.cards.includes('free-jail')) {
    cp.cards = cp.cards.filter(c=>c!=='free-jail');
    cp.inJail = false; cp.jailTurns = 0;
    addLog(gs, `🎉 ${cp.name} gebruikt vrij-uit-kaart!`);
    movePlayer(gs, cp, total, roomId);
  } else if (doubles) {
    cp.inJail = false; cp.jailTurns = 0;
    addLog(gs, `🎉 ${cp.name} gooit doubles — vrij!`);
    movePlayer(gs, cp, total, roomId);
  } else {
    cp.jailTurns++;
    if (cp.jailTurns >= 3) {
      cp.money -= 2000; cp.inJail = false; cp.jailTurns = 0;
      addLog(gs, `💸 ${cp.name} betaalt €2.000 borgsom.`);
      checkBankrupt(gs, cp, roomId);
      if (!cp.bankrupt) movePlayer(gs, cp, total, roomId);
      else nextTurn(gs, roomId);
    } else {
      addLog(gs, `🔒 ${cp.name} zit in de bajes (${cp.jailTurns}/3).`);
      nextTurn(gs, roomId);
    }
  }
  broadcastGame(roomId);
}

function movePlayer(gs, cp, steps, roomId) {
  const oldPos = cp.position;
  const newPos = (cp.position + steps) % 39;
  if (newPos < oldPos || (oldPos===0 && steps>0)) {
    cp.money += 2000; cp.passedGo++;
    addLog(gs, `🚀 ${cp.name} passeert GO — +€2.000!`);
    if (!gs.goPassThreshold && cp.passedGo >= 5) {
      gs.goPassThreshold = true;
      gs.npc.active = true;
      addLog(gs, `🚔 POLITIE NPC verschijnt! ${cp.name} passeerde 5× GO.`);
    }
  }
  cp.position = newPos;
  addLog(gs, `📍 ${cp.name} → ${BOARD[newPos].emoji} ${BOARD[newPos].name}`);
  handleLanding(gs, cp, roomId);
}

function handleLanding(gs, cp, roomId) {
  const sp = BOARD[cp.position];
  // Altijd een kaart sturen
  gs.pendingCard = buildSpaceCard(sp, gs, cp);
  gs.phase = 'card';

  // Acties bepalen
  if (sp.type === 'tax') {
    cp.money -= sp.rent;
    checkBankrupt(gs, cp, roomId);
    gs.pendingCard.autoResolve = true;
    gs.pendingCard.log = `💸 ${cp.name} betaalt €${sp.rent} belasting.`;
    addLog(gs, gs.pendingCard.log);
  } else if (sp.type === 'go-jail') {
    sendToJail(gs, cp);
    gs.pendingCard.autoResolve = true;
  } else if (sp.type === 'jail' || sp.type === 'start' || sp.type === 'free') {
    gs.pendingCard.autoResolve = true;
  }
}

function buildSpaceCard(sp, gs, cp) {
  const ownerId = gs.properties[sp.id];
  const owner   = ownerId !== undefined ? gs.players.find(p=>p.key===ownerId) : null;
  const rent    = (sp.type==='utility')
    ? (gs.dice[0]+gs.dice[1])*300
    : sp.rent;

  return {
    space: sp,
    owner: owner ? { key: owner.key, name: owner.name, color: owner.color } : null,
    rent,
    canBuy:  !owner && sp.price > 0 && cp.money >= sp.price,
    cantAfford: !owner && sp.price > 0 && cp.money < sp.price,
    mustPay: owner && owner.key !== cp.key,
    actions: [],
  };
}

function gameBuy(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game; if (gs.phase !== 'card') return;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey) return;
  const sp = BOARD[cp.position];
  if (!sp.price || gs.properties[sp.id] !== undefined) return;
  if (cp.money < sp.price) return;
  cp.money -= sp.price;
  gs.properties[sp.id] = cp.key;
  cp.properties.push(sp.id);
  addLog(gs, `🏠 ${cp.name} koopt ${sp.name} voor €${sp.price}!`);
  gs.pendingCard = null;
  nextTurn(gs, roomId);
  broadcastGame(roomId);
}

function gameSkip(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game; if (gs.phase !== 'card') return;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey) return;
  gs.pendingCard = null;
  nextTurn(gs, roomId);
  broadcastGame(roomId);
}

function gamePay(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey || !gs.pendingRent) return;
  const { amount, ownerKey } = gs.pendingRent;
  const owner = gs.players.find(p=>p.key===ownerKey);
  cp.money -= amount; if (owner) owner.money += amount;
  addLog(gs, `💸 ${cp.name} betaalt €${amount} aan ${owner?.name}.`);
  gs.pendingRent = null; gs.pendingCard = null;
  checkBankrupt(gs, cp, roomId);
  if (!cp.bankrupt) nextTurn(gs, roomId);
  broadcastGame(roomId);
}

function gameDash(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey || !gs.pendingRent) return;
  const { amount, ownerKey } = gs.pendingRent;
  const owner = gs.players.find(p=>p.key===ownerKey);
  const success = Math.random() < 0.30;
  if (success) {
    addLog(gs, `🏃 ${cp.name} DASHED! Ontsnapt — betaalt niets!`);
    gs.pendingRent = null; gs.pendingCard = null;
    nextTurn(gs, roomId);
  } else {
    const fine = amount * 2;
    cp.money -= fine; if (owner) owner.money += fine;
    addLog(gs, `🚔 ${cp.name} gepakt! Betaalt 2×: €${fine}!`);
    gs.pendingRent = null; gs.pendingCard = null;
    checkBankrupt(gs, cp, roomId);
    if (!cp.bankrupt) nextTurn(gs, roomId);
  }
  broadcastGame(roomId);
}

function gameEndTurn(wsId) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey) return;
  gs.pendingCard = null;
  nextTurn(gs, roomId);
  broadcastGame(roomId);
}

function gameCardAction(wsId, { action }) {
  const { roomId, userKey } = CLIENTS[wsId];
  const room = ROOMS[roomId]; if (!room) return;
  const gs = room.game;
  const cp = gs.players[gs.current];
  if (cp.key !== userKey) return;

  const deck = BOARD[cp.position].type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
  const card = deck[Math.floor(Math.random() * deck.length)];
  addLog(gs, `🃏 ${card.emoji} ${cp.name}: ${card.text}`);
  applyCard(gs, cp, card, roomId);
  broadcastGame(roomId);
}

function applyCard(gs, cp, card, roomId) {
  switch(card.action) {
    case 'gain':        cp.money += card.amount; break;
    case 'lose':        cp.money -= card.amount; checkBankrupt(gs,cp,roomId); break;
    case 'jail':        sendToJail(gs, cp); break;
    case 'free-jail':   cp.cards.push('free-jail'); break;
    case 'goto':        cp.position=card.target; cp.money+=card.bonus; break;
    case 'pay-all':     gs.players.forEach(op=>{if(op.key!==cp.key&&!op.bankrupt){op.money-=card.amount;cp.money+=card.amount;}}); break;
    case 'collect-all': gs.players.forEach(op=>{if(op.key!==cp.key&&!op.bankrupt){cp.money+=card.amount;op.money-=card.amount;}}); break;
  }
  gs.pendingCard = null;
  if (!cp.bankrupt) nextTurn(gs, roomId);
}

function nextTurn(gs, roomId) {
  // NPC beurt
  if (gs.npc.active) {
    const s1 = Math.ceil(Math.random()*6), s2 = Math.ceil(Math.random()*6);
    const oldNpc = gs.npc.position;
    gs.npc.position = (oldNpc + s1 + s2) % 39;
    addLog(gs, `🚔 Politie NPC beweegt naar ${BOARD[gs.npc.position].name}.`);
    const victim = gs.players.find(p=>!p.bankrupt && p.position===gs.npc.position);
    if (victim) {
      // Check vrij-kaart
      if (victim.cards.includes('free-jail')) {
        victim.cards = victim.cards.filter(c=>c!=='free-jail');
        addLog(gs, `🎉 ${victim.name} gebruikt vrij-kaart bij politie!`);
      } else {
        const total=s1+s2; const chosen=spinWheel();
        addLog(gs, `🚔 Politie bij ${victim.name}! → ${chosen.emoji} ${chosen.label}`);
        if (chosen.action==='jail') sendToJail(gs, victim);
        else if (chosen.action==='fine') { victim.money-=chosen.fine; checkBankrupt(gs,victim,roomId); }
        gs.pendingCard = { policeWheel: true, victim: victim.key, chosen };
        broadcastGame(roomId);
        return;
      }
    }
  }

  let next = (gs.current + 1) % gs.players.length, loops = 0;
  while (gs.players[next].bankrupt && loops < gs.players.length) { next=(next+1)%gs.players.length; loops++; }
  gs.current = next;
  gs.phase   = 'roll';

  const alive = gs.players.filter(p=>!p.bankrupt);
  if (alive.length === 1) {
    gs.phase = 'done';
    alive[0].winner = true;
    addLog(gs, `🏆 ${alive[0].name} WINT!`);
    ROOMS[roomId].state = 'finished';
  }
}

function spinWheel() {
  const total = POLICE_WHEEL.reduce((s,w)=>s+w.weight,0);
  let rand = Math.random()*total;
  for (const seg of POLICE_WHEEL) { rand-=seg.weight; if(rand<=0) return seg; }
  return POLICE_WHEEL[0];
}

function sendToJail(gs, p) {
  p.inJail=true; p.jailTurns=0; p.position=10;
  addLog(gs, `🚔 ${p.name} gaat naar de bajes!`);
}

function checkBankrupt(gs, p, roomId) {
  if (p.money > 0) return;
  p.bankrupt=true; p.money=0;
  p.properties.forEach(id=>delete gs.properties[id]);
  p.properties=[];
  addLog(gs, `💀 ${p.name} is BANKRUPT!`);
}

function addLog(gs, text) {
  gs.log.unshift({ text, ts: Date.now() });
  if (gs.log.length > 80) gs.log.pop();
}

// ═══════════════════════════════════════════
//  Broadcast helpers
// ═══════════════════════════════════════════
function broadcastRoom(roomId) {
  const room = ROOMS[roomId]; if (!room) return;
  const payload = {
    type: 'room:state',
    data: {
      id:      room.id,
      host:    room.hostKey,
      state:   room.state,
      players: room.players.map(p=>({ key:p.key, name:p.name, token:p.token, ready:p.ready })),
      chat:    room.chat.slice(-30),
    }
  };
  room.players.forEach(p => broadcastToUser(p.key, payload));
}

function broadcastGame(roomId) {
  const room = ROOMS[roomId]; if (!room || !room.game) return;
  const payload = { type: 'game:state', data: room.game };
  room.players.forEach(p => broadcastToUser(p.key, payload));
}

function broadcastToRoom(roomId, msg) {
  const room = ROOMS[roomId]; if (!room) return;
  room.players.forEach(p => broadcastToUser(p.key, msg));
}

function broadcastToUser(key, msg) {
  Object.values(CLIENTS).forEach(c => {
    if (c.userKey === key && c.ws.readyState === WebSocket.OPEN)
      send(c.ws, msg);
  });
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify(msg));
}

function sendErr(wsId, message) {
  send(CLIENTS[wsId].ws, { type: 'error', data: { message } });
}

function handleDisconnect(wsId) {
  const { userKey } = CLIENTS[wsId];
  if (userKey && USERS[userKey]) USERS[userKey].online = false;
  delete CLIENTS[wsId];
}

// ── Helpers ───────────────────────────────
function generateCode() {
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<5;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
}

function getUserSafe(key) {
  const u=USERS[key]; if(!u) return null;
  return { key:u.key, name:u.name, played:u.played, won:u.won, friends:getFriendsList(key), requests:(u.requests||[]).map(k=>({key:k,name:USERS[k]?.name||k})) };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎲 Shankroll server draait op poort ${PORT}`));
