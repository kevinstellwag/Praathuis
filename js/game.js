// ════════════════════════════════════════════
//  game.js — spellogica
// ════════════════════════════════════════════

let GS = null;

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
function startGame() {
  const me = getCurrentUser();
  // De maker staat altijd als eerste (index 0) in lobbyPlayers
  // Maar we moeten zorgen dat isMe altijd index 0 is
  const ordered = [...lobbyPlayers];
  const selfIdx = ordered.findIndex(p=>p.isMe);
  if (selfIdx>0) { const s=ordered.splice(selfIdx,1); ordered.unshift(s[0]); }

  GS = {
    players: ordered.map((p,i)=>({
      id:i, name:p.name, token:p.token,
      money:15000, position:0,
      properties:[], cards:[],     // kaarten in hand (vrij-uit-bajes etc)
      inJail:false, jailTurns:0,
      doubles:0, bankrupt:false,
      passedGo:0,                  // hoe vaak GO gepasseerd
    })),
    current:    0,
    properties: {},                // spaceId → playerId
    rolled:     false,
    rentDue:    null,
    npc: {
      active:   false,             // wordt actief als 1 speler 5× GO passeert
      position: 0,
      done:     false,
    },
    log: [],
    _goThreshold: false,           // bijhouden of de NPC al geactiveerd is
  };

  buildBoard();
  goTo('screen-game');
  updateGameUI();
  addLog(`🎲 Spel gestart! ${GS.players[0].name} begint.`, 'neutral');
}

