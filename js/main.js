// ═══════════════════════════════════════
//  main.js — App boot & WS event wiring
// ═══════════════════════════════════════

// ── Boot ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  WS.connect();
  setupWSHandlers();
});

// ── WS Handlers ───────────────────────
function setupWSHandlers() {

  WS.on('connected', () => {
    // Verbonden
  });

  WS.on('error', ({ message }) => {
    toast('⚠️ ' + message);
    // Toon fout op actieve auth scherm
    const liMsg = document.getElementById('li-msg');
    const reMsg = document.getElementById('re-msg');
    const authActive = document.getElementById('s-auth').classList.contains('active');
    if (authActive) {
      const registerVisible = document.getElementById('auth-register').style.display !== 'none';
      if (registerVisible) { reMsg.textContent = message; reMsg.className = 'auth-msg'; }
      else { liMsg.textContent = message; liMsg.className = 'auth-msg'; }
    }
  });

  // ── Auth ──
  WS.on('auth:registered', ({ name }) => {
    setAuthMsg('re-msg', `Account aangemaakt! Log nu in. ✓`, true);
  });

  WS.on('auth:loggedin', ({ user }) => {
    ME = user;
    document.getElementById('nav-name').textContent   = user.name;
    document.getElementById('nav-avatar').textContent = user.name[0].toUpperCase();
    renderFriends({ friends: user.friends, requests: user.requests });
    showScreen('s-home');
  });

  // ── Friends ──
  WS.on('friends:results', ({ results }) => {
    renderSearchResults(results);
  });

  WS.on('friends:updated', (data) => {
    renderFriends(data);
    if (currentRoom) renderInviteList(currentRoom);
  });

  WS.on('friends:incoming', ({ fromName }) => {
    toast(`${fromName} wil je vriend zijn! Check je vrienden tab.`);
  });

  WS.on('friends:accepted', ({ byName }) => {
    toast(`${byName} accepteerde je vriendverzoek! 🤝`);
  });

  WS.on('friends:sent', () => {
    toast('Vriendverzoek verstuurd! 📨');
    document.getElementById('friend-search-results').innerHTML = '';
    document.getElementById('friend-search').value = '';
  });

  // ── Room ──
  WS.on('room:state', (room) => {
    renderLobby(room);
    showScreen('s-lobby');

    // Als spel is gestart
    if (room.state === 'playing') {
      showScreen('s-game');
    }
  });

  WS.on('room:invited', ({ roomId, fromName }) => {
    showInviteNotif(roomId, fromName);
  });

  WS.on('room:invite-sent', () => {
    // al afgehandeld in lobby.js
  });

  // ── Game ──
  WS.on('game:state', (gs) => {
    const wasOnLobby = document.getElementById('s-lobby').classList.contains('active');

    if (wasOnLobby || document.getElementById('s-game').classList.contains('active')) {
      showScreen('s-game');
    }

    // Animeer dobbelstenen als ze veranderd zijn
    if (gs.dice && GS) {
      const changed = gs.dice[0] !== GS?.dice?.[0] || gs.dice[1] !== GS?.dice?.[1];
      if (changed) animateDice(gs.dice[0], gs.dice[1]);
    }

    applyGameState(gs);
  });

  // ── Chat ──
  WS.on('chat:message', ({ msg }) => {
    // Lobby chat
    const lobbyChat = document.getElementById('lobby-chat');
    if (lobbyChat) {
      lobbyChat.innerHTML += chatMsgHTML(msg);
      lobbyChat.scrollTop = lobbyChat.scrollHeight;
    }
    // Game chat
    appendGameChat(msg);
  });
}

// ── Enter key voor login ──────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const authActive = document.getElementById('s-auth').classList.contains('active');
  if (!authActive) return;
  const regVisible = document.getElementById('auth-register').style.display !== 'none';
  regVisible ? doRegister() : doLogin();
});

// ── Join code input ───────────────────
document.addEventListener('DOMContentLoaded', () => {
  const codeInput = document.getElementById('join-code');
  if (codeInput) {
    codeInput.addEventListener('input', updateJoinBtn);
  }
});
