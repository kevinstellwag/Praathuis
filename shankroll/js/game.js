// ════════════════════════════════════════════
//  game.js — alle spellogica
// ════════════════════════════════════════════

let GS = null; // Game State

// ── Init ──────────────────────────────────
function startGame() {
  GS = {
    players: lobbyPlayers.slice(0, 4).map((p, i) => ({
      id:          i,
      name:        p.name,
      token:       p.token,
      money:       1500,
      position:    0,
      properties:  [],
      inJail:      false,
      jailTurns:   0,
      freeJail:    false,
      doubles:     0,
      bankrupt:    false,
    })),
    current:    0,
    properties: {},    // spaceId → playerId
    rolled:     false,
    rentDue:    null,  // { amount, ownerId }
    log:        [],
  };

  buildBoard();
  goTo('screen-game');
  updateGameUI();
}

function quitGame() {
  if (confirm('Spel verlaten?')) {
    GS = null;
    goTo('screen-home');
  }
}

// ── Helpers ───────────────────────────────
function curP() { return GS.players[GS.current]; }

function nextAlive(from) {
  let next = (from + 1) % GS.players.length;
  let loops = 0;
  while (GS.players[next].bankrupt && loops < GS.players.length) {
    next = (next + 1) % GS.players.length;
    loops++;
  }
  return next;
}

// ── Dice ──────────────────────────────────
function rollDice() {
  if (GS.rolled) return;

  const p  = curP();
  const d1 = Math.ceil(Math.random() * 6);
  const d2 = Math.ceil(Math.random() * 6);
  const total   = d1 + d2;
  const doubles = d1 === d2;

  animDice(d1, d2, total);

  GS.rolled = true;
  disableBtn('roll-btn');

  if (p.inJail) { handleJailRoll(p, doubles, total); return; }

  if (doubles) {
    p.doubles++;
    if (p.doubles >= 3) {
      addLog(`🚔 ${p.name} gooit 3× doubles — bajes in!`, 'bad');
      sendToJail(p);
      endTurn(false);
      return;
    }
    addLog(`🎲 ${p.name}: ${d1}+${d2}=${total} — DOUBLES! Gooit nog een keer.`);
  } else {
    p.doubles = 0;
    addLog(`🎲 ${p.name}: ${d1}+${d2}=${total}`);
  }

  movePlayer(p, total, doubles);
}

function handleJailRoll(p, doubles, total) {
  if (doubles) {
    p.inJail = false;
    p.jailTurns = 0;
    addLog(`🎉 ${p.name} gooit doubles! Vrij uit de bajes.`, 'good');
    movePlayer(p, total, false);
    return;
  }
  p.jailTurns++;
  if (p.jailTurns >= 3) {
    p.money -= 50;
    p.inJail = false;
    p.jailTurns = 0;
    addLog(`💸 ${p.name} betaalt €50 na 3 beurten — vrij.`, 'bad');
    checkBankrupt(p);
    if (!p.bankrupt) movePlayer(p, total, false);
    else endTurn(false);
  } else {
    addLog(`🔒 ${p.name} zit in de bajes (beurt ${p.jailTurns}/3).`, 'bad');
    endTurn(false);
  }
}

// ── Movement ──────────────────────────────
function movePlayer(p, steps, doubles) {
  const oldPos = p.position;
  const newPos = (p.position + steps) % 40;

  // Passeer GO
  if (newPos < oldPos) {
    p.money += 200;
    addLog(`🚀 ${p.name} passeert GO — +€200!`, 'good');
    toast(`${p.token} passeert GO! +€200`);
  }

  p.position = newPos;
  renderTokens();
  handleLanding(p, doubles);
}

function handleLanding(p, doubles) {
  const sp = BOARD[p.position];
  addLog(`📍 ${p.name} landt op ${sp.emoji} ${sp.name}`);
  disableActions();

  switch (sp.type) {
    case 'start':
      endTurn(doubles); break;

    case 'property':
    case 'station':
    case 'utility':
      handlePropertyLanding(p, sp, doubles); break;

    case 'tax':
      p.money -= sp.rent;
      addLog(`🏛️ ${p.name} betaalt €${sp.rent} belasting.`, 'bad');
      toast(`€${sp.rent} belasting!`);
      checkBankrupt(p);
      if (!p.bankrupt) endTurn(doubles);
      break;

    case 'chance':
      drawCard(p, CHANCE_CARDS, doubles); break;

    case 'community':
      drawCard(p, COMMUNITY_CARDS, doubles); break;

    case 'jail':
      addLog(`👀 ${p.name} bezoekt de bajes (op bezoek).`);
      endTurn(doubles); break;

    case 'go-jail':
      sendToJail(p);
      endTurn(false); break;

    case 'free':
      addLog(`☮️ ${p.name} staat op Gratis Rust.`);
      endTurn(doubles); break;

    default:
      endTurn(doubles);
  }
  updateGameUI();
}

