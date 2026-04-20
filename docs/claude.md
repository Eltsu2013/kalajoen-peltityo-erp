[claude.md](https://github.com/user-attachments/files/26896029/claude.md)
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

| Sivu | Tiedosto | Tunnusväri |
|------|----------|------------|
| Varastokartta | maps/verstaspohja_mitoitettu.html | — |
| Peltipiirturi (Mallisto) | orders/peltipiirturi.html | — |
| Vakiomallit (Parmaco) | orders/vakiomallit.html | — |
| Tilauslomake | orders/tilaus.html | — |
| Asiakashallinta | orders/asiakkaat.html | violetti #a855f7 |
| Tilauslista | orders/tilaukset.html | cyan #0ea5e9 |
| Tuotanto | orders/tuotanto.html | vihreä #22c55e |
| Lasku/Tarjous | orders/lasku.html | — (suunnitteilla) |

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
- Navigointipalkki (☰ Valikko) joka sivulla
- Joka sivulla oma tunnusväri (ks. taulukko yllä)
- Tulostus-CSS: tumma → valkoinen, navigaatio piilotetaan
- Mobiiliresponsiivisuus tärkeää — testataan puhelimella

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
"Jatketaan Kalajoen Peltityö ERP-projektia. Liitän claude.md ja todo8_4.md. Tänään tehdään: [mitä]."

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
