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
- `orders/pellit.js` → `KPT_PELLIT` — pelti-osat: 3D-sivun avaus tasoksi, taitokset ja kanttausluvut, jiirit ja loveukset, merkintäpisteet, samanlaisten yhdistäminen, levityskuva. Vaatii geom.js:n (lataa ensin). Siirretty Huuvasta vaiheessa 1, joten nimet ovat vielä huuvan (Etu/Oikea/Taka/Vasen). v2: valinnainen `p.paneeli` (muu kuin nelikulmainen paneeli).
- `orders/piippu-laskenta.js` → `KPT_PIIPPU.laskeLapepiippu(vals, osat)` — lapepiipun peltien mitat; `laskeHarjapiippu(vals, osat)` ja `harjaPuoli2` — harjapiippu (20.11.2026). Käyttäjät: `piippu.html`, `harjapiippu.html` ja `piippu_tuotanto.html` (vals = tilausrivin `profile_data.vals`, harjapiipussa `tyyppi: 'harjapiippu'`). Ei kopioita sivuilla.
- `orders/piippu-levitys.js` → `KPT_PIIPPU_LEVITYS` — lapepiipun hupun palojen levityskuvat (saumat, tuplat, loveukset, merkintäpisteet, taitostaulukko) 3D-mallista, joten myös kiila / mutkapiippu (`vals.kiilaPaalla`). `laskeKaikki(vals, osat)` = peltilista kiilan kanssa (suoralla piipulla sama kuin `laskeLapepiippu`). Harjapiippu: `harjaHupunPalat`, `levitaTaso` (alareuna voi taittua harjalla), `laskeKaikkiHarja` (lista, hupun rivit todellisena aihiona), `harjaSivukuva(vals, { todelliset })`, `harjaSuhde`. Harjapiipun kiila / mutka (vaihe 5b, 24.11.2026): `harjaKiilaTiedot`, `harjaMalli` (kaksi kattotasoa, kiero lape → varoitus), `harjaKiilaPalat`, `laskeKaikkiHarjaKiila`; `harjaHupunPalat` ja `laskeKaikkiHarja` käyttävät niitä, kun `vals.kiilaPaalla` ja jokin kiilan kenttä poikkeaa suorasta. Vaatii geom.js, pellit.js ja piippu-laskenta.js (tässä järjestyksessä). Käyttäjät: piippu.html, harjapiippu.html ja piippu_tuotanto.html.
- `orders/kansi.js` → `KPT_KANSI` — piipun kansi ja reiät (vaihe 7b, 23.11.2026, mockup `piippu/kansi-mockup.html`): `sivuKortti(el, { muutos, kortti })` = piippusivujen kansikortti (lomake + kuva + reikätaulukko + Tuotannossa mitattu ulkomitta), `kuva(k, { mista })`, `reikaTaulu(k, { mista })`, `tiedot(k)`. Laskenta on `piippu-laskenta.js`:ssä: `KPT_PIIPPU.laskeKansi(pLev, pSyv, vals)` (myös `tulos.kansi` peltilistan laskennasta), `kansiAsetukset`, `kansiReianMitat`. Tallennus `profile_data.vals.kansi`. Vaatii piippu-laskenta.js:n. Käyttäjät: piippu.html, harjapiippu.html, piippu_tuotanto.html.
- `orders/tyokortti.js` → `KPT_TYOKORTTI` — yhteinen työkortin pohja (vaihe 7, 23.11.2026): mustavalkoinen pysty-A4, logo-musta.png, QR (vaatii qrcode-generator-kirjaston), tilauksen tiedot, huomio, ruudut, kpl-laatikot, `paperille(svg)` (ruudun tummat värit mustavalkoisiksi), `asenna(rakennaFn)` + `tulosta()` (Ctrl+P ja Tulosta-nappi tulostavat vain kortin, `#tkk` + `body.tkk-tulostus`). Käyttäjät: piippu_tuotanto.html, tuotanto.html (tilauksen työkortti, 23.11.2026; sivu palauttaa tyhjän, kun tilaus ei ole auki, jolloin lista tulostuu sellaisenaan) ja huuva.html (24.11.2026: yläosa `ylaosaPieni`, Huuvan omat sisältötyylit `#tkk .tk-*`). Myöhemmin Kartio.
- `orders/huuva.html` — Huuva (savuhuuvan levityskuvat, kaistat ja rullan menekki, työkortit), vaihe 8.1 24.11.2026: siirretty testisivulta ilman laskennan muutoksia. Sivun oma skripti on yksi `<script>`-lohko, jonka Huuvan testit lukevat (`testit/huuva/lataa.js`), joten sivulle ei saa lisätä toista inline-skriptiä ennen sitä. Valikossa kategoria Sovitteet. Suunnitelma: projektin `claude/vaihe8_sovitteet_suunnitelma.md`.
- **Piippusivut ja tilaus viestivät localStoragen kautta** (piippusivu ei tallenna kantaan itse, vaan avoin tilaus.html tallentaa): `kpt_add_to_order` (REPLACE_PIIPPU, piippusivu → tilaus), `kpt_piippu_muokkaa` (tilaus → piippusivu: groupId, orderId, groupName, vals, materiaali, osat), `kpt_piippu_tallennettu` (tilaus kuittaa tallennuksen → Avaa Tuotannossa -nappi), `openOrderId` + `kpt_avaa_piippu` (Tuotannon Muokkaa → tilaus korostaa ryhmän piipun). Ryhmät tunnistetaan kannassa nimellä (`group_name`), joten tilaus pitää nimet yksilöllisinä (`uniikkiRyhmanNimi`).
- Kun yhteistä tiedostoa muutetaan: **aja `node testit/aja_kaikki.js` ennen pushia** ja nosta `?v=`-numeroa kaikilla sivuilla, jotka lataavat tiedoston.