function handlePropertyLanding(p, sp, doubles) {
  const ownerId = GS.properties[sp.id];

  if (ownerId === undefined || ownerId === null) {
    // Te koop
    addLog(`🏠 ${sp.name} is beschikbaar voor €${sp.price}.`);
    if (p.money >= sp.price) enableBtn('btn-buy');
    enableBtn('btn-end');
  } else if (ownerId === p.id) {
    addLog(`✅ ${p.name} staat op eigen terrein.`, 'good');
    endTurn(doubles);
  } else {
    const owner  = GS.players[ownerId];
    const rent   = calcRent(sp, ownerId);
    GS.rentDue = { amount: rent, ownerId, doubles };
    addLog(`😬 ${p.name} staat op ${owner.name}'s pand — huur €${rent}!`, 'bad');
    enableBtn('btn-dash');
    enableBtn('btn-pay');
  }
}

function calcRent(sp, ownerId) {
  if (sp.type === 'utility') {
    const d1txt = document.getElementById('die-1').textContent;
    const d2txt = document.getElementById('die-2').textContent;
    const d1 = parseInt(d1txt) || 3;
    const d2 = parseInt(d2txt) || 3;
    return (d1 + d2) * 10;
  }
  return sp.rent;
}

// ── Actions ───────────────────────────────
function buyProperty() {
  const p  = curP();
  const sp = BOARD[p.position];

  p.money -= sp.price;
  GS.properties[sp.id] = p.id;
  p.properties.push(sp.id);

  addLog(`🏠 ${p.name} koopt ${sp.name} voor €${sp.price}!`, 'good');
  toast(`${p.token} koopt ${sp.name}!`);

  disableActions();
  enableBtn('btn-end');
  renderOwners();
  updateGameUI();
}

function dashAction() {
  const p    = curP();
  const { amount, ownerId, doubles } = GS.rentDue;
  const success = Math.random() < 0.30;
  GS.rentDue = null;
  disableActions();

  if (success) {
    addLog(`🏃 ${p.name} DASHED! Ontsnapt — betaalt niets!`, 'good');
    showModal('🏃', 'GEFLIPPED!',
      'Je bent ontsnapt! Ze konden je niet bijhouden.',
      [{ label: 'YOOO 🎉', bg: '#00C853', color: '#fff', cb: () => { closeModal(); endTurn(doubles || false); } }]
    );
  } else {
    const fine  = amount * 2;
    p.money    -= fine;
    const owner = GS.players[ownerId];
    owner.money += fine;
    addLog(`🚔 ${p.name} gepakt! Betaalt 2×: €${fine}!`, 'bad');
    checkBankrupt(p);

    showModal('🚔', 'GEPAKT!',
      `Politie pakt je op het laatste moment!\n\nJe betaalt 2× huur = €${fine} aan ${owner.name}.`,
      [{ label: 'GODVER 😤', bg: '#FF1744', color: '#fff', cb: () => { closeModal(); if (!p.bankrupt) endTurn(doubles || false); } }]
    );
  }
  updateGameUI();
}

function payRent() {
  const p    = curP();
  const { amount, ownerId, doubles } = GS.rentDue;
  const owner = GS.players[ownerId];

  p.money     -= amount;
  owner.money += amount;
  GS.rentDue   = null;

  addLog(`💸 ${p.name} betaalt €${amount} huur aan ${owner.name}.`, 'bad');
  toast(`€${amount} huur betaald aan ${owner.token}`);

  checkBankrupt(p);
  disableActions();
  if (!p.bankrupt) enableBtn('btn-end');
  updateGameUI();
}

