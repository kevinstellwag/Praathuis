// ════════════════════════════════════════════
//  main.js — navigatie
// ════════════════════════════════════════════

function goTo(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const t=document.getElementById(id); if(t) t.classList.add('active');
  if (id==='screen-home')    openHome();
  if (id==='screen-profile') renderProfileScreen();
}

function openHome() {
  const me=getCurrentUser(); if(!me){goTo('screen-login');return;}
  const acc=getAccounts(); const myAcc=acc[me]; if(!myAcc){goTo('screen-login');return;}
  document.getElementById('home-username').textContent=myAcc.name;
  renderFriends();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-home').classList.add('active');
}

document.addEventListener('keydown',e=>{
  if(e.key!=='Enter') return;
  const ls=document.getElementById('screen-login');
  if(!ls.classList.contains('active')) return;
  const lf=document.getElementById('tab-login');
  if(lf.style.display!=='none') doLogin(); else doRegister();
});

// Auto-login
(function init(){
  const me=getCurrentUser();
  if(me){const acc=getAccounts();if(acc[me]){openHome();return;}}
  document.getElementById('screen-login').classList.add('active');
})();
