# Kalajoen Peltityö ERP — Varastopaikat

## Varastot

| Koodi | Nimi | Kuvaus |
|-------|------|--------|
| VER | Verstas | Sisävarasto, täysi hyllyrakenne |
| ULK | Ulkovarasto | Vasen ja oikea puoli |
| AUTO | Auto | Vanha pakettiauto varastona |
| KONTTI | Kontti | Kourutarvikkeet ja pienosat |
| ULKOHYL | Ulkohylly | Ulkona oleva hylly |

### Ulkovarasto
- ULK-V — Vasen puoli (ULKV-Vasen)
- ULK-O — Oikea puoli (ULKV-Oikea)

### Auto, Kontti, Ulkohylly
- Yksi varastopaikka per varasto (ei hyllyrakennetta)

---

## Verstaan kartta

- **URL:** https://eltsu2013.github.io/kalajoen-peltityo-erp/maps/verstaspohja_mitoitettu.html
- **Tiedosto:** maps/verstaspohja_mitoitettu.html (GitHub repo)
- **Teema:** Tumma (IBM Plex Mono), värikoodaus alla

## Värikoodit kartalla
- **Sininen (#3a8fe8)** — IN-R (oikea seinä)
- **Vihreä (#3dba6e)** — IN-L (vasen seinä)
- **Oranssi (#d4921a)** — IN-C (keskialue)

## Pohjapiirros — mitat (mm)

Pohjan muoto vasemmasta alakulmasta myötäpäivään:
- Ylös 14370 → oikealle 7400 → alas 4900 → oikealle 5020 → alas 9470 → vasemmalle 12420

SVG skaala: 1px = 25mm

---

## IN-R — Oikea seinä

### Järjestys nosto-ovesta ylöspäin:

| Koodi | Nimi | Hyllyt | Huomio |
|-------|------|--------|--------|
| IN-R-07 | Hyllykkö 1 | Lattia + Hylly 1-6 | Alin, nosto-oven vieressä |
| IN-R-03 | Lattiarullat | ei hyllyjä | Leveämpi alue, sekalaisia rullia |
| IN-R-02 | Hyllykkö 2 | Lattia + Hylly 1-6 | |
| IN-R-04 | Hyllykkö 3 | Lattia + Hylly 1-6 | |
| IN-R-05 | Hyllykkö 4 | Lattia + Hylly 1-6 | |
| IN-R-06 | Hyllykkö 5 | Lattia + Hylly 1-6 | Ylin |
| IN-R-08 | Giljotiinin välihylly / Kanttikoneen välitila | | Pysyy paikallaan |
| IN-R-09 | Päätyhylly (työkalut/pienosat) | | Pysyy paikallaan |
| IN-R-10 | Päätyseinän levyalue A | | Pysyy paikallaan |
| IN-R-11 | Päätyseinän levyalue B | | Pysyy paikallaan |
| IN-R-01 | Kelateline | Taso 1, Taso 2 | RR20 ylhäällä, RR23 alhaalla |

### Hyllytasokoodit (esimerkki IN-R-07):
- IN-R-07-0 = Lattia
- IN-R-07-1 = Hylly 1
- IN-R-07-2 = Hylly 2
- ... jne. IN-R-07-6 = Hylly 6

Sama logiikka kaikissa hyllyköissä (02, 04, 05, 06, 07).

---

## IN-L — Vasen seinä

| Koodi | Nimi |
|-------|------|
| IN-L-01 | Tekninen tila (ruuvihyllyt 5 tasoa) |
| IN-L-02 | Vessa |
| IN-L-03 | Työkalukoppi |
| IN-L-04 | Porras hyllykkö (hyllyt 1-8) |
| IN-L-05 | Piikit (2 riviä × 13 piikkiä) |
| IN-L-06 | Päätyseinän piikit (2 riviä × 14 piikkiä) |
| IN-L-07 | Päätyseinän 3 hyllyä (1-3) |
| IN-L-08-A | Stucco alu alue |
| IN-L-08-B | Kyva 0,7–1,0 alue |
| IN-L-08-C | ZN sekalaiset palat |
| IN-L-09 | Päätyseinän ZN pikkupalat |
| IN-L-10 | RST levyt |
| IN-L-11 | Jyvä alu 1,5mm pienet |
| IN-L-12 | Jyvä alu 1,5mm isot |
| IN-L-13 | Lattia-alue isoille rullille |
| IN-L-14 | Kotelot / Tsek kone takana |
| IN-L-15 | ZN ja Kyva hyllyt (1-3) |

---

## IN-C — Keskialue

| Koodi | Nimi |
|-------|------|
| IN-C-01 | Kanttikoneen pääty |
| IN-C-02 | Kanttikonetta vasten |
| IN-C-03 | Kattokonetta vasten Oikea |
| IN-C-04 | Kapea tila |
| IN-C-05 | Kattokoneen nosto-oven puoli |
| IN-C-06 | Kattokoneen vasen puoli |
| IN-C-07 | Vakki (liikkuva kontti) |
| IN-C-08 | Kattokonetta vasten Vasen |
| IN-C-09-A | Kattokoneen vapaa taso |
| IN-C-09-B | Kattokoneen kiinteä hyllykkö (5×5) |
| IN-C-09-C | Kaksitasoinen hylly kattokoneen päällä |

---

## Kesken / Seuraavaan päivitykseen

- IN-R-02 ei ole klikattava kartalla (näkyy mutta ei reagoi klikkaukseen)
- IN-R-01 kaipaa 2 tasoa kartalle
- Vasen seinä (IN-L) kaipaa tarkistuksen ja mahdollisia päivityksiä
- QR-koodit hyllyihin (tuleva ominaisuus)
