// ═══════════════════════════════════════
//  auth.js
// ═══════════════════════════════════════

let ME = null; // { key, name, friends, requests }

function switchAuthTab(tab, el) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('auth-login').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('auth-register').style.display = tab === 'register' ? '' : 'none';
}

function doLogin() {
  const name = document.getElementById('li-name').value.trim();
  const pass = document.getElementById('li-pass').value;
  if (!name || !pass) { setAuthMsg('li-msg', 'Vul alles in.'); return; }
  WS.send('auth:login', { name, password: pass });
}

function doRegister() {
  const name  = document.getElementById('re-name').value.trim();
  const pass  = document.getElementById('re-pass').value;
  const pass2 = document.getElementById('re-pass2').value;
  if (!name||!pass||!pass2) { setAuthMsg('re-msg','Vul alles in.'); return; }
  if (pass !== pass2) { setAuthMsg('re-msg','Wachtwoorden komen niet overeen.'); return; }
  WS.send('auth:register', { name, password: pass });
}

function doLogout() {
  WS.send('auth:logout');
  ME = null;
  showScreen('s-auth');
}

function setAuthMsg(id, text, ok=false) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'auth-msg' + (ok ? ' ok' : '');
}
