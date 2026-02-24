// ═══════════════════════════════════════
//  game.js — spellogica (frontend)
// ═══════════════════════════════════════

let GS = null; // Game State (ontvangen van server)

const DICE_FACES = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

// ── Acties ────────────────────────────
function sendRoll() {
  document.getElementById('roll-btn').disabled = true;
  WS.send('game:roll');
}

function sendGameChat() {
  const input = document.getElementById('game-chat-input');
  const text  = input.value.trim();
  if (!text) return;
  WS.send('chat:message', { text });
  input.value = '';
}

function confirmQuit() {
  if (confirm('Spel verlaten?')) { WS.send('room:leave'); goHome(); }
}

function goHome() {
  GS = null;
  closeCardOverlay();
  showScreen('s-home');
}

// ── Game state updaten ────────────────
function applyGameState(gs) {
  GS = gs;

  buildBoardIfNeeded();
  renderTokensOnBoard(gs);
  renderOwnersOnBoard(gs);
  renderSidePlayers(gs);
  renderGameLog(gs.log || []);
  updateDiceUI(gs);
  updateTurnUI(gs);

  if (gs.npc?.active) {
    document.getElementById('npc-indicator').style.display = '';
  }

  // Space card: als er een pending card is, toon hem
  if (gs.pendingCard && !gs.pendingCard.autoResolve) {
    renderSpaceCard(gs);
  }

  // Police wheel
  if (gs.pendingCard?.policeWheel) {
    showPoliceWheel(gs.pendingCard);
  }

  // Winner
  if (gs.phase === 'done') {
    const winner = gs.players.find(p => p.winner);
    if (winner) showWinScreen(winner);
  }
}

let boardBuilt = false;
function buildBoardIfNeeded() {
  if (!boardBuilt) { buildBoard(); boardBuilt = true; }
}

// ── Dobbelstenen UI ───────────────────
function animateDice(d1, d2) {
  const die1 = document.getElementById('d1');
  const die2 = document.getElementById('d2');
  const sum  = document.getElementById('dice-sum');
  const w1   = document.getElementById('d1-watch');
  const w2   = document.getElementById('d2-watch');
  const ws   = document.getElementById('dice-sum-watch');

  const update = (el1, el2, elSum) => {
    if (!el1) return;
    el1.classList.add('rolling'); el2.classList.add('rolling');
    el1.textContent = DICE_FACES[d1];
    el2.textContent = DICE_FACES[d2];
    if (elSum) elSum.textContent = d1 + d2;
    setTimeout(() => { el1.classList.remove('rolling'); el2.classList.remove('rolling'); }, 500);
  };

  update(die1, die2, sum);
  update(w1, w2, ws);
}

function updateDiceUI(gs) {
  if (!gs.dice) return;
  const [d1, d2] = gs.dice;
  const setText = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = DICE_FACES[v] || v; };
  setText('d1', d1); setText('d2', d2); setText('d1-watch', d1); setText('d2-watch', d2);
  const total = d1 + d2;
  ['dice-sum','dice-sum-watch'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=total; });
}

// ── Beurt UI ──────────────────────────
function updateTurnUI(gs) {
  if (!ME || !gs) return;
  const isMyTurn = gs.players[gs.current]?.key === ME.key;
  const cp       = gs.players[gs.current];

  document.getElementById('your-turn-block').style.display  = isMyTurn  ? '' : 'none';
  document.getElementById('waiting-block').style.display    = !isMyTurn ? '' : 'none';

  if (!isMyTurn && cp) {
    document.getElementById('waiting-name').textContent = `Wachten op ${cp.name}...`;
  }

  if (isMyTurn) {
    document.getElementById('roll-btn').disabled = gs.phase !== 'roll';
  }
}

// ── Side players ──────────────────────
function renderSidePlayers(gs) {
  const el = document.getElementById('game-players-list');
  if (!el || !gs) return;
  el.innerHTML = gs.players.map(p => `
    <div class="player-row ${p.key === gs.players[gs.current]?.key ? 'active-player' : ''} ${p.bankrupt ? 'bankrupt' : ''}">
      <span class="pr-token">${p.token}</span>
      <div class="pr-info">
        <div class="pr-name">${p.name}${p.inJail ? ' 🔒' : ''}${p.cards?.includes('free-jail') ? ' 🎉' : ''}</div>
        <div class="pr-pos">${BOARD[p.position]?.name || ''}</div>
      </div>
      <div class="pr-money ${p.money < 2000 ? 'low' : ''}">${fmt(p.money)}</div>
    </div>
  `).join('');
}

