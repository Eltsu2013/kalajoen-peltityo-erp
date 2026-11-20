# Testit

Laskentakoodin automaattiset testit. Ne ajetaan Nodella ennen pushia, kun yhteisiä tiedostoja (`orders/geom.js`, `orders/pellit.js`) tai niitä käyttäviä sivuja muutetaan.

```
node testit/aja_kaikki.js
```

Lopussa pitää lukea `KAIKKI TESTIT OK`. Yksittäisen sarjan voi ajaa myös suoraan, esim. `node testit/huuva/test_pisteet.js`.

Repo on julkinen: testeissä ei käytetä asiakkaiden nimiä eikä tietoja (esim. "testipiippu A").

## huuva/ (12 sarjaa, 2313 tarkistusta 20.11.2026)

Huuvan testit siirrettiin Claude-projektista (`huuva/testit/`) vaiheessa 1 (suunnitelma `claude/yhteiset_tyokalut_suunnitelma.md`). Ne testaavat Huuva-mockupia v16, jonka laskenta ja piirto ovat nyt yhteisissä tiedostoissa:

- `savuhuuva-mockup.html` — Huuva-mockup v16. Sivun oma osa (lomake, kaistat, työkortit, avattavat kortit) on tässä, ja geometria ja pelti-osat ladataan tiedostoista `../../orders/geom.js` ja `../../orders/pellit.js`. **Tämä on nyt Huuva-mockupin pääversio**; projektin kopio on vanha (siinä funktiot ovat vielä sivun sisällä). Huuva siirretään varsinaiseksi sivuksi myöhemmin (suunnitelman vaihe 8).
- `lataa.js` — lataa yhteiset tiedostot ja antaa mockupin skriptin testeille.
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

## Tulossa

- `piippu/`: harjapiipun testipiiput A ja B (vaihe 5).
- Kartion testit (`test_kartio.js`) siirretään, kun Kartio tulee repoon (vaihe 8).
