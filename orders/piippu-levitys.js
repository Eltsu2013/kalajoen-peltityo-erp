// Kalajoen Peltityö ERP — lapepiipun hupun levityskuvat (orders/piippu-levitys.js)
//
// Jokaisesta hupun palasta levityskuva ulkopuolelta katsottuna: paneeli (todellinen korkeus ilman taitoksia),
// pystysaumat, alatupla ja yläreunan taitos taitosviivoineen, kulmien loveukset, taitostaulukko ja merkintäpisteet.
// Käyttäjät: piippu.html (esikatselu) ja piippu_tuotanto.html (pala kerrallaan tuotannossa).
//
// Vaatii: geom.js, pellit.js (merkintäpisteet) ja piippu-laskenta.js (mitat), tässä järjestyksessä:
//   <script src="geom.js?v=1"></script> <script src="pellit.js?v=1"></script>
//   <script src="piippu-laskenta.js?v=3"></script> <script src="piippu-levitys.js?v=1"></script>
// Nodessa: const L = require('../orders/piippu-levitys.js');   (lataa muut itse)
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kummallakin piippusivulla ja aja testit.
//
// Päätökset (Tomi 20.11.2026, mockup v3 piippu/hupun-levitys-mockup.html):
//  - Pystysauma 20 mm taitetaan 90° ulos. 40 mm sauma = 20 mm suoraan jatkoksi samaan tasoon (nurkassa ei taitosta)
//    + 20 mm tupla 180°, joka kiertää naapurin 90° sauman. Jaetun kappaleen liitoksessa aiempi pala saa 20, myöhempi 40.
//  - Saumojen alapäät leikataan suoraan, 90° sivureunasta.
//  - Alatupla 180° sisään. Yläreunan taitos: Ulos 90° (oletus) / Sisään 90° / Tupla 180° sisään.
//  - Tuplien päät viistetään 45° koko tuplan leveydeltä (taittuu nätisti, ja kuvasta näkee heti, että se on tupla).
//  - Kulman loveus: kulmasta poistetaan sauman leveys × taitoksen leveys. Sisäänpäin taitetun yläreunan päät 45° nurkissa.
(function () {
  const req = typeof require === 'function' ? require : null;
  const PL = globalThis.KPT_PELLIT || (req ? req('./pellit.js') : null);
  const PI = globalThis.KPT_PIIPPU || (req ? req('./piippu-laskenta.js') : null);
  if (!PL || !PI) throw new Error('piippu-levitys.js tarvitsee pellit.js:n ja piippu-laskenta.js:n: lataa ne ensin');

  const mm = v => String(Math.round(v));
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const YLA_TYYPIT = { ulos: 'Ulos 90°', sisaan: 'Sisään 90°', tupla: 'Tupla 180°' };

  // Kulmasaumat ulkopuolelta katsottuna: 't90' = 20 mm 90° ulos, 'k40' = 20 suoraan + 20 tupla (Tomin luonnokset 20.11.)
  const SAUMAT = {
    1: { etu: ['t90', 't90'], sivut: ['k40', 't90'], taka: ['k40', 'k40'] },   // sivu: vasen = etupää (oikea sivu ulkoa katsottuna)
    2: { etu: ['t90', 't90'], sivut: ['k40', 'k40'], taka: ['t90', 't90'] },
  };

  // Hupun palat: leveys laskennan listasta, saumat päätyihin ja todellinen korkeus kummassakin päässä.
  // vals = samat syötöt kuin laskeLapepiippu (profile_data.vals) + ylaTyyppi ('ulos' | 'sisaan' | 'tupla', puuttuva = 'ulos').
  function hupunPalat(vals) {
    const v = vals || {};
    const tulos = PI.laskeLapepiippu(v, { juuret: false, huppu: true, kansi: false, hattu: false });
    const g = tulos.geom;
    const s = Number(v.sauma) || 0, st = v.saumatyyppi === 2 ? 2 : 1;
    const suora = Number(v.suora) || 0;
    const kulmaus = suora > 0 ? g.korkeuserot / suora : 0;               // korkeuden muutos sivun pituusmillimetriä kohti
    const yla = YLA_TYYPIT[v.ylaTyyppi] ? v.ylaTyyppi : 'ulos';
    const palat = [];
    [['etu', 'Huppu etu', v.huppuEtuKpl], ['sivut', 'Huppu sivut', v.huppuSivutKpl], ['taka', 'Huppu taka', v.huppuTakaKpl]].forEach(([osa, alku, n]) => {
      const rivit = tulos.muut.filter(p => p.osa === alku || p.osa.startsWith(alku + ' '));
      const kpl = rivit.length || n || 1;
      let x0 = 0;                                                          // paneelin alku sivulla etunurkasta
      rivit.forEach((rivi, k) => {
        const [ulkoV, ulkoO] = SAUMAT[st][osa];
        const vasen = k === 0 ? { tyyppi: ulkoV, nurkka: true } : { tyyppi: 'k40', nurkka: false };
        const oikea = k === kpl - 1 ? { tyyppi: ulkoO, nurkka: true } : { tyyppi: 't90', nurkka: false };
        [vasen, oikea].forEach(e => { e.w = e.tyyppi === 'k40' ? 2 * s : s; });
        const P = rivi.lev - vasen.w - oikea.w;
        let hV, hO;
        if (osa === 'etu') { hV = hO = g.hEtuTodellinen; }
        else if (osa === 'taka') { hV = hO = g.hTakaTodellinen; }
        else { hV = g.hEtuTodellinen - kulmaus * x0; hO = g.hEtuTodellinen - kulmaus * (x0 + P); }
        x0 += P;
        palat.push({ nimi: rivi.osa, kpl: rivi.kpl, osa, P, hV, hO, vasen, oikea, listaLev: rivi.lev, listaPit: rivi.pit,
          yla, ylaW: Number(v.ylareunaV) || 0, ala: Number(v.alatupla) || 0, s });
      });
    });
    return { palat, geom: g };
  }

  const siisti = poly => poly.filter((q, i) => { const r = poly[(i + 1) % poly.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-9; });

  // Levitetty muoto (y ylöspäin, paneelin vasen yläkulma = 0,0). Palauttaa { p, viivat, lovet }:
  // p on pellit.js:n muotoinen (A2..D2 + flanges), joten aihioPisteet ja merkintaSvgSisalto toimivat sellaisinaan.
  function levitaPala(pa) {
    const s = pa.s, P = pa.P;
    const ala = x => -pa.hV + x * (pa.hV - pa.hO) / P;                  // paneelin alareunan y kohdassa x
    const A2 = [0, ala(0)], B2 = [P, ala(P)], C2 = [P, 0], D2 = [0, 0];
    const flanges = [], viivat = [], lovet = [], alaraja = {};
    const tuplaYla = pa.yla === 'tupla' && pa.ylaW > 0;
    const lovYla = { vasen: pa.yla === 'sisaan' && pa.vasen.nurkka ? pa.ylaW : 0, oikea: pa.yla === 'sisaan' && pa.oikea.nurkka ? pa.ylaW : 0 };
    // Pystysaumat
    [['vasen', pa.vasen, -1], ['oikea', pa.oikea, 1]].forEach(([puoli, e, suunta]) => {
      const xr = puoli === 'vasen' ? 0 : P, yAla = ala(xr), xu = xr + suunta * e.w;
      flanges.push({ poly: [[xr, 0], [xu, 0], [xu, yAla], [xr, yAla]] });   // alapää suoraan 90° sivureunasta
      alaraja[puoli] = [[xu, yAla]];
      if (e.tyyppi === 't90') {
        viivat.push({ p: [xr, 0], q: [xr, yAla], suunta: 'ulos', teksti: mm(s) + ' · 90° ulos' });
      } else {
        const x1 = xr + suunta * s;
        viivat.push({ p: [xr, 0], q: [xr, yAla], suunta: 'ei', teksti: 'nurkka' });
        viivat.push({ p: [x1, 0], q: [x1, yAla], suunta: 'ulos', teksti: mm(s) + ' · 180° tupla', tupla: true });
      }
      if (pa.ylaW > 0) {
        lovet.push(tuplaYla ? [[xr, 0], [xu, 0], [xu, pa.ylaW], [xr - suunta * pa.ylaW, pa.ylaW], [xr, 0]]
                            : [[xr, 0], [xu, 0], [xu, pa.ylaW], [xr - suunta * lovYla[puoli], pa.ylaW]]);
      }
    });
    // Alatupla: alareunan suuntainen kaista, leveys kohtisuoraan, päät viistetty 45° koko leveydeltä
    if (pa.ala > 0) {
      const ex = B2[0] - A2[0], ey = B2[1] - A2[1], L = Math.hypot(ex, ey);
      const nx = ey / L, ny = -ex / L, ux = ex / L, uy = ey / L, v = Math.min(pa.ala, L / 2);
      const kohta = (K, d, t) => [K[0] + nx * d + ux * t, K[1] + ny * d + uy * t];   // d = syvyys reunasta, t = matka reunaa pitkin
      flanges.push({ poly: [A2, B2, kohta(B2, pa.ala - v, 0), kohta(B2, pa.ala, -v), kohta(A2, pa.ala, v), kohta(A2, pa.ala - v, 0)] });
      viivat.push({ p: A2, q: B2, suunta: 'sisaan', teksti: mm(pa.ala) + ' · 180° tupla sisään' });
      [[A2, -1, pa.vasen, 'vasen'], [B2, 1, pa.oikea, 'oikea']].forEach(([K, suunta, e, puoli]) => {
        const xu = K[0] + suunta * e.w, o = kohta(K, pa.ala, 0);
        lovet.push([K, kohta(K, pa.ala - v, 0), kohta(K, pa.ala, -suunta * v), o, [xu, o[1]]].concat(alaraja[puoli].slice().reverse()));
      });
    }
    // Yläreunan taitos
    if (pa.ylaW > 0) {
      const w = pa.ylaW, vy = tuplaYla ? Math.min(w, P / 2) : 0;
      flanges.push({ poly: vy > 0 ? [[0, 0], [P, 0], [P, w - vy], [P - vy, w], [vy, w], [0, w - vy]]
                                  : [[0, 0], [P, 0], [P - lovYla.oikea, w], [lovYla.vasen, w]] });
      const nimi = { ulos: '90° ulos', sisaan: '90° sisään', tupla: '180° tupla sisään' }[pa.yla];
      viivat.push({ p: [0, 0], q: [P, 0], suunta: pa.yla === 'ulos' ? 'ulos' : 'sisaan', teksti: mm(w) + ' · ' + nimi });
    }
    flanges.forEach(f => { f.poly = siisti(f.poly); });
    for (let i = 0; i < lovet.length; i++) lovet[i] = siisti(lovet[i]);
    let pts = [A2, B2, C2, D2];
    flanges.forEach(f => { pts = pts.concat(f.poly); });
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
    const tuplaViivat = viivat.filter(x => x.tupla).map(x => ({ p: x.p, q: x.q }));
    const p = { A2, B2, C2, D2, minX, minY, w: Math.max.apply(null, xs) - minX, h: Math.max.apply(null, ys) - minY,
      flanges: flanges.map(f => ({ poly: f.poly, foldLines: [] })).concat(tuplaViivat.length ? [{ poly: [], foldLines: tuplaViivat }] : []) };
    return { p, viivat, lovet };
  }

  // Levityskuva SVG. ikkuna = { nimi, minX, minY, w, h } piirtää lähikuvan (90 × 90 mm) ilman mittoja.
  let svgNro = 0;
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
        if (Math.abs(v.p[0] - v.q[0]) < 1e-9) {
          const yy = Math.max(Math.min(v.p[1], v.q[1]), k.minY) + k.h * 0.55, tx = X(v.p[0]) + (v.p[0] <= 0 ? -4 : 4);
          c += '<text x="' + tx + '" y="' + Y(yy) + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle" transform="rotate(-90 ' + tx + ' ' + Y(yy) + ')">' + esc(t) + '</text>';
        } else {
          const xx = Math.max(Math.min(v.p[0], v.q[0]), k.minX) + k.w * 0.62;
          const yv = v.p[1] + (v.q[1] - v.p[1]) * (xx - v.p[0]) / ((v.q[0] - v.p[0]) || 1);
          c += '<text x="' + X(xx) + '" y="' + (Y(yv) + (v.p[1] === 0 && v.q[1] === 0 ? -5 : 13)) + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle">' + esc(t) + '</text>';
        }
      });
      c += '<text x="8" y="16" font-size="11" font-weight="600" font-family="' + F + '" fill="#e2eef5">' + esc(ikkuna.nimi) + '</text>';
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + c + '</g></svg>';
    }
    const yt = Y(0) - pa.ylaW * sc - 8;
    c += '<text x="' + (X(0) + X(pa.P)) / 2 + '" y="' + (Y(0) + 14) + '" font-size="11" font-family="' + F + '" fill="#e2eef5" text-anchor="middle">paneeli ' + mm(pa.P) + '</text>';
    const korkeus = (x, h, anchor, dx) => '<text x="' + (X(x) + dx) + '" y="' + (Y(-h / 2) + 4) + '" font-size="11" font-family="' + F + '" fill="#e2eef5" text-anchor="' + anchor + '">' + mm(h) + '</text>';
    c += korkeus(0, pa.hV, 'start', 5) + korkeus(pa.P, pa.hO, 'end', -5);
    lv.viivat.forEach(v => {
      if (v.suunta === 'ei') return;
      const mx = (X(v.p[0]) + X(v.q[0])) / 2, my = (Y(v.p[1]) + Y(v.q[1])) / 2;
      if (Math.abs(v.p[0] - v.q[0]) < 1e-9) {
        const tx = v.p[0] < pa.P / 2 ? X(p.minX) - 10 : X(p.minX + p.w) + 14;
        c += '<text x="' + tx + '" y="' + my + '" font-size="9.5" font-family="' + F + '" fill="#f5b942" text-anchor="middle" transform="rotate(-90 ' + tx + ' ' + my + ')">' + esc(v.teksti) + '</text>';
      } else {
        const yy = v.p[1] === 0 && v.q[1] === 0 ? yt : my + 22;
        c += '<text x="' + mx + '" y="' + yy + '" font-size="10" font-family="' + F + '" fill="#f5b942" text-anchor="middle">' + esc(v.teksti) + '</text>';
      }
    });
    c += '<text x="' + X(p.minX + p.w / 2) + '" y="' + (Y(p.minY) + 30) + '" font-size="11" font-family="' + F + '" fill="#6b8fa8" text-anchor="middle">aihio ' + Math.ceil(p.w - 1e-6) + ' × ' + Math.ceil(p.h - 1e-6) + ' mm</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + c + '</g></svg>';
  }

  // Taitostaulukon rivit: [reuna, mitta, kanttausluku, taitto, huomio]
  function taitosRivit(pa) {
    const sauma = (puoli, e) => e.tyyppi === 't90'
      ? [puoli + ' reuna', mm(pa.s), '90°', 'ulos', e.nurkka ? 'nurkkasauma' : 'jakosauma (aiempi pala)']
      : [puoli + ' reuna', mm(pa.s) + ' + ' + mm(pa.s), '0° + 180°', 'tupla', (e.nurkka ? 'kiertää naapurin sauman' : 'jakosauma (myöhempi pala), kiertää') + ' · yht. ' + mm(2 * pa.s)];
    const rivit = [sauma('Vasen', pa.vasen), sauma('Oikea', pa.oikea)];
    if (pa.ala > 0) rivit.push(['Alareuna', mm(pa.ala), '180°', 'sisään', 'alatupla' + (pa.osa === 'sivut' ? ', katon kaltevuudessa' : '') + ', päät viistetty 45°']);
    if (pa.ylaW > 0) rivit.push(['Yläreuna', mm(pa.ylaW), pa.yla === 'tupla' ? '180°' : '90°', pa.yla === 'ulos' ? 'ulos' : 'sisään',
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
    const lv = levitaPala(pa);
    const aw = Math.ceil(lv.p.w - 1e-6), ah = Math.ceil(lv.p.h - 1e-6);
    const lahi = (nimi, x0, y0) => piirraPala(pa, lv, { nimi, minX: x0, minY: y0, w: 90, h: 90 });
    const A = lv.p.A2, D = lv.p.D2, B = lv.p.B2, C = lv.p.C2;
    const symm = pa.vasen.tyyppi === pa.oikea.tyyppi && pa.vasen.nurkka === pa.oikea.nurkka && Math.abs(pa.hV - pa.hO) < 0.01;
    let kulmat = lahi('vasen alakulma', A[0] - pa.vasen.w - 15, A[1] - pa.ala - 25) + lahi('vasen yläkulma', D[0] - pa.vasen.w - 15, D[1] - 60);
    if (!symm) kulmat += lahi('oikea alakulma', B[0] - 75 + pa.oikea.w, B[1] - pa.ala - 25) + lahi('oikea yläkulma', C[0] - 75 + pa.oikea.w, C[1] - 60);
    const pisteita = PL.aihioPisteet(lv.p).pisteet.length;
    const taulu = '<table class="plv-taulu"><tr><th>Reuna</th><th>Mitta</th><th>Kanttaus</th><th>Taitto</th><th>Huom.</th></tr>'
      + taitosRivit(pa).map(r => '<tr>' + r.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</table>';
    const korkeus = mm(pa.hV) + (Math.abs(pa.hV - pa.hO) > 0.5 ? ' → ' + mm(pa.hO) : '');
    return '<details class="plv-pala"' + (o.auki ? ' open' : '') + '><summary><span class="plv-nimi">' + esc(pa.nimi) + ' · ' + (o.kpl || pa.kpl) + ' kpl</span>'
      + '<span class="plv-meta">aihio ' + aw + ' × ' + ah + '</span><span class="plv-meta">korkeus ' + korkeus + '</span>'
      + (pa.osa === 'sivut' ? '<span class="plv-meta">toinen sivu peilikuva</span>' : '') + '</summary>'
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

  const KPT_PIIPPU_LEVITYS = { YLA_TYYPIT, SAUMAT, hupunPalat, levitaPala, piirraPala, taitosRivit, palaHtml, SELITE, CSS };
  globalThis.KPT_PIIPPU_LEVITYS = KPT_PIIPPU_LEVITYS;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PIIPPU_LEVITYS;
})();
