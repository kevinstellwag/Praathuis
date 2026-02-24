// ═══════════════════════════════════════
//  ui.js — gedeelde UI helpers
// ═══════════════════════════════════════

// ── Toast ─────────────────────────────
let _toastTimer;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Screens ───────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ── Home tabs ─────────────────────────
function homeTab(tab, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-games').style.display   = tab === 'games'   ? '' : 'none';
  document.getElementById('tab-friends').style.display = tab === 'friends' ? '' : 'none';
}

// ── Friends render ────────────────────
function renderFriends(data) {
  if (!data) return;
  const { friends, requests } = data;

  // Update ME
  if (ME) { ME.friends = friends || []; ME.requests = requests || []; }

  // Requests
  const reqBox  = document.getElementById('friend-requests-box');
  const reqList = document.getElementById('friend-requests-list');
  if (requests?.length) {
    reqBox.style.display = '';
    reqList.innerHTML = requests.map(r => `
      <div class="request-row">
        <div class="avatar sm">${(r.name||r.key)[0].toUpperCase()}</div>
        <span style="flex:1;font-size:14px;font-weight:500">${r.name || r.key}</span>
        <button class="btn btn-sm btn-primary" onclick="acceptFriend('${r.key}')">✓ Accepteren</button>
        <button class="btn btn-sm btn-outline" onclick="declineFriend('${r.key}')">✕</button>
      </div>
    `).join('');
  } else { reqBox.style.display = 'none'; }

  // Friends list
  const list  = document.getElementById('friends-list');
  const empty = document.getElementById('friends-empty');
  if (!friends?.length) { empty.style.display = ''; list.innerHTML = ''; return; }
  empty.style.display = 'none';
  list.innerHTML = friends.map(f => `
    <div class="friend-row">
      <div class="avatar sm">${f.name[0].toUpperCase()}</div>
      <span class="name">${f.name}</span>
      <span class="online-dot ${f.online ? 'online' : ''}" style="width:7px;height:7px;border-radius:50%;background:${f.online?'var(--green)':'var(--text3)'}"></span>
      <span style="font-size:11px;color:var(--text3)">${f.online ? 'Online' : 'Offline'}</span>
    </div>
  `).join('');
}

function acceptFriend(key) { WS.send('friends:accept', { fromKey: key }); }
function declineFriend(key) { WS.send('friends:decline', { fromKey: key }); }

// ── Search results ────────────────────
function renderSearchResults(results) {
  const el = document.getElementById('friend-search-results');
  if (!results?.length) { el.innerHTML = '<p class="empty-msg">Geen resultaten.</p>'; return; }
  el.innerHTML = results.map(r => `
    <div class="friend-row">
      <div class="avatar sm">${r.name[0].toUpperCase()}</div>
      <span class="name" style="flex:1">${r.name}</span>
      <span class="online-dot" style="width:7px;height:7px;border-radius:50%;background:${r.online?'var(--green)':'var(--text3)'}"></span>
      <button class="btn btn-sm btn-primary" onclick="WS.send('friends:request',{toKey:'${r.key}'});toast('Verzoek verstuurd! 📨')">+ Vriend</button>
    </div>
  `).join('');
}

// ── Chat helpers ──────────────────────
function chatMsgHTML(m) {
  const isMe = ME && m.key === ME.key;
  const time  = new Date(m.ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `
    <div class="chat-msg ${isMe ? 'mine' : ''}">
      <div class="chat-msg-header">
        <span class="chat-msg-name">${m.name}</span>
        <span class="chat-msg-time">${time}</span>
      </div>
      <div class="chat-msg-text">${escHtml(m.text)}</div>
    </div>
  `;
}

function appendGameChat(msg) {
  const el = document.getElementById('game-chat');
  if (!el) return;
  el.innerHTML += chatMsgHTML(msg);
  el.scrollTop = el.scrollHeight;
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