// ── Game log ──────────────────────────
function renderGameLog(log) {
  const el = document.getElementById('game-log');
  if (!el) return;
  el.innerHTML = (log || []).map(e => {
    let cls = '';
    if (e.text?.includes('koopt')||e.text?.includes('Ontvang')||e.text?.includes('DASHED')||e.text?.includes('vrij')) cls='good';
    if (e.text?.includes('Betaal')||e.text?.includes('gepakt')||e.text?.includes('BANKRUPT')||e.text?.includes('bajes')) cls='bad';
    if (e.text?.includes('NPC')||e.text?.includes('Politie')||e.text?.includes('WINNAAR')) cls='event';
    return `<div class="log-entry ${cls}">${e.text}</div>`;
  }).join('');
}

// ── Space Card ────────────────────────
function showSpaceCard(spaceId) {
  // Klik op cel toont altijd de kaart
  if (!GS) return;
  const sp = BOARD[spaceId];
  const ownerKey = GS.properties?.[spaceId];
  const owner    = ownerKey ? GS.players.find(p => p.key === ownerKey) : null;
  const cp       = GS.players[GS.current];
  const isMyTurn = cp?.key === ME?.key;

  const overlay = document.getElementById('card-overlay');
  const card    = document.getElementById('space-card');

  document.getElementById('sc-color').style.background = sp.color || '#333';
  document.getElementById('sc-emoji').textContent      = sp.emoji;
  document.getElementById('sc-name').textContent       = sp.name;
  document.getElementById('sc-badge').textContent      = typeLabel(sp.type);

  // Details
  const details = document.getElementById('sc-details');
  let rows = '';

  if (sp.price > 0) {
    rows += detailRow('Koopprijs', fmt(sp.price), 'green');
  }
  if (sp.rent > 0) {
    rows += detailRow('Huur', fmt(sp.rent));
  }
  if (sp.type === 'tax') {
    rows += detailRow('Belasting', fmt(sp.rent), 'red');
  }
  if (owner) {
    rows += detailRow('Eigenaar', owner.name, 'orange');
  }
  if (sp.type === 'utility' && GS.dice) {
    const rentCalc = (GS.dice[0]+GS.dice[1]) * 300;
    rows += detailRow('Huur (dobbelstenen)', fmt(rentCalc));
  }

  details.innerHTML = rows;

  // Actieknoppen
  const actions = document.getElementById('sc-actions');
  actions.innerHTML = '';

  // Alleen knoppen als het jouw beurt is EN de kaart pending is
  if (isMyTurn && GS.pendingCard && !GS.pendingCard.autoResolve) {
    const pc = GS.pendingCard;

    if (pc.canBuy) {
      actions.innerHTML += `<button class="sc-btn buy" onclick="WS.send('game:buy');closeCardOverlay()">🏠 Kopen — ${fmt(sp.price)}</button>`;
      actions.innerHTML += `<button class="sc-btn skip" onclick="WS.send('game:skip');closeCardOverlay()">Overslaan</button>`;
    }
    else if (pc.cantAfford) {
      actions.innerHTML += `<div style="text-align:center;padding:12px;color:var(--red);font-size:14px;font-weight:600">Niet genoeg geld — beurt gaat door</div>`;
    }
    else if (pc.mustPay) {
      const rent = pc.rent;
      const hasCard = GS.players.find(p=>p.key===ME?.key)?.cards?.includes('free-jail');
      actions.innerHTML += `<button class="sc-btn dash" onclick="WS.send('game:dash');closeCardOverlay()">🏃 Dashen <span style="background:var(--orange);color:white;font-size:10px;padding:2px 6px;border-radius:20px;margin-left:4px">30%</span></button>`;
      actions.innerHTML += `<button class="sc-btn pay"  onclick="WS.send('game:pay');closeCardOverlay()">💸 Betalen — ${fmt(rent)}</button>`;
      if (hasCard) {
        actions.innerHTML += `<button class="sc-btn skip" onclick="useJailCard();closeCardOverlay()" style="background:rgba(234,179,8,.12);color:var(--yellow);border:1px solid rgba(234,179,8,.3)">🎉 Vrij-uit-kaart gebruiken</button>`;
      }
    }
    else if (sp.type === 'chance' || sp.type === 'community') {
      actions.innerHTML += `<button class="sc-btn buy" onclick="WS.send('game:card-action');closeCardOverlay()" style="background:var(--yellow)">🃏 Kaart trekken</button>`;
    }
    else {
      actions.innerHTML += `<button class="sc-btn skip" onclick="WS.send('game:end-turn');closeCardOverlay()">Doorgaan ›</button>`;
    }
  } else {
    // Alleen sluiten
    actions.innerHTML = `<button class="sc-btn skip" onclick="closeCardOverlay()">Sluiten</button>`;
  }

  overlay.classList.add('open');
}