// ── Cards ─────────────────────────────────
function drawCard(p, deck, doubles) {
  const card = deck[Math.floor(Math.random() * deck.length)];
  addLog(`🃏 Kaart: ${card.text}`, 'event');

  let sub = '';
  switch (card.action) {
    case 'gain':         sub = `<strong style="color:#00C853">+€${card.amount}</strong>`; break;
    case 'lose':         sub = `<strong style="color:#FF1744">−€${card.amount}</strong>`; break;
    case 'jail':         sub = `<strong style="color:#FF1744">Bajes in! 🚔</strong>`; break;
    case 'free-jail':    sub = `<strong style="color:#00C853">Kaart bewaard! 🎉</strong>`; break;
    case 'goto':         sub = `<strong style="color:#00C853">Naar GO +€${card.bonus}</strong>`; break;
    case 'pay-all':      sub = `<strong style="color:#FF1744">−€${card.amount} per speler</strong>`; break;
    case 'collect-all':  sub = `<strong style="color:#00C853">+€${card.amount} per speler</strong>`; break;
  }

  showModal('🃏', 'Kaart!', `${card.text}<br><br>${sub}`, [
    { label: 'OK', bg: '#0A0A0A', color: '#fff', cb: () => {
      closeModal();
      applyCard(card, p);
      if (!p.bankrupt) endTurn(doubles);
    }}
  ]);
}

function applyCard(card, p) {
  switch (card.action) {
    case 'gain':
      p.money += card.amount;
      break;
    case 'lose':
      p.money -= card.amount;
      checkBankrupt(p);
      break;
    case 'jail':
      sendToJail(p);
      break;
    case 'free-jail':
      p.freeJail = true;
      break;
    case 'goto':
      p.position = card.target;
      p.money   += card.bonus;
      renderTokens();
      break;
    case 'pay-all':
      GS.players.forEach(op => {
        if (op.id !== p.id && !op.bankrupt) {
          op.money -= card.amount;
          p.money  += card.amount;
        }
      });
      checkBankrupt(p);
      break;
    case 'collect-all':
      GS.players.forEach(op => {
        if (op.id !== p.id && !op.bankrupt) {
          p.money  += card.amount;
          op.money -= card.amount;
        }
      });
      break;
  }
  updateGameUI();
}

// ── End Turn ──────────────────────────────
function endTurn(doubles = false) {
  const p = curP();

  if (doubles && !p.inJail) {
    addLog(`🎲 ${p.name} gooit nog een keer!`);
    GS.rolled = false;
    disableActions();
    enableBtn('roll-btn');
    updateGameUI();
    return;
  }

  const next = nextAlive(GS.current);
  GS.current = next;
  GS.rolled  = false;
  GS.rentDue = null;
  disableActions();
  enableBtn('roll-btn');

  // Check winconditie
  const alive = GS.players.filter(pl => !pl.bankrupt);
  if (alive.length === 1) {
    showWinner(alive[0]);
    return;
  }

  updateGameUI();
}

// ── Jail ──────────────────────────────────
function sendToJail(p) {
  p.inJail    = true;
  p.jailTurns = 0;
  p.position  = 10;
  renderTokens();
  addLog(`🚔 ${p.name} gaat naar de bajes!`, 'bad');
  toast(`${p.token} naar de bajes!`);
}

// ── Bankrupt ──────────────────────────────
function checkBankrupt(p) {
  if (p.money > 0) return;
  p.bankrupt = true;
  p.money    = 0;
  addLog(`💀 ${p.name} is BANKRUPT!`, 'bad');
  toast(`${p.token} is bankrupt! 💀`);

  // Vrij panden op
  p.properties.forEach(id => delete GS.properties[id]);
  p.properties = [];
  renderOwners();

  disableActions();
  setTimeout(() => endTurn(false), 800);
}

// ── Win ───────────────────────────────────
function showWinner(p) {
  const user = getCurrentUser();
  if (user) {
    updateAccountStat(user, 'played');
    const accounts = getAccounts();
    if (accounts[user] && p.name.toLowerCase() === accounts[user].name.toLowerCase()) {
      updateAccountStat(user, 'won');
    }
  }

  setTimeout(() => {
    document.getElementById('win-token').textContent = p.token;
    document.getElementById('win-name').textContent  = p.name;
    document.getElementById('win-stats').textContent = `€${p.money} over · ${p.properties.length} panden`;
    goTo('screen-win');
  }, 600);
}

// ── Buttons ───────────────────────────────
function disableActions() {
  ['btn-buy','btn-dash','btn-pay','btn-end'].forEach(disableBtn);
}

function enableBtn(id)  { const el = document.getElementById(id); if (el) el.disabled = false; }
function disableBtn(id) { const el = document.getElementById(id); if (el) el.disabled = true; }
