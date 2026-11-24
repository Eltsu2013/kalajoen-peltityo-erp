// Kalajoen Peltityö ERP — kaistat ja rullan menekki (orders/menekki.js)
//
// Kappaleet (aihion ääriviiva) leikataan rullasta kaistoiksi: kaistan leveys = aihion korkeus, pituus = kappaleet peräkkäin.
// Ohuella pellillä saman ryhmän kappaleet lomitetaan (joka toinen käännetty 180°), ja ne erottuvat yhdellä suoralla
// giljotiiniviillolla. Kaistat jaetaan riveihin rullan leveydelle, ja lopuksi lasketaan rullan menekki ja jäännöspalat.
// Mukana myös kaistakuva (SVG), leikkaustaulukko ja menekin yhteenveto, joita sivut ja työkortit käyttävät.
//
// Kappale = { nimi, kpl, w, h, ring: [[x, y], ...] (aihion ääriviiva, vasen alakulma 0,0), nimet (valinnainen, palojen nimet),
//   ringPeili (valinnainen: peilikuvapari, joka toinen pala peilattuna samalla kaistalla, ei lomitusta) }.
// Pelti-osista (pellit.js) kappaleet saa KPT_MENEKKI.pellitKappaleiksi(panels):lla.
//
// Käyttö sivulla:   <script src="geom.js?v=1"></script> ja sitten <script src="menekki.js?v=1"></script>
// Käyttö Nodessa:   require('../orders/geom.js'); const M = require('../orders/menekki.js');
// Vaatii geom.js:n (kupera kuori, kuorten erotus, leikkaus puolitasolla, mm-muotoilu).
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kaikilla sivuilla, jotka lataavat sen.
//
// v2 (24.11.2026, ulkoasuremontti R1): sivukortti käyttää uuden ulkoasun värejä (--kpt-*) ja vaaleassa ulkoasussa paperiteemaa.
// Vaihe 8.3 (24.11.2026): siirretty Huuvasta (orders/huuva.html, v16) sellaisenaan. Ainoa muutos: laskeKaistat ottaa
// kappaleet, joilla on valmis ääriviiva (ring), eikä laske sitä itse pellit.js:n aihioPisteet-funktiolla. Huuva tekee
// muunnoksen itse. Testit: testit/huuva/test_kaista.js (node testit/aja_kaikki.js).
(function () {
  const { kuperaKuori, kuoriErotus, leikkaaPuolitasolla, fmtMm, fmtM2, esc } = globalThis.KPT_GEOM;

  // Huuvan palat leikataan ensin rullasta kaistoiksi: kaistan leveys = aihion korkeus, pituus = aihioita peräkkäin.
  // Ohuella pellillä (<= 0,8 mm) saman ryhmän kappaleet lomitetaan: joka toinen kappale käännetään 180°, jolloin
  // vinot sivut menevät vastakkain. Sääntö (Tomi 21.10.): kappaleiden täytyy erottua YHDELLÄ suoralla giljotiiniviillolla
  // kaistan läpi (alareunasta yläreunaan, viilto saa olla viisto); muuten kappaleet saavat koskettaa toisiaan.
  const KAISTA_RAKO = 0;                // mm: kappaleiden väliin jätettävä rako (Tomi: ei tarvita)
  const KAISTA_LOMITUS_MAX_PAKS = 0.8;  // mm: tätä ohuemmalla (tai yhtä ohuella) ehdotetaan lomitusta
  const RULLA_LEVEYS_OLETUS = 1250;     // mm
  const KAISTA_MAX_PITUUS = 5000;       // mm: kaistan oletusenimmäispituus (Tomi 21.10.); leveällä kaistalla kannattaa käyttää pienempää

  // Lomituksen pienin siirto s (mm): toinen kappale = ensimmäinen kierrettynä 180° ja siirrettynä s oikealle.
  // Palauttaa { s, X, Y, c } tai null jos lomituksesta ei ole hyötyä.
  function lomitusSiirto(ring, w, h, rako) {
    const A = kuperaKuori(ring);
    const R = kuperaKuori(ring.map(q => [w - q[0], h - q[1]]));
    const erota = s => kuoriErotus(A, R.map(q => [q[0] + s, q[1]]));
    const ok = s => erota(s).gap >= rako - 1e-9;
    const N = 400;
    let lo = 0, hi = null;
    for (let k = 0; k <= N; k++) {
      const s = 2 * w * k / N;
      if (ok(s)) { hi = s; break; }
      lo = s;
    }
    if (hi === null) return null;
    for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; }
    hi += 0.01;   // pieni vara: suora on silloin yksikäsitteinen (keskipisteen kautta), ketjun viillot osuvat samoille paikoille
    const e = erota(hi);
    if (Math.abs(e.X) < 1e-6 || hi >= w - 0.5) return null;    // vaakasuora viilto tai ei säästöä
    return { s: hi, X: e.X, Y: e.Y, c: e.c };
  }

  // Jakaa kaistat riveihin rullan leveydelle (rivillä kaistat vierekkäin, rivit peräkkäin rullan suunnassa).
  // Tavoite: rullan kokonaispituus (rivien pituuksien summa) mahdollisimman pieni. Alle 9 kaistalla kokeillaan kaikki jaot.
  function jaaRiveihin(kaistat, rulla) {
    const n = kaistat.length;
    const kust = rivit => rivit.reduce((s, r) => s + Math.max.apply(null, r.map(i => kaistat[i].pituus)), 0);
    if (n <= 8) {
      let paras = null, parasK = Infinity;
      const rec = (i, rivit, leveydet) => {
        if (i === n) { const k = kust(rivit); if (k < parasK - 1e-9) { parasK = k; paras = rivit.map(r => r.slice()); } return; }
        for (let r = 0; r < rivit.length; r++) {
          if (leveydet[r] + kaistat[i].h <= rulla + 1e-9) {
            rivit[r].push(i); leveydet[r] += kaistat[i].h;
            rec(i + 1, rivit, leveydet);
            rivit[r].pop(); leveydet[r] -= kaistat[i].h;
          }
        }
        rivit.push([i]); leveydet.push(kaistat[i].h);
        rec(i + 1, rivit, leveydet);
        rivit.pop(); leveydet.pop();
      };
      rec(0, [], []);
      return paras;
    }
    const jarj = kaistat.map((k, i) => i).sort((a, b) => kaistat[b].pituus - kaistat[a].pituus);
    const rivit = [], lev = [];
    jarj.forEach(i => {
      let r = lev.findIndex(l => l + kaistat[i].h <= rulla + 1e-9);
      if (r < 0) { rivit.push([]); lev.push(0); r = rivit.length - 1; }
      rivit[r].push(i); lev[r] += kaistat[i].h;
    });
    return rivit;
  }

  // Valitsee asettelun paksuuden ja käyttäjän valinnan mukaan: 'lomitus' | 'suora'
  function kaistaTila(paksuus, valinta) {
    if (valinta === 'lomitus' || valinta === 'suora') return valinta;
    return (paksuus > 0 && paksuus <= KAISTA_LOMITUS_MAX_PAKS + 1e-9) ? 'lomitus' : 'suora';
  }

  // Kaistan päiden leikkaus: suora, joka sivuaa päätykappaleen kuperaa kuorta ja irrottaa päädyn jätekolmion.
  // ring = päätykappaleen ääriviiva kaistan koordinaateissa, h = kaistan leveys, L = kaistan pituus, puoli = 'alku' (vasen pää) | 'loppu' (oikea pää).
  // Valitaan kuoren pisin vino reuna ko. puolelta. Suora kulkee kaistan läpi kahden reunan välillä: alareuna / yläreuna / päätyreuna.
  // Palauttaa { ala, yla, paatyKorkeus, p1, p2 }: ala = x alareunassa, yla = x yläreunassa (null jos suora ei osu siihen reunaan),
  // paatyKorkeus = korkeus alareunasta päätyreunassa (null jos suora ei osu päätyreunaan), p1/p2 = suoran päät kaistan koordinaateissa.
  function paaLeikkaus(ring, h, L, puoli) {
    const K = kuperaKuori(ring);
    let paras = null, parasL = 0;
    for (let i = 0; i < K.length; i++) {
      const a = K[i], b = K[(i + 1) % K.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      if (l < 1e-9 || Math.abs(dy) / l < 0.3) continue;           // vain vinot / pystyt reunat, ei vaakareunoja
      if ((puoli === 'alku') !== (dy < 0)) continue;              // vastapäivään kierrettäessä vasen ketju kulkee alaspäin
      if (l > parasL) { parasL = l; paras = [a, b]; }
    }
    if (!paras) return null;
    const a = paras[0], b = paras[1], kx = (b[0] - a[0]) / (b[1] - a[1]);
    const xAt = y => a[0] + (y - a[1]) * kx;
    const yAt = x => Math.abs(kx) < 1e-12 ? null : a[1] + (x - a[0]) / kx;
    const T = 0.5, pisteet = [];
    const xb = xAt(0), xt = xAt(h);
    let res = { ala: null, yla: null, paatyKorkeus: null, p1: null, p2: null };
    if (xb >= -T && xb <= L + T) { res.ala = Math.min(L, Math.max(0, xb)); pisteet.push([res.ala, 0]); }
    if (xt >= -T && xt <= L + T) { res.yla = Math.min(L, Math.max(0, xt)); pisteet.push([res.yla, h]); }
    [0, L].forEach(ex => {
      const y = yAt(ex);
      if (y !== null && y > T && y < h - T && pisteet.length < 2) { res.paatyKorkeus = y; pisteet.push([ex, y]); }
    });
    if (pisteet.length < 2) return null;
    res.p1 = pisteet[0]; res.p2 = pisteet[1];
    return res;
  }

  // Kaistan pituus, kun siinä on m kappaletta (lomitettuna siirrot vuorotellen sAB, sBA; suorana aihion leveys)
  function kaistanPituus(m, w, kTila, sAB, sBA) {
    let x = 0;
    for (let i = 0; i < m - 1; i++) x += kTila === 'lomitus' ? (i % 2 === 0 ? sAB : sBA) : w;
    return x + w;
  }

  // Montako kappaletta (enintään n) mahtuu yhdelle kaistalle, kun kaistan enimmäispituus on maxPit. Vähintään 1.
  function kaistaKapasiteetti(n, w, kTila, sAB, sBA, maxPit) {
    if (!(maxPit > 0)) return n;
    let m = 1;
    while (m < n && kaistanPituus(m + 1, w, kTila, sAB, sBA) <= maxPit + 1e-9) m++;
    return m;
  }

  // Jakaa n kappaletta kaistoihin: käyttäjän valinta (kpl per kaista, enintään kapasiteetti) tai tasainen jako.
  // Esim. 10 kappaletta, kapasiteetti 7: tasaisesti [5, 5]; valinta 4: [4, 4, 2].
  function jaaKaistoihin(n, cap, valittu) {
    const koko = valittu > 0 ? Math.min(Math.max(1, Math.floor(valittu)), cap) : 0;
    const sizes = [];
    if (koko) {
      for (let left = n; left > 0; left -= koko) sizes.push(Math.min(koko, left));
    } else {
      const S = Math.ceil(n / cap), base = Math.floor(n / S), extra = n % S;
      for (let i = 0; i < S; i++) sizes.push(base + (i < extra ? 1 : 0));
    }
    return sizes;
  }

  // Pelti-osat (pellit.js, esim. ryhmitteleSamat(...)-tulos tai piipun hupun palan levitys) kappaleiksi: ääriviiva aihioPisteet-funktiolla.
  // aihio = valinnainen oma funktio (Huuva antaa omansa, jotta testit voivat vaihtaa sen).
  function pellitKappaleiksi(panels, aihio) {
    const ap = aihio || globalThis.KPT_PELLIT.aihioPisteet;
    return panels.map(p => ({ nimi: p.name, nimet: p.names, kpl: p.kpl, w: p.w, h: p.h, ring: ap(p).pisteet.map(q => [q.x, q.y]) }));
  }

  // Laskee kaistat ja rullan menekin. kappaleet = [{ nimi, kpl, w, h, ring, nimet }] (ks. tiedoston alku).
  // opts: { tila, rulla, maxPit (kaistan enimmäispituus mm, oletus 5000, 0 = ei rajaa), kplKaistalle: { ryhmän nimi: kpl per kaista } }
  // Palauttaa { tila, rulla, maxPit, ryhmat:[{nimi, kpl, kapasiteetti, valinta, kaistoja}], kaistat:[...], rivit:[...], pituus, kaistaAla, kulutusAla, hukkaAla, jaannokset:[...], varoitukset:[...] }
  function laskeKaistat(panels, opts) {
    opts = opts || {};
    const rulla = opts.rulla > 0 ? opts.rulla : RULLA_LEVEYS_OLETUS;
    const tila = opts.tila === 'lomitus' ? 'lomitus' : 'suora';
    const maxPit = opts.maxPit === undefined ? KAISTA_MAX_PITUUS : opts.maxPit;
    const valinnat = opts.kplKaistalle || {};
    const varoitukset = [];
    const kaistat = [], ryhmat = [];
    panels.forEach(p => {
      const ring = p.ring;
      // Peilikuvapari (vaihe 8.3): ringPeili = peilattu ääriviiva. Joka toinen pala on peilikuva, eikä ryhmää lomiteta.
      const peiliRing = p.ringPeili && p.ringPeili.length >= 3 ? p.ringPeili : null;
      const n = p.kpl;
      // Lomitus: pari "A vasemmalla, käännetty B oikealla" (siirto sAB) ja ketjussa pari "B vasemmalla, A oikealla" (siirto sBA).
      // Ne ovat samat vain jos kappale on peilisymmetrinen (esim. tasakylkinen puolisuunnikas), siksi lasketaan erikseen.
      let sAB = p.w, sBA = p.w, kTila = 'suora', vAB = null, vBA = null;
      if (tila === 'lomitus' && n >= 2 && ring.length >= 3 && !peiliRing) {
        const a = lomitusSiirto(ring, p.w, p.h, KAISTA_RAKO);
        const b = a && (n > 2 ? lomitusSiirto(ring.map(q => [p.w - q[0], p.h - q[1]]), p.w, p.h, KAISTA_RAKO) : a);
        if (a && b) { kTila = 'lomitus'; sAB = a.s; sBA = b.s; vAB = a; vBA = b; }
      }
      const cap = kaistaKapasiteetti(n, p.w, kTila, sAB, sBA, maxPit);
      const valittu = valinnat[p.nimi] > 0 ? Math.min(Math.floor(valinnat[p.nimi]), cap) : 0;
      const koot = jaaKaistoihin(n, cap, valittu);
      ryhmat.push({ nimi: p.nimi, kpl: n, kapasiteetti: cap, valinta: valittu, kaistoja: koot.length, koot });
      let alku = 0;
      koot.forEach((m, osa) => {
        const palat = [], leikkaukset = [];
        let x = 0;
        for (let i = 0; i < m; i++) {
          const kierto = kTila === 'lomitus' && i % 2 === 1;
          const peiliPala = !!peiliRing && (alku + i) % 2 === 1;
          const nimi = p.nimet && p.nimet.length ? p.nimet[(alku + i) % p.nimet.length] : (peiliPala ? p.nimi + ' (peilikuva)' : p.nimi);
          const rr = peiliPala ? peiliRing : ring;
          palat.push({
            nimi,
            kierto,
            dx: x,
            peili: peiliPala,
            ring: rr.map(q => kierto ? [p.w - q[0] + x, p.h - q[1]] : [q[0] + x, q[1]])
          });
          if (i < m - 1) {
            if (kTila === 'lomitus') {
              const v = i % 2 === 0 ? vAB : vBA;
              leikkaukset.push({ ala: v.c / v.X + x, yla: (v.c - v.Y * p.h) / v.X + x });
              x += v.s;
            } else {
              x += p.w;
              leikkaukset.push({ ala: x, yla: x });
            }
          }
        }
        alku += m;
        // yhden kappaleen kaista ei lomitu, vaikka ryhmä muuten lomittuisi
        const kaistaTilaK = m >= 2 ? kTila : 'suora';
        // Päiden leikkaukset (vain lomitetulla kaistalla): alkupää ja loppupää sivuavat päätykappaleita, jolloin päätyjen jätekolmiot irtoavat
        const paat = kaistaTilaK === 'lomitus'
          ? { alku: paaLeikkaus(palat[0].ring, p.h, x + p.w, 'alku'), loppu: paaLeikkaus(palat[m - 1].ring, p.h, x + p.w, 'loppu') }
          : { alku: null, loppu: null };
        kaistat.push({ nimi: p.nimi, kpl: m, w: p.w, h: p.h, tila: kaistaTilaK, siirto: sAB, pituus: x + p.w, suoraPituus: m * p.w, siirto2: sBA,
          osa: osa + 1, osia: koot.length, palat, leikkaukset, paat });
      });
      if (p.h > rulla + 1e-9) varoitukset.push(p.nimi + ': aihion korkeus ' + Math.round(p.h) + ' mm on suurempi kuin rullan leveys ' + Math.round(rulla) + ' mm.');
    });
    kaistat.forEach(k => {
      if (maxPit > 0 && k.pituus > maxPit + 1e-6) varoitukset.push(k.nimi + ': kaista on pidempi kuin enimmäispituus ' + Math.round(maxPit) + ' mm.');
    });
    const rivitIdx = kaistat.length ? jaaRiveihin(kaistat, rulla) : [];
    const rivit = rivitIdx.map(r => ({
      kaistat: r,
      leveys: r.reduce((s, i) => s + kaistat[i].h, 0),
      pituus: Math.max.apply(null, r.map(i => kaistat[i].pituus))
    }));
    const pituus = rivit.reduce((s, r) => s + r.pituus, 0);
    const kaistaAla = kaistat.reduce((s, k) => s + k.pituus * k.h, 0);
    const kulutusAla = rulla * pituus;
    // Käyttökelpoiset jäännökset: kaistan viereen jäävä pala, jos molemmat sivut >= 100 mm
    const jaannokset = [];
    rivit.forEach(r => {
      r.kaistat.forEach(i => {
        const lisaPit = r.pituus - kaistat[i].pituus;
        if (lisaPit >= 100) jaannokset.push({ kaista: kaistat[i].nimi + (kaistat[i].osia > 1 ? ' ' + kaistat[i].osa + '/' + kaistat[i].osia : ''), leveys: kaistat[i].h, pituus: lisaPit });
      });
      const sivuLev = rulla - r.leveys;
      if (sivuLev >= 100) jaannokset.push({ kaista: 'rivin reuna', leveys: sivuLev, pituus: r.pituus });
    });
    return { tila, rulla, maxPit, ryhmat, kaistat, rivit, pituus, kaistaAla, kulutusAla, hukkaAla: kulutusAla - kaistaAla, jaannokset, varoitukset };
  }

  // ---------- Kappalesivut kaistalla: pellin muoto leikkauksen jälkeen, asento ja nollakohta ----------

  // Kaistan j. kappaleen pelti leikkauksen jälkeen: kaistan suorakulmio rajattuna edellisellä ja seuraavalla leikkauksella
  // (ensimmäisellä kappaleella Alku, viimeisellä Loppu). Palautetaan kappaleen omassa kehyksessä (aihion vasen alakulma = 0,0):
  // käännetty kappale on käännetty takaisin pystyyn, peilikuvassa x on käännetty aihion leveyden yli.
  function kaistaPalanLevy(k, j, p, peili) {
    const pa = k.palat[j], m = k.palat.length, h = k.h;
    let poly = [[0, 0], [k.pituus, 0], [k.pituus, h], [0, h]];
    const ref = [0, 0];
    pa.ring.forEach(q => { ref[0] += q[0] / pa.ring.length; ref[1] += q[1] / pa.ring.length; });
    const viiva = lk => [[lk.ala, 0], [lk.yla, h]];
    const vas = j === 0 ? (k.paat && k.paat.alku ? [k.paat.alku.p1, k.paat.alku.p2] : null) : viiva(k.leikkaukset[j - 1]);
    const oik = j === m - 1 ? (k.paat && k.paat.loppu ? [k.paat.loppu.p1, k.paat.loppu.p2] : null) : viiva(k.leikkaukset[j]);
    if (vas) poly = leikkaaPuolitasolla(poly, vas[0], vas[1], ref);
    if (oik) poly = leikkaaPuolitasolla(poly, oik[0], oik[1], ref);
    return poly.map(q => {
      let x = q[0] - pa.dx, y = q[1];
      if (pa.kierto) { x = p.w - x; y = p.h - y; }
      if (peili) x = p.w - x;
      return [x, y];
    });
  }

  // Kuinka monta mm pellin alareunan vasen kulma on aihion nollakohdasta vasemmalle (0 = nollakohta on pellin kulma)
  function levynNollakohta(poly) {
    let mn = Infinity;
    poly.forEach(q => { if (q[1] < 0.01 && q[0] < mn) mn = q[0]; });
    return mn === Infinity ? 0 : Math.max(0, -mn);
  }

  // Ryhmän (p) palat kaistoilla: yksi rivi per pala { kaista, pala, kpl, kierto, offset, levy }
  function palaAsennot(kr, p, peili) {
    const rivit = [];
    if (!kr) return rivit;
    kr.kaistat.forEach((k, si) => {
      if (k.nimi !== (p.nimi !== undefined ? p.nimi : p.name)) return;   // pelti-osa (name) tai kappale (nimi)
      k.palat.forEach((pa, j) => {
        const levy = kaistaPalanLevy(k, j, p, peili);
        rivit.push({ kaista: si + 1, pala: j + 1, kpl: k.palat.length, kierto: pa.kierto, offset: levynNollakohta(levy), levy });
      });
    });
    return rivit;
  }

  // Piirrettäväksi: keskimmäinen pala jos sellainen on (kaksi vinoa sivua), muuten ensimmäinen
  function edustavaLevy(rivit) {
    const r = rivit.find(x => x.pala > 1 && x.pala < x.kpl) || rivit[0];
    return r ? { poly: r.levy, teksti: 'ohut viiva: pellin muoto leikattuna (pala ' + r.pala + '/' + r.kpl + ')' } : null;
  }

  // Taulukko: missä asennossa pala on pellillä ja missä nollakohta on. Samanlaiset palat samalla rivillä.
  function asentoTaulu(rivit, luokka) {
    if (!rivit.length) return '';
    const ryh = [];
    rivit.forEach(r => {
      const avain = r.kaista + '|' + r.kierto + '|' + Math.round(r.offset);
      let g = ryh.find(x => x.avain === avain);
      if (!g) { g = { avain, r, palat: [] }; ryh.push(g); }
      g.palat.push(r.pala);
    });
    const rs = ryh.map(g => {
      const r = g.r, o = Math.round(r.offset);
      return '<tr><td>' + r.kaista + '</td><td>' + g.palat.join(', ') + ' / ' + r.kpl + '</td><td>' + (r.kierto ? '<b>käännä 180°</b>' : 'suoraan') + '</td><td>'
        + (o < 1 ? 'pellin vasen alakulma' : 'pellin alareunalla <b>' + o + ' mm</b> vasemmasta kulmasta oikealle') + '</td></tr>';
    });
    return '<table class="' + luokka + '"><tr><th>Kaista</th><th>Pala</th><th>Asento</th><th>Nollakohta (x 0, y 0)</th></tr>' + rs.join('') + '</table>';
  }

  // Kaistakuva: kaista, kappaleet ja giljotiiniviillot mittoineen. Kaistan vasen pää = x 0.
  // Pitkillä kaistoilla tekstit harvennetaan (kappaleista vain numero, viiltojen mitat vain jos mahtuvat); kaikki mitat ovat taulukossa.
  function kaistaSvgSisalto(k, W, Hh, T) {
    const M = 34, MY = 36;
    const sc = Math.min((W - 2 * M) / k.pituus, (Hh - 2 * MY) / k.h);
    const ox = (W - k.pituus * sc) / 2, oy = (Hh - k.h * sc) / 2;
    const X = x => ox + x * sc, Y = y => oy + (k.h - y) * sc;
    const FONT = 'IBM Plex Mono, monospace';
    const kork = T.leikkaus || T.paneeli;
    let c = '';
    c += '<rect x="' + X(0) + '" y="' + Y(k.h) + '" width="' + (k.pituus * sc) + '" height="' + (k.h * sc) + '" fill="none" stroke="' + T.himmea + '" stroke-width="0.8" stroke-dasharray="3,3"/>';
    k.palat.forEach((pa, i) => {
      c += '<polygon points="' + pa.ring.map(q => X(q[0]) + ',' + Y(q[1])).join(' ') + '" fill="' + (pa.kierto ? T.taitosTaus : 'none') + '" stroke="' + T.paneeli + '" stroke-width="1.4"/>';
      const xs = pa.ring.map(q => q[0]), cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      const leveaa = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) * sc > 105;   // mahtuuko koko teksti
      c += '<text x="' + X(cx) + '" y="' + (Y(k.h / 2) + 3) + '" font-size="11" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '" text-anchor="middle" stroke="' + T.halo + '" stroke-width="3" paint-order="stroke">'
        + (i + 1) + (leveaa ? ': ' + esc(pa.nimi) + (pa.kierto ? ' ⟲180°' : '') : (pa.kierto ? '⟲' : '')) + '</text>';
    });
    // päiden leikkaukset (alku / loppu): viiva + mitat; tekstit varataan ensin, jotta tavalliset leikkausten tekstit väistävät
    const varAla = [], varYla = [];
    [['alku', k.paat && k.paat.alku], ['loppu', k.paat && k.paat.loppu]].forEach(pl => {
      const pa = pl[1];
      if (!pa) return;
      c += '<line x1="' + X(pa.p1[0]) + '" y1="' + Y(pa.p1[1]) + '" x2="' + X(pa.p2[0]) + '" y2="' + Y(pa.p2[1]) + '" stroke="' + kork + '" stroke-width="1.8" stroke-dasharray="8,4"/>';
      const txt = (x, y, s, anc) => '<text x="' + x + '" y="' + y + '" font-size="10" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '" text-anchor="' + anc + '">' + s + '</text>';
      if (pa.ala !== null) { c += txt(X(pa.ala), Y(0) + 13, pl[0] + ': ' + Math.round(pa.ala), 'middle'); varAla.push(X(pa.ala)); }
      if (pa.yla !== null) { c += txt(X(pa.yla), Y(k.h) - 5, pl[0] + ': ' + Math.round(pa.yla), 'middle'); varYla.push(X(pa.yla)); }
      if (pa.paatyKorkeus !== null) {
        const ex = pl[0] === 'alku' ? 0 : k.pituus;
        c += txt(pl[0] === 'alku' ? X(ex) - 4 : X(ex) + 4, Y(pa.paatyKorkeus) + 3, '↑' + Math.round(pa.paatyKorkeus), pl[0] === 'alku' ? 'end' : 'start');
      }
    });
    let edAla = -1e9, edYla = -1e9;
    const vapaa = (lista, px) => lista.every(q => Math.abs(q - px) >= 46);
    k.leikkaukset.forEach((lk, i) => {
      c += '<line x1="' + X(lk.ala) + '" y1="' + Y(0) + '" x2="' + X(lk.yla) + '" y2="' + Y(k.h) + '" stroke="' + kork + '" stroke-width="1.8" stroke-dasharray="8,4"/>';
      const lbl = i + 1 + ': ';
      if (X(lk.ala) - edAla >= 46 && vapaa(varAla, X(lk.ala))) { edAla = X(lk.ala); c += '<text x="' + X(lk.ala) + '" y="' + (Y(0) + 13) + '" font-size="10" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '" text-anchor="middle">' + lbl + Math.round(lk.ala) + '</text>'; }
      if (X(lk.yla) - edYla >= 46 && vapaa(varYla, X(lk.yla))) { edYla = X(lk.yla); c += '<text x="' + X(lk.yla) + '" y="' + (Y(k.h) - 5) + '" font-size="10" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '" text-anchor="middle">' + lbl + Math.round(lk.yla) + '</text>'; }
    });
    // mitat: kaistan pituus alareunan alle, leveys vasemmalle
    c += '<text x="' + X(k.pituus) + '" y="' + (Y(0) + 27) + '" font-size="10" font-family="' + FONT + '" fill="' + T.mitta + '" text-anchor="end">kaista ' + Math.ceil(k.pituus - 1e-9) + ' × ' + Math.round(k.h) + ' mm</text>';
    c += '<text x="' + (X(0) - 6) + '" y="' + Y(k.h / 2) + '" font-size="10" font-family="' + FONT + '" fill="' + T.mitta + '" text-anchor="middle" transform="rotate(-90 ' + (X(0) - 6) + ' ' + Y(k.h / 2) + ')">' + Math.round(k.h) + ' mm</text>';
    return c;
  }

  // Leikkaustaulukko (HTML) yhdelle kaistalle: alkupää, tavalliset leikkaukset, loppupää.
  // Päätyleikkaus voi alkaa kaistan päätyreunasta: silloin alareuna-sarakkeessa lukee "päädyssä, N mm alareunasta".
  const PAATY_HUOM = '<b>Alku</b> ja <b>Loppu</b> ovat kaistan päiden leikkaukset, jotka irrottavat päätyjen jätekolmiot. Jos mittana on "päädyssä", leikkaus alkaa kaistan päätyreunasta kyseiseltä korkeudelta (mitataan kaistan alareunasta) ja päättyy toisen reunan mittaan. Kaikki mitat ovat kaistan vasemmasta päästä.';
  // huomLuokka (valinnainen): selitystekstin luokka; oletuksena Huuvan 'hint' (ruutu, pt-table) tai 'tk-note' (työkortti)
  function kaistaLeikkausTaulu(k, luokka, ilmanHuom, huomLuokka) {
    const paat = k.paat || {};
    if (!k.leikkaukset.length && !paat.alku && !paat.loppu) return '';
    const solu = (x, paaty, kork) => x !== null ? fmtMm(x) : (paaty !== null ? 'päädyssä, ' + fmtMm(paaty) + ' mm alareunasta' : '–');
    const paaRivi = (nimi, pa) => pa ? '<tr><td>' + nimi + '</td><td>' + solu(pa.ala, pa.paatyKorkeus) + '</td><td>' + (pa.yla !== null ? fmtMm(pa.yla) : 'päädyssä, ' + fmtMm(pa.paatyKorkeus) + ' mm alareunasta') + '</td></tr>' : '';
    let rivit = paaRivi('Alku', paat.alku);
    rivit += k.leikkaukset.map((lk, i) => '<tr><td>' + (i + 1) + '</td><td>' + fmtMm(lk.ala) + '</td><td>' + fmtMm(lk.yla) + '</td></tr>').join('');
    rivit += paaRivi('Loppu', paat.loppu);
    const huom = ((paat.alku || paat.loppu) && !ilmanHuom)
      ? '<p class="' + (huomLuokka || (luokka === 'pt-table' ? 'hint' : 'tk-note')) + '" style="margin-top:4px">' + PAATY_HUOM + '</p>' : '';
    return '<table class="' + luokka + '"><tr><th>Leikkaus</th><th>alareunassa mm</th><th>yläreunassa mm</th></tr>' + rivit + '</table>' + huom;
  }

  function kaistaOtsikko(k, nro) {
    const tilaTxt = k.tila === 'lomitus' ? 'lomitettuna, suorana ' + fmtMm(k.suoraPituus) + ' mm' : 'suorana';
    return 'Kaista ' + nro + ': ' + k.nimi + (k.osia > 1 ? ' (osa ' + k.osa + '/' + k.osia + ')' : '') + (k.kpl > 1 ? ' · ' + k.kpl + ' kpl' : ' · 1 kpl') + ' · ' + Math.ceil(k.pituus - 1e-9) + ' × ' + fmtMm(k.h) + ' mm (' + tilaTxt + ')';
  }

  // Rullan menekki ja rivien jako (HTML-teksti)
  // huomLuokka, virheLuokka (valinnaiset): tekstien luokat, oletuksena Huuvan
  function kaistaYhteenveto(kr, luokka, huomLuokka, virheLuokka) {
    let h = '<table class="' + luokka + '"><tr><th>Rivi</th><th>Kaistat rullan leveydellä</th><th>Leveys mm</th><th>Pituus mm</th></tr>';
    kr.rivit.forEach((r, i) => {
      h += '<tr><td>' + (i + 1) + '</td><td>' + r.kaistat.map(j => 'kaista ' + (j + 1) + ' (' + esc(kr.kaistat[j].nimi) + ')').join(' + ') + '</td><td>' + fmtMm(r.leveys) + ' / ' + fmtMm(kr.rulla) + '</td><td>' + Math.ceil(r.pituus - 1e-9) + '</td></tr>';
    });
    h += '</table>';
    h += '<p class="' + (huomLuokka || (luokka === 'pt-table' ? 'hint' : 'tk-note')) + '"><b>Rullasta menee ' + Math.ceil(kr.pituus - 1e-9) + ' mm</b> (' + fmtM2(kr.kulutusAla) + ', rullan leveys ' + fmtMm(kr.rulla) + ' mm). Kaistojen pinta-ala ' + fmtM2(kr.kaistaAla) + ', loppu ' + fmtM2(kr.hukkaAla) + ' on hukkaa tai jäännöstä.';
    if (kr.jaannokset.length) h += ' Käyttökelpoiset jäännökset: ' + kr.jaannokset.map(j => fmtMm(j.leveys) + ' × ' + fmtMm(j.pituus) + ' mm (' + esc(j.kaista) + ' vieressä)').join(', ') + '.';
    h += '</p>';
    kr.varoitukset.forEach(v => { h += '<p class="' + (virheLuokka || 'error-msg') + '">' + esc(v) + '</p>'; });
    return h;
  }

  // ---------- Sivun kortti "Kaistat ja menekki" (piippusivut, vaihe 8.3) ----------
  // Asetukset (rullan leveys, asettelu, kaistan enimmäispituus) muistetaan selaimessa kaikille sivuille yhteisesti.
  // Huuvalla on oma vanha korttinsa (asetukset Huuvan kentissä), joka käyttää samoja funktioita.
  const ASETUS_AVAIN = 'kpt_menekki_asetukset';
  const PAKSUUS_OLETUS = 0.6;   // mm, kun paksuutta ei ole valittu (sama kuin Huuvassa)
  const HANKALA_PIT = 4000, HANKALA_LEV = 600;   // mm: tästä alkaen käsittelyvinkki (sama kuin Huuvassa)
  const CSS = `
.kmk-asetukset { display:flex; flex-wrap:wrap; gap:10px 14px; align-items:flex-end; margin-bottom:8px; }
.kmk-asetukset label { display:flex; flex-direction:column; gap:3px; font-size:11px; color:var(--kpt-himmea, var(--text2, #9595a0)); }
.kmk-asetukset input, .kmk-asetukset select { background:var(--kpt-kentta, var(--bg3, #3a3020)); color:var(--kpt-teksti, var(--text1, var(--text, #ededf0))); border:1px solid var(--kpt-reuna2, var(--border, #56442e)); border-radius:4px; padding:4px 6px; font-size:13px; font-family:inherit; }
.kmk-asetukset input { width:80px; }
.kmk-vihje { font-size:12px; color:var(--kpt-himmea, var(--text2, #9595a0)); line-height:1.5; margin:6px 0; }
.kmk-varoitus { font-size:12px; color:var(--kpt-virhe, #f87171); line-height:1.5; margin:6px 0; }
.kmk-kaista { border-top:1px solid var(--kpt-reuna2, var(--border, #56442e)); padding-top:8px; margin-top:8px; }
.kmk-kaista svg { width:100%; height:auto; display:block; max-height:340px; }
.kmk-nimi { font-size:13px; font-weight:600; margin-bottom:4px; }
.kmk-valinta { font-size:12px; color:var(--kpt-himmea, var(--text2, #9595a0)); margin:8px 0 2px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.kmk-valinta select { background:var(--kpt-kentta, var(--bg3, #3a3020)); color:var(--kpt-teksti, var(--text1, var(--text, #ededf0))); border:1px solid var(--kpt-reuna2, var(--border, #56442e)); border-radius:4px; padding:2px 4px; font-size:12px; max-width:100%; }
.kmk-taulu { border-collapse:collapse; font-size:12px; margin:4px 0; }
.kmk-taulu th, .kmk-taulu td { border:1px solid var(--kpt-reuna2, var(--border, #56442e)); padding:3px 7px; text-align:left; }
.kmk-taulu th { color:var(--kpt-himmea, var(--text2, #9595a0)); font-weight:500; }
.kmk-taulu-wrap { overflow-x:auto; }
`;
  function lisaaCss() {
    if (typeof document === 'undefined' || document.getElementById('kmk-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'kmk-tyylit';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const luku = s => { const x = parseFloat(String(s == null ? '' : s).replace(',', '.')); return isFinite(x) ? x : NaN; };
  function lueAsetukset() {
    let a = {};
    try { a = JSON.parse(localStorage.getItem(ASETUS_AVAIN) || '{}') || {}; } catch (e) { a = {}; }
    return { rulla: luku(a.rulla) > 0 ? luku(a.rulla) : RULLA_LEVEYS_OLETUS, asettelu: ['auto', 'lomitus', 'suora'].indexOf(a.asettelu) >= 0 ? a.asettelu : 'auto',
      maxPit: a.maxPit === '' ? '' : (luku(a.maxPit) >= 0 ? luku(a.maxPit) : KAISTA_MAX_PITUUS) };
  }

  // "Kappaletta kaistalle" -valinta yhdelle ryhmälle (vain jos kappaleita on yli yksi)
  function kplValintaHtml(r) {
    if (!r || r.kpl < 2) return '';
    let o = '<option value="0"' + (!r.valinta ? ' selected' : '') + '>tasainen jako (' + jaaKaistoihin(r.kpl, r.kapasiteetti, 0).join(' + ') + ')</option>';
    for (let m = 1; m <= r.kapasiteetti; m++) o += '<option value="' + m + '"' + (r.valinta === m ? ' selected' : '') + '>' + m + ' kpl (' + jaaKaistoihin(r.kpl, r.kapasiteetti, m).join(' + ') + ')</option>';
    return '<div class="kmk-valinta"><span>' + esc(r.nimi) + ': ' + r.kpl + ' kpl, kaistalle mahtuu ' + r.kapasiteetti + '. Kappaletta kaistalle:</span> <select data-kmk-g="' + encodeURIComponent(r.nimi) + '">' + o + '</select></div>';
  }

  // el = kortin sisältöelementti. opts: { kortti (details-elementti, piilotetaan kun ei kappaleita; otsikkoon menekki),
  //   muutos: kr => ... (kutsutaan jokaisen laskennan jälkeen), paksuus: () => pellin paksuus (mm, tyhjä = ei valittu), teema (valinnainen, oletus pellit.js:n TEEMA_RUUTU + punainen viilto) }
  // Palauttaa { piirra(kappaleet), paivita(), tulos() }.
  function sivuKortti(el, opts) {
    lisaaCss();
    const o = opts || {};
    let as = lueAsetukset(), kplValinta = {}, viim = null, kr = null;
    el.innerHTML = '<div class="kmk-asetukset">'
      + '<label>Rullan leveys mm<input type="text" inputmode="decimal" data-kmk="rulla" value="' + as.rulla + '"></label>'
      + '<label>Asettelu<select data-kmk="asettelu"><option value="auto">automaattinen (paksuuden mukaan)</option><option value="lomitus">lomitettu</option><option value="suora">suora</option></select></label>'
      + '<label>Kaistan enimmäispituus mm<input type="text" inputmode="decimal" data-kmk="maxPit" value="' + as.maxPit + '" placeholder="ei rajaa"></label>'
      + '</div><div class="kmk-sisalto"></div>';
    el.querySelector('[data-kmk="asettelu"]').value = as.asettelu;
    const sis = el.querySelector('.kmk-sisalto');
    const tallenna = () => {
      const g = k => el.querySelector('[data-kmk="' + k + '"]').value;
      as = { rulla: luku(g('rulla')) > 0 ? luku(g('rulla')) : RULLA_LEVEYS_OLETUS, asettelu: g('asettelu'), maxPit: g('maxPit').trim() === '' ? '' : (luku(g('maxPit')) >= 0 ? luku(g('maxPit')) : KAISTA_MAX_PITUUS) };
      try { localStorage.setItem(ASETUS_AVAIN, JSON.stringify({ rulla: g('rulla'), asettelu: as.asettelu, maxPit: g('maxPit') })); } catch (e) { /* ei selainmuistia */ }
      piirra(viim);
    };
    el.querySelectorAll('[data-kmk]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', tallenna));
    sis.addEventListener('change', e => {
      const s = e.target.closest('select[data-kmk-g]');
      if (s) { kplValinta[decodeURIComponent(s.dataset.kmkG)] = parseInt(s.value, 10) || 0; piirra(viim); }
    });
    // Kuvan värit: vaaleassa ulkoasussa (teema.js, html[data-teema="vaalea"]) paperiteema, muuten ruudun tumma teema
    const teema = () => {
      if (o.teema) return o.teema;
      const PL = globalThis.KPT_PELLIT || {};
      const vaalea = typeof document !== 'undefined' && document.documentElement.dataset.teema === 'vaalea';
      return Object.assign({}, (vaalea ? PL.TEEMA_PAPERI : PL.TEEMA_RUUTU) || {}, { leikkaus: vaalea ? '#dc2626' : '#ef4444' });
    };
    function piirra(kappaleet) {
      viim = kappaleet; kr = null;
      if (o.kortti) o.kortti.style.display = kappaleet && kappaleet.length ? '' : 'none';
      if (!kappaleet || !kappaleet.length) { sis.innerHTML = ''; return; }
      try {
        const pk = luku(typeof o.paksuus === 'function' ? o.paksuus() : '');
        const paksuus = pk > 0 ? pk : PAKSUUS_OLETUS;
        const tila = kaistaTila(paksuus, as.asettelu);
        kr = laskeKaistat(kappaleet, { tila, rulla: as.rulla, maxPit: as.maxPit === '' ? 0 : as.maxPit, kplKaistalle: kplValinta });
        let h = '<p class="kmk-vihje">Asettelu: <b>' + (kr.tila === 'lomitus' ? 'lomitettu' : 'suora') + '</b>'
          + (as.asettelu === 'auto' ? ' (paksuus ' + (pk > 0 ? String(pk).replace('.', ',') + ' mm' : 'ei valittu, oletus ' + String(PAKSUUS_OLETUS).replace('.', ',') + ' mm')
            + ' → ' + (paksuus <= KAISTA_LOMITUS_MAX_PAKS ? 'ohut, lomitus' : 'paksu, suora') + ')' : ' (valittu käsin)')
          + '. Kaistan leveys = aihion korkeus. Lomitettuna joka toinen pala on käännetty 180° ja palat erottuvat yhdellä suoralla giljotiiniviillolla.'
          + (kappaleet.some(x => x.ringPeili) ? ' Peilikuvaparit (esim. sivut) ovat samalla kaistalla vuorotellen, eikä niitä lomiteta, koska peilikuvaa ei saa kääntämällä.' : '') + '</p>';
        const T = teema();
        kr.kaistat.forEach((k, i) => {
          if (k.osa === 1) h += kplValintaHtml(kr.ryhmat.find(r => r.nimi === k.nimi));
          const vbH = Math.round(Math.min(330, Math.max(110, 520 * k.h / k.pituus + 60)));
          h += '<div class="kmk-kaista"><div class="kmk-nimi">' + esc(kaistaOtsikko(k, i + 1)) + '</div>'
            + (k.pituus >= HANKALA_PIT && k.h >= HANKALA_LEV ? '<p class="kmk-vihje" style="margin:0 0 4px">Pitkä ja leveä kaista on hankala käsitellä. Voit vähentää kappaleita kaistalle tai pienentää enimmäispituutta.</p>' : '')
            + '<svg viewBox="0 0 520 ' + vbH + '" xmlns="http://www.w3.org/2000/svg">' + kaistaSvgSisalto(k, 520, vbH, T) + '</svg>'
            + '<div class="kmk-taulu-wrap">' + kaistaLeikkausTaulu(k, 'kmk-taulu', false, 'kmk-vihje') + '</div></div>';
        });
        h += '<div class="kmk-kaista"><div class="kmk-nimi">Rullan menekki</div><div class="kmk-taulu-wrap">' + kaistaYhteenveto(kr, 'kmk-taulu', 'kmk-vihje', 'kmk-varoitus') + '</div></div>';
        sis.innerHTML = h;
        const ots = o.kortti && o.kortti.querySelector('summary');
        if (ots) ots.textContent = 'Kaistat ja menekki · rullasta ' + Math.ceil(kr.pituus - 1e-9) + ' mm';
        if (typeof o.muutos === 'function') o.muutos(kr);   // sivu voi verrata tulosta (esim. Kartio: peräkkäin leikattuna)
      } catch (e) {
        console.error('Kaistat:', e);
        sis.innerHTML = '<p class="kmk-varoitus">Kaistojen laskenta epäonnistui.</p>';
      }
    }
    return { piirra, paivita: () => piirra(viim), tulos: () => kr };
  }

  const KPT_MENEKKI = {
    KAISTA_RAKO, KAISTA_LOMITUS_MAX_PAKS, RULLA_LEVEYS_OLETUS, KAISTA_MAX_PITUUS, PAATY_HUOM,
    lomitusSiirto, jaaRiveihin, kaistaTila, paaLeikkaus, kaistanPituus, kaistaKapasiteetti, jaaKaistoihin, laskeKaistat,
    pellitKappaleiksi, kaistaPalanLevy, levynNollakohta, palaAsennot, edustavaLevy, asentoTaulu,
    kaistaSvgSisalto, kaistaLeikkausTaulu, kaistaOtsikko, kaistaYhteenveto,
    sivuKortti, kplValintaHtml, CSS,
  };

  globalThis.KPT_MENEKKI = KPT_MENEKKI;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_MENEKKI;
})();
