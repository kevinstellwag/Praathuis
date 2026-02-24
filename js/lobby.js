// ════════════════════════════════════════════
//  lobby.js — spelers toevoegen, token kiezen
// ════════════════════════════════════════════

let lobbyPlayers  = [];
let selectedToken = null;

function pickToken(el) {
  document.querySelectorAll('.token-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedToken = el.dataset.token;
}

function addLobbyPlayer() {
  const input = document.getElementById('player-name-input');
  const msg   = document.getElementById('lobby-msg');
  const name  = input.value.trim();

  if (!name)                                      { setLobbyMsg('Vul een naam in.'); return; }
  if (!selectedToken)                             { setLobbyMsg('Kies een token!'); return; }
  if (lobbyPlayers.length >= 4)                   { setLobbyMsg('Maximaal 4 spelers.'); return; }
  if (lobbyPlayers.some(p => p.token === selectedToken)) { setLobbyMsg('Token al in gebruik!'); return; }
  if (lobbyPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    setLobbyMsg('Naam al in gebruik!'); return;
  }

  lobbyPlayers.push({ name, token: selectedToken });
  input.value = '';
  selectedToken = null;
  document.querySelectorAll('.token-btn').forEach(b => b.classList.remove('selected'));
  setLobbyMsg('');
  renderLobbyPlayers();
}

function removeLobbyPlayer(i) {
  lobbyPlayers.splice(i, 1);
  renderLobbyPlayers();
}

function renderLobbyPlayers() {
  const el  = document.getElementById('lobby-players');
  const btn = document.getElementById('start-game-btn');

  el.innerHTML = lobbyPlayers.length === 0
    ? '<p class="muted">Nog geen spelers. Voeg minstens 2 toe.</p>'
    : lobbyPlayers.map((p, i) => `
        <div class="lobby-player-item">
          <span class="lobby-player-token">${p.token}</span>
          <span class="lobby-player-name">${p.name}</span>
          <button class="lobby-player-remove" onclick="removeLobbyPlayer(${i})">✕</button>
        </div>
      `).join('');

  btn.disabled = lobbyPlayers.length < 2;
}

function setLobbyMsg(text) {
  document.getElementById('lobby-msg').textContent = text;
}

function openLobby() {
  lobbyPlayers  = [];
  selectedToken = null;
  document.querySelectorAll('.token-btn').forEach(b => b.classList.remove('selected'));
  renderLobbyPlayers();
  goTo('screen-lobby');
}
