// ═══════════════════════════════════════
//  lobby.js
// ═══════════════════════════════════════

let selectedToken     = null;
let selectedJoinToken = null;
let currentRoom       = null;
let pendingInvite     = null; // { roomId, fromName }

// ── Token pickers ─────────────────────
function pickToken(el) {
  document.querySelectorAll('#token-picker .token-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  selectedToken = el.dataset.token;
  document.getElementById('create-room-btn').disabled = false;
}

function pickJoinToken(el) {
  document.querySelectorAll('#join-token-picker .token-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  selectedJoinToken = el.dataset.token;
  updateJoinBtn();
}

function updateJoinBtn() {
  const code = document.getElementById('join-code').value.trim();
  document.getElementById('join-room-btn').disabled = !selectedJoinToken || code.length < 5;
}

// ── Room create / join ────────────────
function createRoom() {
  if (!selectedToken) { toast('Kies eerst een token!'); return; }
  WS.send('room:create', { token: selectedToken });
}

function joinRoom() {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!selectedJoinToken || !code) { toast('Kies een token en vul een code in.'); return; }
  WS.send('room:join', { code, token: selectedJoinToken });
}

function leaveLobby() {
  WS.send('room:leave');
  currentRoom = null;
  document.getElementById('lobby-room-panel').style.display = 'none';
  showScreen('s-home');
}

function toggleReady() { WS.send('room:ready'); }

function startGame() { WS.send('room:start'); }

function copyRoomCode() {
  if (!currentRoom) return;
  navigator.clipboard?.writeText(currentRoom.id) || (document.getElementById('room-code-display').select?.());
  toast('Code gekopieerd! 📋');
}

function sendChat() {
  const input = document.getElementById('lobby-chat-input');
  const text  = input.value.trim();
  if (!text) return;
  WS.send('chat:message', { text });
  input.value = '';
}

// ── Vrienden zoeken ───────────────────
let searchTimer = null;
function searchFriends() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = document.getElementById('friend-search').value.trim();
    if (q.length < 1) { document.getElementById('friend-search-results').innerHTML = ''; return; }
    WS.send('friends:search', { query: q });
  }, 300);
}

// ── Render lobby ──────────────────────
function renderLobby(room) {
  currentRoom = room;
  document.getElementById('lobby-room-panel').style.display = '';
  document.getElementById('room-code-display').textContent  = room.id;

  // Spelers
  const list = document.getElementById('room-players');
  list.innerHTML = room.players.map(p => `
    <div class="room-player-row ${p.key === room.host ? 'host-row' : ''}">
      <span class="rp-token">${p.token}</span>
      <span class="rp-name">${p.name}</span>
      ${p.key === room.host ? '<span class="host-badge">Host</span>' : ''}
      <span class="rp-ready ${p.ready ? 'yes' : 'no'}">${p.ready ? '✓ Klaar' : '○ Wacht'}</span>
    </div>
  `).join('');

  // Start knop (alleen host, minimaal 2 spelers)
  const isHost  = ME && room.host === ME.key;
  const startBtn = document.getElementById('start-btn');
  startBtn.style.display = isHost && room.players.length >= 2 ? '' : 'none';

  // Vrienden uitnodiglijst
  renderInviteList(room);

  // Chat
  renderLobbyChat(room.chat || []);
}

function renderInviteList(room) {
  if (!ME) return;
  const list = document.getElementById('room-invite-list');
  const friends = ME.friends || [];
  if (!friends.length) { list.innerHTML = '<p class="empty-msg">Nog geen vrienden.</p>'; return; }
  list.innerHTML = friends.map(f => {
    const inRoom = room.players.some(p => p.key === f.key);
    return `
      <div class="room-invite-row">
        <div class="avatar sm">${f.name[0].toUpperCase()}</div>
        <span style="flex:1;font-size:13px;font-weight:500">${f.name}</span>
        <span class="online-dot ${f.online ? 'online' : ''}" style="width:7px;height:7px;border-radius:50%;background:${f.online?'var(--green)':'var(--text3)'}"></span>
        ${inRoom
          ? '<span style="font-size:11px;color:var(--text3)">In lobby</span>'
          : `<button class="btn btn-sm btn-primary" onclick="inviteFriend('${f.key}')">Uitnodigen</button>`
        }
      </div>`;
  }).join('');
}

function inviteFriend(key) { WS.send('room:invite', { toKey: key }); toast('Uitnodiging verstuurd! 📨'); }

function renderLobbyChat(msgs) {
  const el = document.getElementById('lobby-chat');
  el.innerHTML = msgs.map(m => chatMsgHTML(m)).join('');
  el.scrollTop = el.scrollHeight;
}

// ── Invite notification ───────────────
function showInviteNotif(roomId, fromName) {
  pendingInvite = { roomId };
  document.getElementById('invite-notif-text').textContent = `${fromName} nodigt je uit voor Trap Board!`;
  document.getElementById('invite-notif').style.display = '';
  document.getElementById('invite-accept-btn').onclick = () => {
    dismissInvite();
    openLobbyScreen();
    // Toon join panel
    document.getElementById('join-code').value = roomId;
    document.getElementById('join-code').dispatchEvent(new Event('input'));
  };
}

function dismissInvite() {
  document.getElementById('invite-notif').style.display = 'none';
  pendingInvite = null;
}

function openLobbyScreen() { showScreen('s-lobby'); }
