// ════════════════════════════════════════════
//  auth.js — login, register, logout
// ════════════════════════════════════════════

function getAccounts() {
  return JSON.parse(localStorage.getItem('sr_accounts') || '{}');
}

function saveAccounts(data) {
  localStorage.setItem('sr_accounts', JSON.stringify(data));
}

function getCurrentUser() {
  return localStorage.getItem('sr_current') || null;
}

function setCurrentUser(name) {
  if (name) localStorage.setItem('sr_current', name);
  else localStorage.removeItem('sr_current');
}

function authTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-login').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('tab-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('l-msg').textContent = '';
  document.getElementById('r-msg').textContent = '';
}

function doLogin() {
  const user = document.getElementById('l-user').value.trim();
  const pass = document.getElementById('l-pass').value;
  const msg  = document.getElementById('l-msg');

  if (!user || !pass) { showMsg('l-msg', 'Vul alles in.'); return; }

  const accounts = getAccounts();
  const key = user.toLowerCase();

  if (!accounts[key] || accounts[key].password !== pass) {
    showMsg('l-msg', 'Verkeerde naam of wachtwoord.'); return;
  }

  setCurrentUser(key);
  openHome();
}

function doRegister() {
  const user  = document.getElementById('r-user').value.trim();
  const pass  = document.getElementById('r-pass').value;
  const pass2 = document.getElementById('r-pass2').value;

  if (!user || !pass || !pass2)         { showMsg('r-msg', 'Vul alles in.'); return; }
  if (user.length < 2)                  { showMsg('r-msg', 'Naam minimaal 2 tekens.'); return; }
  if (user.length > 14)                 { showMsg('r-msg', 'Naam max 14 tekens.'); return; }
  if (pass.length < 4)                  { showMsg('r-msg', 'Wachtwoord minimaal 4 tekens.'); return; }
  if (pass !== pass2)                   { showMsg('r-msg', 'Wachtwoorden komen niet overeen.'); return; }

  const accounts = getAccounts();
  const key = user.toLowerCase();

  if (accounts[key]) { showMsg('r-msg', 'Naam al in gebruik!'); return; }

  accounts[key] = {
    name: user,
    password: pass,
    played: 0,
    won: 0,
    friends: [],
  };
  saveAccounts(accounts);
  showMsg('r-msg', 'Account aangemaakt! Log nu in. ✓', true);
}

function doLogout() {
  setCurrentUser(null);
  goTo('screen-login');
}

function deleteAccount() {
  const user = getCurrentUser();
  if (!user) return;
  if (!confirm('Account permanent verwijderen?')) return;
  const accounts = getAccounts();
  delete accounts[user];
  saveAccounts(accounts);
  setCurrentUser(null);
  goTo('screen-login');
}

function addFriend() {
  const input = document.getElementById('friend-input');
  const name  = input.value.trim().toLowerCase();
  const user  = getCurrentUser();

  if (!name) return;

  const accounts = getAccounts();
  if (!accounts[name])          { toast('Gebruiker niet gevonden'); return; }
  if (name === user)            { toast('Dat ben jijzelf 😂'); return; }

  const me = accounts[user];
  if (!me.friends) me.friends = [];
  if (me.friends.includes(name)) { toast('Al een vriend'); return; }

  me.friends.push(name);
  saveAccounts(accounts);
  input.value = '';
  renderFriends();
  toast('Vriend toegevoegd! 🤝');
}

function renderFriends() {
  const user = getCurrentUser();
  if (!user) return;
  const accounts = getAccounts();
  const me = accounts[user];
  const friends = me.friends || [];

  const list  = document.getElementById('friends-list');
  const empty = document.getElementById('friends-empty');

  if (friends.length === 0) {
    empty.style.display = '';
    list.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = friends.map(f => {
    const acc = accounts[f];
    const displayName = acc ? acc.name : f;
    return `
      <div class="friend-item">
        <div class="friend-avatar">${displayName[0].toUpperCase()}</div>
        <span>${displayName}</span>
      </div>
    `;
  }).join('');
}

function showMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'form-msg' + (ok ? ' ok' : '');
}

function updateAccountStat(key, field) {
  const accounts = getAccounts();
  if (accounts[key]) {
    accounts[key][field] = (accounts[key][field] || 0) + 1;
    saveAccounts(accounts);
  }
}
