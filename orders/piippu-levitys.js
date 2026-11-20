// Kalajoen Peltityö ERP — lapepiipun hupun levityskuvat ja kiila (orders/piippu-levitys.js)
//
// Jokaisesta hupun palasta levityskuva ulkopuolelta katsottuna: paneeli, pystysaumat, alatupla ja yläreunan taitos
// taitosviivoineen, kulmien loveukset, taitostaulukko kanttauslukuineen ja merkintäpisteet. Huppu lasketaan 3D:nä,
// joten myös vino (kiila) ja mutkainen piippu toimivat: jokainen hupun seinä on tasainen levy, joka avataan tasoon.
// Käyttäjät: piippu.html ja piippu_tuotanto.html.
//
// Vaatii: geom.js, pellit.js ja piippu-laskenta.js, tässä järjestyksessä, ennen tätä tiedostoa.
// Nodessa: const L = require('../orders/piippu-levitys.js');   (lataa muut itse)
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kummallakin piippusivulla ja aja testit.
//
// Päätökset (Tomi 20.11.2026, mockupit piippu/hupun-levitys-mockup.html ja piippu/kiila-mockup.html):
//  - Pystysauma 20 mm taitetaan ulos naapuriseinän tasoon. 40 mm sauma = 20 mm suoraan jatkoksi (nurkassa ei taitosta)
//    + 20 mm tupla 180°, joka kiertää naapurin sauman. Jaetun kappaleen liitoksessa aiempi pala saa 20, myöhempi 40.
//  - Saumojen päät leikataan suoraan, 90° sivureunasta. Alatupla 180° sisään. Yläreuna: Ulos (oletus) / Sisään / Tupla.
//  - Tuplien päät viistetään 45° koko leveydeltä. Kulman loveus: sauman leveys × taitoksen leveys.
//  - Kiila / mutkapiippu: mitat yläpäästä. Yläpään muoto neljästä sivusta ja valitusta suorasta kulmasta (ei ristimittaa),
//    korkeus jokaisessa kulmassa, kiila joka sivulle (mm katon kohdalla, miinus = kapenee alaspäin), mitattuna sivun
//    korkeimmasta kulmasta. Kiilapiipun hupun palat listaan todellisen aihion kokoisina (ylöspäin), kansi ja hattu
//    leveimmän ja pisimmän kohdan mukaan, juuret pisimmän sivun mukaan (muotoillaan ja mitataan erikseen).
//
// Versiot: v1 levityskuvat (vaihe 3), v2 3D-malli, kiila ja mutkapiippu (vaihe 4). Suoralla piipulla v2 antaa
// täsmälleen samat palat kuin v1 (testit/piippu/test_levitys.js).
(function () {
  const req = typeof require === 'function' ? require : null;
  const G = globalThis.KPT_GEOM || (req ? req('./geom.js') : null);
  const PL = globalThis.KPT_PELLIT || (req ? req('./pellit.js') : null);
  const PI = globalThis.KPT_PIIPPU || (req ? req('./piippu-laskenta.js') : null);
  if (!G || !PL || !PI) throw new Error('piippu-levitys.js tarvitsee geom.js:n, pellit.js:n ja piippu-laskenta.js:n: lataa ne ensin');
  const { vsub, vadd, vscale, vdot, vcross, vnorm, kulmaAsteina } = G;

  const mm = v => String(Math.round(v));
  const aste = a => (Math.abs(a - Math.round(a)) < 0.05 ? String(Math.round(a)) : (Math.round(a * 10) / 10).toFixed(1).replace('.', ',')) + '°';   // 90° tasan, muuten 1 desimaali
  const ylos = v => Math.ceil(v - 1e-6);                  // aihio ylöspäin täyteen milliin (kuten v1 ja laskeLapepiippu)
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const luku = x => { const n = parseFloat(x); return isNaN(n) ? null : n; };
  const YLA_TYYPIT = { ulos: 'Ulos 90°', sisaan: 'Sisään 90°', tupla: 'Tupla 180°' };
  const SEINAT = ['etu', 'oikea', 'taka', 'vasen'];

  // Kulmasaumat ulkopuolelta katsottuna: 't90' = 20 mm ulos naapurin tasoon, 'k40' = 20 suoraan + 20 tupla (Tomin luonnokset 20.11.)
  const SAUMAT = {
    1: { etu: ['t90', 't90'], sivut: ['k40', 't90'], taka: ['k40', 'k40'] },   // sivu: ensin etupää, sitten takapää
    2: { etu: ['t90', 't90'], sivut: ['k40', 'k40'], taka: ['t90', 't90'] },
  };

  // 2D-apurit
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const unit = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
  const normaali = (p, q) => { const u = unit(sub(q, p)); return [u[1], -u[0]]; };      // ulospäin, kun monikulmio kiertää vastapäivään
  const leikkaus = (p, d, q, e) => { const den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-12) return p.slice(); const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den; return add(p, mul(d, t)); };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const siisti = poly => poly.filter((q, i) => { const r = poly[(i + 1) % poly.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-9; });

  // ---------- Kiilan tiedot tilausrivin syötöistä ----------
  // Tallennetaan profile_data.vals:iin: kiilaPaalla, takaLeveys, oikeaPituus, suoraKulma (0 etuvasen, 1 etuoikea, 2 takaoikea,
  // 3 takavasen), korkeusEV/EO/TO/TV, kiilaVasen/Oikea/Etu/Taka. Puuttuva tai tyhjä = kuten suorassa piipussa.
  function kiilaTiedot(vals) {
    const v = vals || {};
    const lev = Number(v.leveys) || 0, suo = Number(v.suora) || 0, he = Number(v.etukork) || 0, ht = Number(v.takakork) || 0;
    const on = !!v.kiilaPaalla;
    const tai = (x, oletus) => { const n = on ? luku(x) : null; return n === null ? oletus : n; };
    return {
      paalla: on,
      muoto: { etu: lev, vasen: suo, taka: tai(v.takaLeveys, lev), oikea: tai(v.oikeaPituus, suo), suora: on && [0, 1, 2, 3].includes(Number(v.suoraKulma)) ? Number(v.suoraKulma) : 0 },
      korkeudet: [tai(v.korkeusEV, he), tai(v.korkeusEO, he), tai(v.korkeusTO, ht), tai(v.korkeusTV, ht)],
      kiila: { vasen: tai(v.kiilaVasen, 0), oikea: tai(v.kiilaOikea, 0), etu: tai(v.kiilaEtu, 0), taka: tai(v.kiilaTaka, 0) },
    };
  }

  // ---------- Piipun ja hupun 3D-malli ----------
  // Tasokoordinaatit: x vasemmalta oikealle (edestä katsottuna), y edestä taakse, z ylös; piipun yläpää z = 0.
  // Kulmat: 0 = etuvasen, 1 = etuoikea, 2 = takaoikea, 3 = takavasen. Seinät: etu 0→1, oikea 1→2, taka 2→3, vasen 3→0.

  // Yläpään nelikulmio neljästä sivusta ja yhdestä suorasta kulmasta. Palauttaa null, jos mitat eivät sovi yhteen.
  function ylapaa(m) {
    const ympyrat = (P, r1, Q, r2, puoli) => {
      const d = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
      if (d < 1e-9 || d > r1 + r2 + 1e-6 || d < Math.abs(r1 - r2) - 1e-6) return null;
      const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
      const ux = (Q[0] - P[0]) / d, uy = (Q[1] - P[1]) / d, M = [P[0] + a * ux, P[1] + a * uy];
      return [M[0] - puoli * h * uy, M[1] + puoli * h * ux];
    };
    if (![m.etu, m.oikea, m.taka, m.vasen].every(x => x > 0)) return null;
    const C = [null, null, null, null];
    if (m.suora === 0) { C[0] = [0, 0]; C[1] = [m.etu, 0]; C[3] = [0, m.vasen]; C[2] = ympyrat(C[1], m.oikea, C[3], m.taka, -1); }
    if (m.suora === 1) { C[1] = [0, 0]; C[0] = [-m.etu, 0]; C[2] = [0, m.oikea]; C[3] = ympyrat(C[0], m.vasen, C[2], m.taka, 1); }
    if (m.suora === 2) { C[2] = [0, 0]; C[3] = [-m.taka, 0]; C[1] = [0, -m.oikea]; C[0] = ympyrat(C[3], m.vasen, C[1], m.etu, -1); }
    if (m.suora === 3) { C[3] = [0, 0]; C[2] = [m.taka, 0]; C[0] = [0, -m.vasen]; C[1] = ympyrat(C[0], m.etu, C[2], m.oikea, -1); }
    if (C.some(c => !c)) return null;
    const ala = C.reduce((s, p, i) => { const q = C[(i + 1) % 4]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
    if (ala <= 0) return null;
    // etureuna x-akselille, sen keskikohta origoon
    const kulma = Math.atan2(C[1][1] - C[0][1], C[1][0] - C[0][0]), c = Math.cos(-kulma), s = Math.sin(-kulma);
    const O = [(C[0][0] + C[1][0]) / 2, (C[0][1] + C[1][1]) / 2];
    return C.map(p => { const x = p[0] - O[0], y = p[1] - O[1]; return [x * c - y * s, x * s + y * c]; });
  }

  // Kolmen tason leikkauspiste. Rivit [a, b, c, d]: a·x + b·y + c·z = d
  function ratkaise3(r) {
    const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const A = r.map(x => x.slice(0, 3)), D = det(A);
    return [0, 1, 2].map(k => det(A.map((row, i) => row.map((v, j) => j === k ? r[i][3] : v))) / D);
  }

  function hupunMalli(vals) {
    const v = vals || {}, k = kiilaTiedot(v);
    const C = ylapaa(k.muoto);
    if (!C) return null;
    const H = k.korkeudet, h2 = (Number(v.huplis) || 0) / 2, zt = -(Number(v.vahennys) || 0);
    // Seinätaso: ulospäin osoittava vaakanormaali n ja kiila (mm katon kohdalla, + ulompana) seinän korkeimmasta kulmasta
    const seina = (j, lisa) => {
      const p = C[j], q = C[(j + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const n = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l], Hhi = Math.max(H[j], H[(j + 1) % 4]) || 1;
      const kal = (k.kiila[SEINAT[j]] || 0) / Hhi;
      return [n[0], n[1], kal, n[0] * p[0] + n[1] * p[1] + lisa];      // n·xy + kal·z = n·p + lisa
    };
    const piippuSeinat = [0, 1, 2, 3].map(j => seina(j, 0)), huppuSeinat = [0, 1, 2, 3].map(j => seina(j, h2));
    const seinatKulmassa = i => [(i + 3) % 4, i];
    const ala = [0, 1, 2, 3].map(i => { const [a, b] = seinatKulmassa(i); return ratkaise3([piippuSeinat[a], piippuSeinat[b], [0, 0, 1, -H[i]]]); });
    // Katto: pienimmän neliösumman taso piipun neljän alakulman kautta (tavallisella piipulla tarkka)
    const ka = a => a.reduce((s, x) => s + x, 0) / a.length;
    const mx = ka(ala.map(p => p[0])), my = ka(ala.map(p => p[1])), mz = ka(ala.map(p => p[2]));
    let Sxx = 0, Sxy = 0, Syy = 0, Sxz = 0, Syz = 0;
    ala.forEach(p => { const dx = p[0] - mx, dy = p[1] - my, dz = p[2] - mz; Sxx += dx * dx; Sxy += dx * dy; Syy += dy * dy; Sxz += dx * dz; Syz += dy * dz; });
    const den = Sxx * Syy - Sxy * Sxy || 1, r1 = (Sxz * Syy - Syz * Sxy) / den, r2 = (Syz * Sxx - Sxz * Sxy) / den;
    const katto = [-r1, -r2, 1, mz - r1 * mx - r2 * my];
    const B = [0, 1, 2, 3].map(i => { const [a, b] = seinatKulmassa(i); return ratkaise3([huppuSeinat[a], huppuSeinat[b], katto]); });
    const T = [0, 1, 2, 3].map(i => { const [a, b] = seinatKulmassa(i); return ratkaise3([huppuSeinat[a], huppuSeinat[b], [0, 0, 1, zt]]); });
    if (B.concat(T).some(p => p.some(x => !isFinite(x)))) return null;
    const keski = B.concat(T).reduce((a, p) => vadd(a, vscale(p, 1 / 8)), [0, 0, 0]);
    const tahko = (nimi, A, Bc, Cc, Dc) => {
      const cen = [A, Bc, Cc, Dc].reduce((a, p) => vadd(a, vscale(p, 0.25)), [0, 0, 0]);
      let n = vnorm(vcross(vsub(Bc, A), vsub(Dc, A)));
      if (vdot(n, vsub(cen, keski)) < 0) n = vscale(n, -1);
      return { nimi, A, Bc, Cc, Dc, cen, n };
    };
    const tahkot = { etu: tahko('etu', B[0], B[1], T[1], T[0]), oikea: tahko('oikea', B[1], B[2], T[2], T[1]),
                     taka: tahko('taka', B[2], B[3], T[3], T[2]), vasen: tahko('vasen', B[3], B[0], T[0], T[3]) };
    const pit = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    return { kiila: k, C, ala, B, T, tahkot,
      alaSivut: { etu: pit(ala[0], ala[1]), oikea: pit(ala[1], ala[2]), taka: pit(ala[2], ala[3]), vasen: pit(ala[3], ala[0]) },
      W0: (Number(v.leveys) || 0) + 2 * h2, D0: (Number(v.suora) || 0) + 2 * h2 };
  }

  // Tason sisällä oleva yksikkövektori, kohtisuorassa reunaa e vastaan, kohti tahkon keskustaa
  function sisaan(F, e, M) { let u = vnorm(vcross(F.n, e)); if (vdot(u, vsub(F.cen, M)) < 0) u = vscale(u, -1); return u; }
  // Nurkkasauman taitoksen kanttausluku: taitos kääntyy naapuriseinän tasoon, poispäin naapurin rungosta
  function nurkkaKulma(F, N, P1, P2) {
    const e = vnorm(vsub(P2, P1)), M = vscale(vadd(P1, P2), 0.5);
    return kulmaAsteina(vscale(sisaan(F, e, M), -1), vscale(sisaan(N, e, M), -1));
  }
  // Yläreunan taitoksen kanttausluku (vaakasuoraan ulos tai sisään)
  function ylaKulma(F, suunta) {
    const e = vnorm(vsub(F.Cc, F.Dc)), M = vscale(vadd(F.Cc, F.Dc), 0.5);
    let hz = vnorm(vcross(e, [0, 0, 1])); if (vdot(hz, F.n) < 0) hz = vscale(hz, -1);
    return kulmaAsteina(vscale(sisaan(F, e, M), -1), suunta === 'sisaan' ? vscale(hz, -1) : hz);
  }

  // ---------- Hupun palat ----------
  // Palauttaa { palat, malli, symmetrinen } tai null, jos yläpään mitat eivät sovi yhteen.
  function hupunPalat(vals) {
    const v = vals || {};
    const m = hupunMalli(v);
    if (!m) return null;
    const lista = PI.laskeLapepiippu(v, { juuret: false, huppu: true, kansi: false, hattu: false }).muut;
    const t = m.tahkot, s = Number(v.sauma) || 0, st = v.saumatyyppi === 2 ? 2 : 1;
    const yla = YLA_TYYPIT[v.ylaTyyppi] ? v.ylaTyyppi : 'ulos';
    const naapuri = { etu: ['vasen', 'oikea'], oikea: ['etu', 'taka'], taka: ['oikea', 'vasen'], vasen: ['taka', 'etu'] };
    const tee = (osa, tahkoNimi, alku, kplKerroin, nimiLisa) => {
      const F = t[tahkoNimi], tulos = [];
      const rivit = lista.filter(p => p.osa === alku || p.osa.startsWith(alku + ' '));
      const n = rivit.length;
      // Palat sijoitetaan tahkolle listan leveyksien suhteessa (suoralla piipulla täsmälleen kuten ennen): listan lisät
      // (huppu takaa leveämpi, pyöristys) jatkavat palaa tahkon tasossa, ja eri levyinen tahko skaalautuu suhteessa.
      const vertailu = osa === 'sivut' ? m.D0 : m.W0;
      const peili = tahkoNimi === 'vasen';                              // vasemmalla sivulla etupää on oikealla
      let x0 = 0;
      rivit.forEach((rivi, k) => {
        const [ulkoEtu, ulkoTaka] = SAUMAT[st][osa];
        let vasen, oikea, t0, t1;
        if (!peili) {
          vasen = k === 0 ? { tyyppi: ulkoEtu, nurkka: true } : { tyyppi: 'k40', nurkka: false };
          oikea = k === n - 1 ? { tyyppi: ulkoTaka, nurkka: true } : { tyyppi: 't90', nurkka: false };
        } else {
          oikea = k === 0 ? { tyyppi: ulkoEtu, nurkka: true } : { tyyppi: 'k40', nurkka: false };
          vasen = k === n - 1 ? { tyyppi: ulkoTaka, nurkka: true } : { tyyppi: 't90', nurkka: false };
        }
        [vasen, oikea].forEach(e => { e.w = e.tyyppi === 'k40' ? 2 * s : s; });
        const P = rivi.lev - vasen.w - oikea.w;
        if (!peili) { t0 = x0 / vertailu; t1 = (x0 + P) / vertailu; } else { t1 = 1 - x0 / vertailu; t0 = 1 - (x0 + P) / vertailu; }
        x0 += P;
        const [nV, nO] = naapuri[tahkoNimi];
        vasen.kulma = vasen.nurkka ? nurkkaKulma(F, t[nV], F.A, F.Dc) : 90;
        oikea.kulma = oikea.nurkka ? nurkkaKulma(F, t[nO], F.Bc, F.Cc) : 90;
        tulos.push({ nimi: rivi.osa + (nimiLisa || ''), kpl: rivi.kpl * kplKerroin, osa, tahko: tahkoNimi, vasen, oikea, s, kiila: m.kiila.paalla,
          q3: [lerp3(F.A, F.Bc, t0), lerp3(F.A, F.Bc, t1), lerp3(F.Dc, F.Cc, t1), lerp3(F.Dc, F.Cc, t0)],
          yla, ylaW: Number(v.ylareunaV) || 0, ala: Number(v.alatupla) || 0, ylaKulma: yla === 'tupla' ? 180 : ylaKulma(F, yla),
          listaLev: rivi.lev, listaPit: rivi.pit });
      });
      return tulos;
    };
    const etu = tee('etu', 'etu', 'Huppu etu', 1);
    const oikeat = tee('sivut', 'oikea', 'Huppu sivut', 0.5, ' oikea');
    const vasemmat = tee('sivut', 'vasen', 'Huppu sivut', 0.5, ' vasen');
    // Ovatko sivut toistensa peilikuvia? Verrataan levitettyjä ääriviivoja (vasen peilattuna) ja kanttauslukuja.
    const muoto = (pa, peili) => PL.aihioPisteet(levitaPala(pa).p, peili).pisteet;
    const symmetrinen = oikeat.every((o, k) => {
      const a = muoto(o, false), b = muoto(vasemmat[k], true), vk = vasemmat[k];
      return a.length === b.length && a.every((q, i) => Math.hypot(q.x - b[i].x, q.y - b[i].y) < 0.5)
        && Math.abs(o.vasen.kulma - vk.oikea.kulma) < 0.05 && Math.abs(o.oikea.kulma - vk.vasen.kulma) < 0.05 && Math.abs(o.ylaKulma - vk.ylaKulma) < 0.05;
    });
    const sivut = symmetrinen
      ? oikeat.map(o => Object.assign({}, o, { nimi: o.nimi.replace(/ oikea$/, ''), kpl: o.kpl * 2, peili: true }))
      : oikeat.concat(vasemmat);
    const taka = tee('taka', 'taka', 'Huppu taka', 1);
    return { palat: etu.concat(sivut, taka), malli: m, symmetrinen };
  }

  // ---------- Levitys tasoon ----------
  // Palauttaa { p, viivat, lovet, mitat }. p on pellit.js:n muotoinen (A2..D2 + flanges), joten aihioPisteet ja
  // merkintaSvgSisalto toimivat sellaisinaan. Yläreuna on vaakasuorassa, sen vasen pää origossa, paneeli alapuolella.
  function levitaPala(pa) {
    const f = PL.flattenSide(pa.q3[0], pa.q3[1], pa.q3[2], pa.q3[3]);
    const ang = Math.atan2(f.C2[1] - f.D2[1], f.C2[0] - f.D2[0]), c = Math.cos(-ang), si = Math.sin(-ang);
    const rot = q => { const x = q[0] - f.D2[0], y = q[1] - f.D2[1]; return [x * c - y * si, x * si + y * c]; };
    const A2 = rot(f.A2), B2 = rot(f.B2), C2 = rot(f.C2), D2 = rot(f.D2);
    const flanges = [], viivat = [], lovet = [];
    const kaista = (p, q, w, viisteP, viisteQ) => {      // kaista reunan p→q ulkopuolelle, päät kohtisuorat tai 45° viisteellä
      const n = normaali(p, q), u = unit(sub(q, p));
      return siisti([p, q, add(add(q, mul(n, w)), mul(u, viisteQ ? -w : 0)), add(add(p, mul(n, w)), mul(u, viisteP ? w : 0))]);
    };
    const sauma = (p, q, e, puoli) => {                                 // p→q kiertää paneelia vastapäivään
      flanges.push({ poly: kaista(p, q, e.w, false, false) });          // päät suoraan 90° sivureunasta
      const n = normaali(p, q);
      if (puoli === 'oikea') { const t = p; p = q; q = t; }             // viivat ylhäältä alas (kuten v1)
      if (e.tyyppi === 't90') viivat.push({ p, q, suunta: 'ulos', teksti: mm(pa.s) + ' · ' + aste(e.kulma) + ' ulos', puoli });
      else {
        viivat.push({ p, q, suunta: 'ei', teksti: 'nurkka', puoli });
        viivat.push({ p: add(p, mul(n, pa.s)), q: add(q, mul(n, pa.s)), suunta: 'ulos', teksti: mm(pa.s) + ' · 180° tupla', puoli, tupla: true });
      }
    };
    sauma(D2, A2, pa.vasen, 'vasen');
    sauma(B2, C2, pa.oikea, 'oikea');
    if (pa.ala > 0) {
      flanges.push({ poly: kaista(A2, B2, pa.ala, true, true) });
      viivat.push({ p: A2, q: B2, suunta: 'sisaan', teksti: mm(pa.ala) + ' · 180° tupla sisään' });
    }
    const viisteYla = puoli => pa.yla === 'tupla' || (pa.yla === 'sisaan' && pa[puoli].nurkka);
    if (pa.ylaW > 0) {
      flanges.push({ poly: kaista(C2, D2, pa.ylaW, viisteYla('oikea'), viisteYla('vasen')) });
      viivat.push({ p: D2, q: C2, suunta: pa.yla === 'ulos' ? 'ulos' : 'sisaan', teksti: mm(pa.ylaW) + ' · ' + aste(pa.ylaKulma) + ' ' + ({ ulos: 'ulos', sisaan: 'sisään', tupla: 'tupla sisään' }[pa.yla]) });
    }
    // Loveus nurkassa: sauman ja ylä-/alakaistan väliin jäävä alue (+ viisteen kolmio)
    const lovi = (K, sp, sq, ew, rp, rq, rw, viiste) => {
      if (!(ew > 0 && rw > 0)) return;
      const ns = normaali(sp, sq), us = unit(sub(sq, sp)), nr = normaali(rp, rq), ur = unit(sub(rq, rp));
      const Ks = add(K, mul(ns, ew)), Kr = add(K, mul(nr, rw)), X = leikkaus(Ks, us, Kr, ur);
      const kauempi = Math.hypot(rp[0] - K[0], rp[1] - K[1]) < Math.hypot(rq[0] - K[0], rq[1] - K[1]) ? rq : rp;
      lovet.push(siisti([K, Ks, X, Kr].concat(viiste ? [add(Kr, mul(unit(sub(kauempi, K)), rw))] : [])));
    };
    lovi(A2, D2, A2, pa.vasen.w, A2, B2, pa.ala, true);
    lovi(B2, B2, C2, pa.oikea.w, A2, B2, pa.ala, true);
    lovi(C2, B2, C2, pa.oikea.w, C2, D2, pa.ylaW, viisteYla('oikea'));
    lovi(D2, D2, A2, pa.vasen.w, C2, D2, pa.ylaW, viisteYla('vasen'));
    let pts = [A2, B2, C2, D2];
    flanges.forEach(fl => { pts = pts.concat(fl.poly); });
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
    const tuplaViivat = viivat.filter(x => x.tupla).map(x => ({ p: x.p, q: x.q }));
    const p = { A2, B2, C2, D2, minX, minY, w: Math.max.apply(null, xs) - minX, h: Math.max.apply(null, ys) - minY,
      flanges: flanges.map(fl => ({ poly: fl.poly, foldLines: [] })).concat(tuplaViivat.length ? [{ poly: [], foldLines: tuplaViivat }] : []) };
    const pit = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    return { p, viivat, lovet, mitat: { ala: pit(A2, B2), yla: pit(D2, C2), vasen: pit(D2, A2), oikea: pit(B2, C2) } };
  }

  // ---------- Piirto ----------
  // Levityskuva SVG. ikkuna = { nimi, minX, minY, w, h } piirtää lähikuvan (90 × 90 mm) ilman mittoja.
  // Ulkoasu kuten v1:ssä; suoralla piipulla kuva on täsmälleen sama.
  let svgNro = 0;
  const xKorkeudella = (v, y) => Math.abs(v.q[1] - v.p[1]) < 1e-9 ? v.p[0] : v.p[0] + (v.q[0] - v.p[0]) * (y - v.p[1]) / (v.q[1] - v.p[1]);
  const vaaka0 = v => Math.abs(v.p[1]) < 1e-6 && Math.abs(v.q[1]) < 1e-6;
  function piirraPala(pa, lv, ikkuna) {
    const id = 'plv' + (++svgNro);
    const p = lv.p, W = ikkuna ? 300 : 640, M = ikkuna ? 6 : 46;
    const k = ikkuna || { minX: p.minX, minY: p.minY, w: p.w, h: p.h };
    const H = ikkuna ? 300 : Math.round(Math.min(640, Math.max(380, (W - 2 * M) * k.h / k.w + 2 * M)));
    const sc = Math.min((W - 2 * M) / k.w, (H - 2 * M) / k.h);
    const ox = (W - k.w * sc) / 2, oy = (H - k.h * sc) / 2;
    const X = x => ox + (x - k.minX) * sc, Y = y => oy + (k.minY + k.h - y) * sc;
    const pt = q => X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1);
    const F = 'IBM Plex Mono, monospace';
    let c = '<defs><pattern id="' + id + 'r" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="#ef4444" stroke-width="0.7"/></pattern>'
      + (ikkuna ? '<clipPath id="' + id + 'c"><rect width="' + W + '" height="' + H + '"/></clipPath>' : '') + '</defs><g' + (ikkuna ? ' clip-path="url(#' + id + 'c)"' : '') + '>';
    if (!ikkuna) c += '<rect x="' + X(p.minX) + '" y="' + Y(p.minY + p.h) + '" width="' + p.w * sc + '" height="' + p.h * sc + '" fill="none" stroke="#3a5468" stroke-dasharray="2,3"/>';
    lv.lovet.forEach(l => { c += '<polygon points="' + l.map(pt).join(' ') + '" fill="url(#' + id + 'r)" stroke="#ef4444" stroke-width="0.6"/>'; });
    p.flanges.forEach(f => { if (f.poly.length) c += '<polygon points="' + f.poly.map(pt).join(' ') + '" fill="rgba(245,185,66,.14)" stroke="#f5b942" stroke-width="1"/>'; });
    c += '<polygon points="' + [p.A2, p.B2, p.C2, p.D2].map(pt).join(' ') + '" fill="rgba(34,197,94,.06)" stroke="#22c55e" stroke-width="1.6"/>';
    lv.viivat.forEach(v => {
      const da = v.suunta === 'ulos' ? '4,3' : v.suunta === 'sisaan' ? '7,2,1.5,2' : '1,3';
      c += '<line x1="' + X(v.p[0]) + '" y1="' + Y(v.p[1]) + '" x2="' + X(v.q[0]) + '" y2="' + Y(v.q[1]) + '" stroke="' + (v.suunta === 'ei' ? '#6b8fa8' : '#f5b942') + '" stroke-width="1.1" stroke-dasharray="' + da + '"/>';
    });
    if (ikkuna) {
      lv.viivat.forEach(v => {
        if (v.suunta === 'ei') return;
        const t = v.teksti.split(' · ')[1] || '';
        if (v.puoli) {
          const yy = Math.max(Math.min(v.p[1], v.q[1]), k.minY) + k.h * 0.55, tx = X(xKorkeudella(v, yy)) + (v.puoli === 'vasen' ? -4 : 4);
          c += '<text x="' + tx + '" y="' + Y(yy) + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle" transform="rotate(-90 ' + tx + ' ' + Y(yy) + ')">' + esc(t) + '</text>';
        } else {
          const xx = Math.max(Math.min(v.p[0], v.q[0]), k.minX) + k.w * 0.62;
          const yv = v.p[1] + (v.q[1] - v.p[1]) * (xx - v.p[0]) / ((v.q[0] - v.p[0]) || 1);
          c += '<text x="' + X(xx) + '" y="' + (Y(yv) + (vaaka0(v) ? -5 : 13)) + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle">' + esc(t) + '</text>';
        }
      });
      c += '<text x="8" y="16" font-size="11" font-weight="600" font-family="' + F + '" fill="#e2eef5">' + esc(ikkuna.nimi) + '</text>';
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + c + '</g></svg>';
    }
    const m = lv.mitat, A = p.A2, B = p.B2, C = p.C2, D = p.D2;
    const yt = Y(0) - pa.ylaW * sc - 8;
    c += '<text x="' + (X(D[0]) + X(C[0])) / 2 + '" y="' + (Y(0) + 14) + '" font-size="11" font-family="' + F + '" fill="#e2eef5" text-anchor="middle">paneeli ' + mm(m.yla) + '</text>';
    if (pa.kiila && Math.abs(m.ala - m.yla) > 0.5) {                          // kiilapiipussa myös alareunan pituus
      c += '<text x="' + (X(A[0]) + X(B[0])) / 2 + '" y="' + ((Y(A[1]) + Y(B[1])) / 2 - 6) + '" font-size="11" font-family="' + F + '" fill="#e2eef5" text-anchor="middle">alhaalla ' + mm(m.ala) + '</text>';
    }
    const korkeus = (P1, P2, h, anchor, dx) => '<text x="' + (X((P1[0] + P2[0]) / 2) + dx) + '" y="' + (Y((P1[1] + P2[1]) / 2) + 4) + '" font-size="11" font-family="' + F + '" fill="#e2eef5" text-anchor="' + anchor + '">' + mm(h) + '</text>';
    c += korkeus(D, A, m.vasen, 'start', 5) + korkeus(C, B, m.oikea, 'end', -5);
    lv.viivat.forEach(v => {
      if (v.suunta === 'ei') return;
      const mx = (X(v.p[0]) + X(v.q[0])) / 2, my = (Y(v.p[1]) + Y(v.q[1])) / 2;
      if (v.puoli) {
        const tx = v.puoli === 'vasen' ? X(p.minX) - 10 : X(p.minX + p.w) + 14;
        c += '<text x="' + tx + '" y="' + my + '" font-size="9.5" font-family="' + F + '" fill="#f5b942" text-anchor="middle" transform="rotate(-90 ' + tx + ' ' + my + ')">' + esc(v.teksti) + '</text>';
      } else {
        const yy = vaaka0(v) ? yt : my + 22;
        c += '<text x="' + mx + '" y="' + yy + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle">' + esc(v.teksti) + '</text>';
      }
    });
    c += '<text x="' + X(p.minX + p.w / 2) + '" y="' + (Y(p.minY) + 30) + '" font-size="11" font-family="' + F + '" fill="#6b8fa8" text-anchor="middle">aihio ' + ylos(p.w) + ' × ' + ylos(p.h) + ' mm</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + c + '</g></svg>';
  }

  // Taitostaulukon rivit: [reuna, mitta, kanttausluku, taitto, huomio]
  function taitosRivit(pa) {
    const sauma = (puoli, e) => e.tyyppi === 't90'
      ? [puoli + ' reuna', mm(pa.s), aste(e.kulma), 'ulos', e.nurkka ? 'nurkkasauma' : 'jakosauma (aiempi pala)']
      : [puoli + ' reuna', mm(pa.s) + ' + ' + mm(pa.s), '0° + 180°', 'tupla', (e.nurkka ? 'kiertää naapurin sauman' : 'jakosauma (myöhempi pala), kiertää') + ' · yht. ' + mm(2 * pa.s)];
    const rivit = [sauma('Vasen', pa.vasen), sauma('Oikea', pa.oikea)];
    if (pa.ala > 0) rivit.push(['Alareuna', mm(pa.ala), '180°', 'sisään', 'alatupla' + (pa.osa === 'sivut' ? ', katon kaltevuudessa' : '') + ', päät viistetty 45°']);
    if (pa.ylaW > 0) rivit.push(['Yläreuna', mm(pa.ylaW), aste(pa.ylaKulma), pa.yla === 'ulos' ? 'ulos' : 'sisään',
      pa.yla === 'sisaan' ? 'päät 45° (nurkissa)' : pa.yla === 'tupla' ? 'tupla, päät viistetty 45°' : '']);
    return rivit;
  }

  // Sivun tyylit (lisätään kerran, kun ensimmäinen pala piirretään)
  const CSS = '.plv-pala{border:1px solid #1e3a4a;border-radius:6px;margin:0 0 10px;background:#111827}'
    + '.plv-pala>summary{cursor:pointer;padding:10px 12px;display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;list-style:none}'
    + '.plv-pala>summary::-webkit-details-marker{display:none}.plv-pala>summary::before{content:"▸";color:#22c55e;width:10px}.plv-pala[open]>summary::before{content:"▾"}'
    + '.plv-nimi{font-weight:600;font-size:14px}.plv-meta{font-family:"IBM Plex Mono",monospace;font-size:12px;color:#6b8fa8}'
    + '.plv-sisus{padding:0 12px 12px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}@media(max-width:900px){.plv-sisus{grid-template-columns:minmax(0,1fr)}}'
    + '.plv-sisus svg{width:100%;height:auto;display:block;background:#1a2332;border-radius:6px}'
    + '.plv-taulu{border-collapse:collapse;font:12px "IBM Plex Mono",monospace;margin-top:8px;width:100%;table-layout:fixed}'
    + '.plv-taulu th,.plv-taulu td{border:1px solid #1e3a4a;padding:3px 6px;text-align:left;overflow-wrap:anywhere;vertical-align:top}.plv-taulu th{color:#6b8fa8}'
    + '.plv-taulu th:nth-child(1){width:21%}.plv-taulu th:nth-child(2){width:15%}.plv-taulu th:nth-child(3){width:17%}.plv-taulu th:nth-child(4){width:14%}'
    + '@media(max-width:520px){.plv-taulu{font-size:10.5px}.plv-taulu th,.plv-taulu td{padding:2px 3px}.plv-sisus{padding:0 6px 10px}}'
    + '.plv-lisa>summary{cursor:pointer;color:#6b8fa8;font-size:12px;margin:4px 0}.plv-kulmat{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:6px}'
    + '.plv-pala .pt-wrap{display:flex;gap:10px;flex-wrap:wrap}.plv-pala .pt-table{border-collapse:collapse;font:12px "IBM Plex Mono",monospace;margin-top:6px}.plv-pala .pt-table th,.plv-pala .pt-table td{border:1px solid #1e3a4a;padding:2px 8px;text-align:right}'
    + '.plv-selite{font-size:11px;color:#6b8fa8;line-height:1.5;margin:6px 0 10px}';
  function lisaaTyylit() {
    if (typeof document === 'undefined' || document.getElementById('plv-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'plv-tyylit';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // Yhden palan HTML: avattava kortti (oletuksena kiinni), sisällä kuva, taitostaulukko, lähikuvat ja merkintäpisteet napin takana.
  function palaHtml(pa, opts) {
    const o = opts || {};
    lisaaTyylit();
    const lv = levitaPala(pa), m = lv.mitat;
    const aw = ylos(lv.p.w), ah = ylos(lv.p.h);
    const lahi = (nimi, x0, y0) => piirraPala(pa, lv, { nimi, minX: x0, minY: y0, w: 90, h: 90 });
    const A = lv.p.A2, D = lv.p.D2, B = lv.p.B2, C = lv.p.C2;
    const symm = pa.vasen.tyyppi === pa.oikea.tyyppi && pa.vasen.nurkka === pa.oikea.nurkka && Math.abs(m.vasen - m.oikea) < 0.01
      && Math.abs(pa.vasen.kulma - pa.oikea.kulma) < 0.05 && Math.abs(m.ala - m.yla) < 0.01;
    let kulmat = lahi('vasen alakulma', A[0] - pa.vasen.w - 15, A[1] - pa.ala - 25) + lahi('vasen yläkulma', D[0] - pa.vasen.w - 15, D[1] - 60);
    if (!symm) kulmat += lahi('oikea alakulma', B[0] - 75 + pa.oikea.w, B[1] - pa.ala - 25) + lahi('oikea yläkulma', C[0] - 75 + pa.oikea.w, C[1] - 60);
    const pisteita = PL.aihioPisteet(lv.p).pisteet.length;
    const taulu = '<table class="plv-taulu"><tr><th>Reuna</th><th>Mitta</th><th>Kanttaus</th><th>Taitto</th><th>Huom.</th></tr>'
      + taitosRivit(pa).map(r => '<tr>' + r.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</table>';
    const korkeus = mm(m.vasen) + (Math.abs(m.vasen - m.oikea) > 0.5 ? ' → ' + mm(m.oikea) : '');
    return '<details class="plv-pala"' + (o.auki ? ' open' : '') + '><summary><span class="plv-nimi">' + esc(pa.nimi) + ' · ' + (o.kpl || pa.kpl) + ' kpl</span>'
      + '<span class="plv-meta">aihio ' + aw + ' × ' + ah + '</span><span class="plv-meta">korkeus ' + korkeus + '</span>'
      + (pa.peili ? '<span class="plv-meta">toinen sivu peilikuva</span>' : '') + '</summary>'
      + '<div class="plv-sisus"><div>' + piirraPala(pa, lv) + taulu + '</div><div>'
      + '<details class="plv-lisa"><summary>Kulmien lähikuvat' + (symm ? ' (oikeat kulmat ovat peilikuvat)' : '') + '</summary><div class="plv-kulmat">' + kulmat + '</div></details>'
      + '<details class="plv-lisa"><summary>Merkintäpisteet (' + pisteita + ' pistettä, aihion vasemmasta alakulmasta)</summary>'
      + '<svg viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg">' + PL.merkintaSvgSisalto(lv.p, 520, 380, PL.TEEMA_RUUTU, false, null) + '</svg>'
      + PL.pisteTaulu(lv.p, 'pt-table', false) + '</details></div></div></details>';
  }

  // Selite kuvan väreille ja viivoille (HTML)
  const SELITE = '<div class="plv-selite"><span style="color:#22c55e">■</span> paneeli (näkyvä pinta, todellinen korkeus) · <span style="color:#f5b942">■</span> taitos / sauma · '
    + '<span style="color:#f5b942">- - -</span> taitto ulos · <span style="color:#f5b942">-·-·</span> taitto sisään · <span style="color:#6b8fa8">····</span> nurkka, ei taitosta · '
    + '<span style="color:#ef4444">////</span> loveus, leikataan pois ennen taittoa. Kuvat ulkopuolelta katsottuina.</div>';

  // Onko kiilapiippu käytännössä suora (kaikki lisämitat samat kuin suorassa)? Silloin lista kuten ennenkin.
  function onSuora(v, k) {
    const m = k.muoto, he = Number(v.etukork) || 0, ht = Number(v.takakork) || 0;
    return m.taka === m.etu && m.oikea === m.vasen && m.suora === 0 && k.korkeudet[0] === he && k.korkeudet[1] === he
      && k.korkeudet[2] === ht && k.korkeudet[3] === ht && SEINAT.every(n => !k.kiila[n]);
  }

  // ---------- Peltilista kiilan kanssa ----------
  // Sama kuin KPT_PIIPPU.laskeLapepiippu, mutta kiilapiipussa (vals.kiilaPaalla) hupun palat tulevat 3D-mallista todellisen
  // aihion kokoisina (ylöspäin), kansi ja hattu leveimmän ja pisimmän kohdan mukaan ja juuret pisimmän sivun mukaan.
  // Suorassa piipussa palauttaa laskeLapepiippu-tuloksen sellaisenaan. Palauttaa lisäksi { kiila, virhe, malli }.
  function laskeKaikki(vals, osat) {
    const v = vals || {}, o = osat || {};
    const perus = PI.laskeLapepiippu(v, o);
    const k = kiilaTiedot(v);
    if (!k.paalla || onSuora(v, k)) return Object.assign(perus, { kiila: false });
    const t = hupunPalat(v);
    if (!t) return Object.assign(perus, { kiila: true, virhe: 'Yläpään mitat eivät sovi yhteen: tarkista sivujen pituudet ja suoran kulman valinta.' });
    const as = t.malli.alaSivut, km = k.muoto;
    const juuret = o.juuret === false ? [] : PI.laskeLapepiippu(Object.assign({}, v, { leveys: Math.max(as.etu, as.taka), suora: Math.max(as.vasen, as.oikea) }),
      { juuret: true, huppu: o.huppu !== false, kansi: false, hattu: false }).juuret;   // huppu vaikuttaa juuren mittoihin (q9)
    const huppu = o.huppu === false ? [] : t.palat.map(pa => { const lv = levitaPala(pa); return { osa: pa.nimi, lev: ylos(lv.p.w), pit: ylos(lv.p.h), kpl: pa.kpl }; });
    const kh = PI.laskeLapepiippu(Object.assign({}, v, { leveys: Math.max(km.etu, km.taka), suora: Math.max(km.vasen, km.oikea) }),
      { juuret: false, huppu: o.huppu !== false, kansi: o.kansi !== false, hattu: o.hattu !== false }).muut.filter(r => !/^Huppu/.test(r.osa));
    return { juuret, muut: huppu.concat(kh), geom: perus.geom, kiila: true, malli: t.malli, symmetrinen: t.symmetrinen };
  }

  // ---------- Kuva ylhäältä (kiilan syöttöön) ----------
  // Yläpää vihreällä, katon kohta katkoviivalla, sivujen pituudet ja kiilat, kulmissa korkeudet, suora kulma merkittynä.
  function kuvaYlhaalta(vals) {
    const m = hupunMalli(vals);
    if (!m) return '';
    const k = m.kiila;
    const kaikki = m.C.concat(m.ala.map(p => [p[0], p[1]]));
    const xs = kaikki.map(p => p[0]), ys = kaikki.map(p => p[1]);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const W = 320, Hk = 236, H = Hk + 30, MX = 96, MY = 34;          // Hk = piirtoalue, alle kaksi seliteriviä
    const sc = Math.min((W - 2 * MX) / (maxX - minX || 1), (Hk - 2 * MY) / (maxY - minY || 1));
    const X = x => W / 2 + (x - (minX + maxX) / 2) * sc, Y = y => Hk / 2 - (y - (minY + maxY) / 2) * sc;   // etu alhaalla
    const P = p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1);
    const F = 'IBM Plex Mono, monospace';
    let c = '<polygon points="' + m.ala.map(P).join(' ') + '" fill="none" stroke="#6b8fa8" stroke-dasharray="3,3"/>'
      + '<polygon points="' + m.C.map(P).join(' ') + '" fill="rgba(34,197,94,.10)" stroke="#22c55e" stroke-width="1.6"/>';
    const keski = m.C.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
    const pituus = { etu: k.muoto.etu, oikea: k.muoto.oikea, taka: k.muoto.taka, vasen: k.muoto.vasen };
    SEINAT.forEach((n, j) => {
      const p = m.C[j], q = m.C[(j + 1) % 4], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const ux = mx - keski[0], uy = my - keski[1], l = Math.hypot(ux, uy) || 1;
      const kk = k.kiila[n] ? ' (' + (k.kiila[n] > 0 ? '+' : '') + mm(k.kiila[n]) + ')' : '';
      const sivuttain = Math.abs(ux) > Math.abs(uy), anc = sivuttain ? (ux < 0 ? 'end' : 'start') : 'middle';
      const tx = X(mx) + (sivuttain ? (ux < 0 ? -8 : 8) : 0), ty = Y(my) + (sivuttain ? 4 : (uy < 0 ? 16 : -8));
      c += '<text x="' + tx + '" y="' + ty + '" font-size="10.5" font-family="' + F + '" fill="#e2eef5" text-anchor="' + anc + '">' + n + ' ' + mm(pituus[n]) + kk + '</text>';
    });
    const Kc = m.C[k.muoto.suora], A = m.C[(k.muoto.suora + 1) % 4], B = m.C[(k.muoto.suora + 3) % 4], r = 14 / sc;
    const ua = unit(sub(A, Kc)), ub = unit(sub(B, Kc));
    c += '<polyline points="' + [add(Kc, mul(ua, r)), add(add(Kc, mul(ua, r)), mul(ub, r)), add(Kc, mul(ub, r))].map(P).join(' ') + '" fill="none" stroke="#f5b942" stroke-width="1.4"/>';
    m.C.forEach((p, i) => {
      const ux = p[0] - keski[0], uy = p[1] - keski[1], l = Math.hypot(ux, uy) || 1;
      c += '<text x="' + (X(p[0]) + (ux < 0 ? -6 : 6)) + '" y="' + (Y(p[1]) + (uy < 0 ? 14 : -6)) + '" font-size="9.5" font-family="' + F + '" fill="#f5b942" text-anchor="' + (ux < 0 ? 'end' : 'start') + '">' + mm(k.korkeudet[i]) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:#1a2332;border-radius:6px">' + c
      + '<text x="6" y="' + (H - 18) + '" font-size="9" font-family="' + F + '" fill="#6b8fa8">ylhäältä, etu alhaalla · kulmissa korkeudet</text>'
      + '<text x="6" y="' + (H - 7) + '" font-size="9" font-family="' + F + '" fill="#6b8fa8">⌐ = suora kulma · katkoviiva = katon kohta</text></svg>';
  }

  const KPT_PIIPPU_LEVITYS = { YLA_TYYPIT, SAUMAT, kiilaTiedot, ylapaa, hupunMalli, hupunPalat, levitaPala, piirraPala, taitosRivit,
    palaHtml, SELITE, CSS, laskeKaikki, kuvaYlhaalta };
  globalThis.KPT_PIIPPU_LEVITYS = KPT_PIIPPU_LEVITYS;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PIIPPU_LEVITYS;
})();
