# Kalajoen Peltityö ERP — Tilanne ja tekolista

## Projektin tila (3. huhtikuuta 2026)

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

- Profiilityypit: Alavesipelti, Alavp 2, Ulkonurkka, Sisänurkka, Jiiripelti, Seinänvieripelti, Eturäystäspelti, Päätypelti, Päätypelti huopa, U-lista u/s, Kynnys, Hattulista, Z-lista, Peitelista, Vapaa profiili
- Napit ryhmitelty: MUUT ja KATOLLE osiot
- SVG-esikatselu reaaliajassa, pintamerkki, kaato/nousu/etenemä/kokonaismitta
- Pituustaulukko (mitta, päät, kok, kpl, huomio)
- Aihioleveyslaskenta
- Nimike-kenttä muokattavissa ennen tilauksen lisäystä
- Tuoteryhmä/materiaali/väri/paksuus-valinta — hakee Supabasesta, suodattuu unit=m² mukaan
- Sidebar resize — vetoelementti, muistaa leveyden, 2/3/4 saraketta leveyden mukaan
- Kulma-kentät siniharmaina (border + teksti), mitta-kentät normaalit — visuaalinen erottelu
- Navigointipalkki (☰ Valikko) — linkit kaikkiin sivuihin ja Retooliin
- Integraatio tilaus.html:ään localStorage-kanavalla (BroadcastChannel ei toimi GitHub Pagesilla)
- Lähettää: rivit, kulmat, aihioleveys, materiaali, väri, paksuus, tuoteryhmä

**vakiomallit.html** — Parmaco-vakiomallien piirtotyökalu (yhtenäinen sivu)

- Kaikki Parmaco-vakiomallit yhdellä sivulla profiilivalintanapein
- Profiilityypit: Ikkunapellit (Yläpelti / Alapelti), Kynnyspelti 1, Alaslaskun kappalista, Hattupelti viipalesaumaan, Ulkoverhouksen katkaisulista, Kattolista, Räystäslista
- Sama integraatiologiikka kuin peltipiirturissa

**tilaus.html** — tilauslomake

- Ryhmät (lisää, kopioi, poista, nimeä uudelleen)
- Pellit ryhmitelty aihioleveyden mukaan ryhmän sisällä
- Nimike muokattavissa suoraan tilauslistalla lennosta
- Kappalemäärä yhteensä ryhmän otsikossa
- Tilauspäivä + toimituspäivä + kohde/viite + huomio
- Status-valinnat: DRAFT/IN_PROGRESS/QUOTED/ORDERED/IN_PRODUCTION/COMPLETED/INVOICED (UI suomeksi)
- Asiakkaat haetaan Supabasesta, haku kirjoittamalla
- Tilaus tallentuu Supabaseen (orders + order_items + order_item_rows + order_item_angles + order_item_widths)
- Pellin lisäys, muokkaus, kopiointi, poisto — kaikki tallentuvat/päivittyvät/poistuvat Supabasesta
- CASCADE-poisto: pellin poisto poistaa automaattisesti rivit, kulmat ja leveydet
- Pellin muokkaus jälkikäteen Malliston kautta
- Materiaali/väri/paksuus/tuoteryhmä valitaan Mallistossa — näkyy tilausrivillä ja tallentuu omiin sarakkeisiin
- Kappaletavara-lomake (nimike, pituus m, määrä, yksikkö, huomio)
- Asiakkaan ✎ Muokkaa -nappi + Uusi asiakas -nappi
- Navigointipalkki (☰ Valikko)

---

#### Asiakashallinta (GitHub Pages)

**asiakkaat.html** — asiakashallinta ja -arkisto

- Asiakaslista vasemmassa paneelissa, haku nimellä/numerolla/yhteyshenkilöllä/puhelimella
- Asiakaskortti oikealla: perustiedot, laskutusosoite, yhteystiedot, OVT, muistiinpanot
- Muokkaa/Tallenna/Peruuta-toiminnot
- Arkistoi/Palauta-toiminto (is_active)
- Tilaushistoria asiakaskortin alla — klikkaamalla avautuu tilaus.html
- Uusi tilaus -nappi avaa tilaus.html asiakas esivalittuna
- Tunnusväri: violetti #a855f7
- Mobiiliparannukset, isompi fontti, sidebar resize
- Asiakasnumero luodaan automaattisesti (next_customer_number())
- 4902 asiakasta siirretty Accessista

---

#### Tilausten hallinta (GitHub Pages)

**tilaukset.html** — tilauslista ja hallinta

- Koko leveys, ei sidebaria — optimoitu listaukseen
- Tunnusväri: cyan #0ea5e9
- Yhteenveto-kortit ylhäällä (Aktiiviset / Luonnokset / Laskutettu / Arkisto / Kaikki) — toimivat myös suodatinnappina
- Suodatinpalkki: status-napit kaikille vaihtoehdoille + asiakashaku
- Taulukko lajiteltavissa kaikista sarakkeista
- Oletussuodatin: Aktiiviset (IN_PROGRESS, QUOTED, ORDERED, IN_PRODUCTION, COMPLETED)
- Vasemmassa reunassa värillinen statusviiva per rivi
- Rivi klikkauksesta avaa tilaus.html (localStorage openOrderId)
- ⧉ Kopioi -nappi joka rivillä — avaa uuden tilauksen ilman asiakasta, rivit kopioituna
- Navigointipalkki, logo

#### Tilauksen kopiointi

