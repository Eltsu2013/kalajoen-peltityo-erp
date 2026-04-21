[claude.md](https://github.com/user-attachments/files/26925441/claude.md)
# Kalajoen Peltityö ERP — Ohje uusille chateille

## Projektin perustiedot

| Asia | Arvo |
|------|------|
| Asiakas | Kalajoen Peltityö Oy |
| Stack | Supabase + GitHub Pages (HTML/JS) + Retool |
| Supabase projekti | hjyeugeqmyavxisndlwp |
| Warehouse ID | e56f3534-50f9-4081-8840-f81f03905113 |
| GitHub repo | eltsu2013/kalajoen-peltityo-erp |
| GitHub Pages | https://eltsu2013.github.io/kalajoen-peltityo-erp/ |
| Anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4 |

---

## Sivut ja niiden tunnusvärit

| Sivu | Tiedosto | Tunnusväri | Suojattu |
|------|----------|------------|----------|
| Varastokartta | maps/verstaspohja_mitoitettu.html | — | EI |
| Peltipiirturi (Mallisto) | orders/peltipiirturi.html | — | KYLLÄ |
| Vakiomallit (Parmaco) | orders/vakiomallit.html | — | KYLLÄ |
| Tilauslomake | orders/tilaus.html | — | KYLLÄ |
| Asiakashallinta | orders/asiakkaat.html | violetti #a855f7 | KYLLÄ |
| Tilauslista | orders/tilaukset.html | cyan #0ea5e9 | KYLLÄ |
| Tuotanto | orders/tuotanto.html | vihreä #22c55e | KYLLÄ |
| Piippu (laskin) | orders/piippu.html | vihreä #22c55e | EI |
| Kirjautuminen | orders/login.html | cyan #0ea5e9 | — |
| Lasku/Tarjous | orders/lasku.html | — (suunnitteilla) | KYLLÄ |

---

## Tietokanta — tärkeimmät taulut

| Taulu | Kuvaus |
|-------|--------|
| customers | 4902 asiakasta, asiakasnumero automaattinen |
| orders | Tilaukset, status DRAFT→INVOICED→ARCHIVED |
| order_items | Tilausrivit, materiaali/väri/paksuus/tuoteryhmä |
| order_item_rows | Pituusrivit, production_status, done_qty |
| order_item_angles | Kanttikoneen kulmat |
| order_item_widths | Aihioleveys |
| order_item_prices | Laskettu hinta per rivi, lukittuu laskutuksessa |
| products | Tuotteet, unit: m²/m/kpl |
| stock_items | Varastoerät ROLL/SHEET/OFFCUT/ITEM/BULK |
| pricing_list | Hinnasto per leveys (Pural 121 riviä) |
| pricing_fixed | Kiinteät hinnat 128 riviä (työt/profiilit/kourut/levyt) |
| pricing_materials | Materiaalien ostohinnat ja kertoimet |
| pricing_bend_surcharge | Käännöslisä (ei vielä arvoa — johto miettii) |

---

## Kirjautuminen ja sivujen suojaus

### Miten suojaus toimii

Sivut on suojattu Supabase Auth -kirjautumisella. Rakenne on yksinkertainen:

- `login.html` — kirjautumissivu, ohjaa onnistuneen kirjautumisen jälkeen `tilaukset.html`:ään
- `auth-guard.js` — "vartija"-skripti joka lisätään jokaiselle suojattavalle sivulle

Kun selain lataa suojatun sivun, auth-guard tarkistaa heti onko käyttäjä kirjautunut. Jos ei → ohjataan automaattisesti `login.html`:ään. Jos on → sivu näytetään normaalisti. Sisältö piilotetaan tarkistuksen ajaksi niin ettei se välähdä ruudulla ennen ohjausta.

Auth-guard myös lisää automaattisesti "Kirjaudu ulos" -napin navigointipalkkiin joka sivulle — ei tarvita erillisiä muutoksia per sivu.

### Tiedostot

| Tiedosto | Sijainti | Kuvaus |
|----------|----------|--------|
| login.html | orders/login.html | Kirjautumissivu |
| auth-guard.js | orders/auth-guard.js | Vartija-skripti |

### Käyttäjät Supabasessa

Käyttäjät hallitaan Supabase dashboardilla: **Authentication → Users**

Tällä hetkellä käyttäjät:
- Omistaja (pääkäyttäjä)
- Johtaja — lisätään myöhemmin

Uuden käyttäjän lisäys:
1. Authentication → Users → Add user → Create new user
2. Syötä sähköposti ja salasana
3. **Tärkeä:** "Send email confirmation" pois päältä

### Supabase-asetukset (tehty kerran, ei tarvitse toistaa)

Authentication → Providers → Email → **"Confirm email" pois päältä**

Ilman tätä asetusta Supabase vaatii sähköpostivahvistuksen uusilta käyttäjiltä, jolloin kirjautuminen ei onnistu.

### Suojauksen lisääminen uudelle sivulle

Lisää nämä kaksi riviä jokaisen suojattavan sivun `</head>`-tagin eteen:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="auth-guard.js"></script>
```

**Huom:** Jos sivulla on jo Supabase CDN -rivi, lisää vain auth-guard.js-rivi sen perään — älä lisää kahta CDN-riviä.

Tarkista ensin onko CDN jo sivulla hakemalla tiedostosta `supabase.js` — jos löytyy, lisää vain auth-guard-rivi.

### Sivut joille EI lisätä suojausta

- `maps/verstaspohja_mitoitettu.html` — varastokartta, julkinen
- `orders/piippu.html` — piippulaskin, ei tallenna dataa, julkinen
- Mahdolliset muut laskurit jotka eivät käsittele asiakas- tai tilaustietoja

### Kirjautumissivun ?next= -parametri

Jos käyttäjä yrittää avata suojatun sivun kirjautumattomana, auth-guard lisää osoitteeseen `?next=sivunnimi.html`. Login.html käyttää tätä tietoa ja ohjaa käyttäjän takaisin oikealle sivulle kirjautumisen jälkeen, eikä aina tilaukset.html:ään.

---

## Arkkitehtuuriperiaatteet

- **Tietokanta englanniksi, UI suomeksi**
- Status-arvot englanniksi: DRAFT/IN_PROGRESS/QUOTED/ORDERED/IN_PRODUCTION/COMPLETED/INVOICED/ARCHIVED
- GitHub Pages ei tue BroadcastChannel — käytetään localStorage-kanavaa sivujen väliseen viestintään
- Hinnat ALV 0% järjestelmässä — ALV lisätään vasta laskulla
- Hinta näkyy vain valmiissa tilauksessa/tarjouksessa, ei tilauslomakkeella
- Aihioleveys pyöristetään ylöspäin lähimpään 10mm hinnan haussa

---

## Hinnoittelukaava (Pural/HC25/ZN)

```
metriHinta = aihioleveys_m × ostohinta_m2 × 1,85 + 2,00 €/m
           + käännökset × käännöslisä€/käännös (johto päättää suuruuden)
```

---

## Tyyliohjeet

- Tumma teema kaikilla sivuilla
- IBM Plex Sans + IBM Plex Mono fontit
- Navigointipalkki (☰ Valikko) joka sivulla — logo SVG inline HTML:ssä
- Joka sivulla oma tunnusväri (ks. taulukko yllä)
- Tulostus-CSS: tumma → valkoinen, navigaatio piilotetaan
- Mobiiliresponsiivisuus tärkeää — testataan puhelimella
- Border-radius: 4px (ei pyöreitä nappeja)

---

## Tapa toimia

- **Suunnittele ensin, koodaa sitten** — mockup tai rakennekuvaus ennen koodia
- **Yksi muutos kerrallaan** — erityisesti geometria/trigonometria
- **Erilliset chatit per aihe** — pitkät chatit hidastuvat
- **Todo-tiedostot** päivitetään session lopussa
- Käyttäjä on ei-koodari mutta oppii — selitä lyhyesti miksi tehdään niin kuin tehdään
- Kommunikointi suomeksi, rento sävy

---

## Chat-kohtaiset aloitusohjeet

**Hinnasto-chat:**
"Jatketaan hinnasto-chattia. Liitän hinnasto_todo_9_4.md. Tänään tehdään: [mitä]."

**Lasku-chat:**
"Jatketaan laskutusta. Liitän lasku_chat_aloitus.md ja todo8_4.md. Tänään tehdään: [mitä]."

**Muu moduuli:**
"Jatketaan Kalajoen Peltityö ERP-projektia. Liitän claude.md ja todo21_4.md. Tänään tehdään: [mitä]."

---

## Muistilista lasku-chatille

- Laskunumerointi jatkuu Accessista (~22682 seuraava)
- Viitenumero = laskunumero + suomalainen tarkistesumma (7-3-1)
- Tarjous ≈ lasku mutta rivihinnat voi piilottaa + tekstipohjat
- Laskurivejä voi lisätä/piilottaa laskutusvaiheessa
- Käyttäjä voi korvata koko yksikköhinnan manuaalisesti
- Kopioitaessa kysytään: vanhat vai uudet hinnat
- PDF → sähköposti (esitäytetty viesti, käyttäjä lähettää itse)
- Viitesiirrot ei akuutti — lisätään myöhemmin
