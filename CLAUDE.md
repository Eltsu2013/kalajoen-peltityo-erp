# Ohjeet Claude Codelle — Kalajoen Peltityö ERP

Tämä tiedosto latautuu automaattisesti, kun Claude Code avaa repon. Laajempi projektiohje on Claude-projektin dokumentissa `claude.md`, ja päivien tilannekuvat ovat dokumenteissa `claude/istunto_*.md`.

**Repo on julkinen.** Älä kirjoita tänne salasanoja, `service_role`-avainta, sähköpostiosoitteita tai asiakastietoja. Supabasen anon-avain saa olla.

## Rakenne

- `orders/` — kaikki ERP-sivut (vanilla HTML/JS) sekä `auth-guard.js`, `nav.js` ja `logo-valkoinen.png`. GitHub Pages julkaisee `main`-haaran heti.
- `maps/` — varastokartta (staattinen).
- `supabase/` — tietokantaan liittyvät tiedostot.

## Säännöt

- **Käyttäjälle näkyvä teksti aina suomeksi** (esim. DRAFT → "Luonnos"). Tietokanta on englanniksi.
- **Valikko on vain tiedostossa `orders/nav.js`.** Uusi sivu lisätään valikkoon yhdellä rivillä `VALIKKO`-listaan. Sivulla on vain `<div class="nav-dropdown" id="navDropdown">` (varalinkki Etusivulle) ja heti sen perässä `<script src="nav.js?v=N"></script>`. Kun muutat nav.js:ää, nosta `?v=`-numeroa kaikilla sivuilla, jotta selaimet hakevat uuden version. Valikon ulkoasu (`.nav-item` ym.) tulee sivujen omista tyyleistä, jotka eroavat toisistaan, joten testaa valikon muutos **kuvakaappauksin kaikilla sivuilla**, ei vain toiminnallisesti (17.11.: kategorianappi näkyi tilaukset.html:ssä valkoisena laatikkona).
- **Logo:** `<img src="logo-valkoinen.png">` (malli: `claude/ohje_code_logon_vaihto.md`). Älä koskaan upota logoa SVG:nä.
- **Kirjautuminen:** jokaisella suojatulla sivulla `supabase-js` + `auth-guard.js`. Lataa data mieluiten `window._authReady.then(...)`. Älä poista auth-guard.js:n `await window._authReady` -riviä (korjaa tyhjän sivun, kun kirjautuminen vanhenee).
- **Oikea tietoturva on RLS:ssä**, ei auth-guardissa. Uusi taulu: RLS päälle ja säännöt vain `authenticated`-roolille.
- **Pienet muutokset suoraan `main`-haaraan, isot omaan haaraan ja pull requestiin** (Tomi hyväksyy).
- Tarkista ennen pushia: inline-skriptit `node --check`, ja muuttuneet sivut selaimessa (Playwright, Supabase mockattuna) myös 360 px leveydellä.
- Commitin tekijäksi Tomin GitHub-tunnus `Eltsu2013` (sama nimi ja sähköposti kuin repon aiemmissa commiteissa).
- Tomi ei ole koodari: selitä muutokset selkokielellä ja perustele valinnat. Väitä vastaan, jos olet eri mieltä.
