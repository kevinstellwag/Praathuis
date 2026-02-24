# 🎲 Shankroll — Upload naar GitHub Pages

 ## Wat heb je nodig?
- Een gratis GitHub account → [github.com](https://github.com)
- Optioneel: een eigen domeinnaam (bijv. shankroll.nl)

---

## STAP 1 — GitHub account aanmaken
1. Ga naar **github.com**
2. Klik op **Sign up**
3. Kies een gebruikersnaam, email en wachtwoord
4. Bevestig je email

---

## STAP 2 — Nieuwe repository aanmaken
1. Log in op GitHub
2. Klik rechtsboven op het **+** icoontje → **New repository**
3. Vul in bij **Repository name**: `shankroll` (of wat je wil)
4. Zet het op **Public** (verplicht voor gratis GitHub Pages)
5. Klik op **Create repository**

---

## STAP 3 — Bestanden uploaden
1. Je ziet nu je lege repository
2. Klik op **uploading an existing file** (of **Add file → Upload files**)
3. Sleep de volgende bestanden/mappen naar het uploadvenster:
   ```
   shankroll/
   ├── index.html
   ├── README.md
   ├── css/
   │   └── style.css
   └── js/
       ├── data.js
       ├── auth.js
       ├── lobby.js
       ├── board.js
       ├── game.js
       ├── ui.js
       └── main.js
   ```
4. Scroll naar beneden → klik **Commit changes**

---

## STAP 4 — GitHub Pages aanzetten
1. Ga in je repository naar het **Settings** tabblad (tandwiel-icoontje)
2. Klik links in het menu op **Pages**
3. Onder **Branch** kies je `main` (of `master`)
4. Klik op **Save**
5. Wacht 1-2 minuten

Je game is nu live op:
```
https://JOUW-GEBRUIKERSNAAM.github.io/shankroll/
```

---

## STAP 5 (optioneel) — Eigen domein koppelen

### Domein kopen
Koop een domein bij bijv.:
- **Hostnet.nl** (~€10/jaar voor .nl)
- **TransIP.nl** (~€8/jaar voor .nl)
- **Namecheap.com** (~$10/jaar voor .com)

### DNS instellen bij je domeinnaam aanbieder
Ga naar de DNS-instellingen van je domein en voeg toe:

| Type  | Naam | Waarde               |
|-------|------|----------------------|
| A     | @    | 185.199.108.153      |
| A     | @    | 185.199.109.153      |
| A     | @    | 185.199.110.153      |
| A     | @    | 185.199.111.153      |
| CNAME | www  | JOUW-NAAM.github.io  |

### In GitHub Pages instellen
1. Ga naar Settings → Pages
2. Vul bij **Custom domain** jouw domein in (bijv. `shankroll.nl`)
3. Vink **Enforce HTTPS** aan
4. Wacht 10-30 minuten (DNS heeft tijd nodig)

---

## Updates uploaden
Als je de game wil aanpassen:
1. Pas het bestand aan op je computer
2. Ga naar je GitHub repository
3. Klik op het bestand dat je wil aanpassen
4. Klik op het potlood-icoontje ✏️ (rechtsboven in het bestand)
5. Pas aan en klik **Commit changes**

Of: upload opnieuw via **Add file → Upload files** en overschrijf de oude bestanden.

---

## Bestandenstructuur
```
shankroll/
├── index.html        ← Alle HTML/schermen
├── README.md         ← Deze handleiding
├── css/
│   └── style.css     ← Alle opmaak/design
└── js/
    ├── data.js       ← Bord, kaarten, speldata
    ├── auth.js       ← Login, registreren, accounts
    ├── lobby.js      ← Spelerslobby, tokens
    ├── board.js      ← Bord bouwen en renderen
    ├── game.js       ← Alle spellogica
    ├── ui.js         ← UI updates, modals, toasts
    └── main.js       ← Navigatie en opstart
```

---

## Veelgestelde vragen

**Kost dit iets?**
Nee. GitHub Pages is 100% gratis. Alleen een eigen domeinnaam kost geld (~€8-15/jaar).

**Werkt het op telefoon?**
Ja. De game is volledig mobielvriendelijk.

**Kan iedereen het spelen?**
Ja, iedereen met de link kan de game spelen. Accounts worden opgeslagen op het apparaat van de speler (localStorage).

**Kan ik meerdere games toevoegen?**
Ja. Je kan nieuwe games toevoegen door extra HTML-schermen en JS-bestanden toe te voegen.

**Hoe verwijder ik een account?**
Ga naar je profiel in de app → "Account verwijderen".

---

Gemaakt met ❤️ — Shankroll 2025
