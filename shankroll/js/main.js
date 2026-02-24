// ════════════════════════════════════════════
//  main.js — navigatie en opstart
// ════════════════════════════════════════════

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // Acties bij specifiek scherm
  if (screenId === 'screen-home')    openHome();
  if (screenId === 'screen-profile') renderProfileScreen();
}

function openHome() {
  const user = getCurrentUser();
  if (!user) { goTo('screen-login'); return; }

  const accounts = getAccounts();
  const me = accounts[user];
  if (!me) { goTo('screen-login'); return; }

  document.getElementById('home-username').textContent = me.name;
  renderFriends();

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
}

// ── Enter key support ─────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;

  const loginScreen = document.getElementById('screen-login');
  if (!loginScreen.classList.contains('active')) return;

  const loginTab = document.getElementById('tab-login');
  if (loginTab.style.display !== 'none') doLogin();
  else doRegister();
});

// ── Auto-login ────────────────────────────
(function init() {
  const user = getCurrentUser();
  if (user) {
    const accounts = getAccounts();
    if (accounts[user]) {
      openHome();
      return;
    }
  }
  // Toon login scherm
  document.getElementById('screen-login').classList.add('active');
})();
