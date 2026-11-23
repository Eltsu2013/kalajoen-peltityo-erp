// Kalajoen Peltityö ERP — pelti-osat (orders/pellit.js)
//
// Pelti-osa = tasomainen kappale, jonka reunoille tulee taitoksia ja saumoja. Tämä tiedosto
// avaa 3D-muodon sivut tasoksi todellisin mitoin, laskee taitosten kanttausluvut, jiirit ja
// loveukset, aihion ääriviivan ja merkintäpisteet, yhdistää samanlaiset kappaleet ja piirtää
// levityskuvan (ruutu- ja paperiteema).
//
// Vaihe 1 (20.11.2026): siirretty Huuva-mockupista (v16) sellaisenaan, joten funktiot puhuvat
// vielä huuvan kieltä (Etu / Oikea / Taka / Vasen, kouru). Piippujen tarvitsemat yleistykset
// (alareunan pisteiden omat korkeudet, viisikulmainen harjasivu) tehdään vaiheissa 3–4,
// ja testit vahtivat, ettei huuvan laskenta muutu.
//
// Vaatii geom.js:n:  <script src="geom.js?v=1"></script>  <script src="pellit.js?v=2"></script>
// v3 (23.11.2026): aihion koko kuvissa ylöspäin pyöristettynä (aiemmin normaalisti), muuten ennallaan.
// v2 (20.11.2026): p.paneeli valinnainen paneelin ääriviiva (harjapiipun viisikulmainen sivu), muuten ennallaan.
// Nodessa:           const P = require('../orders/pellit.js');   (lataa geom.js:n itse)
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kaikilla sivuilla, jotka lataavat sen.
(function () {
  const G = globalThis.KPT_GEOM || (typeof require === 'function' ? require('./geom.js') : null);
  if (!G) throw new Error('pellit.js tarvitsee geom.js:n: lataa se ensin');
  const {
    dist3, vsub, vscale, vdot, vcross, vnorm, vmid, vcentroid, kulmaAsteina, polygonSign,
    yhdistaMonikulmiot, fmtPiste, esc,
  } = G;

  // ---------- Huuvan sivujen nimet ----------

  const PANEL_NAMES = ['Etu', 'Oikea', 'Taka', 'Vasen'];
  const PARTITIIVI = { Etu: 'Etua', Oikea: 'Oikeaa', Taka: 'Takaa', Vasen: 'Vasenta' };

  // ---------- Geometria: kolmiointi nelikulmio-nelikulmio-sovitteelle ----------

  function computeCorners(Wb, Db, Wt, Dt, H, dx, dy) {
    const B = [
      [-Wb/2, -Db/2, 0],
      [ Wb/2, -Db/2, 0],
      [ Wb/2,  Db/2, 0],
      [-Wb/2,  Db/2, 0],
    ];
    const T = [
      [dx-Wt/2, dy-Dt/2, H],
      [dx+Wt/2, dy-Dt/2, H],
      [dx+Wt/2, dy+Dt/2, H],
      [dx-Wt/2, dy+Dt/2, H],
    ];
    return { B, T };
  }

  // Litistää yhden sivupaneelin (A-Bc alareunassa, Cc-Dc yläreunassa) tasoon todellisin mitoin.
  // A2 asetetaan origoon ja Bc2 x-akselille — paluuarvo sisältää kaikki neljä 2D-pistettä
  // sekä alkuperäiset 3D-reunamitat (a,b,c,d).
  function flattenSide(A3, Bc3, Cc3, Dc3) {
    const a = dist3(A3, Bc3);
    const b = dist3(Bc3, Cc3);
    const c = dist3(Cc3, Dc3);
    const d = dist3(Dc3, A3);
    const p = dist3(A3, Cc3);

    const A2 = [0, 0];
    const B2 = [a, 0];
    const x = (p*p - b*b + a*a) / (2*a);
    const y = Math.sqrt(Math.max(0, p*p - x*x));
    const C2 = [x, y];

    const pcx = C2[0], pcy = C2[1];
    const a2 = (d*d - c*c + p*p) / (2*p);
    const h2 = Math.max(0, d*d - a2*a2);
    const h = Math.sqrt(h2);
    const footx = a2 * (pcx/p), footy = a2 * (pcy/p);
    const perpx = -pcy/p, perpy = pcx/p;
    const Da = [footx + h*perpx, footy + h*perpy];
    const Db_ = [footx - h*perpx, footy - h*perpy];

    function cross(ax, ay, bx, by) { return ax*by - ay*bx; }
    const signB = cross(C2[0], C2[1], B2[0], B2[1]);
    const signDa = cross(C2[0], C2[1], Da[0], Da[1]);
    const D2 = (Math.sign(signDa) !== Math.sign(signB)) ? Da : Db_;

    return { A2, B2, C2, D2, a, b, c, d, p };
  }

  // Jokainen paneeli: A-Bc alareuna (vasemmalta oikealle ulkopuolelta katsottuna), Cc-Dc yläreuna.
  // Renkaassa Etu → Oikea → Taka → Vasen: paneelin oikea reuna (Bc-Cc) on seuraavan paneelin vasen reuna.
  function paneelimaaritykset(s) {
    const { B, T } = computeCorners(s.Wb, s.Db, s.Wt, s.Dt, s.H, s.dx, s.dy);
    return {
      B, T,
      defs: [
        { name: 'Etu',   A: B[0], Bc: B[1], Cc: T[1], Dc: T[0] },
        { name: 'Oikea', A: B[1], Bc: B[2], Cc: T[2], Dc: T[1] },
        { name: 'Taka',  A: B[2], Bc: B[3], Cc: T[3], Dc: T[2] },
        { name: 'Vasen', A: B[3], Bc: B[0], Cc: T[0], Dc: T[3] },
      ],
    };
  }

  function laskeLevitys(s) {
    const { defs } = paneelimaaritykset(s);
    return defs.map(sd => Object.assign({ name: sd.name }, flattenSide(sd.A, sd.Bc, sd.Cc, sd.Dc)));
  }

  // 3D-tiedot jokaisesta paneelista (myös pois valituista — niiden tasoa tarvitaan naapurin kulmiin).
  // n = ulospäin osoittava yksikkönormaali, cen = paneelin keskipiste.
  function geomPaneelit(s) {
    const { B, T, defs } = paneelimaaritykset(s);
    const hoodCenter = vcentroid(B.concat(T));
    const list = defs.map(sd => {
      const cen = vcentroid([sd.A, sd.Bc, sd.Cc, sd.Dc]);
      let n = vnorm(vcross(vsub(sd.Bc, sd.A), vsub(sd.Dc, sd.A)));
      if (vdot(n, vsub(cen, hoodCenter)) < 0) n = vscale(n, -1);
      return Object.assign({ cen, n }, sd);
    });
    return { list, topCenter: vcentroid(T), bottomCenter: vcentroid(B) };
  }

  // Yksikkövektori, joka on tason (normaali n) sisällä, kohtisuorassa reunaa e vastaan
  // ja osoittaa reunalta kohti tason keskipistettä cen.
  function tasonSisaanpain(n, e, cen, M) {
    let u = vnorm(vcross(n, e));
    if (vdot(u, vsub(cen, M)) < 0) u = vscale(u, -1);
    return u;
  }

  // Sivutaitoksen kanttausluku (aste, jonka pelti käännetään suorasta).
  // Taitos asettuu naapuripaneelin sisäpintaa vasten; jos naapuria ei valmisteta,
  // taitos kääntyy seinän suuntaiseksi (pystytaso naapurin alareunan kautta), ulos huuvasta päin.
  function sivuTaitosKulma(gp, i, puoli, panelOn, seinaDir) {
    const P = gp.list[i];
    const j = (puoli === 'left') ? (i + 3) % 4 : (i + 1) % 4;
    const N = gp.list[j];
    const E1 = (puoli === 'left') ? P.Dc : P.Bc;
    const E2 = (puoli === 'left') ? P.A : P.Cc;
    const e = vnorm(vsub(E2, E1));
    const M = vmid(E1, E2);
    const dP = vscale(tasonSisaanpain(P.n, e, P.cen, M), -1);   // paneelin pintaa reunan yli jatkava suunta
    let dF, vastaan;
    if (panelOn[N.name]) {
      dF = tasonSisaanpain(N.n, e, N.cen, M);                    // naapurin sisäpintaa pitkin, naapurin sisään
      vastaan = N.name;
    } else {
      const eb = vsub(N.Bc, N.A);                                // naapurin alareuna on seinän suuntainen
      const nW = vnorm([eb[1], -eb[0], 0]);                      // seinän vaakasuora normaali
      dF = vnorm(vcross(nW, e));
      if (vdot(dF, P.n) < 0) dF = vscale(dF, -1);                // ulos huuvasta päin
      if (seinaDir === 'sisaan') dF = vscale(dF, -1);            // piilokiinnitys: taitos huuvan sisään, seinän tasoa pitkin
      vastaan = 'seinä';
    }
    // e = reunan suunta (E1 → E2), dF = taitoksen suunta asennettuna (yksikkövektorit). Näillä lasketaan päiden vaakaleikkaus.
    return { angle: kulmaAsteina(dP, dF), vastaan, suunta: vastaan === 'seinä' ? (seinaDir === 'sisaan' ? 'sisään' : 'ulos') : 'sisään', e, dF };
  }

  // Yläreunan taitos: 'sisaan' = vaakasuora huuvan sisään, 'ylos' = pystysuoraan ylös (esim. putkea varten),
  // 'ulos' = vaakasuora ulospäin (vanha, ei enää käyttöliittymässä; säilytetty testejä varten).
  // Kulma riippuu paneelin kaltevuudesta.
  function ylaTaitosKulma(gp, i, suunta) {
    const P = gp.list[i];
    const E1 = P.Cc, E2 = P.Dc;
    const e = vnorm(vsub(E2, E1));
    const M = vmid(E1, E2);
    const dP = vscale(tasonSisaanpain(P.n, e, P.cen, M), -1);
    if (suunta === 'ylos') {
      // paneeli kallistuu sisäänpäin ylöspäin mentäessä, joten pystyyn kääntyminen on kohti katsojaa (ulos)
      return { angle: kulmaAsteina(dP, [0, 0, 1]), vastaan: 'pystysuora, ylös', suunta: 'ulos' };
    }
    let h = vnorm(vcross(e, [0, 0, 1]));
    const toCenter = vsub(gp.topCenter, M); toCenter[2] = 0;
    if (vdot(h, toCenter) < 0) h = vscale(h, -1);                // sisäänpäin
    if (suunta === 'ulos') h = vscale(h, -1);
    return { angle: kulmaAsteina(dP, h), vastaan: (suunta === 'ulos' ? 'vaakasuora, ulos' : 'vaakasuora, sisään'), suunta: (suunta === 'ulos' ? 'ulos' : 'sisään') };
  }

  // Alareunan kourun kanttausluvut paneelin reunasta ulospäin:
  // pohja (vaakasuora, ulos huuvasta) → nousu (pystyyn) → tupla (180°).
  // Pohjan kulma riippuu paneelin kaltevuudesta, nousu ja tupla ovat vakioita.
  function alaKouruKulma(gp, i, floor, rise, hem) {
    const P = gp.list[i];
    const E1 = P.A, E2 = P.Bc;
    const e = vnorm(vsub(E2, E1));
    const M = vmid(E1, E2);
    const dP = vscale(tasonSisaanpain(P.n, e, P.cen, M), -1);   // paneelin pintaa alareunan yli jatkava suunta
    let h = vnorm(vcross(e, [0, 0, 1]));
    const toCenter = vsub(gp.bottomCenter, M); toCenter[2] = 0;
    if (vdot(h, toCenter) > 0) h = vscale(h, -1);                // ulos huuvasta päin
    const pohjaKulma = kulmaAsteina(dP, h);
    const nousuKulma = kulmaAsteina(h, [0, 0, 1]);
    const segments = [];
    if (floor > 0) segments.push({ nimi: 'pohja', w: floor, angle: pohjaKulma, suunta: 'ulos' });
    if (rise > 0) segments.push({ nimi: 'nousu', w: rise, angle: nousuKulma, suunta: 'ulos' });
    if (hem > 0) segments.push({ nimi: 'tupla', w: hem, angle: 180, suunta: 'ulos' });
    return { angle: pohjaKulma, vastaan: 'kouru', segments };
  }

  // Alareunan vaakasuora taitos huuvan sisään (+ valinnainen tupla päähän).
  // Taitoksen suunta: 'sisään' = pelti taittuu poispäin katsojasta levityskuvassa (levityskuva on ulkopuolelta).
  function alaSisaanKulma(gp, i, w, hem) {
    const P = gp.list[i];
    const E1 = P.A, E2 = P.Bc;
    const e = vnorm(vsub(E2, E1));
    const M = vmid(E1, E2);
    const dP = vscale(tasonSisaanpain(P.n, e, P.cen, M), -1);
    let h = vnorm(vcross(e, [0, 0, 1]));
    const toCenter = vsub(gp.bottomCenter, M); toCenter[2] = 0;
    if (vdot(h, toCenter) < 0) h = vscale(h, -1);                // sisäänpäin
    const kulma = kulmaAsteina(dP, h);
    const segments = [];
    if (w > 0) segments.push({ nimi: 'taitos', w, angle: kulma, suunta: 'sisään' });
    if (hem > 0) segments.push({ nimi: 'tupla', w: hem, angle: 180, suunta: 'sisään' });
    return { angle: kulma, vastaan: 'sisäänpäin', segments };
  }

  // Kaksi 180° tuplaa peräkkäin samaan suuntaan (huuvan sisäpuolelle) — reuna näyttää suoralta.
  function alaTuplatKulma(d1, d2) {
    const segments = [];
    if (d1 > 0) segments.push({ nimi: 'tupla 1', w: d1, angle: 180, suunta: 'sisään' });
    if (d2 > 0) segments.push({ nimi: 'tupla 2', w: d2, angle: 180, suunta: 'sisään' });
    return { angle: 180, vastaan: 'kaksi tuplaa', segments };
  }

  // Laskee valmistettavat paneelit levitettyinä taitoksineen.
  // opts = { panelOn:{Etu,Oikea,Taka,Vasen}, sideW:{Etu:{L,R},...}, top:{on,w,dir} }
  function laskeKaikki(s, opts) {
    const flat = laskeLevitys(s);
    const gp = geomPaneelit(s);
    const out = [];
    flat.forEach((p, i) => {
      if (!opts.panelOn[p.name]) return;
      const pts = [p.A2, p.B2, p.C2, p.D2];
      const sgn = polygonSign(pts) >= 0 ? 1 : -1;
      const flanges = [];

      function lisaaTaitos(kind, label, w, P2, Q2, angleFn) {
        if (!(w > 0)) return;
        const ex = Q2[0] - P2[0], ey = Q2[1] - P2[1];
        const len = Math.sqrt(ex*ex + ey*ey);
        const nx = sgn * ey / len, ny = -sgn * ex / len;   // ulospäin paneelista
        const ka = angleFn();
        // Sivutaitoksen päät leikataan VAAKAAN (v10): kun taitos on käännetty paikalleen, sen ala- ja yläpää ovat
        // tasan huuvan ala- ja yläreunan tasossa. Reuna on vino, joten kohtisuora pää ei olisi vaakasuorassa.
        // Taitoksen ulkoreunan pisteitä siirretään reunan suuntaan matkan siirto verran, jolloin ulkopisteen
        // korkeus (z) on sama kuin reunan päätepisteen: siirto * e_z + w * dF_z = 0.
        let siirto = 0;
        if ((kind === 'left' || kind === 'right') && ka.e && ka.dF && Math.abs(ka.e[2]) > 1e-3) {
          siirto = -w * ka.dF[2] / ka.e[2];
        }
        const ux = ex / len, uy = ey / len;
        const poly = [P2, Q2,
          [Q2[0] + w*nx + siirto*ux, Q2[1] + w*ny + siirto*uy],
          [P2[0] + w*nx + siirto*ux, P2[1] + w*ny + siirto*uy]];
        flanges.push({ kind, label, w, angle: ka.angle, vastaan: ka.vastaan, suunta: ka.suunta, segments: ka.segments, nx, ny, len, poly, siirto, e: ka.e, dF: ka.dF,
          outerMid: [(poly[2][0] + poly[3][0]) / 2, (poly[2][1] + poly[3][1]) / 2] });
      }

      const sw = opts.sideW[p.name] || { L: 0, R: 0 };
      lisaaTaitos('left',  'Vasen reuna',  sw.L, p.D2, p.A2, () => sivuTaitosKulma(gp, i, 'left',  opts.panelOn, opts.sideDir && opts.sideDir[p.name] && opts.sideDir[p.name].L));
      lisaaTaitos('right', 'Oikea reuna',  sw.R, p.B2, p.C2, () => sivuTaitosKulma(gp, i, 'right', opts.panelOn, opts.sideDir && opts.sideDir[p.name] && opts.sideDir[p.name].R));
      if (opts.top) {
        // Uusi muoto: top.type per paneeli ('ei' | 'sisaan' | 'ylos'). Vanha muoto: top.on + top.dir (koskee kaikkia, ei loveuksia).
        const ylaUusi = !!opts.top.type;
        const yTyyppi = ylaUusi ? (opts.top.type[p.name] || 'ei') : (opts.top.on ? (opts.top.dir === 'ulos' ? 'ulos' : 'sisaan') : 'ei');
        if (yTyyppi !== 'ei' && opts.top.w > 0) {
          lisaaTaitos('top', 'Yläreuna', opts.top.w, p.C2, p.D2, () => ylaTaitosKulma(gp, i, yTyyppi));
          const f = flanges[flanges.length - 1];
          // 45° loveus vaakasuoran sisäänpäin taitoksen päissä, jos naapurillakin on sama
          if (ylaUusi && yTyyppi === 'sisaan' && opts.top.loveus !== false) {
            const wN = opts.top.w;
            const nbC = PANEL_NAMES[(i + 1) % 4], nbD = PANEL_NAMES[(i + 3) % 4];       // C2-pää: seuraava paneeli, D2-pää: edellinen
            const naapuri = nimi => opts.panelOn[nimi] && opts.top.type[nimi] === 'sisaan';
            let lovC = naapuri(nbC), lovD = naapuri(nbD);
            if (f.len <= 2 * wN) { lovC = false; lovD = false; }
            if (lovC || lovD) {
              const ux = (p.D2[0] - p.C2[0]) / f.len, uy = (p.D2[1] - p.C2[1]) / f.len;
              const flat = (t, d) => [p.C2[0] + t*ux + d*f.nx, p.C2[1] + t*uy + d*f.ny];
              const tLo = lovC ? wN : 0, tHi = lovD ? f.len - wN : f.len;
              f.poly = [flat(0, 0), flat(f.len, 0), flat(tHi, wN), flat(tLo, wN)];
              f.loveus = { C: lovC ? wN : 0, D: lovD ? wN : 0 };
            } else {
              f.loveus = { C: 0, D: 0 };
            }
          }
        }
      }

      const bt = opts.bottom;
      if (bt) {
        // Taaksepäin yhteensopivuus: vanha muoto { on:{...}, floor, rise, hem } = kouru ilman jiirejä
        const uusiMuoto = !!bt.type;
        let tyyppi = uusiMuoto ? bt.type[p.name] : (bt.on && bt.on[p.name] ? 'kouru' : 'ei');
        let prof = null;
        if (tyyppi === 'kouru' && bt.floor > 0) prof = { nimi: 'kouru', fn: () => alaKouruKulma(gp, i, bt.floor, bt.rise, bt.hem) };
        else if (tyyppi === 'sisaan' && bt.inW > 0) prof = { nimi: 'sisään', fn: () => alaSisaanKulma(gp, i, bt.inW, bt.inHem || 0) };
        else if (tyyppi === 'tuplat' && ((bt.d1 || 0) + (bt.d2 || 0)) > 0) prof = { nimi: '2×tupla', fn: () => alaTuplatKulma(bt.d1 || 0, bt.d2 || 0) };
        if (prof) {
          const ka = prof.fn();
          const total = ka.segments.reduce((a, sg) => a + sg.w, 0);
          lisaaTaitos('bottom', 'Alareuna (' + prof.nimi + ')', total, p.A2, p.B2, () => ka);
          const f = flanges[flanges.length - 1];
          f.profNimi = prof.nimi;

          // Päätykäsittely kulmissa. A2-pää (vasen) rajoittuu edelliseen paneeliin, B2-pää (oikea) seuraavaan.
          //  - kouru: jiiri (45°), jos naapurilla on myös kouru; pidennys = naapurin pohja + OMA lisämitta
          //  - sisäänpäin taitos: 45° loveus, jos naapurilla on myös sisäänpäin taitos
          //  - muuten pää jää suoraksi
          const nbS = PANEL_NAMES[(i + 3) % 4], nbE = PANEL_NAMES[(i + 1) % 4];
          const naapuriOn = (nimi, tyyppiNimi, leveys) => uusiMuoto && opts.panelOn[nimi] && bt.type[nimi] === tyyppiNimi && leveys > 0;
          const lisa = Math.max(0, (typeof bt.lisa === 'object' && bt.lisa !== null) ? (bt.lisa[p.name] || 0) : (bt.lisa || 0));
          const ex = (p.B2[0] - p.A2[0]) / f.len, ey = (p.B2[1] - p.A2[1]) / f.len;
          const flat = (t, d) => [p.A2[0] + t*ex + d*f.nx, p.A2[1] + t*ey + d*f.ny];
          const aLen = f.len, fl = ka.segments[0].w;
          let jiiriS = false, jiiriE = false, loveusS = false, loveusE = false;
          let fN = 0;                                              // viereisen paneelin vastaavan osan leveys
          if (prof.nimi === 'kouru') {
            fN = bt.floor;
            jiiriS = naapuriOn(nbS, 'kouru', bt.floor);
            jiiriE = naapuriOn(nbE, 'kouru', bt.floor);
          } else if (prof.nimi === 'sisään' && bt.loveus !== false) {
            fN = bt.inW;
            loveusS = naapuriOn(nbS, 'sisaan', bt.inW);
            loveusE = naapuriOn(nbE, 'sisaan', bt.inW);
            if (aLen <= 2 * fN) { loveusS = false; loveusE = false; }   // liian lyhyt reuna loveuksille
          }
          let tLo = 0, tHi = aLen;
          const loc = [];
          if (prof.nimi === 'kouru') {
            tLo = jiiriS ? -lisa - fN : 0; tHi = jiiriE ? aLen + lisa + fN : aLen;
            loc.push(jiiriS ? [-lisa, 0] : [0, 0]);
            loc.push(jiiriE ? [aLen + lisa, 0] : [aLen, 0]);
            if (jiiriE) loc.push([tHi, fl]);
            loc.push([tHi, total]);
            loc.push([tLo, total]);
            if (jiiriS) loc.push([tLo, fl]);
          } else {
            // loveus: päätyviiva kulkee 45° sisäänpäin taitoksen alareunasta taitoksen ulkoreunaan (syvyys fl)
            tLo = loveusS ? fN : 0; tHi = loveusE ? aLen - fN : aLen;
            loc.push([0, 0]);
            loc.push([aLen, 0]);
            if (loveusE) loc.push([tHi, fl]);
            loc.push([tHi, total]);
            loc.push([tLo, total]);
            if (loveusS) loc.push([tLo, fl]);
          }
          // poista peräkkäiset kaksoispisteet (esim. kun tupla = 0)
          const dedup = loc.filter((q, k) => { const r = loc[(k + 1) % loc.length]; return !(Math.abs(q[0] - r[0]) < 1e-9 && Math.abs(q[1] - r[1]) < 1e-9); });
          f.poly = dedup.map(q => flat(q[0], q[1]));
          if (prof.nimi === 'kouru') f.jiiri = { S: jiiriS ? fN + lisa : 0, E: jiiriE ? fN + lisa : 0, lisa };
          if (prof.nimi === 'sisään') f.loveus = { S: loveusS ? fN : 0, E: loveusE ? fN : 0 };
          f.foldLines = [];
          let off = 0;
          for (let k = 0; k < f.segments.length - 1; k++) {
            off += f.segments[k].w;
            f.foldLines.push({ p: flat(tLo, off), q: flat(tHi, off), sisaan: f.segments[k + 1].suunta === 'sisään' });
          }
          f.lblPos = flat(aLen / 2, total / 2);
        }
      }

      let allPts = pts.slice();
      flanges.forEach(f => { allPts = allPts.concat(f.poly); });
      const xs = allPts.map(q => q[0]), ys = allPts.map(q => q[1]);
      const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      // Paneelin todellinen korkeus (kohtisuora etäisyys alareunasta yläreunaan, ilman taitoksia)
      const abx = p.B2[0] - p.A2[0], aby = p.B2[1] - p.A2[1], abl = Math.sqrt(abx*abx + aby*aby);
      const dist = q => Math.abs((q[0] - p.A2[0]) * aby - (q[1] - p.A2[1]) * abx) / abl;
      const hp = (dist(p.C2) + dist(p.D2)) / 2;
      out.push(Object.assign({}, p, { flanges, minX, minY, w: maxX - minX, h: maxY - minY, hp }));
    });
    return out;
  }

  // ---------- Levityskuvan piirto (SVG), ruutu- ja paperiteema ----------

  // Asettelee paneelit joko yhteen tai kahteen riviin (se joka antaa suuremman mittakaavan).
  const TEEMA_RUUTU = { paneeli: '#f97316', taitos: '#e8a020', taitosTaus: 'rgba(232,160,32,0.14)', mitta: '#c9c4b8', himmea: '#847f72', nimi: '#ededf0', halo: '#3d3426' };
  // Aihion koko kuvissa ylöspäin täyteen milliin, kuten listoissa (Tomi 23.11.2026: mieluummin hieman iso kuin liian pieni)
  const aihioMm = x => Math.ceil(x - 1e-6);
  const TEEMA_PAPERI = { paneeli: '#000000', taitos: '#444444', taitosTaus: 'rgba(0,0,0,0.07)', mitta: '#000000', himmea: '#555555', nimi: '#000000', halo: '#ffffff' };

  // Palauttaa levityskuvan SVG-sisällön annetuille (ryhmitellyille) paneeleille.
  function levitysSvgSisalto(panels, W, Hh, T) {
    const margin = 14, gapMM = 150, gapPx = 18, labelPx = 30;
    const n = panels.length;
    const drawW = W - 2*margin;

    function suunnitelma(nRows) {
      const perRow = Math.ceil(n / nRows);
      const rows = [];
      for (let r = 0; r < nRows; r++) {
        const grp = panels.slice(r*perRow, (r+1)*perRow);
        if (grp.length) rows.push(grp);
      }
      let maxRowW = 0, sumH = 0;
      rows.forEach(grp => {
        const rowW = grp.reduce((a, p) => a + p.w, 0) + gapMM * (grp.length - 1);
        maxRowW = Math.max(maxRowW, rowW);
        sumH += Math.max.apply(null, grp.map(p => p.h));
      });
      const fixedPx = rows.length * labelPx + (rows.length - 1) * gapPx;
      const drawH = Hh - 2*margin - fixedPx;
      const scale = Math.min(drawW / Math.max(1, maxRowW), drawH / Math.max(1, sumH));
      return { rows, scale };
    }

    let best = suunnitelma(1);
    if (n >= 2) {
      const p2 = suunnitelma(2);
      if (p2.scale > best.scale * 1.05) best = p2;
    }
    const scale = best.scale;

    let c = '', yCursor = margin;
    best.rows.forEach(grp => {
      const rowHmm = Math.max.apply(null, grp.map(p => p.h));
      const rowWmm = grp.reduce((a, p) => a + p.w, 0) + gapMM * (grp.length - 1);
      const rowBottom = yCursor + rowHmm * scale;
      const x0 = margin + (drawW - rowWmm * scale) / 2;
      let curMM = 0;
      grp.forEach(p => {
        const map = pt => [x0 + (curMM + (pt[0] - p.minX)) * scale, rowBottom - (pt[1] - p.minY) * scale];

        // Taitokset ensin (alle), sitten paneelin ääriviiva
        p.flanges.forEach(f => {
          const pts = f.poly.map(map).map(q => q.join(',')).join(' ');
          c += '<polygon points="' + pts + '" fill="' + T.taitosTaus + '" stroke="' + T.taitos + '" stroke-width="1.1"/>';
          if (f.kind === 'bottom') {
            // Alareunan taitosviivat (esim. pohja | nousu | tupla) ja kokonaismitta suikaleen sisällä
            (f.foldLines || []).forEach(fl => {
              const l1 = map(fl.p), l2 = map(fl.q);
              c += '<line x1="' + l1[0] + '" y1="' + l1[1] + '" x2="' + l2[0] + '" y2="' + l2[1] + '" stroke="' + T.taitos + '" stroke-width="0.8" stroke-dasharray="' + (fl.sisaan ? '6,2,1.5,2' : '2,2') + '"/>';
            });
            if (f.w * scale >= 9) {
              const mc = map(f.lblPos);
              c += '<text x="' + mc[0] + '" y="' + (mc[1] + 3) + '" font-size="8" font-family="IBM Plex Mono, monospace" fill="' + T.taitos + '" text-anchor="middle" stroke="' + T.halo + '" stroke-width="2.5" paint-order="stroke">' + (f.profNimi || 'kouru') + ' ' + Math.round(f.w) + '</text>';
            }
            return;
          }
          const om = map(f.outerMid);
          const mx = om[0], my = om[1];
          const sx = f.nx, sy = -f.ny;   // ruutukoordinaatit (y käännetty)
          const teksti = Math.round(f.w) + '·' + Math.round(f.angle) + '°';
          if (Math.abs(sx) > 0.35) {
            // sivutaitos: pystysuuntainen teksti taitoksen ulkopuolella (ei mene naapuripaneelin päälle)
            const tx = mx + sx * 7, ty = my;
            c += '<text x="' + tx + '" y="' + ty + '" font-size="8" font-family="IBM Plex Mono, monospace" fill="' + T.taitos + '" text-anchor="middle" transform="rotate(-90 ' + tx + ' ' + ty + ')">' + teksti + '</text>';
          } else {
            const tx = mx, ty = my + sy * 5 + 3;
            c += '<text x="' + tx + '" y="' + ty + '" font-size="8" font-family="IBM Plex Mono, monospace" fill="' + T.taitos + '" text-anchor="middle">' + teksti + '</text>';
          }
        });

        const A = map(p.A2), B = map(p.B2), C = map(p.C2), D = map(p.D2);
        const pts = [A, B, C, D].map(pp => pp.join(',')).join(' ');
        c += '<polygon points="' + pts + '" fill="none" stroke="' + T.paneeli + '" stroke-width="1.5"/>';
        // Pituusmitat paneelin sisäpuolella (ettei taitokset peitä niitä)
        c += '<text x="' + ((A[0]+B[0])/2) + '" y="' + (Math.max(A[1], B[1]) - 5) + '" font-size="9" font-family="IBM Plex Mono, monospace" fill="' + T.mitta + '" text-anchor="middle">' + Math.round(p.a) + '</text>';
        c += '<text x="' + ((C[0]+D[0])/2) + '" y="' + (Math.max(C[1], D[1]) + 12) + '" font-size="9" font-family="IBM Plex Mono, monospace" fill="' + T.mitta + '" text-anchor="middle">' + Math.round(p.c) + '</text>';
        // Todelliset sivumitat (vasen = d, oikea = b) reunojen suuntaisesti paneelin sisäpuolella
        const cen = [(A[0]+B[0]+C[0]+D[0])/4, (A[1]+B[1]+C[1]+D[1])/4];
        function sivuMitta(P1, P2, mm) {
          const mx = (P1[0]+P2[0])/2, my = (P1[1]+P2[1])/2;
          let ang = Math.atan2(P2[1]-P1[1], P2[0]-P1[0]) * 180 / Math.PI;
          if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
          const dxv = cen[0]-mx, dyv = cen[1]-my, dl = Math.sqrt(dxv*dxv + dyv*dyv) || 1;
          const tx = mx + dxv/dl * 8, ty = my + dyv/dl * 8;
          return '<text x="' + tx + '" y="' + ty + '" font-size="8.5" font-family="IBM Plex Mono, monospace" fill="' + T.mitta + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + ang.toFixed(1) + ' ' + tx + ' ' + ty + ')">' + Math.round(mm) + '</text>';
        }
        c += sivuMitta(D, A, p.d) + sivuMitta(B, C, p.b);
        c += '<text x="' + cen[0] + '" y="' + cen[1] + '" font-size="9" font-family="IBM Plex Mono, monospace" fill="' + T.himmea + '" text-anchor="middle" dominant-baseline="middle">h ' + Math.round(p.hp) + '</text>';
        // Nimi ja aihion koko alle
        const cx = x0 + (curMM + p.w / 2) * scale;
        c += '<text x="' + cx + '" y="' + (rowBottom + 13) + '" font-size="10" font-family="IBM Plex Mono, monospace" fill="' + T.nimi + '" text-anchor="middle" font-weight="600">' + p.name + (p.kpl > 1 ? ' · ' + p.kpl + ' kpl' : '') + '</text>';
        c += '<text x="' + cx + '" y="' + (rowBottom + 24) + '" font-size="8.5" font-family="IBM Plex Mono, monospace" fill="' + T.himmea + '" text-anchor="middle">aihio ' + aihioMm(p.w) + '×' + aihioMm(p.h) + '</text>';
        curMM += p.w + gapMM;
      });
      yCursor = rowBottom + labelPx + gapPx;
    });
    return c;
  }

  // ---------- Samanlaisten kappaleiden yhdistäminen ja taitostaulukon rivit ----------

  // Yhdistää täsmälleen samanlaiset paneelit (sama muoto ja samat taitokset) yhdeksi: "Etu + Taka · 2 kpl".
  // Vertailu: levitetyn muodon koordinaatit (kierretty alareuna x-akselille) + kaikki taitokset kulmineen.
  function ryhmitteleSamat(list) {
    const ryhmat = [];
    list.forEach(p => {
      const vx = p.B2[0] - p.A2[0], vy = p.B2[1] - p.A2[1], L = Math.sqrt(vx*vx + vy*vy);
      const rot = q => { const x = q[0] - p.A2[0], y = q[1] - p.A2[1]; return [(x*vx + y*vy) / L, (-x*vy + y*vx) / L]; };
      const C = rot(p.C2), D = rot(p.D2);
      const fl = p.flanges.map(f => [f.kind, f.w.toFixed(1), f.angle.toFixed(1), f.vastaan === 'seinä' ? 's' : '', f.suunta || '',
        (f.segments || []).map(sg => sg.w.toFixed(1) + ':' + sg.angle.toFixed(1) + ':' + sg.suunta).join(','),
        f.jiiri ? f.jiiri.S.toFixed(1) + '/' + f.jiiri.E.toFixed(1) : '',
        f.loveus ? 'l' + (f.loveus.S !== undefined ? f.loveus.S.toFixed(1) + '/' + f.loveus.E.toFixed(1) : f.loveus.C.toFixed(1) + '/' + f.loveus.D.toFixed(1)) : ''].join('|')).sort().join(';');
      const sig = [L, C[0], C[1], D[0], D[1]].map(v => v.toFixed(1)).join(',') + '#' + fl;
      let g = ryhmat.find(r => r.sig === sig);
      if (!g) { g = { sig, p, names: [] }; ryhmat.push(g); }
      g.names.push(p.name);
    });
    return ryhmat.map(g => Object.assign({}, g.p, { name: g.names.join(' + '), names: g.names, kpl: g.names.length }));
  }

  // Kourun päiden kuvaus: "vasen pää jiirissä (+30 mm), oikea pää suora"
  function jiiriTeksti(f) {
    if (f.jiiri) {
      const osa = (nimi, v) => nimi + ' pää ' + (v > 0 ? 'jiirissä (+' + Math.round(v * 10) / 10 + ' mm)' : 'suora');
      return osa('vasen', f.jiiri.S) + ', ' + osa('oikea', f.jiiri.E);
    }
    if (f.loveus) {
      const osa = (nimi, v) => nimi + ' pää ' + (v > 0 ? '45° loveus (' + Math.round(v * 10) / 10 + ' mm)' : 'suora');
      if (f.loveus.S !== undefined) return osa('vasen', f.loveus.S) + ', ' + osa('oikea', f.loveus.E);
      return osa('vasen', f.loveus.D) + ', ' + osa('oikea', f.loveus.C);       // yläreuna: D2 = vasen, C2 = oikea
    }
    return '';
  }

  function kplTeksti(p) { return p.kpl > 1 ? ' · ' + p.kpl + ' kpl' : ''; }

  // Taitosrivit työkorttiin / tulosluetteloon: [reuna, osa, mitta, kulma, suunta, huomio]
  function taitosRivit(p) {
    const rivit = [];
    const jarj = { left: 0, right: 1, top: 2, bottom: 3 };
    p.flanges.slice().sort((x, y) => jarj[x.kind] - jarj[y.kind]).forEach(f => {
      if (f.kind === 'bottom') {
        f.segments.forEach((sg, k) => rivit.push(['Alareuna (' + f.profNimi + ')', sg.nimi, sg.w, sg.angle, sg.suunta, k === 0 ? jiiriTeksti(f) : '']));
        return;
      }
      const kohde = (f.kind === 'top') ? f.vastaan
        : (f.vastaan === 'seinä' ? 'seinää vasten' : (p.kpl > 1 ? 'naapuripaneelia vasten' : PARTITIIVI[f.vastaan] + ' vasten'));
      const paaHuom = (f.kind === 'left' || f.kind === 'right') ? ' · päät leikattu vaakaan' : '';
      rivit.push([f.label, '', f.w, f.angle, f.suunta || '', kohde + paaHuom + (f.kind === 'top' && f.loveus ? ' · ' + jiiriTeksti(f) : '')]);
    });
    return rivit;
  }

  // ---------- Merkintäpisteet: aihion ääriviivan kulmat numeroituina ----------

  // Aihion leikkauspisteet numeroituina, koordinaatit aihion vasemmasta alakulmasta. Piste 1 on ääriviivan alin (ja siitä vasemmanpuoleisin) kulma,
  // numerointi jatkuu vastapäivään (kuvassa: oikealle alareunaa pitkin, sitten ylös oikeaa reunaa).
  // peili = true: pelti merkataan sisäpinnalta, jolloin kuva on peilikuva (x käännetään aihion leveyden yli, numerointi alkaa uudestaan).
  // p.paneeli (valinnainen, 20.11.2026): paneelin ääriviiva, jos se ei ole nelikulmio A2–B2–C2–D2 (harjapiipun viisikulmainen sivu).
  function aihioPisteet(p, peili) {
    const polys = [p.paneeli || [p.A2, p.B2, p.C2, p.D2]].concat(p.flanges.map(f => f.poly));
    const loops = yhdistaMonikulmiot(polys);
    if (!loops.length) return { pisteet: [], silmukoita: 0 };
    let ring = loops[0];
    if (peili) ring = ring.map(q => [2 * p.minX + p.w - q[0], q[1]]).reverse();   // peilaus kääntää kiertosuunnan, joten käännetään takaisin vastapäivään
    let s0 = 0;
    ring.forEach((q, k) => {
      const c = ring[s0];
      if (q[1] < c[1] - 1e-9 || (Math.abs(q[1] - c[1]) <= 1e-9 && q[0] < c[0])) s0 = k;
    });
    ring = ring.slice(s0).concat(ring.slice(0, s0));
    return {
      pisteet: ring.map((q, k) => ({ n: k + 1, x: q[0] - p.minX, y: q[1] - p.minY })),
      silmukoita: loops.length
    };
  }
  // Piirtää aihion ääriviivan, numeroidut kulmapisteet ja aihion mitat. Teema T kuten levitysSvgSisalto.
  function merkintaSvgSisalto(p, W, Hh, T, peili, levy) {
    const r = aihioPisteet(p, peili);
    if (!r.pisteet.length) return '';
    const M = 30;
    const sc = Math.min((W - 2 * M) / p.w, (Hh - 2 * M) / p.h);
    const ox = (W - p.w * sc) / 2, oy = (Hh - p.h * sc) / 2;
    const X = x => ox + x * sc, Y = y => oy + (p.h - y) * sc;
    const FONT = 'IBM Plex Mono, monospace';
    let c = '';
    // aihion kehys ja mitat
    c += '<rect x="' + X(0) + '" y="' + Y(p.h) + '" width="' + (p.w * sc) + '" height="' + (p.h * sc) + '" fill="none" stroke="' + T.himmea + '" stroke-width="0.7" stroke-dasharray="2,3"/>';
    c += '<text x="' + (X(p.w / 2)) + '" y="' + (Y(0) + 15) + '" font-size="9" font-family="' + FONT + '" fill="' + T.mitta + '" text-anchor="middle">aihio ' + aihioMm(p.w) + ' × ' + aihioMm(p.h) + ' mm</text>';
    if (levy && levy.poly && levy.poly.length >= 3) {
      c += '<polygon points="' + levy.poly.map(q => X(q[0]) + ',' + Y(q[1])).join(' ') + '" fill="none" stroke="' + T.mitta + '" stroke-width="1.1"/>';
      c += '<text x="' + (X(p.w / 2)) + '" y="' + (Y(0) + 26) + '" font-size="9" font-family="' + FONT + '" fill="' + T.mitta + '" text-anchor="middle">' + esc(levy.teksti) + '</text>';
    }
    c += '<text x="' + (X(0) - 6) + '" y="' + (Y(p.h / 2)) + '" font-size="9" font-family="' + FONT + '" fill="' + T.mitta + '" text-anchor="middle" transform="rotate(-90 ' + (X(0) - 6) + ' ' + (Y(p.h / 2)) + ')">y ↑</text>';
    c += '<text x="' + (X(p.w) + 4) + '" y="' + (Y(0) - 4) + '" font-size="9" font-family="' + FONT + '" fill="' + T.mitta + '">x →</text>';
    // sisäsaumat: paneelin reunat ja alareunan taitosviivat (katkoviiva)
    const lx = x => peili ? p.w - x : x;   // paikallinen x (peilikuvassa käännetty)
    const quad = (p.paneeli || [p.A2, p.B2, p.C2, p.D2]).map(q => X(lx(q[0] - p.minX)) + ',' + Y(q[1] - p.minY)).join(' ');
    c += '<polygon points="' + quad + '" fill="none" stroke="' + T.himmea + '" stroke-width="0.8" stroke-dasharray="5,3"/>';
    p.flanges.forEach(f => (f.foldLines || []).forEach(fl => {
      c += '<line x1="' + X(lx(fl.p[0] - p.minX)) + '" y1="' + Y(fl.p[1] - p.minY) + '" x2="' + X(lx(fl.q[0] - p.minX)) + '" y2="' + Y(fl.q[1] - p.minY) + '" stroke="' + T.himmea + '" stroke-width="0.8" stroke-dasharray="5,3"/>';
    }));
    if (peili) c += '<text x="8" y="12" font-size="10" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '">PEILIKUVA: pellin sisäpinta ylöspäin</text>';
    // ääriviiva
    const pts = r.pisteet;
    c += '<polygon points="' + pts.map(q => X(q.x) + ',' + Y(q.y)).join(' ') + '" fill="none" stroke="' + T.paneeli + '" stroke-width="1.6"/>';
    // numerot: sijoitus ulos päin kulman suunnasta, sitten hajotus ettei numerot mene päällekkäin
    const n = pts.length;
    const px = pts.map(q => [X(q.x), Y(q.y)]);
    const lab = pts.map((q, k) => {
      const a = pts[(k + n - 1) % n], b = pts[(k + 1) % n];
      const d1 = [q.x - a.x, q.y - a.y], d2 = [b.x - q.x, b.y - q.y];
      const l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1;
      let nx = d1[1] / l1 + d2[1] / l2, ny = -d1[0] / l1 - d2[0] / l2;   // ulospäin (vastapäivä-ääriviiva: oikea normaali)
      const nl = Math.hypot(nx, ny);
      if (nl < 1e-6) { nx = d1[1] / l1; ny = -d1[0] / l1; } else { nx /= nl; ny /= nl; }
      return [px[k][0] + nx * 11, px[k][1] - ny * 11];   // y käännetty ruutukoordinaateiksi
    });
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = lab[j][0] - lab[i][0], dy = lab[j][1] - lab[i][1], d = Math.hypot(dx, dy);
        if (d < 13) {
          const ux = d > 1e-6 ? dx / d : 1, uy = d > 1e-6 ? dy / d : 0, push = (13 - d) / 2;
          lab[i][0] -= ux * push; lab[i][1] -= uy * push; lab[j][0] += ux * push; lab[j][1] += uy * push;
        }
      }
    }
    pts.forEach((q, k) => {
      const lx = Math.max(6, Math.min(W - 6, lab[k][0])), ly = Math.max(10, Math.min(Hh - 4, lab[k][1]));
      if (Math.hypot(lx - px[k][0], ly - px[k][1]) > 15) {
        c += '<line x1="' + px[k][0] + '" y1="' + px[k][1] + '" x2="' + lx + '" y2="' + ly + '" stroke="' + T.mitta + '" stroke-width="0.5"/>';
      }
      c += '<circle cx="' + px[k][0] + '" cy="' + px[k][1] + '" r="2.4" fill="' + T.paneeli + '"/>';
      c += '<text x="' + lx + '" y="' + (ly + 3.5) + '" font-size="11" font-weight="700" font-family="' + FONT + '" fill="' + T.nimi + '" text-anchor="middle" stroke="' + T.halo + '" stroke-width="3" paint-order="stroke">' + q.n + '</text>';
    });
    return c;
  }

  // Pistetaulukko (HTML). luokka: taulukon CSS-luokka. Yli 12 pistettä jaetaan kahteen rinnakkaiseen taulukkoon.
  function pisteTaulu(p, luokka, peili) {
    const r = aihioPisteet(p, peili);
    const rivit = r.pisteet.map(q => '<tr><td>' + q.n + '</td><td>' + fmtPiste(q.x) + '</td><td>' + fmtPiste(q.y) + '</td></tr>');
    const otsikko = '<tr><th>Piste</th><th>x mm</th><th>y mm</th></tr>';
    const taulu = rs => '<table class="' + luokka + '">' + otsikko + rs.join('') + '</table>';
    if (rivit.length <= 12) return '<div class="pt-wrap">' + taulu(rivit) + '</div>';
    const puoli = Math.ceil(rivit.length / 2);
    return '<div class="pt-wrap">' + taulu(rivit.slice(0, puoli)) + taulu(rivit.slice(puoli)) + '</div>';
  }

  const KPT_PELLIT = {
    PANEL_NAMES, PARTITIIVI, computeCorners, flattenSide, paneelimaaritykset, laskeLevitys,
    geomPaneelit, tasonSisaanpain, sivuTaitosKulma, ylaTaitosKulma, alaKouruKulma, alaSisaanKulma,
    alaTuplatKulma, laskeKaikki, TEEMA_RUUTU, TEEMA_PAPERI, levitysSvgSisalto, ryhmitteleSamat,
    jiiriTeksti, kplTeksti, taitosRivit, aihioPisteet, merkintaSvgSisalto, pisteTaulu,
  };

  globalThis.KPT_PELLIT = KPT_PELLIT;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PELLIT;
})();