- Kopiointinappi tilaukset.html:ssä (asiakas tyhjenee, rivit säilyvät)
- Kopiointinappi asiakkaat.html:n tilaushistoriassa (asiakas säilyy, rivit säilyvät)
- Kopiointinappi tilaus.html:n headerissa kun tilaus on auki (asiakas tyhjenee, rivit säilyvät)
- Kaikki kopiot luodaan DRAFT-statuksella, päivämäärä = tänään, kohde/huomio tyhjennetään

#### Asiakashallinta — päivitykset

- Tilaushistoria: status käännetty suomeksi (DRAFT→Luonnos jne., myös ARCHIVED→Arkisto)
- Tilaushistoria: uusin tilaus ylimpänä (ORDER BY order_date DESC) — oli jo tehty
- Tilaushistoria: kohde/viite-kenttä näkyy rivissä pvm:n jälkeen
- Navigointipalkki päivitetty: tilaukset.html lisätty kaikkiin sivuihin

#### Supabase — orders status-constraint

- Lisätty ARCHIVED-status: orders_status_check päivitetty
- SQL: ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('DRAFT','IN_PROGRESS','QUOTED','ORDERED','IN_PRODUCTION','COMPLETED','INVOICED','ARCHIVED'))

#### Tietokanta — muutokset 2.4.2026

- order_items: lisätty sarakkeet material, color, thickness_mm, product_group
- order_items: lisätty RLS UPDATE ja DELETE politiikat
- orders: lisätty sarake kohde (text)
- orders: status constraint päivitetty englanninkieliseksi (DRAFT/IN_PROGRESS/QUOTED/ORDERED/IN_PRODUCTION/COMPLETED/INVOICED)
- Uusi taulu: order_item_rows (pituusrivit)
- Uusi taulu: order_item_angles (kanttikoneen kulmat, tulevaisuudessa kanttikoneohjaukseen)
- Uusi taulu: order_item_widths (aihioleveys, tulevaisuudessa useampi leveys per profiili)
- order_item_extra_lengths: olemassa, tuleva ominaisuus (limitysvara saumoille)

---

### KESKEN / TEKOLISTA ⏳

#### Pienet karttatyöt

- [ ] IN-R-02 klikattavaksi kartalla
- [ ] IN-R-01 tasot 1 ja 2 kartalle
- [ ] Vasen seinä (IN-L) tarkistus

#### Tilausmoduuli — muut

- [ ] Seinänvieripelti: kulma ei toimi oikein — seinälle-viiva pysyy pystysuorana mutta muut viivat eivät seuraa kulmaa

#### Isommat kokonaisuudet

- [ ] Leikkausoptimointi (rulla → levy → siivu, parent_stock_item_id)
- [ ] Laskutus ja maksuseuranta
- [ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
- [ ] Johtajan resurssioikeudet — vaatii maksullisen Retool-version
- [ ] Retool-teemat — vaatii business-version
- [ ] QR-koodit hyllyihin
- [ ] Kartta + taulukko yhdistäminen Retoolissa

---

## Arkkitehtuurisuunnitelmat

### Viestintä tilaus.html ↔ peltipiirturi/vakiomallit

BroadcastChannel ei toimi GitHub Pagesilla luotettavasti. Käytetään localStorage-kanavaa:
- Peltipiirturi/vakiomallit kirjoittaa `kpt_add_to_order`-avaimen
- tilaus.html kuuntelee `storage`-eventtiä ja käsittelee viestin kerran

### Tietokantarakenne order_item-taulut

Periaate: tietokanta englanniksi, UI suomeksi.

- order_item_rows — pituusrivit leikkausoptimointia ja tulostusta varten
- order_item_angles — kulmat kanttikoneen ohjausta varten (tulevaisuus)
- order_item_widths — aihioleveys, tulevaisuudessa useampi leveys per profiili
- order_item_extra_lengths — limitysvara saumoille (tulevaisuus)
- profile_data jsonb — varmuuskopio, sisältää piirturin vals/opts-arvot

### Leikkausoptimointi (tuleva)

Ryhmittelyperiaate: sama material + color + thickness_mm → sama leikkausajo.
Tarvitaan: order_item_rows (pituudet), order_item_widths (leveydet), order_items.aihio_width_mm.

---

## Ohjeet uuden chat-ketjun aloitukseen

"Jatketaan Kalajoen Peltityö ERP-projektia. Stack: Supabase + Retool + GitHub Pages. Warehouse ID: e56f3534-50f9-4081-8840-f81f03905113. Liitän projektidokumentit. Tänään tehdään: [mitä tehdään]."

---

## Tärkeimmät tiedot pikaisesti

| Asia | Arvo |
|------|------|
| Warehouse ID (Verstas) | e56f3534-50f9-4081-8840-f81f03905113 |
| GitHub repo | eltsu2013/kalajoen-peltityo-erp |
| Kartta | maps/verstaspohja_mitoitettu.html |
| Asiakkaat | orders/asiakkaat.html |
| Tilauslomake | orders/tilaus.html |
| Peltipiirturi | orders/peltipiirturi.html |
| Vakiomallit | orders/vakiomallit.html |
| Supabase projekti | hjyeugeqmyavxisndlwp |
| Supabase anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4 |
| Edge fn: lisää pelti | create_initial_stock_items |
| Edge fn: muokkaa pelti | adjust_stock_item_edge |
| Edge fn: hae pellit | get_stock_items |
| Edge fn: hae tuotteet | get_products |
| Edge fn: lisää tuote | create_product |
| Edge fn: muokkaa tuote | update_product |
| Edge fn: poista tuote | deactivate_product |
