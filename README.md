# 🎲 Shankroll — Multiplayer Trap Board

Volledig online multiplayer bordspel. Donker thema, live chat, vrienden uitnodigen, politie NPC.

---

## Structuur

```
shankroll-full/
├── backend/          ← Node.js server (deployen op Railway)
│   ├── server.js
│   └── package.json
└── frontend/         ← Website (uploaden naar GitHub Pages)
    ├── index.html
    ├── css/style.css
    └── js/
        ├── config.js   ← ZET HIER JE SERVER URL
        ├── ws.js
        ├── data.js
        ├── auth.js
        ├── lobby.js
        ├── board.js
        ├── game.js
        ├── ui.js
        └── main.js
```

---

## STAP 1 — Backend deployen op Railway (GRATIS)

### 1a. Railway account
1. Ga naar **railway.app**
2. Registreer met GitHub

### 1b. Nieuw project aanmaken
1. Klik op **New Project**
2. Kies **Deploy from GitHub repo**
3. Maak een nieuwe GitHub repo aan voor de backend
4. Upload de inhoud van de `backend/` map
5. Railway detecteert automatisch dat het Node.js is

### 1c. Server URL kopiëren
- Railway geeft je een URL zoals: `shankroll-backend.up.railway.app`
- Onthoud deze URL!

### 1d. Gratis limiet
- Railway geeft **500 uur/maand gratis**
- Voor een hobbyproject meer dan genoeg

---

## STAP 2 — Frontend configureren

Open `frontend/js/config.js` en vul je Railway URL in:

```javascript
CONFIG.WS_URL = 'wss://jouw-naam.up.railway.app';
```

Let op: gebruik `wss://` (niet `ws://`) voor een live server!

---

## STAP 3 — Frontend op GitHub Pages

### 3a. GitHub repo aanmaken
1. Ga naar **github.com** → New repository
2. Naam bijv. `shankroll`
3. Stel in op **Public**

### 3b. Bestanden uploaden
Upload de inhoud van `frontend/` (NIET de map zelf):
```
index.html        ← direct in root
css/style.css
js/config.js
js/ws.js
js/data.js
js/auth.js
js/lobby.js
js/board.js
js/game.js
js/ui.js
js/main.js
```

### 3c. GitHub Pages aanzetten
1. Settings → Pages
2. Branch: `main` → Save
3. Wacht 2 minuten
4. Live op: `https://JOUNAAM.github.io/shankroll/`

### 3d. Eigen domein (optioneel)
Koop een domein bij Hostnet/TransIP (~€10/jaar) en koppel via Settings → Pages → Custom domain.

---

## Lokaal testen

### Backend starten:
```bash
cd backend
npm install
npm start
```
Server draait op `http://localhost:3000`

### Frontend:
Open `frontend/index.html` in een browser. Zorg dat `config.js` op `ws://localhost:3000` staat.

---

## Features

- ✅ Online multiplayer via WebSockets
- ✅ Login & registreren
- ✅ Vrienden zoeken, verzoek sturen, accepteren
- ✅ Kamer aanmaken met 5-letter code
- ✅ Kamer joinen via code
- ✅ Vrienden uitnodigen via notificatie
- ✅ Live lobby chat
- ✅ Live game chat
- ✅ Volledig Trap Board spel (39 vakjes, clockwise)
- ✅ Space kaart bij elk vakje
- ✅ Kopen, huur betalen, dashen (30%)
- ✅ Kans & Gemeenschap kaarten
- ✅ Gevangenis systeem
- ✅ NPC Politie (actief na 5× GO)
- ✅ Politie Rad van Fortuin animatie
- ✅ Vrij-uit-bajes kaarten
- ✅ Dobbelstenen animatie
- ✅ Win scherm

---

## Kosten

| Service       | Kosten              |
|---------------|---------------------|
| Railway       | Gratis (500u/maand) |
| GitHub Pages  | Gratis              |
| Eigen domein  | ~€10/jaar (optioneel)|

**Totaal: €0 — of €10/jaar voor eigen domein**
