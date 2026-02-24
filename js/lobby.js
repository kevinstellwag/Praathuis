// ════════════════════════════════════════════
//  lobby.js — spel aanmaken, vrienden uitnodigen
// ════════════════════════════════════════════

let lobbyPlayers  = [];  // { name, token, isNPC }
let selectedToken = null;

// ── Token kiezen ──────────────────────────
function pickToken(el) {
  document.querySelectorAll('.token-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  selectedToken = el.dataset.token;
}

// ── Jezelf toevoegen (game aanmaken) ──────
function addSelf() {
  const me = getCurrentUser();
  if (!me) return;
  const acc = getAccounts();
  const name = acc[me].name;
  if (!selectedToken) { setLobbyMsg('Kies eerst een token!'); return; }
  if (lobbyPlayers.some(p=>p.isMe)) { setLobbyMsg('Jij staat al in de lobby.'); return; }
  lobbyPlayers.unshift({ name, token:selectedToken, isMe:true, key:me });
  selectedToken=null;
  document.querySelectorAll('.token-btn').forEach(b=>b.classList.remove('selected'));
  setLobbyMsg('');
  renderLobbyPlayers();
}

// ── Vriend uitnodigen ─────────────────────
function inviteFriendToLobby(key) {
  const acc  = getAccounts();
  const name = acc[key]?.name || key;
  if (lobbyPlayers.length >= 4)            { toast('Maximaal 4 spelers'); return; }
  if (lobbyPlayers.some(p=>p.key===key))   { toast(`${name} staat al in de lobby`); return; }
  // Willekeurig beschikbaar token kiezen
  const usedTokens = lobbyPlayers.map(p=>p.token);
  const allTokens  = ['🔫','🔪','🧢','🚗','💊','💰','🐍','💀'];
  const freeTokens = allTokens.filter(t=>!usedTokens.includes(t));
  if (!freeTokens.length) { toast('Geen tokens meer beschikbaar'); return; }
  const token = freeTokens[0];
  lobbyPlayers.push({ name, token, key, invited:true });
  renderLobbyPlayers();
  toast(`${name} uitgenodigd! 📨`);
}

function removeFromLobby(i) {
  lobbyPlayers.splice(i,1);
  renderLobbyPlayers();
}

function renderLobbyPlayers() {
  const el  = document.getElementById('lobby-players');
  const btn = document.getElementById('start-game-btn');
  const me  = getCurrentUser();

  if (!lobbyPlayers.length) {
    el.innerHTML='<p class="muted">Voeg jezelf toe om te beginnen.</p>';
  } else {
    el.innerHTML = lobbyPlayers.map((p,i)=>`
      <div class="lobby-player-item">
        <span class="lp-token">${p.token}</span>
        <span class="lp-name">${p.name}${p.isMe?' <span class="you-badge">jij</span>':''}</span>
        <button class="lp-remove" onclick="removeFromLobby(${i})">✕</button>
      </div>
    `).join('');
  }

  // Render vriend-uitnodiging lijst
  renderFriendInviteList();

  // Start alleen als:
  // - Er minstens 1 speler is (jijzelf)
  // - Jij (de maker) staat erin
  const hasSelf = lobbyPlayers.some(p=>p.key===me);
  btn.disabled  = !hasSelf || lobbyPlayers.length < 1;
}

function renderFriendInviteList() {
  const me  = getCurrentUser(); if(!me) return;
  const acc = getAccounts();
  const friends = acc[me]?.friends || [];
  const el = document.getElementById('lobby-friend-list');
  if (!friends.length) { el.innerHTML='<p class="muted-sm">Je hebt nog geen vrienden.</p>'; return; }
  el.innerHTML = friends.map(k=>{
    const inLobby = lobbyPlayers.some(p=>p.key===k);
    return `
      <div class="lobby-invite-row">
        <div class="friend-avatar-sm">${(acc[k]?.name||k)[0].toUpperCase()}</div>
        <span>${acc[k]?.name||k}</span>
        ${inLobby
          ? `<span class="badge gray">Al in lobby</span>`
          : `<button class="btn-xs green" onclick="inviteFriendToLobby('${k}')">Uitnodigen</button>`}
      </div>
    `;
  }).join('');
}

function setLobbyMsg(t) { document.getElementById('lobby-msg').textContent=t; }

function openLobby() {
  lobbyPlayers=[]; selectedToken=null;
  document.querySelectorAll('.token-btn').forEach(b=>b.classList.remove('selected'));
  renderLobbyPlayers();
  goTo('screen-lobby');
}