## Säännöt

- **Käyttäjälle näkyvä teksti aina suomeksi** (esim. DRAFT → "Luonnos"). Tietokanta on englanniksi.
- **Valikko on vain tiedostossa `orders/nav.js`.** Uusi sivu lisätään valikkoon yhdellä rivillä `VALIKKO`-listaan. Sivulla on vain `<div class="nav-dropdown" id="navDropdown">` (varalinkki Etusivulle) ja heti sen perässä `<script src="nav.js?v=N"></script>`. Kun muutat nav.js:ää, nosta `?v=`-numeroa kaikilla sivuilla, jotta selaimet hakevat uuden version. Valikon ulkoasu (`.nav-item` ym.) tulee sivujen omista tyyleistä, jotka eroavat toisistaan, joten testaa valikon muutos **kuvakaappauksin kaikilla sivuilla**, ei vain toiminnallisesti (17.11.: kategorianappi näkyi tilaukset.html:ssä valkoisena laatikkona).
- **Logo:** ruudulla `<img src="logo-valkoinen.png">` (malli: `claude/ohje_code_logon_vaihto.md`), paperitulosteissa `logo-musta.png` (sama kuva mustana). Älä koskaan upota logoa SVG:nä.
- **Tulosteet:** mustavalkoiset, logo + päiväys. Mallit: tilaus.html:n `#tuloste` ja työkortit yhteisellä pohjalla `tyokortti.js` (`#tkk`, rakennetaan ennen tulostusta / `beforeprint`-tapahtumassa, `@media print` näyttää vain sen). Työkortin QR-koodi avaa `tuotanto.html?tilaus=<id>`.
- **Kirjautuminen:** jokaisella suojatulla sivulla `supabase-js` + `auth-guard.js`. Lataa data mieluiten `window._authReady.then(...)`. Älä poista auth-guard.js:n `await window._authReady` -riviä (korjaa tyhjän sivun, kun kirjautuminen vanhenee).
- **Oikea tietoturva on RLS:ssä**, ei auth-guardissa. Uusi taulu: RLS päälle ja säännöt vain `authenticated`-roolille.
- **Muutokset suoraan `main`-haaraan** (Tomi 20.11.2026: Claude julkaisee itse, ettei Tomin tarvitse käydä GitHubissa). Ennen pushia testit ja selaintarkistukset (alla), ja pushin jälkeen Tomille selkokielinen kuvaus siitä, mitä muuttui ja mitä hänen kannattaa testata. Jos jokin menee rikki, korjaa tai peru (`git revert`) heti.
- **Kysy Tomilta ennen** muutoksia, joita ei saa helposti peruttua: tietokannan rakenne, RLS-säännöt, tietojen poisto tai massamuutos. Pull request vain, jos Tomi haluaa katsoa muutoksen ennen julkaisua.
- Tarkista ennen pushia: inline-skriptit `node --check`, ja muuttuneet sivut selaimessa (Playwright, Supabase mockattuna) myös 360 px leveydellä.
- Commitin tekijäksi Tomin GitHub-tunnus `Eltsu2013` (sama nimi ja sähköposti kuin repon aiemmissa commiteissa).
- Tomi ei ole koodari: selitä muutokset selkokielellä ja perustele valinnat. Väitä vastaan, jos olet eri mieltä.