function quitGame() {
  if (!confirm('Spel verlaten?')) return;
  GS=null; goTo('screen-home');
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function curP() { return GS.players[GS.current]; }

function nextAlive(from) {
  let next=(from+1)%GS.players.length, loops=0;
  while (GS.players[next].bankrupt && loops<GS.players.length) {
    next=(next+1)%GS.players.length; loops++;
  }
  return next;
}

// ─────────────────────────────────────────────
//  DOBBELSTENEN
// ─────────────────────────────────────────────
function rollDice() {
  if (GS.rolled) return;
  const p=curP();
  const d1=Math.ceil(Math.random()*6);
  const d2=Math.ceil(Math.random()*6);
  const total=d1+d2;
  const doubles=d1===d2;

  animDice(d1,d2,total);
  GS.rolled=true;
  disableBtn('roll-btn');

  if (p.inJail) { handleJailRoll(p,doubles,total); return; }

  if (doubles) {
    p.doubles++;
    if (p.doubles>=3) {
      addLog(`🚔 ${p.name} gooit 3× doubles — bajes in!`,'bad');
      sendToJail(p); endTurn(false); return;
    }
    addLog(`🎲 ${p.name}: ${d1}+${d2}=${total} — DOUBLES! Nog een beurt.`);
  } else {
    p.doubles=0;
    addLog(`🎲 ${p.name}: ${d1}+${d2}=${total}`);
  }
  movePlayer(p,total,doubles);
}

function handleJailRoll(p,doubles,total) {
  // Vrij-uit-bajes kaart?
  if (p.cards.includes('free-jail')) {
    p.cards=p.cards.filter(c=>c!=='free-jail');
    p.inJail=false; p.jailTurns=0;
    addLog(`🎉 ${p.name} gebruikt vrij-uit-bajes kaart!`,'good');
    movePlayer(p,total,false); return;
  }
  if (doubles) {
    p.inJail=false; p.jailTurns=0;
    addLog(`🎉 ${p.name} gooit doubles — vrij!`,'good');
    movePlayer(p,total,false); return;
  }
  p.jailTurns++;
  if (p.jailTurns>=3) {
    p.money-=2000; p.inJail=false; p.jailTurns=0;
    addLog(`💸 ${p.name} betaalt €2.000 borgsom — vrij.`,'bad');
    checkBankrupt(p);
    if (!p.bankrupt) movePlayer(p,total,false); else endTurn(false);
  } else {
    addLog(`🔒 ${p.name} zit in de bajes (beurt ${p.jailTurns}/3).`,'bad');
    endTurn(false);
  }
}

// ─────────────────────────────────────────────
//  BEWEGEN
// ─────────────────────────────────────────────
function movePlayer(p,steps,doubles) {
  const oldPos=p.position;
  const newPos=(p.position+steps)%39; // 39 vakjes (0–38)
  if (newPos<oldPos || (oldPos===0 && steps>0 && newPos>0)) {
    // Passeer GO (alleen als we echt rondgaan)
    if (newPos !== oldPos) {
      p.money+=2000;
      p.passedGo++;
      addLog(`🚀 ${p.name} passeert GO — +${fmt(2000)}!`,'good');
      toast(`${p.token} passeert GO! +${fmt(2000)}`);
      checkNPCActivation(p);
    }
  }
  p.position=newPos;
  renderTokens();
  highlightCurrentCell(newPos);
  handleLanding(p,doubles);
}

function checkNPCActivation(p) {
  if (GS.npc.active || GS._goThreshold) return;
  if (p.passedGo>=5) {
    GS.npc.active=true;
    GS._goThreshold=true;
    GS.npc.position=0;
    addLog(`🚨 POLITIE NPC verschijnt! ${p.name} is al 5× over GO!`,'event');
    toast('🚔 Politie NPC is nu actief!');
    renderTokens();
  }
}

// ─────────────────────────────────────────────
//  LANDING
// ─────────────────────────────────────────────
function handleLanding(p,doubles) {
  const sp=BOARD[p.position];
  addLog(`📍 ${p.name} → ${sp.emoji} ${sp.name}`);
  disableActions();

  switch(sp.type) {
    case 'start':    endTurn(doubles); break;
    case 'property':
    case 'station':
    case 'utility':  handlePropertyLanding(p,sp,doubles); break;
    case 'tax':
      p.money-=sp.rent;
      addLog(`🏛️ ${p.name} betaalt ${fmt(sp.rent)} belasting.`,'bad');
      toast(`${fmt(sp.rent)} belasting!`);
      checkBankrupt(p);
      if(!p.bankrupt) endTurn(doubles); break;
    case 'chance':   drawCard(p,CHANCE_CARDS,doubles); break;
    case 'community':drawCard(p,COMMUNITY_CARDS,doubles); break;
    case 'jail':
      addLog(`👀 ${p.name} bezoekt de bajes (op bezoek).`);
      endTurn(doubles); break;
    case 'go-jail':
      sendToJail(p); endTurn(false); break;
    case 'free':
      addLog(`☮️ ${p.name} staat op Gratis Rust.`);
      endTurn(doubles); break;
    default: endTurn(doubles);
  }
  updateGameUI();
}

// ─────────────────────────────────────────────
//  EIGENDOM LANDING → PROPERTY CARD
// ─────────────────────────────────────────────
function handlePropertyLanding(p,sp,doubles) {
  const ownerId=GS.properties[sp.id];

  if (ownerId===undefined||ownerId===null) {
    // Kopen? Toon kaart als je genoeg geld hebt
    if (p.money>=sp.price) {
      showPropertyCard(sp, p, doubles, 'buy');
    } else {
      addLog(`💸 ${p.name} heeft niet genoeg geld voor ${sp.name}.`,'bad');
      toast('Niet genoeg geld — beurt doorgegeven.');
      endTurn(doubles);
    }
  } else if (ownerId===p.id) {
    addLog(`✅ ${p.name} staat op eigen terrein.`,'good');
    endTurn(doubles);
  } else {
    const owner=GS.players[ownerId];
    const rent=calcRent(sp,ownerId);
    GS.rentDue={amount:rent,ownerId,doubles};
    showPropertyCard(sp, p, doubles, 'rent', rent, owner);
  }
}

function calcRent(sp,ownerId) {
  if (sp.type==='utility') {
    const d1=parseInt(document.getElementById('die-1').textContent)||3;
    const d2=parseInt(document.getElementById('die-2').textContent)||3;
    return (d1+d2)*300;
  }
  return sp.rent;
}

// ─────────────────────────────────────────────
//  PROPERTY CARD (visueel)
// ─────────────────────────────────────────────
function showPropertyCard(sp, p, doubles, mode, rent=0, owner=null) {
  const card = document.getElementById('prop-card-overlay');
  const c    = document.getElementById('prop-card');

  // Kleur stripe
  c.style.setProperty('--card-color', sp.color||'#888');

  document.getElementById('pc-emoji').textContent = sp.emoji;
  document.getElementById('pc-name').textContent  = sp.name;

  const btns = document.getElementById('pc-btns');

  if (mode==='buy') {
    document.getElementById('pc-price-row').style.display = '';
    document.getElementById('pc-rent-row').style.display  = 'none';
    document.getElementById('pc-owner-row').style.display = 'none';
    document.getElementById('pc-price').textContent = fmt(sp.price);
    document.getElementById('pc-rent-val').textContent = fmt(sp.rent);
    document.getElementById('pc-rent-row').style.display = '';

    addLog(`🏠 ${sp.name} is te koop voor ${fmt(sp.price)}.`);

    btns.innerHTML=`
      <button class="pc-btn green" onclick="buyFromCard(${sp.id},${doubles})">🏠 Kopen — ${fmt(sp.price)}</button>
      <button class="pc-btn gray"  onclick="closePropertyCard(${doubles}, true)">Overslaan</button>
    `;
  } else {
    // Huur betalen
    document.getElementById('pc-price-row').style.display = 'none';
    document.getElementById('pc-rent-row').style.display  = '';
    document.getElementById('pc-owner-row').style.display = '';
    document.getElementById('pc-rent-val').textContent    = fmt(rent);
    document.getElementById('pc-owner-name').textContent  = owner.name;

    const hasCard = p.cards.includes('free-jail');
    addLog(`😬 ${p.name} staat op ${owner.name}'s pand — huur ${fmt(rent)}!`,'bad');

    btns.innerHTML=`
      <button class="pc-btn orange" onclick="dashFromCard(${doubles})">🏃 Dashen <span class="small-tag">30%</span></button>
      <button class="pc-btn blue"   onclick="payFromCard(${doubles})">💸 Betalen — ${fmt(rent)}</button>
      ${hasCard ? `<button class="pc-btn gold" onclick="useJailCardForRent(${doubles})">🎉 Kaart gebruiken</button>`:''}
    `;
  }

  card.classList.add('open');
}

function closePropertyCard(doubles, skip=false) {
  document.getElementById('prop-card-overlay').classList.remove('open');
  if (skip) { addLog(`⏭️ ${curP().name} slaat aankoop over.`); endTurn(doubles); }
}

function buyFromCard(spaceId,doubles) {
  document.getElementById('prop-card-overlay').classList.remove('open');
  const p=curP(); const sp=BOARD[spaceId];
  p.money-=sp.price;
  GS.properties[sp.id]=p.id;
  p.properties.push(sp.id);
  addLog(`🏠 ${p.name} koopt ${sp.name} voor ${fmt(sp.price)}!`,'good');
  toast(`${p.token} koopt ${sp.name}!`);
  renderOwners();
  endTurn(doubles);
  updateGameUI();
}

function payFromCard(doubles) {
  document.getElementById('prop-card-overlay').classList.remove('open');
  const p=curP(); const {amount,ownerId}=GS.rentDue;
  const owner=GS.players[ownerId];
  p.money-=amount; owner.money+=amount; GS.rentDue=null;
  addLog(`💸 ${p.name} betaalt ${fmt(amount)} huur aan ${owner.name}.`,'bad');
  checkBankrupt(p);
  if(!p.bankrupt) endTurn(doubles);
  updateGameUI();
}

function dashFromCard(doubles) {
  document.getElementById('prop-card-overlay').classList.remove('open');
  const p=curP(); const {amount,ownerId}=GS.rentDue; GS.rentDue=null;
  const success=Math.random()<0.30;
  if (success) {
    addLog(`🏃 ${p.name} DASHED! Ontsnapt — betaalt niets!`,'good');
    showModal('🏃','GEFLIPPED!','Je bent ontsnapt! Betaalt niets.',[
      {label:'YOOO 🎉',bg:'#27AE60',color:'#fff',cb:()=>{closeModal();endTurn(doubles);}}
    ]);
  } else {
    const fine=amount*2;
    p.money-=fine;
    GS.players[ownerId].money+=fine;
    addLog(`🚔 ${p.name} gepakt! Betaalt 2×: ${fmt(fine)}!`,'bad');
    checkBankrupt(p);
    showModal('🚔','GEPAKT!',`Politie pakt je! Je betaalt 2× huur = ${fmt(fine)} aan ${GS.players[ownerId].name}.`,[
      {label:'GODVER 😤',bg:'#E74C3C',color:'#fff',cb:()=>{closeModal();if(!p.bankrupt)endTurn(doubles);}}
    ]);
  }
  updateGameUI();
}

function useJailCardForRent(doubles) {
  document.getElementById('prop-card-overlay').classList.remove('open');
  const p=curP();
  p.cards=p.cards.filter(c=>c!=='free-jail');
  GS.rentDue=null;
  addLog(`🎉 ${p.name} gebruikt vrij-uit-bajes kaart — betaalt geen huur!`,'good');
  toast('Kaart gebruikt!');
  endTurn(doubles);
  updateGameUI();
}

// ─────────────────────────────────────────────
//  KAARTEN
// ─────────────────────────────────────────────
function drawCard(p,deck,doubles) {
  const card=deck[Math.floor(Math.random()*deck.length)];
  addLog(`🃏 ${card.emoji} Kaart: ${card.text}`,'event');
  let sub='';
  switch(card.action) {
    case 'gain':        sub=`<span class="hl-green">+${fmt(card.amount)}</span>`; break;
    case 'lose':        sub=`<span class="hl-red">−${fmt(card.amount)}</span>`; break;
    case 'jail':        sub=`<span class="hl-red">Bajes in! 🚔</span>`; break;
    case 'free-jail':   sub=`<span class="hl-green">Kaart toegevoegd aan je hand 🎉</span>`; break;
    case 'goto':        sub=`<span class="hl-green">Ga naar GO +${fmt(card.bonus)}</span>`; break;
    case 'pay-all':     sub=`<span class="hl-red">−${fmt(card.amount)} per speler</span>`; break;
    case 'collect-all': sub=`<span class="hl-green">+${fmt(card.amount)} per speler</span>`; break;
  }
  showModal(card.emoji,'Kaart!',`${card.text}<br><br>${sub}`,[
    {label:'OK',bg:'#0A0A0A',color:'#fff',cb:()=>{closeModal();applyCard(card,p);if(!p.bankrupt)endTurn(doubles);}}
  ]);
}

function applyCard(card,p) {
  switch(card.action) {
    case 'gain':        p.money+=card.amount; break;
    case 'lose':        p.money-=card.amount; checkBankrupt(p); break;
    case 'jail':        sendToJail(p); break;
    case 'free-jail':   p.cards.push('free-jail'); toast(`${p.token} heeft een vrij-uit-bajes kaart!`); break;
    case 'goto':        p.position=card.target; p.money+=card.bonus; renderTokens(); break;
    case 'pay-all':
      GS.players.forEach(op=>{if(op.id!==p.id&&!op.bankrupt){op.money-=card.amount;p.money+=card.amount;}});
      checkBankrupt(p); break;
    case 'collect-all':
      GS.players.forEach(op=>{if(op.id!==p.id&&!op.bankrupt){p.money+=card.amount;op.money-=card.amount;}});
      break;
  }
  updateGameUI();
}

// ─────────────────────────────────────────────
//  NPC POLITIE
// ─────────────────────────────────────────────
function doNPCTurn() {
  if (!GS.npc.active || GS.npc.done) return;

  const d1=Math.ceil(Math.random()*6);
  const d2=Math.ceil(Math.random()*6);
  const steps=d1+d2;
  const oldPos=GS.npc.position;
  GS.npc.position=(oldPos+steps)%39;
  addLog(`🚔 Politie NPC beweegt ${steps} stappen naar ${BOARD[GS.npc.position].emoji} ${BOARD[GS.npc.position].name}.`,'event');
  renderTokens();

  // Check: staat NPC op zelfde plek als een speler?
  setTimeout(()=>{
    GS.players.forEach(p=>{
      if (!p.bankrupt && p.position===GS.npc.position) {
        triggerPoliceEncounter(p);
      }
    });
  }, 600);
}

function triggerPoliceEncounter(p) {
  addLog(`🚨 POLITIE bij ${p.name}!`,'event');

  // Heeft de speler een vrij-uit-bajes kaart?
  if (p.cards.includes('free-jail')) {
    showModal('🎉','Politiecontrole!',
      `De politie stopt ${p.name}!<br><br>Je gebruikt je <strong>vrij-uit-kaart</strong> en gaat vrijuit! 🎉`,
      [{label:'Gebruik kaart 🎉',bg:'#27AE60',color:'#fff',cb:()=>{
        p.cards=p.cards.filter(c=>c!=='free-jail');
        closeModal(); updateGameUI();
        addLog(`🎉 ${p.name} gebruikt vrij-uit-kaart bij politie!`,'good');
      }}]
    );
    return;
  }

  // Rad van Fortuin
  spinPoliceWheel(p);
}

function spinPoliceWheel(p) {
  // Gewogen random
  const total=POLICE_WHEEL.reduce((s,w)=>s+w.weight,0);
  let rand=Math.random()*total;
  let chosen=POLICE_WHEEL[POLICE_WHEEL.length-1];
  for (const seg of POLICE_WHEEL) { rand-=seg.weight; if(rand<=0){chosen=seg;break;} }

  // Toon wiel animatie
  showPoliceWheelModal(p, chosen);
}

function showPoliceWheelModal(p, chosen) {
  const overlay = document.getElementById('wheel-overlay');
  overlay.style.display='flex';

  const segments = document.querySelectorAll('.wheel-seg');
  const label    = document.getElementById('wheel-result-label');
  const desc     = document.getElementById('wheel-result-desc');
  const btn      = document.getElementById('wheel-ok-btn');
  const spinning = document.getElementById('wheel-spinning');
  const result   = document.getElementById('wheel-result');

  spinning.style.display='';
  result.style.display='none';
  label.textContent='';
  desc.textContent='';

  // Animeer de segmenten
  let flash=0;
  const interval=setInterval(()=>{
    segments.forEach((s,i)=>s.classList.toggle('flash', i===flash%POLICE_WHEEL.length));
    flash++;
  },120);

  setTimeout(()=>{
    clearInterval(interval);
    segments.forEach(s=>s.classList.remove('flash'));
    // Highlight het gekozen segment
    const idx=POLICE_WHEEL.indexOf(chosen);
    if(segments[idx]) segments[idx].classList.add('chosen');
    spinning.style.display='none';
    result.style.display='';
    label.textContent=chosen.emoji+' '+chosen.label;
    desc.textContent=chosen.desc;

    btn.onclick=()=>{
      overlay.style.display='none';
      segments.forEach(s=>s.classList.remove('chosen','flash'));
      applyPoliceResult(p,chosen);
    };
  }, 2000);
}

function applyPoliceResult(p, chosen) {
  switch(chosen.action) {
    case 'warning':
      addLog(`⚠️ ${p.name} krijgt een waarschuwing en mag gaan.`,'good');
      break;
    case 'fine':
      p.money-=chosen.fine;
      addLog(`💸 ${p.name} betaalt ${fmt(chosen.fine)} boete.`,'bad');
      checkBankrupt(p);
      break;
    case 'jail':
      sendToJail(p);
      break;
  }
  updateGameUI();
}

// ─────────────────────────────────────────────
//  BEURT BEËINDIGEN
// ─────────────────────────────────────────────
function endTurn(doubles=false) {
  const p=curP();
  if (doubles&&!p.inJail) {
    addLog(`🎲 ${p.name} gooit nog een keer!`);
    GS.rolled=false; disableActions(); enableBtn('roll-btn'); updateGameUI(); return;
  }

  // NPC beurt VOOR de volgende speler
  if (GS.npc.active && !GS.npc.done) {
    setTimeout(doNPCTurn, 400);
  }

  const next=nextAlive(GS.current);
  GS.current=next; GS.rolled=false; GS.rentDue=null;
  disableActions(); enableBtn('roll-btn');

  const alive=GS.players.filter(pl=>!pl.bankrupt);
  if (alive.length===1) { showWinner(alive[0]); return; }

  updateGameUI();
  addLog(`➡️ Beurt van ${curP().name}.`);
}

// ─────────────────────────────────────────────
//  GEVANGENIS / BANKRUPT / WIN
// ─────────────────────────────────────────────
function sendToJail(p) {
  p.inJail=true; p.jailTurns=0; p.position=10;
  renderTokens(); highlightCurrentCell(10);
  addLog(`🚔 ${p.name} gaat naar de bajes!`,'bad');
  toast(`${p.token} naar de bajes!`);
}

function checkBankrupt(p) {
  if (p.money>0) return;
  p.bankrupt=true; p.money=0;
  addLog(`💀 ${p.name} is BANKRUPT!`,'bad');
  toast(`${p.token} is bankrupt! 💀`);
  p.properties.forEach(id=>delete GS.properties[id]);
  p.properties=[]; renderOwners();
  disableActions();
  setTimeout(()=>endTurn(false),800);
}

function showWinner(p) {
  const me=getCurrentUser();
  if(me){ updateStat(me,'played');
    const acc=getAccounts();
    if(acc[me]&&p.name.toLowerCase()===acc[me].name.toLowerCase()) updateStat(me,'won');
  }
  setTimeout(()=>{
    document.getElementById('win-token').textContent=p.token;
    document.getElementById('win-name').textContent=p.name;
    document.getElementById('win-stats').textContent=`${fmt(p.money)} over · ${p.properties.length} panden`;
    goTo('screen-win');
  },700);
}

// ─────────────────────────────────────────────
//  BUTTON HELPERS
// ─────────────────────────────────────────────
function disableActions() {
  ['btn-end'].forEach(disableBtn);
}
function enableBtn(id)  { const el=document.getElementById(id); if(el) el.disabled=false; }
function disableBtn(id) { const el=document.getElementById(id); if(el) el.disabled=true; }
