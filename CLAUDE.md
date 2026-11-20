# Ohjeet Claude Codelle — Kalajoen Peltityö ERP

Tämä tiedosto latautuu automaattisesti, kun Claude Code avaa repon. Laajempi projektiohje on Claude-projektin dokumentissa `claude.md`, ja päivien tilannekuvat ovat dokumenteissa `claude/istunto_*.md`.

**Repo on julkinen.** Älä kirjoita tänne salasanoja, `service_role`-avainta, sähköpostiosoitteita tai asiakastietoja. Supabasen anon-avain saa olla.

## Rakenne

- `orders/` — kaikki ERP-sivut (vanilla HTML/JS) sekä `auth-guard.js`, `nav.js` ja `logo-valkoinen.png`. GitHub Pages julkaisee `main`-haaran heti.
- `maps/` — varastokartta `verstaspohja_mitoitettu.html` (staattinen) ja sen zoomaus `kartta-zoom.js`. varasto.html lataa kartan SVG:n tästä tiedostosta ja liittää zoomauksen siihen, joten karttamuutokset näkyvät molemmilla sivuilla.
- `supabase/` — tietokantaan liittyvät tiedostot.
- `testit/` — Node-testit laskentakoodille (`node testit/aja_kaikki.js`), ks. `testit/LUEMINUT.md`.

## Yhteiset laskentatiedostot

Sama malli kuin `nav.js` ja `profiilit.js`: kaava ja piirto yhdessä tiedostossa, sivut lukevat sen. Suunnitelma: projektin `claude/yhteiset_tyokalut_suunnitelma.md`.

- `orders/profiilit.js` → `KPT_PROFIILIT` — kanttausprofiilit (Mallisto, Tuotanto, Vakiomallit).
- `orders/geom.js` → `KPT_GEOM` — vektorit, monikulmiot, ääriviivojen yhdistäminen, kupera kuori, leikkaus suoralla, mm-muotoilu.
- `orders/pellit.js` → `KPT_PELLIT` — pelti-osat: 3D-sivun avaus tasoksi, taitokset ja kanttausluvut, jiirit ja loveukset, merkintäpisteet, samanlaisten yhdistäminen, levityskuva. Vaatii geom.js:n (lataa ensin). Siirretty Huuvasta vaiheessa 1, joten nimet ovat vielä huuvan (Etu/Oikea/Taka/Vasen).
- `orders/piippu-laskenta.js` → `KPT_PIIPPU.laskeLapepiippu(vals, osat)` — lapepiipun peltien mitat. Käyttäjät: `piippu.html` ja `piippu_tuotanto.html` (vals = tilausrivin `profile_data.vals`). Ei enää kopioita sivuilla.
- `orders/piippu-levitys.js` → `KPT_PIIPPU_LEVITYS` — lapepiipun hupun palojen levityskuvat (saumat, tuplat, loveukset, merkintäpisteet, taitostaulukko). Vaatii geom.js, pellit.js ja piippu-laskenta.js (tässä järjestyksessä). Käyttäjät: piippu.html ja piippu_tuotanto.html.
- Kun yhteistä tiedostoa muutetaan: **aja `node testit/aja_kaikki.js` ennen pushia** ja nosta `?v=`-numeroa kaikilla sivuilla, jotka lataavat tiedoston.

## Säännöt

- **Käyttäjälle näkyvä teksti aina suomeksi** (esim. DRAFT → "Luonnos"). Tietokanta on englanniksi.
- **Valikko on vain tiedostossa `orders/nav.js`.** Uusi sivu lisätään valikkoon yhdellä rivillä `VALIKKO`-listaan. Sivulla on vain `<div class="nav-dropdown" id="navDropdown">` (varalinkki Etusivulle) ja heti sen perässä `<script src="nav.js?v=N"></script>`. Kun muutat nav.js:ää, nosta `?v=`-numeroa kaikilla sivuilla, jotta selaimet hakevat uuden version. Valikon ulkoasu (`.nav-item` ym.) tulee sivujen omista tyyleistä, jotka eroavat toisistaan, joten testaa valikon muutos **kuvakaappauksin kaikilla sivuilla**, ei vain toiminnallisesti (17.11.: kategorianappi näkyi tilaukset.html:ssä valkoisena laatikkona).
- **Logo:** ruudulla `<img src="logo-valkoinen.png">` (malli: `claude/ohje_code_logon_vaihto.md`), paperitulosteissa `logo-musta.png` (sama kuva mustana). Älä koskaan upota logoa SVG:nä.
- **Tulosteet:** mustavalkoiset, logo + päiväys. Mallit: tilaus.html:n `#tuloste` ja tuotanto.html:n työkortti `#tyokortti` (rakennetaan ennen tulostusta / `beforeprint`-tapahtumassa, `@media print` näyttää vain sen). Työkortin QR-koodi avaa `tuotanto.html?tilaus=<id>`.
- **Kirjautuminen:** jokaisella suojatulla sivulla `supabase-js` + `auth-guard.js`. Lataa data mieluiten `window._authReady.then(...)`. Älä poista auth-guard.js:n `await window._authReady` -riviä (korjaa tyhjän sivun, kun kirjautuminen vanhenee).
- **Oikea tietoturva on RLS:ssä**, ei auth-guardissa. Uusi taulu: RLS päälle ja säännöt vain `authenticated`-roolille.
- **Pienet muutokset suoraan `main`-haaraan, isot omaan haaraan ja pull requestiin** (Tomi hyväksyy).
- Tarkista ennen pushia: inline-skriptit `node --check`, ja muuttuneet sivut selaimessa (Playwright, Supabase mockattuna) myös 360 px leveydellä.
- Commitin tekijäksi Tomin GitHub-tunnus `Eltsu2013` (sama nimi ja sähköposti kuin repon aiemmissa commiteissa).
- Tomi ei ole koodari: selitä muutokset selkokielellä ja perustele valinnat. Väitä vastaan, jos olet eri mieltä.
