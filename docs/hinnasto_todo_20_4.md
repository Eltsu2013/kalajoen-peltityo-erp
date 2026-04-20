[hinnasto_todo_9_4.md](https://github.com/user-attachments/files/26896053/hinnasto_todo_9_4.md)
# Kalajoen Peltityö ERP — Hinnasto-chat tilanne

## Päivitetty: 20. huhtikuuta 2026

---

## Sovittu ✅

### Yleistä
- Hinnat käytetään **ALV 0%** — ALV lisätään vasta laskutusvaiheessa
- Hinta näkyy vain **valmiissa tilauksessa ja tarjouksessa**, ei tilauslomakkeella
- **Lasku-chatille muistutus:** kun lasku kopioidaan, käyttäjältä kysytään käytetäänkö vanhat hinnat vai lasketaan uudelleen nykyisellä hinnastolla

---

### Hinnoittelun kolme kategoriaa

**1. Kaavapohjainen** — Pural, HC25, ZN, Pural matta
- Kaava: `aihioleveys_m × ostohinta_m2 × 1,85 + perustyö€/m + (käännökset × käännöslisä€)`
- Kerroin 1,85 vahvistettu Pural-sarjalta (tuotekoodit 305-399)
- Käännöslisä per käännös per pelti — EI per metri
- Perustyö €/m kattaa materiaalin käsittelyn + pitkien peltien lisätyön
- **Hinta on vakio aihioleveyden mukaan** — leikkausoptimointi hyödyttää sisäisesti

**2. Tapauskohtainen** — RST, Alu, Kyva, Kupari, Messinki
- Järjestelmä näyttää neliöhinnan pohjana
- Käyttäjä lisää työn hinnan manuaalisesti per tilaus

**3. Kiinteä hinta** — Parmaco, kattoturvatuotteet, kourut, tarvikkeet, tikkaat
- Parmaco: vuosisopimus, kiinteä hinta per malli, päivitetään vuoden alussa
- Asiakaskohtaiset hinnat mahdollisia (kerroin tai kiinteä €)

---

### Manuaaliset lisät (käyttäjä syöttää käsin)
- Vaativa pitkä pelti joka vaatii kaksi tekijää
- RST/Alu/Kyva työlisä
- Johtajan käsin laskema hinta — käyttäjä voi korvata koko yksikköhinnan manuaalisesti
- Pyöristys loppuhintaan (lähimpään 5 senttiin tai vapaa)

---

### Asiakaskohtaiset hinnat
- Mahdollisia — järjestelmä tarkistaa ensin asiakaskohtaisen, sitten yleisen
- Voi olla: oma kerroin tai kiinteä alennus
- Firmat-listat esimerkki vanhasta käytännöstä

---

### Tietokantarakenne (TOTEUTETTU 20.4.2026)

**`pricing_materials`** ✅ — kaavapohjainen hinnoittelu per materiaali
**`pricing_bend_surcharge`** ✅ — käännöslisä (ei vielä lisätty arvoa — johto miettii)
**`pricing_list`** ✅ — hinnasto per leveys, 121 Pural-riviä sisällä (alv 0%, €/m)
**`pricing_fixed`** ✅ — 128 kiinteää hintaa: työt, profiilit, kattoturva, kourut, levyt
**`order_item_prices`** ✅ — laskettu hinta per tilausrivi, lukittuu laskutuksessa

**Hinnan hakuLogiikka:** aihioleveys pyöristetään ylöspäin lähimpään 10mm → haetaan pricing_list

---

### Ostohinnat tiedossa (viimeisimmät)

| Materiaali | Ostohinta €/m² | Lähde |
|-----------|---------------|-------|
| Pural RR20 (iso rulla 250m²) | ~8,50 | METEHE, 2025-10/12 |
| HC25 RR23 (iso rulla 250m²) | ~7,25 | METEHE, 2026-01 |
| HC25 RR33 (iso rulla 250m²) | ~7,95 | METEHE, 2025-08/09 |
| Pural matta (kela 20m²) | ~13,25 | METEHE, 2025-10 |
| ZN 0,6 (kela 20m²) | 9,00 | METEHE, 2026-01 |
| RST 0,6 (arkki 3,125m²) | ~24,60 | JANLA, 2025-12 |
| Jyvä alu 1,5mm | ~35,26 | Alumeco, 2024-08 |

---

### Kilpailija-analyysi (Listasepät, verottomat hinnat)

- Hinta kasvaa **tasan lineaarisesti** pituuden mukaan (2000mm = 2× 1000mm)
- Käännöslisä: **~0,99–1,44 € per käännös** (veroton) — kiinteä per pelti, ei per metri
- Listasepillä huomattavasti korkeampi kate kuin KPT:llä
- KPT:n tarkka aihioleveyspohjainen kaava on reilumpi asiakkaalle

---

## Auki / Päätettävä ⏳

- [ ] **Käännöslisän suuruus** — johto miettii, Listasepät ~1,20€/käännös
- [ ] **Perustyön suuruus** — pysyykö 2€/m vai muutetaan?
- [ ] **Leveyskerroin-kaava** — Accessissa on kaava, pitää kaivaa esille
- [ ] **ZN:n kerroin** — onko sama 1,85 kuin Puralilla?
- [ ] **HC25:n kerroin** — tarkistettava
- [ ] **Parmaco-hinnat** — syötetään manuaalisesti kun vuosisopimus sovittu
- [ ] **Muiden materiaalien hinnat** hinnastoon (ZN, HC25 jne.) — vanha hinnasto ei luotettava
- [ ] **Hinnan hakulogiikka** — Supabase-funktio joka hakee oikean hinnan tilausriville
- [ ] **Hinnan näyttäminen** valmiissa tilauksessa/tarjouksessa — UI rakentamatta

## Ei toteuteta / Rajattu pois

- Vanha hinnasto (1623 riviä) — ei migratoida, rakennetaan uusi puhtaalta pöydältä
- Kiinteä hinta per leveys-variantti — korvataan laskentakaavalla
- Hinnoittelu tilauslomakkeella — vain valmiissa tilauksessa/tarjouksessa
- Dynaaminen hinta leikkausoptimoinnin mukaan — hinta vakio aihioleveyden perusteella

---

## Ohjeet uuden hinnasto-chat-ketjun aloitukseen

"Jatketaan Kalajoen Peltityö ERP-projektin hinnasto-chattia. Liitän hinnasto_todo_9_4.md tiedoston. Tänään tehdään: [mitä tehdään]."
