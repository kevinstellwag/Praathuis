// ════════════════════════════════════════════
//  board.js — bord opbouwen
// ════════════════════════════════════════════

function buildBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  for (let row=1; row<=10; row++) {
    for (let col=1; col<=10; col++) {
      // Center
      if (row>=2 && row<=9 && col>=2 && col<=9) {
        if (row===2 && col===2) {
          const c = document.createElement('div');
          c.className = 'cell center-cell';
          c.style.gridColumn='2/10';
          c.style.gridRow='2/10';
          c.innerHTML=`
            <div class="center-art">
              <div class="center-logo">TRAP<br>BOARD</div>
              <div class="center-sub">speel · win · domineer</div>
              <div class="center-police" id="npc-center" style="display:none">
                <span>🚔</span><span class="npc-label">NPC POLITIE</span>
              </div>
            </div>`;
          board.appendChild(c);
        }
        continue;
      }

      const id    = spaceFromGrid(col, row);
      if (id < 0) continue;
      const space = BOARD[id];

      const cell = document.createElement('div');
      cell.className = `cell type-${space.type}`;
      cell.id = `cell-${id}`;
      cell.setAttribute('data-id', id);

      // Hoeken krijgen extra class
      if ([0,10,19,28].includes(id)) cell.classList.add('corner');

      cell.innerHTML=`
        ${space.color ? `<div class="cell-stripe" style="background:${space.color}"></div>`:''}
        <div class="cell-emoji-wrap" id="tok-${id}"></div>
        <div class="cell-center-wrap">
          <div class="cell-emo">${space.emoji}</div>
          <div class="cell-nm">${space.name}</div>
          ${space.price>0 ? `<div class="cell-pr">${fmt(space.price)}</div>`:''}
        </div>
        <div class="cell-owner-dot" id="own-${id}" style="display:none"></div>
      `;

      board.appendChild(cell);
    }
  }
}

function renderTokens() {
  if (!GS) return;
  document.querySelectorAll('[id^="tok-"]').forEach(el=>el.innerHTML='');

  // Spelers
  GS.players.forEach(p=>{
    if (p.bankrupt) return;
    const el = document.getElementById(`tok-${p.position}`);
    if (el) el.innerHTML += `<span class="board-token" title="${p.name}">${p.token}</span>`;
  });

  // NPC politie
  if (GS.npc && !GS.npc.done) {
    const el = document.getElementById(`tok-${GS.npc.position}`);
    if (el) el.innerHTML += `<span class="board-token npc-token" title="Politie">🚔</span>`;
  }
}

function renderOwners() {
  if (!GS) return;
  document.querySelectorAll('[id^="own-"]').forEach(el=>el.style.display='none');
  Object.entries(GS.properties).forEach(([sid,pid])=>{
    const el=document.getElementById(`own-${sid}`);
    if (el) { el.style.display='block'; el.style.background=PLAYER_COLORS[pid%PLAYER_COLORS.length]; }
  });
}

// Highlight het vakje waar de huidige speler staat
function highlightCurrentCell(pos) {
  document.querySelectorAll('.cell').forEach(c=>c.classList.remove('highlighted'));
  const el = document.getElementById(`cell-${pos}`);
  if (el) { el.classList.add('highlighted'); el.scrollIntoView({block:'nearest',behavior:'smooth'}); }
}
