// ════════════════════════════════════════════
//  board.js — bord bouwen en renderen
// ════════════════════════════════════════════

function buildBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  // Bouw 10×10 grid
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 10; col++) {

      // Center gebied
      if (row >= 2 && row <= 9 && col >= 2 && col <= 9) {
        if (row === 2 && col === 2) {
          const center = document.createElement('div');
          center.className = 'cell center-cell';
          center.style.gridColumn = '2 / 10';
          center.style.gridRow    = '2 / 10';
          center.innerHTML = `
            <div class="center-content">
              <h2>TRAP<br>BOARD</h2>
              <p>speel. win. domineer.</p>
            </div>
          `;
          board.appendChild(center);
        }
        continue;
      }

      const id    = spaceFromGrid(col, row);
      const space = BOARD[id];
      if (!space) continue;

      const cell  = document.createElement('div');
      cell.className = `cell type-${space.type}`;
      cell.id        = `cell-${id}`;
      cell.title     = space.name + (space.price > 0 ? ` (€${space.price})` : '');

      cell.innerHTML = `
        ${space.color ? `<div class="cell-color" style="background:${space.color}"></div>` : ''}
        <div class="cell-tokens" id="tok-${id}"></div>
        <div class="cell-emoji">${space.emoji}</div>
        <div class="cell-name-text">${space.name}</div>
        ${space.price > 0 ? `<div class="cell-price-text">€${space.price}</div>` : ''}
        <div class="cell-owner" id="own-${id}" style="display:none"></div>
      `;

      board.appendChild(cell);
    }
  }
}

function renderTokens() {
  if (!GS) return;

  // Leeg alle token-slots
  document.querySelectorAll('[id^="tok-"]').forEach(el => el.innerHTML = '');

  // Zet elke speler op zijn positie
  GS.players.forEach(p => {
    if (p.bankrupt) return;
    const el = document.getElementById(`tok-${p.position}`);
    if (el) el.innerHTML += `<span title="${p.name}">${p.token}</span>`;
  });
}

function renderOwners() {
  if (!GS) return;

  // Reset
  document.querySelectorAll('[id^="own-"]').forEach(el => el.style.display = 'none');

  // Toon eigenaar stip
  Object.entries(GS.properties).forEach(([spaceId, playerId]) => {
    const el = document.getElementById(`own-${spaceId}`);
    if (el) {
      el.style.display    = 'block';
      el.style.background = PLAYER_COLORS[playerId % PLAYER_COLORS.length];
    }
  });
}
