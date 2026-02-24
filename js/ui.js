// ════════════════════════════════════════════
//  ui.js — UI updaten, modals, toasts, log
// ════════════════════════════════════════════

// ── Game UI ───────────────────────────────
function updateGameUI() {
  if (!GS) return;

  const p = curP();

  // Current player box
  document.getElementById('cur-token').textContent  = p.token;
  document.getElementById('cur-name').textContent   = p.name;
  document.getElementById('cur-money').textContent  = `€${p.money}`;
  document.getElementById('cur-money').className    = 'cur-money' + (p.money < 200 ? ' low' : '');
  document.getElementById('cur-pos').textContent    = BOARD[p.position]?.name || '';
  document.getElementById('jail-tag').style.display = p.inJail ? '' : 'none';

  // Players overview
  const overview = document.getElementById('players-overview');
  overview.innerHTML = GS.players.map(pl => `
    <div class="p-row ${pl.id === GS.current ? 'active' : ''} ${pl.bankrupt ? 'bankrupt' : ''}">
      <span class="p-row-token">${pl.token}</span>
      <span class="p-row-name">${pl.name}${pl.inJail ? ' 🔒' : ''}</span>
      <span class="p-row-money ${pl.money < 200 ? 'low' : ''}">€${pl.money}</span>
    </div>
  `).join('');

  renderTokens();
  renderOwners();
  renderLog();
}

// ── Dice animation ────────────────────────
const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function animDice(d1, d2, total) {
  const el1 = document.getElementById('die-1');
  const el2 = document.getElementById('die-2');
  const tot = document.getElementById('dice-total');

  el1.classList.add('rolling');
  el2.classList.add('rolling');
  el1.textContent = DICE_FACES[d1];
  el2.textContent = DICE_FACES[d2];
  tot.textContent = total;

  setTimeout(() => {
    el1.classList.remove('rolling');
    el2.classList.remove('rolling');
  }, 450);
}

// ── Log ───────────────────────────────────
function addLog(text, type = '') {
  if (!GS) return;
  GS.log.unshift({ text, type });
  if (GS.log.length > 60) GS.log.pop();
  renderLog();
}

function renderLog() {
  if (!GS) return;
  const el = document.getElementById('game-log');
  if (!el) return;
  el.innerHTML = GS.log.map(e =>
    `<div class="log-entry ${e.type}">${e.text}</div>`
  ).join('');
}

// ── Modal ─────────────────────────────────
function showModal(icon, title, body, buttons) {
  document.getElementById('m-icon').textContent   = icon;
  document.getElementById('m-title').textContent  = title;
  document.getElementById('m-body').innerHTML     = body.replace(/\n/g, '<br>');

  const btns = document.getElementById('m-btns');
  btns.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'm-btn';
    btn.textContent = b.label;
    btn.style.background = b.bg;
    btn.style.color = b.color || '#000';
    btn.onclick = b.cb;
    btns.appendChild(btn);
  });

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── Toast ─────────────────────────────────
let _toastTimer;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Profile screen ────────────────────────
function renderProfileScreen() {
  const user = getCurrentUser();
  if (!user) return;
  const accounts = getAccounts();
  const me = accounts[user];
  if (!me) return;

  document.getElementById('profile-avatar').textContent = me.name[0].toUpperCase();
  document.getElementById('profile-name').textContent   = me.name;
  document.getElementById('stat-played').textContent    = me.played || 0;
  document.getElementById('stat-won').textContent       = me.won || 0;
  const wr = me.played ? Math.round((me.won / me.played) * 100) : 0;
  document.getElementById('stat-winrate').textContent   = wr + '%';
}
