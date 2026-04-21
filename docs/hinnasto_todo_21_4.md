[todo21_4.md](https://github.com/user-attachments/files/26925483/todo21_4.md)
# Kalajoen Peltityö ERP — Tilanne ja tekolista

## Projektin tila (21. huhtikuuta 2026)

---

### VALMIS ✅

#### Varastonhallinta

- Tietokantarakenne (Supabase)
- Varastorakenne ja -paikat (locations-taulu)
- Pellin lisäys, muokkaus, arkistointi, varastopaikan vaihto
- Retool desktop UI: Varasto / Kartta / Yhteenveto / Tuotteet välilehdet
- Retool mobiili UI: Selaa / Lisää / Muokkaa / Kartta välilehdet
- Varastokartta GitHub Pagesissa (interaktiivinen SVG, mobiiliresponsiivinen)
- Toinen käyttäjä lisätty (johtaja, viewer-rooli)
- Tuotteet-välilehti (lista, suodattimet, lisäys, muokkaus, poisto käytöstä)
- ITEM (Kpl) ja BULK (Metri) tyypit käyttöön varastossa
- product_code-kenttä lisätty products-tauluun ja funktioihin
- GitHub kansiorakenne siistiytyi (docs/, maps/, supabase/functions/)
- Supabase unit-arvot päivitetty: mm/Mm → m², m/M → m, kpl/Kpl → kpl

---

#### Tilausmoduuli (GitHub Pages)

**peltipiirturi.html** — Mallisto, peltiprofiilien piirtotyökalu
- Kaikki profiilityypit, SVG-esikatselu, pituustaulukko, aihioleveyslaskenta
- Sidebar resize, kulma-kentät siniharmaina
- Navigointipalkki (☰ Valikko)
- Integraatio tilaus.html:ään localStorage-kanavalla
- Seinänvieripelti kulma KORJATTU 6.4.2026
- **Auth-guard lisätty 21.4.2026**

**vakiomallit.html** — Parmaco-vakiomallien piirtotyökalu
- Kaikki Parmaco-vakiomallit yhdellä sivulla
- vals-tallennus KORJATTU 6.4.2026
- **Auth-guard lisätty 21.4.2026**

**tilaus.html** — tilauslomake
- Ryhmät, pellit, kappaletavara, status, asiakashaku
- Tilaus tallentuu Supabaseen kaikkiin alatauluihin
- **Auth-guard lisätty 21.4.2026**

---

#### Asiakashallinta (GitHub Pages)

**asiakkaat.html** — asiakashallinta ja -arkisto
- Asiakaslista, asiakaskortti, tilaushistoria
- 4902 asiakasta siirretty Accessista
- **Auth-guard lisätty 21.4.2026**

---

#### Tilausten hallinta (GitHub Pages)

**tilaukset.html** — tilauslista ja hallinta
- Yhteenveto-kortit, statussuodattimet, taulukko, kopiointinappi
- **Auth-guard lisätty 21.4.2026**

---

#### Tuotanto (GitHub Pages)

**tuotanto.html** — tuotannonohjaussivu
- Tilauslista, yhteislista, työkortti
- Kanttaus-kuvat kaikille profiilityypeille
- Tuotantostatukset per pituusrivi (WAITING/CUT/BENT/EXTRA/DONE)
- **Auth-guard lisätty 21.4.2026**

---

#### Piippu (GitHub Pages)

**piippu.html** — piippulaskin (EI SUOJATTU — julkinen työkalu)
- Laskee piipun osien mitat: juuret, huppu, kansi, hattu
- SVG-piirros piipun geometriasta mitoilla
- Ei tallenna mitään Supabaseen
- **Ulkoasu päivitetty 21.4.2026** — IBM Plex Sans, tumma teema, sama header kuin muilla sivuilla (☰ Valikko, SVG-logo)

---

#### Kirjautuminen ja sivujen suojaus (21.4.2026) — UUSI

**Toteutettu Supabase Auth -kirjautumisella.**

Tiedostot:
- `orders/login.html` — kirjautumissivu, cyan-teema, SVG-logo, salasanan palautus
- `orders/auth-guard.js` — vartija-skripti

Suojatut sivut (auth-guard lisätty):
- asiakkaat.html ✅
- tilaukset.html ✅
- tilaus.html ✅
- tuotanto.html ✅
- peltipiirturi.html ✅
- vakiomallit.html ✅

Suojaamattomat sivut (julkisia):
- piippu.html — pelkkä laskin, ei asiakas/tilaustietoja
- maps/verstaspohja_mitoitettu.html — varastokartta

Supabase-asetukset (tehty, ei tarvitse toistaa):
- Authentication → Providers → Email → "Confirm email" POIS päältä

Käyttäjät Supabasessa:
- Omistaja lisätty
- Johtaja — lisätään myöhemmin tarvittaessa

---

#### Hinnasto (Supabase-taulut luotu 20.4.2026)

- pricing_materials — kaavapohjainen hinnoittelu per materiaali
- pricing_bend_surcharge — käännöslisä (arvo päättämättä)
- pricing_list — 121 Pural-riviä (alv 0%, €/m)
- pricing_fixed — 128 kiinteää hintaa
- order_item_prices — laskettu hinta per tilausrivi, lukittuu laskutuksessa

---

#### Tietokanta — muutokset

**6.4.2026:**
- order_items: lisätty production_status
- order_item_rows: lisätty production_status ja done_qty

**2.4.2026:**
- order_items: lisätty material, color, thickness_mm, product_group + RLS-politiikat
- orders: lisätty kohde, ARCHIVED-status
- Uudet taulut: order_item_rows, order_item_angles, order_item_widths

---

### KESKEN / TEKOLISTA ⏳

#### tuotanto.html — pienet viimeistelyt

- [ ] Vakiomallit-profiilien kuvat — testaus kesken
- [ ] Z-lista: juuri korjattu, tarkistettava
- [ ] Päätypelti: tippanokka-kulman offsetit — säätöä voi tarvita
- [ ] Tulostus: kuva + mitat pysyy yhdessä lohkossa

#### Kirjautuminen — myöhemmin

- [ ] Johtajan käyttäjätunnus lisätään Supabaseen kun tarvitaan
- [ ] Mahdollinen uusi sivu (lasku.html) — muista lisätä auth-guard

#### Pienet karttatyöt

- [ ] IN-R-02 klikattavaksi kartalla
- [ ] IN-R-01 tasot 1 ja 2 kartalle
- [ ] Vasen seinä (IN-L) tarkistus

#### Hinnasto — auki

- [ ] Käännöslisän suuruus — johto miettii
- [ ] Perustyön suuruus — pysyykö 2€/m
- [ ] Leveyskerroin-kaava — Accessissa on kaava, pitää kaivaa
- [ ] ZN:n ja HC25:n kerroin — tarkistettava
- [ ] Parmaco-hinnat — syötetään kun vuosisopimus sovittu
- [ ] Hinnan hakulogiikka — Supabase-funktio
- [ ] Hinnan näyttäminen valmiissa tilauksessa/tarjouksessa

#### Laskutus (lasku.html) — ei aloitettu

- [ ] Lasku/Tarjous-sivu
- [ ] Laskunumerointi jatkuu Accessista (~22682)
- [ ] PDF-generointi + sähköpostitus
- [ ] Ks. lasku_chat_aloitus.md

#### Isommat kokonaisuudet

- [ ] Leikkausoptimointi (rulla → levy → siivu)
- [ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
- [ ] Johtajan resurssioikeudet Retoolissa — vaatii maksullisen version
- [ ] QR-koodit hyllyihin

---

## Arkkitehtuurisuunnitelmat

### Viestintä tilaus.html ↔ peltipiirturi/vakiomallit

localStorage-kanava: peltipiirturi/vakiomallit kirjoittaa `kpt_add_to_order`-avaimen, tilaus.html kuuntelee `storage`-eventtiä.

### Leikkausoptimointi (tuleva)

Ryhmittelyperiaate: sama material + color + thickness_mm → sama leikkausajo.
Tarvitaan: order_item_rows (pituudet), order_item_widths (leveydet), order_items.aihio_width_mm.

---

## Ohjeet uuden chat-ketjun aloitukseen

"Jatketaan Kalajoen Peltityö ERP-projektia. Liitän claude.md ja todo21_4.md. Tänään tehdään: [mitä tehdään]."

---

## Tärkeimmät tiedot pikaisesti

| Asia | Arvo |
|------|------|
| Warehouse ID (Verstas) | e56f3534-50f9-4081-8840-f81f03905113 |
| GitHub repo | eltsu2013/kalajoen-peltityo-erp |
| Kartta | maps/verstaspohja_mitoitettu.html |
| Kirjautuminen | orders/login.html |
| Auth-guard | orders/auth-guard.js |
| Asiakkaat | orders/asiakkaat.html |
| Tilauslomake | orders/tilaus.html |
| Tilauslista | orders/tilaukset.html |
| Peltipiirturi | orders/peltipiirturi.html |
| Vakiomallit | orders/vakiomallit.html |
| Tuotanto | orders/tuotanto.html |
| Piippu | orders/piippu.html |
| Supabase projekti | hjyeugeqmyavxisndlwp |
| Supabase anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4 |