function renderSpaceCard(gs) {
  if (!gs.pendingCard) return;
  const cp = gs.players[gs.current];
  showSpaceCard(cp.position);
}

function detailRow(label, val, colorClass='') {
  return `<div class="sc-detail-row">
    <span class="sc-detail-label">${label}</span>
    <span class="sc-detail-val ${colorClass}">${val}</span>
  </div>`;
}

function closeCardOverlay() {
  document.getElementById('card-overlay').classList.remove('open');
}

function useJailCard() {
  WS.send('game:card-action', { action: 'use-jail-card' });
}

// ── Police Wheel ──────────────────────
const WHEEL_SEGMENTS = [
  { label:"Waarschuwing",     emoji:"⚠️" },
  { label:"€2.000 Boete",     emoji:"💸" },
  { label:"€5.000 Boete",     emoji:"💸" },
  { label:"Gevangenis",       emoji:"🔒" },
  { label:"Agent vriendelijk",emoji:"🕺" },
];

function showPoliceWheel(pendingCard) {
  const overlay = document.getElementById('wheel-overlay');
  overlay.style.display = 'flex';

  const victim = GS?.players.find(p => p.key === pendingCard.victim);
  document.getElementById('wheel-victim-name').textContent = `${victim?.name || '?'} wordt gecontroleerd`;

  const slots = document.getElementById('wheel-slots');
  slots.innerHTML = WHEEL_SEGMENTS.map((s, i) => `
    <div class="wheel-slot" id="wslot-${i}">
      <span>${s.emoji}</span><span>${s.label}</span>
    </div>
  `).join('');

  const resultBox = document.getElementById('wheel-result-box');
  resultBox.style.display = 'none';

  // Animeer
  let tick = 0;
  const interval = setInterval(() => {
    document.querySelectorAll('.wheel-slot').forEach(s => s.classList.remove('flash'));
    const idx = tick % WHEEL_SEGMENTS.length;
    document.getElementById(`wslot-${idx}`)?.classList.add('flash');
    tick++;
  }, 120);

  setTimeout(() => {
    clearInterval(interval);
    document.querySelectorAll('.wheel-slot').forEach(s => s.classList.remove('flash'));

    // Toon gekozen resultaat
    const chosen = pendingCard.chosen;
    const chosenIdx = WHEEL_SEGMENTS.findIndex(s => s.label === chosen.label);
    if (chosenIdx >= 0) document.getElementById(`wslot-${chosenIdx}`)?.classList.add('chosen');

    document.getElementById('wheel-res-emoji').textContent = chosen.emoji || '⚠️';
    document.getElementById('wheel-res-label').textContent = chosen.label;
    resultBox.style.display = '';

    // Sluit na 2.5 seconden
    setTimeout(() => {
      overlay.style.display = 'none';
      // Trigger next turn
      if (ME && GS.players[GS.current]?.key === ME.key) {
        WS.send('game:end-turn');
      }
    }, 2500);
  }, 2200);
}

// ── Win ────────────────────────────────
function showWinScreen(winner) {
  document.getElementById('win-token').textContent       = winner.token;
  document.getElementById('win-player-name').textContent = winner.name;
  document.getElementById('win-money').textContent       = fmt(winner.money) + ' over';
  document.getElementById('win-overlay').style.display  = 'flex';
}
