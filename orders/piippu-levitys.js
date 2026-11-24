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
// täsmälleen samat palat kuin v1 (testit/piippu/test_levitys.js). v3 (20.11. illalla): kiilan lisäkenttä vasen sivu
// (suora = oikea sivu); laskeKaikki antaa suorankin piipun hupun rivit todellisen aihion kokoisina (ei varmuusvaraa).
// v4–v5 (20.11. illalla): harjapiipun hupun palat (harjaHupunPalat, levitaTaso, laskeKaikkiHarja). Vaatii pellit.js?v=2.
// v18 (24.11.2026): lapepiipun kiilassa tyhjät vasemmat korkeudet katon tasosta (LASKETTU), kiero katto -varoitus.
// v17 (24.11.2026): kiilaSivukuva (lapepiipun sivukuva oikeasta sivusta kiilan kanssa, vaihe 5c).
// v16 (24.11.2026): tyhjät vasemman puolen korkeudet lasketaan katon tasosta (varoitus LASKETTU, EI MITATTU).
// v15 (24.11.2026): harjaKuvaYlhaalta, harjaSivukuva oikeasta sivusta kiilan kanssa.
// v14 (24.11.2026): harjapiipun kiila / mutka (harjaKiilaTiedot, harjaMalli, harjaKiilaPalat, laskeKaikkiHarjaKiila; vaihe 5b).
// v12 (23.11.2026): harjapiipun etukappaleet 1–3 osana (etuJako1 / etuJako2).
// v11 (23.11.2026): jakosauma seuraa hupun saumaa (KPT_PIIPPU.harjaJakosauma).
// v10 (23.11.2026): palaTiedot(pa) ja levita(pa) julki (työkortin palasivut); palaHtml käyttää samaa, ruutu ennallaan.
// v9 (23.11.2026): harjapiipun etukuvassa etu 2 -puoli peilikuvana ja puolet nimetty Etu 1 / Etu 2.
// v8 (23.11.2026): etukuva(vals) Tomin Excelin mallin mukaan (lapepiippu ja harjapiippu).
// v7 (23.11.2026): harjapiipun sivukuvaan juuren etuosa (Eteen piipusta + Alas).
// v6: harjapiipun sivukuva ja kaltevuus suhdelukuna (harjaSivukuva, harjaSuhde), yhteinen harjapiippu-sivulle ja Tuotannolle.
(function () {
  const req = typeof require === 'function' ? require : null;
  const G = globalThis.KPT_GEOM || (req ? req('./geom.js') : null);
  const PL = globalThis.KPT_PELLIT || (req ? req('./pellit.js') : null);
  const PI = globalThis.KPT_PIIPPU || (req ? req('./piippu-laskenta.js') : null);
  if (!G || !PL || !PI) throw new Error('piippu-levitys.js tarvitsee geom.js:n, pellit.js:n ja piippu-laskenta.js:n: lataa ne ensin');
  const { vsub, vadd, vscale, vdot, vcross, vnorm, kulmaAsteina } = G;

  const mm = v => String(Math.round(v));
  const mm1 = v => String(Math.round(v * 10) / 10).replace('.', ',');
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
  // Tallennetaan profile_data.vals:iin: kiilaPaalla, takaLeveys, vasenPituus, suoraKulma (0 etuvasen, 1 etuoikea, 2 takaoikea,
  // 3 takavasen), korkeusEV/EO/TO/TV, kiilaVasen/Oikea/Etu/Taka. Puuttuva tai tyhjä = kuten suorassa piipussa.
  // "Suora mitta" (vals.suora) on piipun OIKEA sivu, koska Piippu-sivun sivukuvassa etu on vasemmalla (Tomi 20.11.2026 illalla).
  // Ensimmäisessä versiossa (20.11. päivällä) suora oli vasen sivu ja lisäkenttä oikeaPituus: sellainen tilaus lasketaan kuten ennen.
  function kiilaTiedot(vals) {
    const v = vals || {};
    const lev = Number(v.leveys) || 0, suo = Number(v.suora) || 0, he = Number(v.etukork) || 0, ht = Number(v.takakork) || 0;
    const on = !!v.kiilaPaalla;
    const tai = (x, oletus) => { const n = on ? luku(x) : null; return n === null ? oletus : n; };
    const vanhaMalli = on && luku(v.vasenPituus) === null && luku(v.oikeaPituus) !== null;
    return {
      paalla: on,
      muoto: { etu: lev, taka: tai(v.takaLeveys, lev),
        vasen: vanhaMalli ? suo : tai(v.vasenPituus, suo), oikea: vanhaMalli ? luku(v.oikeaPituus) : suo, suora: on && [0, 1, 2, 3].includes(Number(v.suoraKulma)) ? Number(v.suoraKulma) : 0 },
      korkeudet: [tai(v.korkeusEV, he), tai(v.korkeusEO, he), tai(v.korkeusTO, ht), tai(v.korkeusTV, ht)],
      kiila: { vasen: tai(v.kiilaVasen, 0), oikea: tai(v.kiilaOikea, 0), etu: tai(v.kiilaEtu, 0), taka: tai(v.kiilaTaka, 0) },
      // Vasemman puolen korkeudet, jotka käyttäjä on syöttänyt. Tyhjät lasketaan katon tasosta (hupunMalli, 24.11.2026).
      annettu: { EV: on && luku(v.korkeusEV) !== null, TV: on && luku(v.korkeusTV) !== null },
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
    const H = k.korkeudet.slice(), h2 = (Number(v.huplis) || 0) / 2, zt = -(Number(v.vahennys) || 0);
    // Seinätaso: ulospäin osoittava vaakanormaali n ja kiila (mm katon kohdalla, + ulompana) seinän korkeimmasta kulmasta
    const seina = (j, lisa) => {
      const p = C[j], q = C[(j + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const n = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l], Hhi = Math.max(H[j], H[(j + 1) % 4]) || 1;
      const kal = (k.kiila[SEINAT[j]] || 0) / Hhi;
      return [n[0], n[1], kal, n[0] * p[0] + n[1] * p[1] + lisa];      // n·xy + kal·z = n·p + lisa
    };
    const seinatKulmassa = i => [(i + 3) % 4, i];
    let piippuSeinat = [0, 1, 2, 3].map(j => seina(j, 0));
    const kulma = i => Hh => { const [a, b] = seinatKulmassa(i); return ratkaise3([piippuSeinat[a], piippuSeinat[b], [0, 0, 1, -Hh]]); };
    // Tyhjät vasemman puolen korkeudet katon tasosta (24.11.2026, sama periaate kuin harjapiipussa): toinen vasen kulma annettu →
    // taso kolmen annetun kautta; kumpikaan ei annettu → katto sivusuunnassa vaakasuora (räystäs etureunan suuntainen).
    // Oikean puolen tyhjät = pääkenttien etu- ja takakorkeus (mitattu, sama sivu kuin sivukuvassa).
    const ann = k.annettu || { EV: true, TV: true };
    if (!(ann.EV && ann.TV)) {
      const taso3 = (a, b, c) => { const n = vcross(vsub(b, a), vsub(c, a)); return Math.hypot(n[0], n[1], n[2]) < 1e-9 ? null : { n, d: vdot(n, a) }; };
      const osuma = (F, ts, oletus) => {
        if (!ts) return oletus;
        const s0 = vdot(ts.n, F(0)) - ts.d, s1 = vdot(ts.n, F(1000)) - ts.d;
        return Math.abs(s1 - s0) < 1e-12 ? oletus : 1000 * s0 / (s0 - s1);
      };
      const etuSuunta = [C[1][0] - C[0][0], C[1][1] - C[0][1], 0];
      for (let kierros = 0; kierros < 6; kierros++) {
        piippuSeinat = [0, 1, 2, 3].map(j => seina(j, 0));
        const P1 = kulma(1)(H[1]), P2 = kulma(2)(H[2]);
        let ts;
        if (ann.EV) ts = taso3(kulma(0)(H[0]), P1, P2);
        else if (ann.TV) ts = taso3(P1, P2, kulma(3)(H[3]));
        else { const n = vcross(vsub(P2, P1), etuSuunta); ts = Math.hypot(n[0], n[1], n[2]) < 1e-9 ? null : { n, d: vdot(n, P1) }; }
        if (!ann.EV) H[0] = osuma(kulma(0), ts, H[0]);
        if (!ann.TV) H[3] = osuma(kulma(3), ts, H[3]);
      }
      piippuSeinat = [0, 1, 2, 3].map(j => seina(j, 0));
    }
    if (!(H[0] > 0 && H[3] > 0 && isFinite(H[0]) && isFinite(H[3]))) return null;
    const lasketut = [];
    [['EV', 'korkeusEV', 'etuvasen', H[0], k.korkeudet[0]], ['TV', 'korkeusTV', 'takavasen', H[3], k.korkeudet[3]]]
      .forEach(([a, kentta, nimi, arvo, oletus]) => { if (!ann[a] && Math.abs(arvo - oletus) > 0.5) lasketut.push({ kentta, nimi, arvo }); });
    const huppuSeinat = [0, 1, 2, 3].map(j => seina(j, h2));
    const ala = [0, 1, 2, 3].map(i => kulma(i)(H[i]));
    // Katto: pienimmän neliösumman taso piipun neljän alakulman kautta (tavallisella piipulla tarkka)
    const ka = a => a.reduce((s, x) => s + x, 0) / a.length;
    const mx = ka(ala.map(p => p[0])), my = ka(ala.map(p => p[1])), mz = ka(ala.map(p => p[2]));
    let Sxx = 0, Sxy = 0, Syy = 0, Sxz = 0, Syz = 0;
    ala.forEach(p => { const dx = p[0] - mx, dy = p[1] - my, dz = p[2] - mz; Sxx += dx * dx; Sxy += dx * dy; Syy += dy * dy; Sxz += dx * dz; Syz += dy * dz; });
    const den = Sxx * Syy - Sxy * Sxy || 1, r1 = (Sxz * Syy - Syz * Sxy) / den, r2 = (Syz * Sxx - Sxz * Sxy) / den;
    const katto = [-r1, -r2, 1, mz - r1 * mx - r2 * my];
    // Kiero katto: neljä annettua kulmaa eivät osu samaan tasoon (heitto = 4 × suurin poikkeama, kuten harjapiipussa)
    const heitto = 4 * Math.max.apply(null, ala.map(p => Math.abs(p[2] - (mz + r1 * (p[0] - mx) + r2 * (p[1] - my)))));
    const varoitukset = [];
    if (lasketut.length) varoitukset.push('LASKETTU, EI MITATTU: ' + lasketut.map(x => x.nimi + ' ' + mm(x.arvo) + ' mm').join(', ')
      + '. Laskettu katon tasosta muista korkeuksista. Tarkista mittaamalla, tai syötä mitattu arvo.');
    if (heitto > 5) varoitukset.push('Katto on kiero: kulmien korkeudet heittävät noin ' + Math.round(heitto) + ' mm (yksi kulma ei osu samaan tasoon muiden kanssa). Tarkista korkeudet; laskenta käyttää keskimääräistä kattoa.');
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
    return { kiila: k, C, ala, B, T, tahkot, korkeudet: H, lasketut, varoitukset, heitto,
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
    c += '<polygon points="' + (lv.paneeli || [p.A2, p.B2, p.C2, p.D2]).map(pt).join(' ') + '" fill="rgba(34,197,94,.06)" stroke="#22c55e" stroke-width="1.6"/>';
    if (lv.harja) c += '<line x1="' + X(lv.harja.x) + '" y1="' + Y(0) + '" x2="' + X(lv.harja.x) + '" y2="' + Y(-lv.harja.h) + '" stroke="#38bdf8" stroke-width="0.9" stroke-dasharray="3,3"/>';
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
    if (lv.harja) {                                                            // harjapiipun sivu: korkeus ja paikka harjalla
      c += '<text x="' + (X(lv.harja.x) + 5) + '" y="' + (Y(-lv.harja.h / 2) + 4) + '" font-size="11" font-family="' + F + '" fill="#38bdf8" text-anchor="start">' + mm1(lv.harja.h) + '</text>';
      c += '<text x="' + X(lv.harja.x) + '" y="' + (Y(0) + 30) + '" font-size="10" font-family="' + F + '" fill="#38bdf8" text-anchor="middle">harja ' + mm1(lv.harja.x) + ' (aihiosta ' + mm1(lv.harja.aihiosta) + ')</text>';
    }
    if (pa.paat && (pa.paat[0] || pa.paat[1])) {
      c += '<text x="' + (X(0) + 4) + '" y="' + (yt - 14) + '" font-size="10" font-family="' + F + '" fill="#6b8fa8" text-anchor="start">' + esc(pa.paat[0]) + ' -pää</text>';
      c += '<text x="' + (X(pa.P) - 4) + '" y="' + (yt - 14) + '" font-size="10" font-family="' + F + '" fill="#6b8fa8" text-anchor="end">' + esc(pa.paat[1]) + ' -pää</text>';
    }
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
    const paa = (puoli, k) => pa.paat && pa.paat[k] ? puoli + ' reuna (' + pa.paat[k] + ')' : puoli + ' reuna';
    const sauma = (puoli, e, k) => { const sl = e.s === undefined ? pa.s : e.s; return e.tyyppi === 't90'
      ? [paa(puoli, k), mm(sl), aste(e.kulma), 'ulos', e.nurkka ? 'nurkkasauma' : 'jakosauma (aiempi pala)']
      : [paa(puoli, k), mm(sl) + ' + ' + mm(sl), '0° + 180°', 'tupla', (e.nurkka ? 'kiertää naapurin sauman' : 'jakosauma (myöhempi pala), kiertää') + ' · yht. ' + mm(2 * sl)]; };
    const rivit = [sauma('Vasen', pa.vasen, 0), sauma('Oikea', pa.oikea, 1)];
    if (pa.ala > 0 && pa.ala2d && pa.ala2d.length === 3) {
      rivit.push(['Alareuna, ' + pa.alaNimet[0], mm(pa.ala), '180°', 'sisään', 'alatupla, päät 45° (harjalla loveus), usein käsin']);
      rivit.push(['Alareuna, ' + pa.alaNimet[1], mm(pa.ala), '180°', 'sisään', 'alatupla, päät 45° (harjalla loveus), usein käsin']);
    } else if (pa.ala > 0) rivit.push(['Alareuna', mm(pa.ala), '180°', 'sisään', 'alatupla' + (pa.osa === 'sivut' ? ', katon kaltevuudessa' : '') + ', päät viistetty 45°']);
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

  // Palan tiedot ruudulle ja työkorttiin (v10, 23.11.2026): levitys, aihio, korkeusteksti, lähikuvat (SVG-lista),
  // taitosrivit ja merkintäpisteiden määrä. Yksi paikka, jotta Tuotannon ruutu ja paperi näyttävät samat asiat.
  function palaTiedot(pa) {
    const lv = levita(pa), m = lv.mitat;
    const lahi = (nimi, x0, y0) => piirraPala(pa, lv, { nimi, minX: x0, minY: y0, w: 90, h: 90 });
    const A = lv.p.A2, D = lv.p.D2, B = lv.p.B2, C = lv.p.C2;
    const symm = pa.vasen.tyyppi === pa.oikea.tyyppi && pa.vasen.nurkka === pa.oikea.nurkka && Math.abs(m.vasen - m.oikea) < 0.01
      && Math.abs(pa.vasen.kulma - pa.oikea.kulma) < 0.05 && Math.abs(m.ala - m.yla) < 0.01;
    const kulmat = [lahi('vasen alakulma', A[0] - pa.vasen.w - 15, A[1] - pa.ala - 25), lahi('vasen yläkulma', D[0] - pa.vasen.w - 15, D[1] - 60)];
    if (!symm) kulmat.push(lahi('oikea alakulma', B[0] - 75 + pa.oikea.w, B[1] - pa.ala - 25), lahi('oikea yläkulma', C[0] - 75 + pa.oikea.w, C[1] - 60));
    if (lv.harja) kulmat.unshift(piirraPala(pa, lv, { nimi: 'harjan kohta (loveus 45°)', minX: lv.harja.x - 60, minY: -lv.harja.h - 80, w: 120, h: 120 }));
    const korkeus = lv.harja ? mm(m.vasen) + ' / harja ' + mm(lv.harja.h) + ' / ' + mm(m.oikea) : mm(m.vasen) + (Math.abs(m.vasen - m.oikea) > 0.5 ? ' → ' + mm(m.oikea) : '');
    return { lv, aw: ylos(lv.p.w), ah: ylos(lv.p.h), korkeus, symm, kulmat, taitokset: taitosRivit(pa), pisteita: PL.aihioPisteet(lv.p).pisteet.length };
  }

  // Yhden palan HTML: avattava kortti (oletuksena kiinni), sisällä kuva, taitostaulukko, lähikuvat ja merkintäpisteet napin takana.
  function palaHtml(pa, opts) {
    const o = opts || {};
    lisaaTyylit();
    const t = palaTiedot(pa), lv = t.lv;
    const taulu = '<table class="plv-taulu"><tr><th>Reuna</th><th>Mitta</th><th>Kanttaus</th><th>Taitto</th><th>Huom.</th></tr>'
      + t.taitokset.map(r => '<tr>' + r.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</table>';
    return '<details class="plv-pala"' + (o.auki ? ' open' : '') + '><summary><span class="plv-nimi">' + esc(pa.nimi) + ' · ' + (o.kpl || pa.kpl) + ' kpl</span>'
      + '<span class="plv-meta">aihio ' + t.aw + ' × ' + t.ah + '</span><span class="plv-meta">korkeus ' + t.korkeus + '</span>'
      + (pa.peili ? '<span class="plv-meta">toinen sivu peilikuva</span>' : '') + '</summary>'
      + '<div class="plv-sisus"><div>' + piirraPala(pa, lv) + taulu + '</div><div>'
      + '<details class="plv-lisa"' + (lv.harja ? ' open' : '') + '><summary>' + (lv.harja ? 'Harjan kohta ja kulmien lähikuvat' : 'Kulmien lähikuvat') + (t.symm ? ' (oikeat kulmat ovat peilikuvat)' : '') + '</summary><div class="plv-kulmat">' + t.kulmat.join('') + '</div></details>'
      + '<details class="plv-lisa"><summary>Merkintäpisteet (' + t.pisteita + ' pistettä, aihion vasemmasta alakulmasta)</summary>'
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

  // ---------- Lapepiipun sivukuva kiilapiipussa (vaihe 5c, 24.11.2026) ----------
  // Sivukuva näyttää oikean sivun (sama sivu kuin "Suora mitta"), kuten harjapiipussa (Tomi 24.11.: oikea sivu + kuva ylhäältä).
  // Palauttaa { etu, taka, etuTod, takaTod } (korkeudet oikean sivun kulmista ja hupun oikean sivupalan todelliset korkeudet
  // ilman taitoksia 3D-mallista) tai null, kun piippu on suora. Suoralla syötöllä etuTod / takaTod = hEtuTodellinen / hTakaTodellinen.
  function kiilaSivukuva(vals) {
    const v = vals || {}, k = kiilaTiedot(v);
    if (!k.paalla || onSuora(v, k)) return null;
    const tulos = { etu: k.korkeudet[1], taka: k.korkeudet[2], etuTod: null, takaTod: null };
    let t = null;
    try { t = hupunPalat(v); } catch (e) { t = null; }
    const sivut = t ? t.palat.filter(pa => pa.osa === 'sivut' && pa.tahko === 'oikea') : [];
    if (sivut.length) { tulos.etuTod = levitaPala(sivut[0]).mitat.vasen; tulos.takaTod = levitaPala(sivut[sivut.length - 1]).mitat.oikea; }
    return tulos;
  }

  // ---------- Peltilista kiilan kanssa ----------
  // Sama kuin KPT_PIIPPU.laskeLapepiippu, mutta kiilapiipussa (vals.kiilaPaalla) hupun palat tulevat 3D-mallista todellisen
  // aihion kokoisina (ylöspäin), kansi ja hattu leveimmän ja pisimmän kohdan mukaan ja juuret pisimmän sivun mukaan.
  // Suorassa piipussa palauttaa laskeLapepiippu-tuloksen sellaisenaan. Palauttaa lisäksi { kiila, virhe, malli }.
  function laskeKaikki(vals, osat) {
    const v = vals || {}, o = osat || {};
    const perus = PI.laskeLapepiippu(v, o);
    const k = kiilaTiedot(v);
    if (!k.paalla || onSuora(v, k)) {
      // Suora piippu: hupun rivit todellisen aihion kokoisina (Tomi 20.11.2026 illalla: ei varmuusvaraa, ylimääräinen korkeus pois).
      // Vain sivujen korkeus muuttuu (kaava lisää alatuplan koko leveyden, vaikka tupla on katon kaltevuudessa ja viistetty);
      // leveydet sekä etu- ja takapalat ovat samat kuin laskeLapepiippu. Mahdottomilla syötöillä jää kaavan luku.
      if (o.huppu !== false) {
        let t = null;
        try { t = hupunPalat(Object.assign({}, v, { kiilaPaalla: false })); } catch (e) { t = null; }
        if (t) perus.muut = perus.muut.map(r => {
          if (!/^Huppu/.test(r.osa)) return r;
          const pa = t.palat.find(x => x.nimi === r.osa && x.kpl === r.kpl);
          if (!pa) return r;
          const lv = levitaPala(pa);
          return Object.assign({}, r, { lev: ylos(lv.p.w), pit: ylos(lv.p.h) });
        });
      }
      return Object.assign(perus, { kiila: false });
    }
    const t = hupunPalat(v);
    if (!t) return Object.assign(perus, { kiila: true, virhe: 'Yläpään mitat eivät sovi yhteen: tarkista sivujen pituudet ja suoran kulman valinta.' });
    const as = t.malli.alaSivut, km = k.muoto;
    const juuret = o.juuret === false ? [] : PI.laskeLapepiippu(Object.assign({}, v, { leveys: Math.max(as.etu, as.taka), suora: Math.max(as.vasen, as.oikea) }),
      { juuret: true, huppu: o.huppu !== false, kansi: false, hattu: false }).juuret;   // huppu vaikuttaa juuren mittoihin (q9)
    const huppu = o.huppu === false ? [] : t.palat.map(pa => { const lv = levitaPala(pa); return { osa: pa.nimi, lev: ylos(lv.p.w), pit: ylos(lv.p.h), kpl: pa.kpl }; });
    const khT = PI.laskeLapepiippu(Object.assign({}, v, { leveys: Math.max(km.etu, km.taka), suora: Math.max(km.vasen, km.oikea) }),
      { juuret: false, huppu: o.huppu !== false, kansi: o.kansi !== false, hattu: o.hattu !== false });
    const kh = khT.muut.filter(r => !/^Huppu/.test(r.osa));
    return { juuret, muut: huppu.concat(kh), kansi: khT.kansi, geom: perus.geom, kiila: true, malli: t.malli, symmetrinen: t.symmetrinen, varoitukset: t.malli.varoitukset };
  }


  // ======================================================================================================
  // HARJAPIIPPU (vaihe 5, 20.11.2026): hupun palat. Suorassa harjapiipussa kaikki seinät ovat pystysuoria, joten
  // kulmasaumat ja yläreuna ovat 90° ja palat levitetään suoraan tasossa. Sivukappaleen alareuna kulkee katon mukaan
  // ja taittuu harjalla (mockup piippu/harjapiippu-sivukappale-mockup.html v3, Tomin päätökset 20.11.):
  //  - alatupla kahtena osana, kumpikin viistetään harjalla 45° (loveus, kärki V:n kärjessä), taitetaan erikseen,
  //    usein käsin (pala ei mahdu kanttikoneeseen)
  //  - sivut yhtenä (40 + 40) tai poikki harjalta: etu 1 -puolelle jakosauma 90° ulos, etu 2 -puolelle 2 × jakosauma
  //    (kiertää sen); etukappaleet 20 + 20 (90° ulos)
  // Pala: { nimi, kpl, osa, P (paneelin leveys), ala2d (alareunan pisteet vasemmalta oikealle, yläreuna y = 0),
  //         vasen, oikea ({ tyyppi, nurkka, w, s, kulma }), yla, ylaW, ylaKulma, ala, peili, paat, alaNimet }.
  function harjaHupunPalat(vals) {
    const v = vals || {};
    if (v.kiilaPaalla && !onSuoraHarja(harjaKiilaTiedot(v))) return harjaKiilaPalat(v);   // kiila / mutka (vaihe 5b)
    const t = PI.laskeHarjapiippu(v, { juuret: false, huppu: true, kansi: false, hattu: false });
    if (t.virheet.length) return null;
    const g = t.geom, s = Number(v.sauma) || 0, jako = PI.harjaJakosauma ? PI.harjaJakosauma(v) : (Number(v.jakosauma) || 0);
    const huplis = Number(v.huplis) || 0, liitos = Number(v.hsivlisa) || 0;
    const yla = YLA_TYYPIT[v.ylaTyyppi] ? v.ylaTyyppi : 'ulos';
    const yht = { yla, ylaW: Number(v.ylareunaV) || 0, ylaKulma: yla === 'tupla' ? 180 : 90, ala: Number(v.alatupla) || 0, harja: true };
    const reuna = (tyyppi, nurkka, leveys) => ({ tyyppi, nurkka, s: leveys, w: tyyppi === 'k40' ? 2 * leveys : leveys, kulma: 90 });
    const rivi = nimi => t.muut.find(r => r.osa === nimi) || {};
    const palat = [];
    // Etukappaleet yhtenä tai 2–3 osana (kuten lapepiipun Sauma 2:n etu): aiempi pala jakosauma 90° ulos, seuraava kiertää sen tuplalla
    [[1, g.lev1, g.hE1Tod, g.etuJako1 || 1], [2, g.lev2, g.hE2Tod, g.etuJako2 || 1]].forEach(([n, lev, h, k]) => {
      const P = (lev + huplis) / k;
      for (let i = 1; i <= k; i++) {
        const nimi = 'Huppu etu ' + n + (k > 1 ? ' osa ' + i : '');
        palat.push(Object.assign({ nimi, kpl: 1, osa: 'etu', P, ala2d: [[0, -h], [P, -h]],
          vasen: i === 1 ? reuna('t90', true, s) : reuna('k40', false, s), oikea: i === k ? reuna('t90', true, s) : reuna('t90', false, s),
          paat: ['', ''], alaNimet: [''], listaLev: rivi(nimi).lev, listaPit: rivi(nimi).pit }, yht));
      }
    });
    const P = Number(v.suora1) + Number(v.suora2) + huplis + liitos;                 // sivun paneeli (sivuL − 2 × 40)
    const xH = liitos / 2 + huplis / 2 + Number(v.suora1);                           // harjan kohta paneelin etu 1 -reunasta
    if (g.sivutJako === 2) {
      palat.push(Object.assign({ nimi: 'Huppu sivu 1', kpl: 2, osa: 'sivut', P: xH, ala2d: [[0, -g.hE1Tod], [xH, -g.hHTod]], peili: true,
        vasen: reuna('k40', true, s), oikea: reuna('t90', false, jako), paat: ['etu 1', 'harja'], alaNimet: [''], harjaX: xH }, yht));
      palat.push(Object.assign({ nimi: 'Huppu sivu 2', kpl: 2, osa: 'sivut', P: P - xH, ala2d: [[0, -g.hHTod], [P - xH, -g.hE2Tod]], peili: true,
        vasen: reuna('k40', false, jako), oikea: reuna('k40', true, s), paat: ['harja', 'etu 2'], alaNimet: [''], harjaX: 0 }, yht));
    } else {
      palat.push(Object.assign({ nimi: 'Huppu sivut', kpl: 2, osa: 'sivut', P, ala2d: [[0, -g.hE1Tod], [xH, -g.hHTod], [P, -g.hE2Tod]], peili: true,
        vasen: reuna('k40', true, s), oikea: reuna('k40', true, s), paat: ['etu 1', 'etu 2'], alaNimet: ['etu 1 -puoli', 'etu 2 -puoli'], harjaX: xH }, yht));
    }
    palat.forEach(pa => { const r = rivi(pa.nimi); pa.listaLev = r.lev; pa.listaPit = r.pit; });
    return { palat, geom: g };
  }

  // Tasolevitys: paneeli ylhäältä suora (y = 0), alareuna pa.ala2d (2 tai 3 pistettä). Palauttaa saman muodon kuin
  // levitaPala ja lisäksi paneelin ääriviivan (lv.paneeli, myös p.paneeli merkintäpisteitä varten) ja harjan kohdan.
  function levitaTaso(pa) {
    const ala = pa.ala2d, A2 = ala[0], B2 = ala[ala.length - 1], C2 = [pa.P, 0], D2 = [0, 0];
    const flanges = [], viivat = [], lovet = [];
    const sauma = (p, q, e, puoli) => {
      const n = normaali(p, q);
      flanges.push({ poly: siisti([p, q, add(q, mul(n, e.w)), add(p, mul(n, e.w))]) });   // päät suoraan 90° sivureunasta
      const [yp, yq] = puoli === 'oikea' ? [q, p] : [p, q];
      if (e.tyyppi === 't90') viivat.push({ p: yp, q: yq, suunta: 'ulos', teksti: mm(e.s) + ' · ' + aste(e.kulma) + ' ulos', puoli });
      else {
        viivat.push({ p: yp, q: yq, suunta: 'ei', teksti: 'nurkka', puoli });
        viivat.push({ p: add(yp, mul(n, e.s)), q: add(yq, mul(n, e.s)), suunta: 'ulos', teksti: mm(e.s) + ' · 180° tupla', puoli, tupla: true });
      }
    };
    sauma(D2, A2, pa.vasen, 'vasen');
    sauma(B2, C2, pa.oikea, 'oikea');
    // Alatupla jokaiselle alareunan osalle: päät viistetään 45° koko leveydeltä, myös harjalla (loveus V:n kärkeen).
    // Jos 45°:n viisteet eivät mahdu sisäkulmaan (kattojen kaltevuudet yhteensä yli 90°), tuplat erotetaan puolittajalla.
    const w = pa.ala;
    const harjaLovet = [];
    if (w > 0) {
      const mitre = i => { const na = normaali(ala[i - 1], ala[i]), nb = normaali(ala[i], ala[i + 1]), b = unit(add(na, nb)); return add(ala[i], mul(b, w / (b[0] * na[0] + b[1] * na[1]))); };
      const mahtuu45 = i => { const ua = unit(sub(ala[i], ala[i - 1])), ub = unit(sub(ala[i + 1], ala[i])); return Math.acos(Math.max(-1, Math.min(1, -(ua[0] * ub[0] + ua[1] * ub[1])))) * 180 / Math.PI > 90 + 1e-6; };
      for (let i = 0; i + 1 < ala.length; i++) {
        const p = ala[i], q = ala[i + 1], n = normaali(p, q), u = unit(sub(q, p));
        const ulkoQ = i + 2 < ala.length && !mahtuu45(i + 1) ? mitre(i + 1) : add(add(q, mul(n, w)), mul(u, -w));
        const ulkoP = i > 0 && !mahtuu45(i) ? mitre(i) : add(add(p, mul(n, w)), mul(u, w));
        flanges.push({ poly: siisti([p, q, ulkoQ, ulkoP]) });
        viivat.push({ p, q, suunta: 'sisaan', teksti: mm(w) + ' · 180° tupla sisään', alaOsa: i });
        if (i > 0 && mahtuu45(i)) {
          const na = normaali(ala[i - 1], p), ua = unit(sub(p, ala[i - 1]));
          harjaLovet.push(siisti([p, add(add(p, mul(na, w)), mul(ua, -w)), mitre(i), ulkoP]));
        }
      }
    }
    const viisteYla = puoli => pa.yla === 'tupla' || (pa.yla === 'sisaan' && pa[puoli].nurkka);
    if (pa.ylaW > 0) {
      const n = normaali(C2, D2), u = unit(sub(D2, C2));
      flanges.push({ poly: siisti([C2, D2, add(add(D2, mul(n, pa.ylaW)), mul(u, viisteYla('vasen') ? -pa.ylaW : 0)), add(add(C2, mul(n, pa.ylaW)), mul(u, viisteYla('oikea') ? pa.ylaW : 0))]) });
      viivat.push({ p: D2, q: C2, suunta: pa.yla === 'ulos' ? 'ulos' : 'sisaan', teksti: mm(pa.ylaW) + ' · ' + aste(pa.ylaKulma) + ' ' + ({ ulos: 'ulos', sisaan: 'sisään', tupla: 'tupla sisään' }[pa.yla]) });
    }
    // Nurkkien loveukset kuten levitaPala
    const lovi = (K, sp, sq, ew, rp, rq, rw, viiste) => {
      if (!(ew > 0 && rw > 0)) return;
      const ns = normaali(sp, sq), us = unit(sub(sq, sp)), nr = normaali(rp, rq), ur = unit(sub(rq, rp));
      const Ks = add(K, mul(ns, ew)), Kr = add(K, mul(nr, rw)), X = leikkaus(Ks, us, Kr, ur);
      const kauempi = Math.hypot(rp[0] - K[0], rp[1] - K[1]) < Math.hypot(rq[0] - K[0], rq[1] - K[1]) ? rq : rp;
      lovet.push(siisti([K, Ks, X, Kr].concat(viiste ? [add(Kr, mul(unit(sub(kauempi, K)), rw))] : [])));
    };
    lovi(A2, D2, A2, pa.vasen.w, A2, ala[1], w, true);
    lovi(B2, B2, C2, pa.oikea.w, ala[ala.length - 2], B2, w, true);
    lovi(C2, B2, C2, pa.oikea.w, C2, D2, pa.ylaW, viisteYla('oikea'));
    lovi(D2, D2, A2, pa.vasen.w, C2, D2, pa.ylaW, viisteYla('vasen'));
    harjaLovet.forEach(l => lovet.push(l));
    const paneeli = ala.concat([C2, D2]);                                            // vastapäivään
    let pts = paneeli.slice();
    flanges.forEach(fl => { pts = pts.concat(fl.poly); });
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
    const tuplaViivat = viivat.filter(x => x.tupla).map(x => ({ p: x.p, q: x.q }));
    // alareunan taitosviivat merkintäkuvaan, kun alareuna taittuu (harjan kohta näkyy)
    const alaViivat = ala.length > 2 ? viivat.filter(x => x.alaOsa !== undefined).map(x => ({ p: x.p, q: x.q })) : [];
    const p = { A2, B2, C2, D2, paneeli, minX, minY, w: Math.max.apply(null, xs) - minX, h: Math.max.apply(null, ys) - minY,
      flanges: flanges.map(fl => ({ poly: fl.poly, foldLines: [] })).concat(tuplaViivat.length || alaViivat.length ? [{ poly: [], foldLines: tuplaViivat.concat(alaViivat) }] : []) };
    const pit = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let alaPit = 0;
    for (let i = 0; i + 1 < ala.length; i++) alaPit += pit(ala[i], ala[i + 1]);
    const harja = ala.length === 3 ? { x: ala[1][0], h: -ala[1][1], aihiosta: ala[1][0] - minX } : null;
    return { p, viivat, lovet, paneeli, harja, mitat: { ala: alaPit, yla: pit(D2, C2), vasen: pit(D2, A2), oikea: pit(B2, C2) } };
  }
  const levita = pa => pa.ala2d ? levitaTaso(pa) : levitaPala(pa);

  // Harjapiipun sivukuva (SVG): piippu sivulta, etu 1 vasemmalla, katto molemmin puolin harjaa, vinomitat katon
  // suuntaisesti, suorat mitat ja kokonaismitta. Yhteinen harjapiippu-sivulle ja Tuotannolle (vaihe 6b, 20.11.2026).
  // opts.todelliset = true: korkeuksien alle hupun todelliset korkeudet ilman taitoksia (Tuotanto: pellissä näkyvä mitta).
  function harjaSivukuva(vals, opts) {
    const m = vals || {}, o = opts || {};
    const n = x => Number(x) || 0;
    // Kiila / mutka (vaihe 5b, Tomi 24.11.): sivukuva oikeasta sivusta, korkeudet sen kulmista ja harjalta
    const kt = m.kiilaPaalla ? harjaKiilaTiedot(m) : null, kiilaSivu = kt && !onSuoraHarja(kt);
    const suora1 = n(m.suora1), suora2 = n(m.suora2);
    const kork1 = kiilaSivu ? kt.korkeudet[1] : n(m.kork1), kork2 = kiilaSivu ? kt.korkeudet[2] : n(m.kork2), korkH = kiilaSivu ? kt.harjaKork.oikea : n(m.korkH);
    const C1 = '#f1f5f9', C2 = '#64748b', CI = '#38bdf8', CA = '#f59e0b', F = 'IBM Plex Mono, monospace';
    const txt = (x, y, t, a) => '<text x="' + x + '" y="' + y + '" fill="' + ((a && a.c) || C1) + '" font-size="' + ((a && a.s) || 12) + '" font-family="' + F + '" text-anchor="' + ((a && a.a) || 'middle') + '">' + esc(t) + '</text>';
    const mittaH = (x1, x2, y, t) => '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + CI + '" stroke-width="1"/>'
      + '<line x1="' + x1 + '" y1="' + (y - 5) + '" x2="' + x1 + '" y2="' + (y + 5) + '" stroke="' + CI + '"/><line x1="' + x2 + '" y1="' + (y - 5) + '" x2="' + x2 + '" y2="' + (y + 5) + '" stroke="' + CI + '"/>' + txt((x1 + x2) / 2, y - 5, t, { c: CI });
    const W = 640, H = 320, mT = 30, mB = 95;
    const uloke1 = n(m.k24_1) || 150, uloke2 = n(m.k24_2) || 150;
    const kokoLev = uloke1 + suora1 + suora2 + uloke2, maxK = Math.max(kork1, kork2, 1);
    const sc = Math.min((W - 80) / (kokoLev || 1), (H - mT - mB) / maxK);
    const x1 = 40 + uloke1 * sc, xH = x1 + suora1 * sc, x2 = xH + suora2 * sc;
    const yTop = mT, y1 = yTop + kork1 * sc, yH = yTop + korkH * sc, y2 = yTop + kork2 * sc;
    const k1 = suora1 > 0 ? (y1 - yH) / (xH - x1) : 0, k2 = suora2 > 0 ? (y2 - yH) / (x2 - xH) : 0;
    const xa = x1 - uloke1 * sc, ya = y1 + k1 * uloke1 * sc, xb = x2 + uloke2 * sc, yb = y2 + k2 * uloke2 * sc;
    let h = '<polyline points="' + xa + ',' + ya + ' ' + xH + ',' + yH + ' ' + xb + ',' + yb + '" fill="none" stroke="' + C2 + '" stroke-width="1.5"/>';
    h += '<polyline points="' + x1 + ',' + y1 + ' ' + x1 + ',' + yTop + ' ' + x2 + ',' + yTop + ' ' + x2 + ',' + y2 + '" fill="none" stroke="' + C1 + '" stroke-width="2"/>';
    h += '<line x1="' + xH + '" y1="' + yTop + '" x2="' + xH + '" y2="' + yH + '" stroke="' + C2 + '" stroke-dasharray="4 3"/>';
    // Juuren etuosa (nillityslista 23.11.2026): katkoviiva katon suuntaan "Eteen piipusta" ja päästä "Alas" kohtisuoraan
    // katon alle, kuten lapepiipun kuvassa. Ilman syöttöä (0) ei piirretä.
    const juuriEtu = (px, py, ex, ey, eteen, alas) => {
      if (!(eteen > 0)) return { h: '', yAla: py };
      const dx = px - ex, dy = py - ey, l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l, ny = dx / l;
      if (ny < 0) { nx = -nx; ny = -ny; }                     // normaali katon alle (SVG:ssä y kasvaa alas)
      const ax = ex + nx * alas * sc, ay = ey + ny * alas * sc;
      const viiva = (a, b, c, d) => '<line x1="' + a + '" y1="' + b + '" x2="' + c + '" y2="' + d + '" stroke="' + C1 + '" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round"/>';
      return { h: viiva(px, py, ex, ey) + (alas > 0 ? viiva(ex, ey, ax, ay) : ''), yAla: Math.max(py, ey, ay) };
    };
    const je1 = juuriEtu(x1, y1, xa, ya, n(m.k24_1), n(m.j25_1)), je2 = juuriEtu(x2, y2, xb, yb, n(m.k24_2), n(m.j25_2));
    h += je1.h + je2.h;
    let tod = null;
    if (o.todelliset && !kiilaSivu) { try { tod = PI.laskeHarjapiippu(m, { juuret: false, kansi: false, hattu: false }).geom; } catch (e) { tod = null; } }
    const korkeus = (x, yAla, arvo, a, todArvo) => {
      const yy = (yTop + yAla) / 2;
      return txt(x, yy, mm(arvo), { a }) + (tod ? txt(x, yy + 15, '↳ ' + mm(todArvo), { a, c: CI, s: 10.5 }) : '');
    };
    h += korkeus(x1 + 6, y1, kork1, 'start', tod && tod.hE1Tod) + korkeus(xH + 6, yH, korkH, 'start', tod && tod.hHTod) + korkeus(x2 - 6, y2, kork2, 'end', tod && tod.hE2Tod);
    h += txt(x1, yTop - 10, 'Etu 1', { c: C2, s: 11 }) + txt(xH, yTop - 10, 'Harja', { c: C2, s: 11 }) + txt(x2, yTop - 10, 'Etu 2', { c: C2, s: 11 });
    const vino = (ax, ay, bx, by, arvo) => {
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const cx = (ax + bx) / 2 + nx * 16, cy = (ay + by) / 2 + ny * 16, kulma = Math.atan2(dy, dx) * 180 / Math.PI;
      return '<text x="' + cx + '" y="' + cy + '" fill="' + CA + '" font-size="12" font-family="' + F + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + kulma + ' ' + cx + ' ' + cy + ')">vino ' + mm(arvo) + '</text>';
    };
    h += vino(x1, y1, xH, yH, Math.hypot(suora1, kork1 - korkH)) + vino(xH, yH, x2, y2, Math.hypot(suora2, kork2 - korkH));
    const yM = Math.max(ya, yb, y1, y2, je1.yAla, je2.yAla) + 24;
    h += mittaH(x1, xH, yM, mm(suora1)) + mittaH(xH, x2, yM, mm(suora2)) + mittaH(x1, x2, yM + 30, 'koko ' + mm(suora1 + suora2));
    if (tod) h += txt(W - 6, H - 6, '↳ = hupun todellinen korkeus ilman taitoksia', { a: 'end', c: CI, s: 10 });
    if (kiilaSivu) h += txt(6, H - 6, 'oikea sivu · vasen sivu kuvassa ylhäältä', { a: 'start', c: C2, s: 10.5 });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:900px;height:auto;display:block">' + h + '</svg>';
  }

  // Katon kaltevuus suhdelukuna kuten lapepiipussa (1 : suora / korkeusero), kummallekin puolelle (Tomi 20.11.2026)
  function harjaSuhde(vals) {
    const n = x => Number(x) || 0, korkH = n(vals.korkH);
    const suhde = (suora, kork) => kork - korkH > 0 && suora > 0 ? '1:' + (suora / (kork - korkH)).toFixed(1) : '—';
    return [suhde(n(vals.suora1), n(vals.kork1)), suhde(n(vals.suora2), n(vals.kork2))];
  }


  // Harjapiipun peltilista: kuten KPT_PIIPPU.laskeHarjapiippu, mutta hupun rivit todellisen aihion kokoisina
  // (Tomi 20.11.2026: ei varmuusvaraa). Leikkausmitat poistettu 23.11.2026 (piippu-laskenta.js v5).
  function laskeKaikkiHarja(vals, osat) {
    const o = osat || {};
    if (vals && vals.kiilaPaalla && !onSuoraHarja(harjaKiilaTiedot(vals))) return laskeKaikkiHarjaKiila(vals, o);   // kiila / mutka (vaihe 5b)
    const perus = PI.laskeHarjapiippu(vals, o);
    if (o.huppu === false || perus.virheet.length) return perus;
    const t = harjaHupunPalat(vals);
    if (!t) return perus;
    perus.muut = perus.muut.map(r => {
      const pa = t.palat.find(x => x.nimi === r.osa);
      if (!pa) return r;
      const lv = levitaTaso(pa);
      return Object.assign({}, r, { lev: ylos(lv.p.w), pit: ylos(lv.p.h) });
    });
    return perus;
  }

  // ======================================================================================================
  // HARJAPIIPUN KIILA / MUTKA (vaihe 5b, 24.11.2026, suunnitelma claude/harjapiippu_kiila_suunnitelma.md, Tomi hyväksyi 24.11.)
  // Sama tapa kuin lapepiipun kiilassa: piippu ja huppu 3D:nä, jokainen hupun seinä on tasainen levy. Kattoja on kaksi
  // (puolen 1 ja puolen 2 lape), harja on niiden leikkausviiva. Sivuseinä on viisikulmio (alareuna taittuu harjalla), ja se
  // avataan levitaTaso-funktiolla kuten suoran harjapiipun sivu. Kolmiointia ei tarvita, koska seinät ovat tasaisia.
  // Kulmat (ylhäältä, etu 1 alhaalla): 0 = etu 1 vasen, 1 = etu 1 oikea, 2 = etu 2 oikea, 3 = etu 2 vasen.
  // Seinät 0 etu 1, 1 oikea, 2 etu 2, 3 vasen; seinä j ulkopuolelta katsottuna: vasemmalla kulma j, oikealla kulma j + 1.
  // Tallennus profile_data.vals: kiilaPaalla, vasenPituus (oikea sivu = suora1 + suora2), suoraKulma (0–3), harjaVasen
  // (etu 1:n kulmasta harjalle vasemmalla sivulla; oikealla = suora1), korkE1V, korkE1O, korkHV, korkHO, korkE2V, korkE2O,
  // kiilaEtu1, kiilaEtu2, kiilaVasen, kiilaOikea. Tyhjä = kuten suorassa harjapiipussa.
  function harjaKiilaTiedot(vals) {
    const v = vals || {}, on = !!v.kiilaPaalla, n = x => Number(x) || 0;
    const lev1 = n(v.lev1), lev2 = v.lev2 === null || v.lev2 === undefined || v.lev2 === '' ? lev1 : n(v.lev2);
    const s1 = n(v.suora1), koko = s1 + n(v.suora2), k1 = n(v.kork1), kH = n(v.korkH), k2 = n(v.kork2);
    const tai = (x, oletus) => { const a = on ? luku(x) : null; return a === null ? oletus : a; };
    return {
      paalla: on,
      muoto: { etu: lev1, taka: lev2, oikea: koko, vasen: tai(v.vasenPituus, koko), suora: on && [0, 1, 2, 3].includes(Number(v.suoraKulma)) ? Number(v.suoraKulma) : 0 },
      harja: { oikea: s1, vasen: tai(v.harjaVasen, s1) },
      korkeudet: [tai(v.korkE1V, k1), tai(v.korkE1O, k1), tai(v.korkE2O, k2), tai(v.korkE2V, k2)],
      harjaKork: { oikea: tai(v.korkHO, kH), vasen: tai(v.korkHV, kH) },
      kiila: { etu: tai(v.kiilaEtu1, 0), oikea: tai(v.kiilaOikea, 0), taka: tai(v.kiilaEtu2, 0), vasen: tai(v.kiilaVasen, 0) },
      // Vasemman puolen korkeudet, jotka käyttäjä on syöttänyt. Tyhjät lasketaan katon tasosta (harjaMalli, Tomi 24.11.2026).
      annettu: { E1V: on && luku(v.korkE1V) !== null, HV: on && luku(v.korkHV) !== null, E2V: on && luku(v.korkE2V) !== null },
    };
  }
  function onSuoraHarja(k) {
    const m = k.muoto, H = k.korkeudet;
    return m.etu === m.taka && m.vasen === m.oikea && m.suora === 0 && k.harja.vasen === k.harja.oikea
      && H[0] === H[1] && H[2] === H[3] && k.harjaKork.vasen === k.harjaKork.oikea && SEINAT.every(s => !k.kiila[s]);
  }

  // Pienimmän neliösumman taso z = a·x + b·y + c pisteiden kautta. Palauttaa rivin [−a, −b, 1, c] ja heiton:
  // neljällä pisteellä heitto = kuinka paljon yksi kohta on muiden kolmen tason ulkopuolella (4 × suurin poikkeama).
  function tasoPisteista(pts) {
    const ka = a => a.reduce((s, x) => s + x, 0) / a.length;
    const mx = ka(pts.map(p => p[0])), my = ka(pts.map(p => p[1])), mz = ka(pts.map(p => p[2]));
    let Sxx = 0, Sxy = 0, Syy = 0, Sxz = 0, Syz = 0;
    pts.forEach(p => { const dx = p[0] - mx, dy = p[1] - my, dz = p[2] - mz; Sxx += dx * dx; Sxy += dx * dy; Syy += dy * dy; Sxz += dx * dz; Syz += dy * dz; });
    const den = Sxx * Syy - Sxy * Sxy;
    if (Math.abs(den) < 1e-9) return null;
    const a = (Sxz * Syy - Syz * Sxy) / den, b = (Syz * Sxx - Sxz * Sxy) / den, c = mz - a * mx - b * my;
    const poik = Math.max.apply(null, pts.map(p => Math.abs(p[2] - (a * p[0] + b * p[1] + c))));
    return { rivi: [-a, -b, 1, c], heitto: pts.length === 4 ? 4 * poik : poik };
  }

  // Harjapiipun 3D-malli. Palauttaa null, jos mitat eivät sovi yhteen.
  function harjaMalli(vals) {
    const v = vals || {}, k = harjaKiilaTiedot(v);
    const C = ylapaa(k.muoto);
    if (!C) return null;
    if (!(k.harja.oikea > 0 && k.harja.oikea < k.muoto.oikea && k.harja.vasen > 0 && k.harja.vasen < k.muoto.vasen)) return null;   // harja sivulle
    const H = k.korkeudet.slice(), HK = { oikea: k.harjaKork.oikea, vasen: k.harjaKork.vasen };
    const h2 = (Number(v.huplis) || 0) / 2, zt = -(Number(v.vahennys) || 0);
    const pit2 = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    const seina = (j, lisa) => {
      const p = C[j], q = C[(j + 1) % 4], l = pit2(p, q);
      const n = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l], Hhi = Math.max(H[j], H[(j + 1) % 4]) || 1;
      const kal = (k.kiila[SEINAT[j]] || 0) / Hhi;
      return [n[0], n[1], kal, n[0] * p[0] + n[1] * p[1] + lisa];
    };
    let pS = [0, 1, 2, 3].map(j => seina(j, 0));
    const kulma = i => Hh => ratkaise3([pS[(i + 3) % 4], pS[i], [0, 0, 1, -Hh]]);
    // Harjan kohta piipun sivuseinällä: matka etu 1:n kulmasta sivua pitkin (yläpäässä), seinän tasossa korkeudella −H
    const harjaPiste = (j, alku, loppu, matka, Hh) => {
      const P = C[alku], Q = C[loppu], t = matka / (pit2(P, Q) || 1), pl = pS[j];
      const xy = [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
      return [xy[0] + pl[0] * pl[2] * Hh, xy[1] + pl[1] * pl[2] * Hh, -Hh];
    };
    const hOF = Hh => harjaPiste(1, 1, 2, k.harja.oikea, Hh), hVF = Hh => harjaPiste(3, 0, 3, k.harja.vasen, Hh);
    // Tyhjät vasemman puolen korkeudet lasketaan katon tasosta (Tomi 24.11.2026: laskettu ehdotus, selvä varoitus):
    //  - harja vasen: annetun vasemman kulman lappeesta, muuten harja vaakasuora (sama kuin oikealla)
    //  - etu 1 vasen / etu 2 vasen: oman lappeen tasosta (oikea kulma + harjan kaksi pistettä)
    // Kiilan kallistus riippuu seinän korkeimmasta kulmasta, joten lasketaan muutaman kierroksen.
    const taso3 = (a, b, c) => { const n = vcross(vsub(b, a), vsub(c, a)); return Math.hypot(n[0], n[1], n[2]) < 1e-9 ? null : { n, d: vdot(n, a) }; };
    const osuma = (F, ts, oletus) => {                  // korkeus, jolla piste F(H) osuu tasolle ts
      if (!ts) return oletus;
      const s0 = vdot(ts.n, F(0)) - ts.d, s1 = vdot(ts.n, F(1000)) - ts.d;
      return Math.abs(s1 - s0) < 1e-12 ? oletus : 1000 * s0 / (s0 - s1);
    };
    const ann = k.annettu || { E1V: true, HV: true, E2V: true };
    if (!(ann.E1V && ann.HV && ann.E2V)) {
      for (let kierros = 0; kierros < 6; kierros++) {
        pS = [0, 1, 2, 3].map(j => seina(j, 0));
        if (!ann.HV) {
          if (ann.E1V) HK.vasen = osuma(hVF, taso3(kulma(0)(H[0]), kulma(1)(H[1]), hOF(HK.oikea)), HK.oikea);
          else if (ann.E2V) HK.vasen = osuma(hVF, taso3(kulma(2)(H[2]), kulma(3)(H[3]), hOF(HK.oikea)), HK.oikea);
          else HK.vasen = HK.oikea;
        }
        if (!ann.E1V) H[0] = osuma(kulma(0), taso3(kulma(1)(H[1]), hOF(HK.oikea), hVF(HK.vasen)), H[0]);
        if (!ann.E2V) H[3] = osuma(kulma(3), taso3(kulma(2)(H[2]), hOF(HK.oikea), hVF(HK.vasen)), H[3]);
      }
      pS = [0, 1, 2, 3].map(j => seina(j, 0));
    }
    // Lasketut arvot, jotka poikkeavat suoran piipun oletuksesta (näytetään varoituksena ja kuvassa ≈-merkillä)
    const lasketut = [];
    [['E1V', 'korkE1V', 'etu 1 vasen', H[0], k.korkeudet[0]], ['HV', 'korkHV', 'harja vasen', HK.vasen, k.harjaKork.vasen], ['E2V', 'korkE2V', 'etu 2 vasen', H[3], k.korkeudet[3]]]
      .forEach(([a, kentta, nimi, arvo, oletus]) => { if (!ann[a] && isFinite(arvo) && Math.abs(arvo - oletus) > 0.5) lasketut.push({ kentta, nimi, arvo }); });
    if ([H[0], H[3], HK.vasen].some(x => !isFinite(x) || x <= 0)) return null;
    const hS = [0, 1, 2, 3].map(j => seina(j, h2));
    const ala = [0, 1, 2, 3].map(i => kulma(i)(H[i]));
    const hO = hOF(HK.oikea), hV = hVF(HK.vasen);
    const lape1 = tasoPisteista([ala[0], ala[1], hO, hV]), lape2 = tasoPisteista([ala[2], ala[3], hO, hV]);
    if (!lape1 || !lape2) return null;
    const katto = i => i < 2 ? lape1.rivi : lape2.rivi;
    const B = [0, 1, 2, 3].map(i => ratkaise3([hS[(i + 3) % 4], hS[i], katto(i)]));
    const T = [0, 1, 2, 3].map(i => ratkaise3([hS[(i + 3) % 4], hS[i], [0, 0, 1, zt]]));
    const BH = { 1: ratkaise3([hS[1], lape1.rivi, lape2.rivi]), 3: ratkaise3([hS[3], lape1.rivi, lape2.rivi]) };   // hupun harjapisteet
    if (B.concat(T, [BH[1], BH[3]]).some(p => p.some(x => !isFinite(x)))) return null;
    // Harjan pitää osua sivulle kulmien väliin, ja hupun pitää olla katon yläpuolella
    const valissa = (P, A, Bp) => { const d = vsub(Bp, A), t = vdot(vsub(P, A), d) / (vdot(d, d) || 1); return t > 0.001 && t < 0.999; };
    if (!valissa(BH[1], B[1], B[2]) || !valissa(BH[3], B[0], B[3])) return null;
    if ([0, 1, 2, 3].some(i => B[i][2] >= T[i][2]) || BH[1][2] >= zt || BH[3][2] >= zt) return null;
    const tahkot = [0, 1, 2, 3].map(j => {
      const n = vnorm([hS[j][0], hS[j][1], hS[j][2]]), jj = (j + 1) % 4;
      const pts = [B[j]].concat(BH[j] ? [BH[j]] : [], [B[jj], T[jj], T[j]]);
      return { nimi: SEINAT[j], n, cen: pts.reduce((a, p) => vadd(a, vscale(p, 1 / pts.length)), [0, 0, 0]), Dc: T[j], Cc: T[jj], pts };
    });
    const varoitukset = [];
    if (lasketut.length) varoitukset.push('LASKETTU, EI MITATTU: ' + lasketut.map(x => x.nimi + ' ' + mm(x.arvo) + ' mm').join(', ')
      + '. Laskettu katon tasosta muista korkeuksista. Tarkista mittaamalla, tai syötä mitattu arvo.');
    [[lape1, 1], [lape2, 2]].forEach(([l, nro]) => {
      if (l.heitto > 5) varoitukset.push('Puolen ' + nro + ' lape on kiero: korkeudet heittävät noin ' + Math.round(l.heitto) + ' mm (yksi kohta ei osu samaan tasoon muiden kanssa). Tarkista korkeudet; laskenta käyttää keskimääräistä kattoa.');
    });
    return { kiila: k, C, ala, korkeudet: H, harjaKork: HK, lasketut, harjaPiippu: { oikea: hO, vasen: hV }, lape1, lape2, B, T, BH, tahkot, varoitukset };
  }

  // Tasaisen seinän avaus: yläreuna x-akselille (vasen pää origossa, ulkopuolelta katsottuna), paneeli alapuolella.
  function tasoon(F, TL, TR) {
    const e = vnorm(vsub(TR, TL));
    let u = vnorm(vcross(F.n, e)); if (u[2] < 0) u = vscale(u, -1);
    return P => { const d = vsub(P, TL); return [vdot(d, e), vdot(d, u)]; };
  }

  // Kiila- / mutkaharjapiipun hupun palat. Sama muoto kuin harjaHupunPalat ({ palat, geom }) + malli, symmetrinen, varoitukset.
  // Toimii myös suoralla syötöllä (testi: antaa samat palat kuin harjaHupunPalat).
  function harjaKiilaPalat(vals) {
    const v = vals || {};
    const t0 = PI.laskeHarjapiippu(v, { juuret: false, huppu: false, kansi: false, hattu: false });
    if (t0.virheet.length) return null;
    const m = harjaMalli(v);
    if (!m) return null;
    const g = t0.geom, s = Number(v.sauma) || 0, jako = PI.harjaJakosauma(v), L = Number(v.hsivlisa) || 0;
    const yla = YLA_TYYPIT[v.ylaTyyppi] ? v.ylaTyyppi : 'ulos';
    const reuna = (tyyppi, nurkka, leveys, kulma) => ({ tyyppi, nurkka, s: leveys, w: tyyppi === 'k40' ? 2 * leveys : leveys, kulma: nurkka ? kulma : 90 });
    const F = m.tahkot, B = m.B, T = m.T;
    const nurkka = (j, vasenPaa) => {                  // seinän j kulmasauman kanttausluku (vasen = kulma j, oikea = kulma j + 1)
      const i = vasenPaa ? j : (j + 1) % 4, naapuri = vasenPaa ? (j + 3) % 4 : (j + 1) % 4;
      return nurkkaKulma(F[j], F[naapuri], B[i], T[i]);
    };
    const yht = j => ({ yla, ylaW: Number(v.ylareunaV) || 0, ylaKulma: yla === 'tupla' ? 180 : ylaKulma(F[j], yla), ala: Number(v.alatupla) || 0, harja: true, kiila: true });
    const palat = [];
    // Etukappaleet 1–3 osana: palat tahkolle tasavälein ylä- ja alareunaa pitkin (kuten lapepiipun kiilassa)
    [[0, 1, g.etuJako1 || 1], [2, 2, g.etuJako2 || 1]].forEach(([j, nro, kpl]) => {
      const jj = (j + 1) % 4, f = tasoon(F[j], T[j], T[jj]);
      for (let i = 1; i <= kpl; i++) {
        const a = (i - 1) / kpl, b = i / kpl;
        const TL = lerp3(T[j], T[jj], a), TR = lerp3(T[j], T[jj], b), BL = lerp3(B[j], B[jj], a), BR = lerp3(B[j], B[jj], b);
        const x0 = f(TL)[0], P = f(TR)[0] - x0, siirto = q => { const r = f(q); return [r[0] - x0, r[1]]; };
        palat.push(Object.assign({ nimi: 'Huppu etu ' + nro + (kpl > 1 ? ' osa ' + i : ''), kpl: 1, osa: 'etu', P, ala2d: [siirto(BL), siirto(BR)],
          vasen: i === 1 ? reuna('t90', true, s, nurkka(j, true)) : reuna('k40', false, s), oikea: i === kpl ? reuna('t90', true, s, nurkka(j, false)) : reuna('t90', false, s),
          paat: ['', ''], alaNimet: [''] }, yht(j)));
      }
    });
    // Sivut ulkopuolelta: oikealla etu 1 vasemmalla, vasemmalla etu 2 vasemmalla. Liitosvara L/2 kumpaankin päähän.
    const sivu = (j, puoli) => {
      const jj = (j + 1) % 4, f = tasoon(F[j], T[j], T[jj]);
      const P = f(T[jj])[0] + L, bl = f(B[j]), bh = f(m.BH[j]), br = f(B[jj]);
      const ala = [[bl[0], bl[1]], [bh[0] + L / 2, bh[1]], [br[0] + L, br[1]]];
      const pE1 = j === 1;                              // oikea sivu: vasen pää on etu 1
      const paat = pE1 ? ['etu 1', 'etu 2'] : ['etu 2', 'etu 1'], alaNimet = pE1 ? ['etu 1 -puoli', 'etu 2 -puoli'] : ['etu 2 -puoli', 'etu 1 -puoli'];
      const kV = nurkka(j, true), kO = nurkka(j, false), lisa = ' ' + puoli;
      if (g.sivutJako !== 2) {
        return [Object.assign({ nimi: 'Huppu sivut' + lisa, kpl: 1, osa: 'sivut', P, ala2d: ala, vasen: reuna('k40', true, s, kV), oikea: reuna('k40', true, s, kO),
          paat, alaNimet, harjaX: ala[1][0] }, yht(j))];
      }
      // Poikki harjalta: leikkaus harjan kohdalta kohtisuoraan yläreunaan. Etu 1 -puolelle jakosauma 90° ulos, etu 2 -puolelle 2 × jakosauma.
      const xH = ala[1][0];
      const vasenPala = { P: xH, ala2d: [ala[0], ala[1]] }, oikeaPala = { P: P - xH, ala2d: [[0, ala[1][1]], [ala[2][0] - xH, ala[2][1]]] };
      const e1 = Object.assign(pE1 ? vasenPala : oikeaPala, { nimi: 'Huppu sivu 1' + lisa, paat: pE1 ? ['etu 1', 'harja'] : ['harja', 'etu 1'],
        vasen: pE1 ? reuna('k40', true, s, kV) : reuna('t90', false, jako), oikea: pE1 ? reuna('t90', false, jako) : reuna('k40', true, s, kO), harjaX: pE1 ? xH : 0 });
      const e2 = Object.assign(pE1 ? oikeaPala : vasenPala, { nimi: 'Huppu sivu 2' + lisa, paat: pE1 ? ['harja', 'etu 2'] : ['etu 2', 'harja'],
        vasen: pE1 ? reuna('k40', false, jako) : reuna('k40', true, s, kV), oikea: pE1 ? reuna('k40', true, s, kO) : reuna('k40', false, jako), harjaX: pE1 ? 0 : xH });
      return [e1, e2].map(pa => Object.assign({ kpl: 1, osa: 'sivut', alaNimet: [''] }, pa, yht(j)));
    };
    const oikeat = sivu(1, 'oikea'), vasemmat = sivu(3, 'vasen');
    // Ovatko sivut peilikuvia? Verrataan levitettyjä ääriviivoja (vasen peilattuna) ja kanttauslukuja, kuten lapepiipussa.
    const muoto = (pa, peili) => PL.aihioPisteet(levitaTaso(pa).p, peili).pisteet;
    const symmetrinen = oikeat.every((o, i) => {
      const vk = vasemmat[i], a = muoto(o, false), b = muoto(vk, true);
      return a.length === b.length && a.every((q, k2) => Math.hypot(q.x - b[k2].x, q.y - b[k2].y) < 0.5)
        && Math.abs(o.vasen.kulma - vk.oikea.kulma) < 0.05 && Math.abs(o.oikea.kulma - vk.vasen.kulma) < 0.05 && Math.abs(o.ylaKulma - vk.ylaKulma) < 0.05;
    });
    const sivut = symmetrinen
      ? oikeat.map(o => Object.assign({}, o, { nimi: o.nimi.replace(/ oikea$/, ''), kpl: 2, peili: true }))
      : oikeat.concat(vasemmat);
    const kaikki = palat.concat(sivut);
    kaikki.forEach(pa => { const lv = levitaTaso(pa); pa.listaLev = ylos(lv.p.w); pa.listaPit = ylos(lv.p.h); });
    return { palat: kaikki, geom: g, malli: m, symmetrinen, varoitukset: m.varoitukset };
  }

  // Kiila- / mutkaharjapiipun peltilista: hupun palat 3D-mallista, juuret pisimmän sivun mukaan (Tomi 24.11.: mitataan
  // kuitenkin erikseen), kansi ja hattu leveimmän ja pisimmän yläpään mitan mukaan.
  function laskeKaikkiHarjaKiila(vals, osat) {
    const v = vals || {}, o = osat || {};
    const perus = PI.laskeHarjapiippu(v, o);
    if (perus.virheet.length) return Object.assign(perus, { kiila: true });
    const t = harjaKiilaPalat(v);
    if (!t) return Object.assign(perus, { kiila: true, virheet: ['Kiilan mitat eivät sovi yhteen: tarkista sivujen pituudet, suoran kulman valinta, harjan kohdat ja korkeudet.'] });
    const m = t.malli, a = m.ala, hp = m.harjaPiippu;
    const vaaka = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    const pisin = pts => pts.map(([p, q]) => ({ s: vaaka(p, q), ero: q[2] - p[2] })).reduce((x, y) => Math.hypot(y.s, y.ero) > Math.hypot(x.s, x.ero) ? y : x);
    const p1 = pisin([[a[1], hp.oikea], [a[0], hp.vasen]]), p2 = pisin([[a[2], hp.oikea], [a[3], hp.vasen]]);
    const juuret = o.juuret === false ? [] : PI.laskeHarjapiippu(Object.assign({}, v, { lev1: vaaka(a[0], a[1]), lev2: vaaka(a[2], a[3]),
      suora1: p1.s, suora2: p2.s, korkH: 1000, kork1: 1000 + p1.ero, kork2: 1000 + p2.ero }), { juuret: true, huppu: false, kansi: false, hattu: false }).juuret;
    const km = m.kiila.muoto, levMax = Math.max(km.etu, km.taka), pitMax = Math.max(km.oikea, km.vasen), s2 = Number(v.suora2) || 0;
    const khT = PI.laskeHarjapiippu(Object.assign({}, v, { lev1: levMax, lev2: levMax, suora1: pitMax - s2 }), { juuret: false, huppu: false, kansi: o.kansi !== false, hattu: o.hattu !== false });
    const huppu = o.huppu === false ? [] : t.palat.map(pa => ({ osa: pa.nimi, lev: pa.listaLev, pit: pa.listaPit, kpl: pa.kpl }));
    return { juuret, muut: huppu.concat(khT.muut), virheet: [], kansi: khT.kansi, geom: perus.geom, kiila: true, malli: m, symmetrinen: t.symmetrinen, varoitukset: t.varoitukset };
  }

  // Harjapiippu ylhäältä (kiilan syöttöön, vaihe 5b): etu 1 vasemmalla ja etu 2 oikealla kuten sivukuvassa, oikea sivu alhaalla.
  // Yläpää vihreällä, katon kohta piipun seinillä katkoviivalla, harja keltaisella, kulmissa korkeudet, harjalla korkeus ja matka etu 1:stä.
  function harjaKuvaYlhaalta(vals) {
    const m = harjaMalli(vals);
    if (!m) return '';
    const k = m.kiila, hp = m.harjaPiippu;
    const kaikki = m.C.concat(m.ala.map(p => [p[0], p[1]]));
    const xs = kaikki.map(p => p[0]), ys = kaikki.map(p => p[1]);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const W = 420, MX = 78, MY = 46;
    const sc = Math.min((W - 2 * MX) / (maxY - minY || 1), (300 - 2 * MY) / (maxX - minX || 1));
    const Hk = Math.round((maxX - minX) * sc + 2 * MY), H = Hk + 30;                 // korkeus kuvan mukaan, ei tyhjää tilaa
    const X = p => W / 2 + (p[1] - (minY + maxY) / 2) * sc, Y = p => Hk / 2 + (p[0] - (minX + maxX) / 2) * sc;
    const P = p => X(p).toFixed(1) + ',' + Y(p).toFixed(1);
    const F = 'IBM Plex Mono, monospace';
    const t = (x, y, s, a, c, kok) => '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (kok || 10.5) + '" font-family="' + F + '" fill="' + (c || '#e2eef5') + '" text-anchor="' + (a || 'middle') + '">' + esc(s) + '</text>';
    const katto = [m.ala[0], m.ala[1], hp.oikea, m.ala[2], m.ala[3], hp.vasen];
    let c = '<polygon points="' + katto.map(P).join(' ') + '" fill="none" stroke="#6b8fa8" stroke-dasharray="3,3"/>'
      + '<polygon points="' + m.C.map(P).join(' ') + '" fill="rgba(34,197,94,.10)" stroke="#22c55e" stroke-width="1.6"/>'
      + '<line x1="' + X(hp.oikea).toFixed(1) + '" y1="' + Y(hp.oikea).toFixed(1) + '" x2="' + X(hp.vasen).toFixed(1) + '" y2="' + Y(hp.vasen).toFixed(1) + '" stroke="#f5b942" stroke-width="1.6" stroke-dasharray="6,3"/>';
    const kk = n => k.kiila[n] ? ' (' + (k.kiila[n] > 0 ? '+' : '') + mm(k.kiila[n]) + ')' : '';
    const ala = Math.max(Y(m.C[1]), Y(m.C[2])), yla = Math.min(Y(m.C[0]), Y(m.C[3]));
    // oikea sivu alhaalla, vasen ylhäällä: lähimpänä harjan tiedot, uloimpana sivun pituus
    c += t(X(hp.oikea), ala + 14, 'harja ' + mm(k.harjaKork.oikea) + ' · ' + mm(k.harja.oikea), 'middle', '#f5b942');
    const laskettu = kentta => m.lasketut.some(x => x.kentta === kentta) ? '≈' : '';
    c += t(X(hp.vasen), yla - 8, 'harja ' + laskettu('korkHV') + mm(m.harjaKork.vasen) + ' · ' + mm(k.harja.vasen), 'middle', '#f5b942');
    c += t((X(m.C[1]) + X(m.C[2])) / 2, ala + 29, 'oikea ' + mm(k.muoto.oikea) + kk('oikea'));
    c += t((X(m.C[0]) + X(m.C[3])) / 2, yla - 23, 'vasen ' + mm(k.muoto.vasen) + kk('vasen'));
    const etuX = Math.min(X(m.C[0]), X(m.C[1])) - 34, takaX = Math.max(X(m.C[2]), X(m.C[3])) + 34, keskiY = (Y(m.C[0]) + Y(m.C[1])) / 2;
    c += '<text transform="translate(' + etuX.toFixed(1) + ' ' + keskiY.toFixed(1) + ') rotate(-90)" font-size="10.5" font-family="' + F + '" fill="#e2eef5" text-anchor="middle">etu 1 ' + mm(k.muoto.etu) + esc(kk('etu')) + '</text>';
    c += '<text transform="translate(' + takaX.toFixed(1) + ' ' + ((Y(m.C[2]) + Y(m.C[3])) / 2).toFixed(1) + ') rotate(90)" font-size="10.5" font-family="' + F + '" fill="#e2eef5" text-anchor="middle">etu 2 ' + mm(k.muoto.taka) + esc(kk('taka')) + '</text>';
    // korkeudet kulmissa
    m.C.forEach((p, i) => {
      const vas = i < 2, ylos2 = i === 0 || i === 3;
      const lk = i === 0 ? laskettu('korkE1V') : i === 3 ? laskettu('korkE2V') : '';
      c += t(X(p) + (vas ? -5 : 5), Y(p) + (ylos2 ? -5 : 13), lk + mm(m.korkeudet[i]), vas ? 'end' : 'start', lk ? '#ef4444' : '#f5b942', 9.5);
    });
    // suora kulma
    const Kc = m.C[k.muoto.suora], A = m.C[(k.muoto.suora + 1) % 4], Bq = m.C[(k.muoto.suora + 3) % 4], r = 12 / sc;
    const ua = unit(sub(A, Kc)), ub = unit(sub(Bq, Kc));
    c += '<polyline points="' + [add(Kc, mul(ua, r)), add(add(Kc, mul(ua, r)), mul(ub, r)), add(Kc, mul(ub, r))].map(P).join(' ') + '" fill="none" stroke="#f5b942" stroke-width="1.4"/>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:#1a2332;border-radius:6px">' + c
      + t(6, H - 18, 'ylhäältä, etu 1 vasemmalla · kulmissa korkeudet' + (m.lasketut.length ? ' · ≈ = laskettu' : ''), 'start', '#6b8fa8', 9)
      + t(6, H - 7, '⌐ suora kulma · harja: korkeus · matka etu 1:stä', 'start', '#6b8fa8', 9) + '</svg>';
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
      const lk = m.lasketut.some(x => x.kentta === ['korkeusEV', 'korkeusEO', 'korkeusTO', 'korkeusTV'][i]);
      c += '<text x="' + (X(p[0]) + (ux < 0 ? -6 : 6)) + '" y="' + (Y(p[1]) + (uy < 0 ? 14 : -6)) + '" font-size="9.5" font-family="' + F + '" fill="' + (lk ? '#ef4444' : '#f5b942') + '" text-anchor="' + (ux < 0 ? 'end' : 'start') + '">' + (lk ? '≈' : '') + mm(m.korkeudet[i]) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:#1a2332;border-radius:6px">' + c
      + '<text x="6" y="' + (H - 18) + '" font-size="9" font-family="' + F + '" fill="#6b8fa8">ylhäältä, etu alhaalla · kulmissa korkeudet' + (m.lasketut.length ? ' · ≈ laskettu' : '') + '</text>'
      + '<text x="6" y="' + (H - 7) + '" font-size="9" font-family="' + F + '" fill="#6b8fa8">⌐ = suora kulma · katkoviiva = katon kohta</text></svg>';
  }


  // ---------- Etukuva (v8, 23.11.2026, Tomin Excelin malli) ----------
  // Piippu edestä: leveys ylhäällä, juuren pohjaviiva, ylitys vasen ja oikea alla, päissä Uraan-taitos (kulma: 90 = suoraan alas),
  // juuri nousee piipulle katkoviivalla. Harjapiippu etu 1:n puolelta; etu 2 -puolen ylitykset yläreunassa PEILIKUVANA: ne mitataan
  // etu 2:n edestä, joten etu 2:n vasen näkyy tässä kuvassa oikealla (Tomi 23.11.2026). Piipun korkeus on vain viitteellinen.
  function etukuva(vals) {
    const m = vals || {}, n = x => Number(x) || 0;
    const harja = m.tyyppi === 'harjapiippu';
    const lev1 = harja ? n(m.lev1) : n(m.leveys);
    if (!(lev1 > 0)) return '';
    const lev2 = harja ? (m.lev2 === null || m.lev2 === undefined || m.lev2 === '' ? lev1 : n(m.lev2)) : 0;
    const v1 = harja ? n(m.ylit1V) : n(m.vasen), o1 = harja ? n(m.ylit1O) : n(m.oikea);
    const v2 = n(m.ylit2V), o2 = n(m.ylit2O);
    const ur = n(m.poimu), kul = m.harjakulma === null || m.harjakulma === undefined || m.harjakulma === '' ? 90 : n(m.harjakulma);
    const nousu = n(m.nousu);
    const C1 = '#f1f5f9', C2 = '#64748b', CI = '#38bdf8', CA = '#f59e0b', F = 'IBM Plex Mono, monospace';
    const W = 400, H = 260, cx = W / 2;
    const kokoL = Math.max(v1 + lev1 + o1, harja ? v2 + lev2 + o2 : 0, 1);
    const sc = (W - 90) / kokoL;
    const yTop = harja ? 95 : 62, yBase = harja ? 186 : 190;
    const xL = cx - lev1 * sc / 2, xR = cx + lev1 * sc / 2, xa = xL - v1 * sc, xb = xR + o1 * sc;
    const t = (x, y, s, a) => '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" fill="' + ((a && a.c) || C1) + '" font-size="' + ((a && a.s) || 12) + '" font-family="' + F + '" text-anchor="' + ((a && a.a) || 'middle') + '"' + (a && a.b ? ' font-weight="700"' : '') + '>' + esc(s) + '</text>';
    const l = (x1, y1, x2, y2, c, w, d) => '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + c + '" stroke-width="' + (w || 1) + '"' + (d ? ' stroke-dasharray="' + d + '"' : '') + '/>';
    const mitta = (x1, x2, y, s, c) => x2 - x1 < 1 ? '' : l(x1, y, x2, y, c || CI) + l(x1, y - 4, x1, y + 4, c || CI) + l(x2, y - 4, x2, y + 4, c || CI) + t((x1 + x2) / 2, y + (y > yTop ? 14 : -5), s, { b: true, s: 12 });
    // piippu (pohja on juuren viiva) ja leveys
    let h = '<polyline points="' + [[xL, yBase], [xL, yTop], [xR, yTop], [xR, yBase]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="none" stroke="' + C1 + '" stroke-width="2"/>';
    h += mitta(xL, xR, yTop - 12, mm(lev1));
    // juuri: pohjaviiva ja Uraan-taitokset päissä
    h += l(xa, yBase, xb, yBase, CA, 2.2);
    const L = Math.max(12, Math.min(40, ur * sc)), r = kul * Math.PI / 180;
    if (ur > 0) {
      h += l(xa, yBase, xa - Math.cos(r) * L, yBase + Math.sin(r) * L, CA, 2.2);
      h += l(xb, yBase, xb + Math.cos(r) * L, yBase + Math.sin(r) * L, CA, 2.2);
    }
    if (v1 > 0) h += t(xL - 4, yBase - 6, 'Vasen', { s: 10, c: C2, a: 'end' });
    if (o1 > 0) h += t(xR + 4, yBase - 6, 'Oikea', { s: 10, c: C2, a: 'start' });
    h += mitta(xa, xL, yBase + 26, mm(v1)) + mitta(xR, xb, yBase + 26, mm(o1));
    // juuri nousee piipulle: katkoviiva piipun yli
    if (nousu > 0) {
      const yN = yBase - Math.min(nousu * sc, (yBase - yTop) * 0.45);
      h += l(xL, yN, xR, yN, CA, 1, '4 3') + t(cx, yN - 5, 'juuri nousee ' + mm(nousu), { s: 10, c: CA });
    }
    h += t(cx, H - 8, ur > 0 ? 'Uraan ' + mm(ur) + ' · kulma ' + mm(kul) + '°' : 'Ei uraanta', { s: 10.5, c: CA });
    if (harja) {
      // Etu 2 -puoli (harjan takana) yläreunassa peilikuvana: etu 2:n oikea on tässä kuvassa vasemmalla ja vasen oikealla
      const yH = 48, xL2 = cx - lev2 * sc / 2, xR2 = cx + lev2 * sc / 2;
      h += t(6, 16, 'ETU 2 -PUOLI', { s: 11, b: true, a: 'start' }) + t(100, 16, '(harjan takana, peilikuvana)', { s: 10, c: C2, a: 'start' });
      h += t(6, yTop + 12, 'ETU 1 -PUOLI', { s: 11, b: true, a: 'start' }) + t(6, yTop + 26, '(kuva edestä)', { s: 10, c: C2, a: 'start' });
      if (o2 > 0) h += l(xL2 - o2 * sc, yH, xL2, yH, CA, 1.6, '6 3') + t(xL2 - o2 * sc / 2, yH - 6, 'oikea ' + mm(o2), { s: 11, b: true });
      if (v2 > 0) h += l(xR2, yH, xR2 + v2 * sc, yH, CA, 1.6, '6 3') + t(xR2 + v2 * sc / 2, yH - 6, 'vasen ' + mm(v2), { s: 11, b: true });
      h += l(xL2, yH - 5, xL2, yH + 5, C2) + l(xR2, yH - 5, xR2, yH + 5, C2);
      if (Math.abs(lev2 - lev1) > 0.5) h += t(cx, yH + 4, 'leveys ' + mm(lev2), { s: 10, c: C2 });
    } else h += t(6, 16, 'Edestä', { s: 10, c: C2, a: 'start' });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + h + '</svg>';
  }

  const KPT_PIIPPU_LEVITYS = { YLA_TYYPIT, SAUMAT, kiilaTiedot, ylapaa, hupunMalli, hupunPalat, levitaPala, piirraPala, taitosRivit,
    palaHtml, palaTiedot, levita, SELITE, CSS, laskeKaikki, kuvaYlhaalta, kiilaSivukuva,
    harjaHupunPalat, levitaTaso, laskeKaikkiHarja, harjaSivukuva, harjaSuhde, etukuva,
    harjaKiilaTiedot, harjaMalli, harjaKiilaPalat, laskeKaikkiHarjaKiila, harjaKuvaYlhaalta };
  globalThis.KPT_PIIPPU_LEVITYS = KPT_PIIPPU_LEVITYS;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PIIPPU_LEVITYS;
})();
