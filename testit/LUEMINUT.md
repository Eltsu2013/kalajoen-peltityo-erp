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

## Tulossa

- `piippu/`: lapepiipun nykyiset luvut (vaihe 2, ennen ja jälkeen -vertailu) ja harjapiipun testipiiput A ja B.
- Kartion testit (`test_kartio.js`) siirretään, kun Kartio tulee repoon (vaihe 8).
