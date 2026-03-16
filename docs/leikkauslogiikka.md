# Kalajoen Peltityö ERP — Leikkauslogiikka

## Päätökset (LUKITTU)

Nämä päätökset on tehty projektin alkuvaiheessa ja ne ovat lukittuja.

### Inventoinnin nollapiste
- Nykyinen varasto on järjestelmän nollapiste
- Historiallisia parent-ketjuja ei rekonstruoida
- Kaikki tästä eteenpäin luodut ROLL/SHEET/OFFCUT-rivit ovat jäljitettäviä
- `batch_id` voi olla NULL inventointiriveillä
- `parent_stock_item_id` = NULL inventointiriveillä

### Leikkausmalli
Leveyssuuntainen leikkaus käyttää **remaining-mallia** (ei split-mallia).

---

## Leikkauslogiikka

### Leveyssuuntainen leikkaus (cut_sheet_width)

Kun leikataan leveys `p_cut_width_mm`:

1. Lukitaan aktiivinen SHEET tai OFFCUT
2. Varmistetaan että `remaining_width_mm >= p_cut_width_mm`
3. Päivitetään alkuperäinen: `remaining_width_mm = remaining_width_mm - p_cut_width_mm`
4. Luodaan uusi OFFCUT:
   - `original_width_mm = p_cut_width_mm`
   - `remaining_width_mm = p_cut_width_mm`
   - `parent_stock_item_id = lähdepala`
5. Kirjataan `stock_movements → CUT`

**Alkuperäistä ei arkistoida** — se jää ACTIVE-tilaan pienemmällä leveydellä.

### Pituussuuntainen katkaisu (cut_roll_length — ROLL → SHEET)

1. `cut_roll_length()` toimii
2. RULLA: `remaining_length` pienenee
3. Uusi SHEET syntyy, `parent = RULLA`
4. RULLA pysyy ACTIVE-tilassa

### Täysi rullaleikkaus (cut_roll_into_panels)

2-vaiheinen prosessi:
1. Katkaise pituus
2. Leikkaa leveys (quantity rinnakkain)
3. Luo yhtenäinen offcut
4. Arkistoi välilevy

---

## Jäljitettävyys

Parent-ketju muodostuu näin:

```
ROLL
→ SHEET (cut_roll_length)
→ OFFCUT (cut_sheet_width)
→ OFFCUT (jos leikataan uudelleen)
```

Ketju rekonstruoidaan aina `parent_stock_item_id`:n avulla.

Mahdollistaa myöhemmin:
- Reklamaatiojäljitys
- Hukka-analyysi
- Optimointihistoria
- Materiaalin elinkaaren seuranta

---

## stock_movements — liikkeiden tyypit

| Tyyppi | Kuvaus |
|--------|--------|
| IN | Varastoon lisäys |
| CUT | Leikkaus |
| TRANSFER | Varastopaikan vaihto |
| ADJUST | Mittojen muokkaus |
| ARCHIVE | Arkistointi (pelti käytetty) |

**Periaate: varastoa ei koskaan päivitetä suoraan — kaikki muutokset funktioiden kautta.**

---

## Optimointistrategiat (tuleva ominaisuus)

| Strategia | Kuvaus |
|-----------|--------|
| BALANCED | Tasapainoinen |
| PREFER_ROLL | Suosi rullaa |
| PREFER_STOCK_CLEANUP | Suosi varaston siivousta |
| MIN_WASTE | Minimoi hukka |

---

## Käytännön esimerkki

**Tilaus:** Sami Torvi, lista RR20 0,5mm, leveys 150mm, 33 metriä, pituus 2500–3000mm

**Varastotilanne:** Rulla 1250mm × 120m + useita levyjä eri mitoissa

**Ratkaisu:** Rullasta 3000×1250 levy → 7 siivua → loppu varastoon. Lisäksi 3000×830 levy → 3 siivua → loppu varastoon. 3010×160 levy → 1 siivu → loppu roskiin.
