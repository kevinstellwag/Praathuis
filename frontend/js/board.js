// ═══════════════════════════════════════
//  board.js — bord bouwen
// ═══════════════════════════════════════

let _lastPositions = {}; // key → positie (om animaties te triggeren)

function buildBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {
      // Center stuk
      if (row >= 2 && row <= 9 && col >= 2 && col <= 9) {
        if (row === 2 && col === 2) {
          const c = document.createElement('div');
          c.className = 'cell center';
          c.style.gridColumn = '2 / 10';
          c.style.gridRow    = '2 / 10';
          c.innerHTML = `
            <div class="center-inner">
              <h2>TRAP<br>BOARD</h2>
              <p>Speel · Win · Domineer</p>
              <div class="center-npc" id="npc-center" style="display:none">🚔 Politie actief</div>
            </div>`;
          board.appendChild(c);
        }
        continue;
      }

      const id = spaceFromGrid(col, row);
      if (id < 0) continue;
      const sp = BOARD[id];

      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${id}`;
      cell.setAttribute('data-type', sp.type);
      cell.title = sp.name;
      cell.onclick = () => showSpaceCard(id);

      cell.innerHTML = `
        ${sp.color ? `<div class="cell-stripe" style="background:${sp.color}"></div>` : ''}
        <div class="cell-tokens" id="tok-${id}"></div>
        <div class="cell-emoji">${sp.emoji}</div>
        <div class="cell-label">${sp.name}</div>
        ${sp.price > 0 ? `<div class="cell-price">${fmt(sp.price)}</div>` : ''}
        <div class="cell-owner" id="own-${id}" style="display:none"></div>
      `;

      board.appendChild(cell);
    }
  }
}

function renderTokensOnBoard(gs) {
  if (!gs) return;

  // Leeg alles
  document.querySelectorAll('[id^="tok-"]').forEach(el => el.innerHTML = '');

  // Spelers
  gs.players.forEach(p => {
    if (p.bankrupt) return;
    const el = document.getElementById(`tok-${p.position}`);
    if (!el) return;

    const moved = _lastPositions[p.key] !== p.position;
    const cls   = `cell-token${moved ? ' just-moved' : ''}`;
    el.innerHTML += `<span class="${cls}" title="${p.name}" style="color:${p.color||'white'}">${p.token}</span>`;

    if (moved) _lastPositions[p.key] = p.position;
  });

  // NPC
  if (gs.npc?.active) {
    const el = document.getElementById(`tok-${gs.npc.position}`);
    if (el) el.innerHTML += `<span class="cell-token npc" title="Politie NPC">🚔</span>`;

    const npcCenter = document.getElementById('npc-center');
    if (npcCenter) npcCenter.style.display = '';
  }

  // Highlight huidige speler
  document.querySelectorAll('.cell.highlighted').forEach(c => c.classList.remove('highlighted'));
  if (gs.players[gs.current]) {
    const pos = gs.players[gs.current].position;
    const el  = document.getElementById(`cell-${pos}`);
    if (el) el.classList.add('highlighted');
  }
}

function renderOwnersOnBoard(gs) {
  if (!gs) return;
  document.querySelectorAll('[id^="own-"]').forEach(el => el.style.display = 'none');
  Object.entries(gs.properties).forEach(([sid, playerKey]) => {
    const player = gs.players.find(p => p.key === playerKey);
    const el     = document.getElementById(`own-${sid}`);
    if (el && player) {
      el.style.display    = 'block';
      el.style.background = player.color || '#6366f1';
    }
  });
}
