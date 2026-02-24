// ════════════════════════════════════════════
//  ui.js — UI rendering
// ════════════════════════════════════════════

const DICE_FACES=['','⚀','⚁','⚂','⚃','⚄','⚅'];

// ── Game UI ───────────────────────────────
function updateGameUI() {
  if (!GS) return;
  const p=curP();

  document.getElementById('cur-token').textContent = p.token;
  document.getElementById('cur-name').textContent  = p.name;
  document.getElementById('cur-money').textContent = fmt(p.money);
  document.getElementById('cur-money').className   = 'cur-money'+(p.money<2000?' low':'');
  document.getElementById('cur-pos').textContent   = BOARD[p.position]?.name||'';
  document.getElementById('jail-tag').style.display= p.inJail?'':'none';

  // Kaarten in hand
  const cardBar=document.getElementById('cur-cards');
  if (p.cards.includes('free-jail')) {
    cardBar.style.display='';
    cardBar.innerHTML=`<span class="hand-card" title="Vrij-uit-bajes kaart">🎉 Vrij-uit-kaart</span>`;
  } else { cardBar.style.display='none'; }

  // NPC status
  const npcBar=document.getElementById('npc-status');
  if (GS.npc.active && !GS.npc.done) {
    npcBar.style.display='';
    npcBar.innerHTML=`🚔 Politie NPC actief — positie: ${BOARD[GS.npc.position]?.name||'?'}`;
  } else {
    npcBar.style.display='none';
  }

  // Players overzicht
  const ov=document.getElementById('players-overview');
  ov.innerHTML=GS.players.map(pl=>`
    <div class="p-row ${pl.id===GS.current?'active':''} ${pl.bankrupt?'bankrupt':''}">
      <span class="p-token">${pl.token}</span>
      <div class="p-info">
        <span class="p-name">${pl.name}${pl.inJail?' 🔒':''}</span>
        <span class="p-pos">${BOARD[pl.position]?.name||''}</span>
      </div>
      <div class="p-right">
        <span class="p-money ${pl.money<2000?'low':''}">${fmt(pl.money)}</span>
        ${pl.cards.includes('free-jail')?`<span class="p-card-dot" title="Vrij-uit-kaart">🎉</span>`:''}
      </div>
    </div>
  `).join('');

  renderTokens();
  renderOwners();
  renderLog();
}

// ── Dobbelstenen animatie ─────────────────
function animDice(d1,d2,total) {
  const el1=document.getElementById('die-1');
  const el2=document.getElementById('die-2');
  const tot=document.getElementById('dice-total');
  el1.classList.add('rolling'); el2.classList.add('rolling');
  el1.textContent=DICE_FACES[d1];
  el2.textContent=DICE_FACES[d2];
  tot.textContent=total;
  setTimeout(()=>{el1.classList.remove('rolling');el2.classList.remove('rolling');},450);
}

// ── Log ───────────────────────────────────
function addLog(text,type='') {
  if(!GS) return;
  GS.log.unshift({text,type});
  if(GS.log.length>80) GS.log.pop();
  renderLog();
}

function renderLog() {
  const el=document.getElementById('game-log'); if(!el) return;
  el.innerHTML=GS.log.map(e=>`<div class="log-entry ${e.type}">${e.text}</div>`).join('');
}

// ── Modal ─────────────────────────────────
function showModal(icon,title,body,buttons) {
  document.getElementById('m-icon').textContent=icon;
  document.getElementById('m-title').textContent=title;
  document.getElementById('m-body').innerHTML=body.replace(/\n/g,'<br>');
  const btns=document.getElementById('m-btns');
  btns.innerHTML='';
  buttons.forEach(b=>{
    const btn=document.createElement('button');
    btn.className='m-btn';
    btn.innerHTML=b.label;
    btn.style.background=b.bg;
    btn.style.color=b.color||'#000';
    btn.onclick=b.cb;
    btns.appendChild(btn);
  });
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

// ── Toast ─────────────────────────────────
let _tt;
function toast(text) {
  const el=document.getElementById('toast');
  el.textContent=text; el.classList.add('show');
  clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('show'),2800);
}

// ── Profiel ───────────────────────────────
function renderProfileScreen() {
  const me=getCurrentUser(); if(!me) return;
  const acc=getAccounts(); const myAcc=acc[me]; if(!myAcc) return;
  document.getElementById('profile-avatar').textContent=myAcc.name[0].toUpperCase();
  document.getElementById('profile-name').textContent=myAcc.name;
  document.getElementById('stat-played').textContent=myAcc.played||0;
  document.getElementById('stat-won').textContent=myAcc.won||0;
  const wr=myAcc.played?Math.round((myAcc.won/myAcc.played)*100):0;
  document.getElementById('stat-winrate').textContent=wr+'%';
}
