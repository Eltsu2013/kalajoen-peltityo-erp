# Testit

Laskentakoodin automaattiset testit. Ne ajetaan Nodella ennen pushia, kun yhteisiä tiedostoja (`orders/geom.js`, `orders/pellit.js`) tai niitä käyttäviä sivuja muutetaan.

```
node testit/aja_kaikki.js
```

Lopussa pitää lukea `KAIKKI TESTIT OK`. Yksittäisen sarjan voi ajaa myös suoraan, esim. `node testit/huuva/test_pisteet.js`.

Repo on julkinen: testeissä ei käytetä asiakkaiden nimiä eikä tietoja (esim. "testipiippu A").

## huuva/ (12 sarjaa, 2313 tarkistusta 20.11.2026)

Huuvan testit siirrettiin Claude-projektista (`huuva/testit/`) vaiheessa 1 (suunnitelma `claude/yhteiset_tyokalut_suunnitelma.md`). Ne testaavat Huuva-sivua (`orders/huuva.html`, Huuva v16; vaiheeseen 8.1 asti testisivu `savuhuuva-mockup.html`), jonka geometria ja pelti-osat ovat yhteisissä tiedostoissa:

- Huuva on 24.11.2026 alkaen oikea ERP-sivu `orders/huuva.html` (vaihe 8.1, laskenta ennallaan). Testisivu `savuhuuva-mockup.html` poistettiin, jotta Huuvasta on vain yksi versio. Projektin kopio `huuva/savuhuuva-mockup.html` on vanha.
- `lataa.js` — lataa yhteiset tiedostot (geom.js, pellit.js, menekki.js, tyokortti.js) ja antaa `orders/huuva.html`:n skriptin testeille. Kaistalaskenta on 24.11.2026 alkaen yhteisessä `orders/menekki.js`:ssä (vaihe 8.3), ja `test_kaista` todistaa, ettei se muuttunut siirrossa.
- `test_*.js` — testit. Sisältö on sama kuin projektissa; vain latausrivi muuttui. `test_geom.js` testaa nyt oikeaa `pellit.js`:ää (ennen siinä oli oma kopio funktioista).

| Sarja | Mitä testaa |
|---|---|
| test_geom | Sivujen avaus tasoksi (keskitetty ja seinämalli) |
| test_taitokset | Sivu- ja yläreunan taitosten kanttausluvut, taitosten paikka ja koko, esiasetukset |
| test_kouru | Alareunan kouru |
| test_profiilit | Alareunan profiilit (kouru, sisäänpäin taitos, kaksi tuplaa) |
| test_jiirit, test_jiirit2 | Kourun jiirit ja lisämitat kulmissa |
| test_yla | Yläreunan taitos per paneeli ja 45° loveukset |
| test_ryhmat | Samanlaisten kappaleiden yhdistäminen ("Etu + Taka · 2 kpl") |
| test_paat | Sivutaitosten päät vaakasuorassa asennettuna (3D-tarkistus) |
| test_pisteet | Merkintäpisteet, ääriviivojen yhdistäminen, peilikuva |
| test_kaista | Kaistat rullasta, lomitus, päiden leikkaukset, rullan menekki |
| test_kortit | Avattavat kortit, yhteenvedot, tallennus selaimeen |

Tarkempi kuvaus jokaisesta sarjasta: projektin `huuva/testit/LUEMINUT.md`.

## piippu/ (2 sarjaa, 116 tarkistusta 20.11.2026)

`test_lapepiippu.js` testaa `orders/piippu-laskenta.js`:ää, jota käyttävät Piippu-sivu ja Tuotannon piippunäkymä (vaihe 2).

- **Vertailuluvut** (`lapepiippu_vertailu.json`): 25 piippua peltilistoineen. Tallennettu siirron yhteydessä, kun uusi tiedosto oli todettu täsmälleen samaksi kuin vanhat kaksi kopiota 20 000 mittayhdistelmällä. Jos tämä hälyttää, laskenta on muuttunut. Päivitetty tarkoituksella 20.11. (hupun palat pyöristetään ylöspäin).
- **Käsin lasketut oletusmitat** (Piippu-sivun oletusarvot): hupun palat, kansi, hattu, juuret, kaltevuuskorjaus, hupun todellinen korkeus (982 / 778).
- **Saumarakenne** (Tomin luonnokset 20.11.): jaetun kappaleen liitokseen 60 mm (3 × sauma), sauma 2:ssa takimmainen sivupala saa 40:n, sauma 2:n etu = taka.
- Osavalinnat (huppu pois, vain hattu) ja Tuotannon oletus (kaikki osat).
- Kokeiltu: jos E2-korjaus (18.11.) tai Sauma 2 -korjaus (20.11.) perutaan, testi hälyttää.

`test_levitys.js` (26 tarkistusta) testaa hupun levityskuvia (`orders/piippu-levitys.js`): käsin lasketut etupalan merkintäpisteet, sivupalan 40 mm sauma (20 suoraan + tupla, nurkassa ei taitosta), saumatyypit ja jaetut palat, yläreunan Ulos / Sisään / Tupla, tuplien 45° viisteet ja 300 satunnaista piippua (yksi ääriviiva, aihio mahtuu listan mittoihin, loveukset ei tyhjiä).

`test_menekki.js` testaa yhteistä kaistat ja menekki -tiedostoa (`orders/menekki.js`, vaihe 8.3) ilman Huuvaa: suorakaiteet suorana, puolisuunnikkaan lomitus käsin laskettuna, pelti-osat kappaleiksi ja piipun hupun palat kaistoille (`kaistaKappaleet`, peilikuvapari samalla kaistalla vuorotellen, kappalemäärä säilyy, harjapiippu).

## kartio/ (3 sarjaa, 24.11.2026)

Testaavat Kartio-sivua `orders/kartio.html` (vaihe 8.2 / ulkoasuremontti R1). Ne lukevat sivun ensimmäisen `<script>`-lohkon merkkiin `// ==== UI ====` asti, joten laskennan pitää olla sivun ensimmäinen inline-skripti ja ennen UI-merkkiä.

- `test_kartio.js` ja `test_kartio_karki.js` — Tomin Kartio-testit Claude-projektista (pyöreä ja nelikulmainen kartio, sovitteet, huullokset, saumat, sijoitus, leikkauskulmat; terävä kärki). Siirretty sellaisinaan, vain polku ja tulostus muutettu tälle ajurille.
- `test_kartio_harppi.js` — uusi `kartioHarppi` (Tomin toiveet A ja B): harpin kärjen paikka pellillä, kaaren pisteet tasavälein, pisteet leikkausääriviivalla, kärki palan / pellin ulkopuolella.

## Tulossa

- `piippu/`: harjapiipun testipiiput A ja B (vaihe 5).
