// ════════════════════════════════════════════
//  auth.js — accounts & vrienden
// ════════════════════════════════════════════

function getAccounts() {
  return JSON.parse(localStorage.getItem('sr_accounts') || '{}');
}
function saveAccounts(d) { localStorage.setItem('sr_accounts', JSON.stringify(d)); }
function getCurrentUser() { return localStorage.getItem('sr_current') || null; }
function setCurrentUser(n) { n ? localStorage.setItem('sr_current',n) : localStorage.removeItem('sr_current'); }
function getMe() { const u=getCurrentUser(); return u ? getAccounts()[u] : null; }

// ── Auth ──────────────────────────────────
function authTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-login').style.display    = tab==='login'    ? '':'none';
  document.getElementById('tab-register').style.display = tab==='register' ? '':'none';
  ['l-msg','r-msg'].forEach(id=>{ document.getElementById(id).textContent=''; });
}

function doLogin() {
  const user = document.getElementById('l-user').value.trim().toLowerCase();
  const pass = document.getElementById('l-pass').value;
  if (!user||!pass) { setMsg('l-msg','Vul alles in.'); return; }
  const acc = getAccounts();
  if (!acc[user] || acc[user].password!==pass) { setMsg('l-msg','Verkeerde naam of wachtwoord.'); return; }
  setCurrentUser(user);
  openHome();
}

function doRegister() {
  const user  = document.getElementById('r-user').value.trim();
  const pass  = document.getElementById('r-pass').value;
  const pass2 = document.getElementById('r-pass2').value;
  if (!user||!pass||!pass2) { setMsg('r-msg','Vul alles in.'); return; }
  if (user.length<2||user.length>14) { setMsg('r-msg','Naam: 2–14 tekens.'); return; }
  if (pass.length<4) { setMsg('r-msg','Wachtwoord min. 4 tekens.'); return; }
  if (pass!==pass2) { setMsg('r-msg','Wachtwoorden komen niet overeen.'); return; }
  const acc = getAccounts();
  const key = user.toLowerCase();
  if (acc[key]) { setMsg('r-msg','Naam al in gebruik!'); return; }
  acc[key] = { name:user, password:pass, played:0, won:0, friends:[], invites:[] };
  saveAccounts(acc);
  setMsg('r-msg','Account aangemaakt! Log nu in. ✓', true);
}

function doLogout() { setCurrentUser(null); goTo('screen-login'); }

function deleteAccount() {
  if (!confirm('Account permanent verwijderen?')) return;
  const acc = getAccounts(); delete acc[getCurrentUser()]; saveAccounts(acc);
  setCurrentUser(null); goTo('screen-login');
}

// ── Vrienden ──────────────────────────────
function searchFriend() {
  const val = document.getElementById('friend-search').value.trim().toLowerCase();
  const results = document.getElementById('friend-results');
  if (!val) { results.innerHTML=''; return; }
  const acc = getAccounts();
  const me  = getCurrentUser();
  const myAcc = acc[me];
  const friends = myAcc.friends||[];
  const matches = Object.keys(acc).filter(k=>k!==me && k.includes(val) && !friends.includes(k));
  if (!matches.length) { results.innerHTML='<p class="muted-sm">Niemand gevonden.</p>'; return; }
  results.innerHTML = matches.slice(0,5).map(k=>`
    <div class="friend-result-row">
      <div class="friend-avatar-sm">${acc[k].name[0].toUpperCase()}</div>
      <span>${acc[k].name}</span>
      <button class="btn-xs" onclick="sendFriendRequest('${k}')">Verzoek sturen</button>
    </div>
  `).join('');
}

function sendFriendRequest(toKey) {
  const acc = getAccounts();
  const me  = getCurrentUser();
  if (!acc[toKey].invites) acc[toKey].invites=[];
  if (acc[toKey].invites.includes(me)) { toast('Al verstuurd'); return; }
  if ((acc[toKey].friends||[]).includes(me)) { toast('Al vrienden'); return; }
  acc[toKey].invites.push(me);
  saveAccounts(acc);
  toast('Vriendverzoek verstuurd! 📨');
  document.getElementById('friend-results').innerHTML='';
  document.getElementById('friend-search').value='';
}

function acceptFriend(fromKey) {
  const acc = getAccounts();
  const me  = getCurrentUser();
  if (!acc[me].friends) acc[me].friends=[];
  if (!acc[fromKey].friends) acc[fromKey].friends=[];
  acc[me].friends.push(fromKey);
  acc[fromKey].friends.push(me);
  acc[me].invites = (acc[me].invites||[]).filter(k=>k!==fromKey);
  saveAccounts(acc);
  renderFriends(); toast(`${acc[fromKey].name} toegevoegd als vriend! 🤝`);
}

function declineFriend(fromKey) {
  const acc = getAccounts(); const me=getCurrentUser();
  acc[me].invites = (acc[me].invites||[]).filter(k=>k!==fromKey);
  saveAccounts(acc); renderFriends();
}

function renderFriends() {
  const me=getCurrentUser(); if(!me) return;
  const acc=getAccounts(); const myAcc=acc[me];
  const friends=(myAcc.friends||[]);
  const invites=(myAcc.invites||[]);
  const list=document.getElementById('friends-list');
  const empty=document.getElementById('friends-empty');
  const invBox=document.getElementById('invites-box');

  // Verzoeken
  if (invites.length) {
    invBox.style.display='';
    invBox.innerHTML = `<div class="section-label">Vriendverzoeken</div>` + invites.map(k=>`
      <div class="invite-row">
        <div class="friend-avatar-sm">${(acc[k]?.name||k)[0].toUpperCase()}</div>
        <span>${acc[k]?.name||k}</span>
        <button class="btn-xs green" onclick="acceptFriend('${k}')">✓</button>
        <button class="btn-xs red"   onclick="declineFriend('${k}')">✕</button>
      </div>
    `).join('');
  } else { invBox.style.display='none'; }

  // Vrienden
  if (!friends.length) { empty.style.display=''; list.innerHTML=''; return; }
  empty.style.display='none';
  list.innerHTML = friends.map(k=>`
    <div class="friend-item">
      <div class="friend-avatar">${(acc[k]?.name||k)[0].toUpperCase()}</div>
      <span>${acc[k]?.name||k}</span>
    </div>
  `).join('');
}

// ── Stats ─────────────────────────────────
function updateStat(key, field) {
  const acc=getAccounts(); if(acc[key]) { acc[key][field]=(acc[key][field]||0)+1; saveAccounts(acc); }
}

function setMsg(id,text,ok=false) {
  const el=document.getElementById(id); el.textContent=text;
  el.className='form-msg'+(ok?' ok':'');
}
