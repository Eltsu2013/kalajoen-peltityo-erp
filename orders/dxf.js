// Kalajoen Peltityö ERP — DXF-tiedostot (orders/dxf.js), vaihe 8.5 D1 (26.11.2026), v3 D3 Kartio: kaaripätkät ääriviivaan
//
// Leikattavien palojen muodot DXF-tiedostoksi CAD-ohjelmaan ja laserille (Tomi 26.11.2026: "CAD-ohjelma ja joskus laser").
// Muoto DXF R12 (AC1009): vanhin ja yleisin, käytännössä kaikki ohjelmat ja koneet lukevat sen. Yksiköt millimetreinä.
// Tasot (layer): LEIKKAUS = leikattava ääriviiva, TAITOS = taitosviivat (katkoviiva, ei leikata), TEKSTI = palan nimi.
// Laserilla tasot TAITOS ja TEKSTI voi piilottaa ennen leikkausta.
//
// Käyttö:
//   const d = KPT_DXF.uusi();
//   d.monikulmio([[0,0],[800,0],[800,600],[0,600]], 'LEIKKAUS');   // suljettu ääriviiva
//   d.monikulmio([[0,0,KPT_DXF.kaarevuus(90)],[100,100],[0,100]]);  // ensimmäinen pätkä 90° kaari (vastapäivään)
//   d.viiva(0, 100, 800, 100, 'TAITOS');
//   d.kaari(cx, cy, r, alkuAste, loppuAste, 'LEIKKAUS');            // vastapäivään alkukulmasta loppukulmaan
//   d.teksti(0, 620, 12, 'Etu + Taka · 2 kpl', 'TEKSTI');                 // tiedostoon: Etu + Taka - 2 kpl
//   d.lataa('huuva.dxf');                                            // selain: tiedoston lataus
//   d.sisalto() / KPT_DXF.koodaa(teksti)                              // DXF-tiedosto tekstinä / tavuina (Windows-1252, ä ja ö)
// Ei riippuvuuksia. Node-testit: testit/dxf/test_dxf.js.
(function () {
  'use strict';

  const TASOT = [
    // nimi, väri (AutoCAD-värinumero: 7 = valkoinen/musta, 1 = punainen, 3 = vihreä, 5 = sininen, 8 = harmaa), viivatyyppi
    ['LEIKKAUS', 7, 'CONTINUOUS'],
    ['TAITOS', 1, 'DASHED'],
    ['TEKSTI', 8, 'CONTINUOUS'],
  ];

  // Luku DXF:ään: piste desimaalierottimena, ei eksponenttimuotoa, enintään 4 desimaalia (0,0001 mm)
  function n(v) {
    if (!isFinite(v)) throw new Error('DXF: virheellinen luku ' + v);
    let s = (Math.round(v * 10000) / 10000).toFixed(4).replace(/\.?0+$/, '');
    if (s === '-0') s = '0';
    return s === '' ? '0' : s;
  }

  // Kaarevuus (bulge) tarkemmin: neljän desimaalin pyöristys heitti 850 mm säteen 0,2 mm (testattu ezdxf:llä), 10 desimaalia riittää
  function nb(v) {
    if (!isFinite(v)) throw new Error('DXF: virheellinen kaarevuus ' + v);
    const s = v.toFixed(10).replace(/\.?0+$/, '');
    return s === '-0' || s === '' ? '0' : s;
  }

  function uusi() {
    const ent = [];                 // entiteettien rivit (ryhmäkoodi, arvo)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const laajenna = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    const lisaa = (...pareja) => { for (let i = 0; i < pareja.length; i += 2) ent.push([pareja[i], pareja[i + 1]]); };
    const taso = t => (TASOT.some(x => x[0] === t) ? t : '0');
    // Kaaripätkän (p → q, kaarevuus b) uloimmat kohdat rajoihin: keskipiste ja säde kaarevuudesta, pääsuunnat kaaren sisältä
    const kaarenRajat = (p, q, b) => {
      const th = 4 * Math.atan(b), L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (!(L > 1e-12) || Math.abs(th) < 1e-12) return;
      const r = L / (2 * Math.sin(Math.abs(th) / 2));
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
      const h = (L / 2) / Math.tan(th / 2);            // keskipisteen etäisyys jänteen keskeltä, vasemmalle plus
      const cx = mx - uy * h, cy = my + ux * h;
      const a0 = Math.atan2(p[1] - cy, p[0] - cx) * 180 / Math.PI;
      const pit = th * 180 / Math.PI;                  // plus = vastapäivään
      const alku = pit >= 0 ? a0 : a0 + pit, loppu = alku + Math.abs(pit);
      for (let s = Math.ceil(alku / 90) * 90; s < loppu; s += 90) laajenna(cx + r * Math.cos(s * Math.PI / 180), cy + r * Math.sin(s * Math.PI / 180));
    };

    const d = {
      viiva(x1, y1, x2, y2, t) {
        lisaa(0, 'LINE', 8, taso(t), 10, n(x1), 20, n(y1), 30, '0', 11, n(x2), 21, n(y2), 31, '0');
        laajenna(x1, y1); laajenna(x2, y2);
        return d;
      },
      // Monikulmio pisteistä [[x, y], ...]; suljettu oletuksena (viimeisestä pisteestä takaisin ensimmäiseen).
      // v3 (D3 Kartio): piste voi olla [x, y, kaarevuus]: pätkä tästä pisteestä seuraavaan on silloin kaari (DXF:n "bulge",
      // ryhmäkoodi 42 = tan(kaaren kulma / 4), plus = vastapäivään). Näin kaaret ja suorat ovat yksi suljettu ääriviiva.
      monikulmio(pisteet, t, suljettu) {
        if (!pisteet || pisteet.length < 2) return d;
        const kiinni = suljettu !== false;
        lisaa(0, 'POLYLINE', 8, taso(t), 66, '1', 10, '0', 20, '0', 30, '0', 70, kiinni ? '1' : '0');
        pisteet.forEach((q, i) => {
          const b = q[2] || 0, seur = pisteet[(i + 1) % pisteet.length];
          if (b) lisaa(0, 'VERTEX', 8, taso(t), 10, n(q[0]), 20, n(q[1]), 30, '0', 42, nb(b));
          else lisaa(0, 'VERTEX', 8, taso(t), 10, n(q[0]), 20, n(q[1]), 30, '0');
          laajenna(q[0], q[1]);
          if (b && (kiinni || i < pisteet.length - 1)) kaarenRajat(q, seur, b);
        });
        lisaa(0, 'SEQEND', 8, taso(t));
        return d;
      },
      // Kaari keskipisteestä, säde ja kulmat asteina (0° = oikealle, kasvaa vastapäivään), piirretään alusta loppuun vastapäivään
      kaari(cx, cy, r, a0, a1, t) {
        lisaa(0, 'ARC', 8, taso(t), 10, n(cx), 20, n(cy), 30, '0', 40, n(r), 50, n(a0), 51, n(a1));
        // rajat: kaaren päät ja ne pääsuunnat (0, 90, 180, 270), jotka kaari ylittää
        const norm = a => ((a % 360) + 360) % 360;
        const alku = norm(a0), pit = norm(a1 - a0) || 360;
        const piste = a => laajenna(cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180));
        piste(alku); piste(alku + pit);
        [0, 90, 180, 270, 360, 450, 540, 630].forEach(s => { if (s > alku && s < alku + pit) piste(s); });
        return d;
      },
      teksti(x, y, korkeus, s, t) {
        s = tekstiCadille(s);
        lisaa(0, 'TEXT', 8, taso(t), 10, n(x), 20, n(y), 30, '0', 40, n(korkeus), 1, s);
        laajenna(x, y); laajenna(x + korkeus * 0.6 * String(s).length, y + korkeus);
        return d;
      },
      tyhja() { return ent.length === 0; },
      rajat() { return ent.length ? { minX, minY, maxX, maxY } : null; },
      // Koko DXF-tiedosto tekstinä (rivinvaihto CRLF)
      sisalto() {
        const r = [];
        const p = (k, v) => { r.push(String(k)); r.push(String(v)); };
        const b = d.rajat() || { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        // HEADER: versio R12, merkistö Windows-1252, metrinen, piirroksen rajat (ohjelma osaa zoomata koko kuvaan)
        p(0, 'SECTION'); p(2, 'HEADER');
        p(9, '$ACADVER'); p(1, 'AC1009');
        p(9, '$DWGCODEPAGE'); p(3, 'ANSI_1252');
        p(9, '$MEASUREMENT'); p(70, 1);
        p(9, '$INSUNITS'); p(70, 4);
        p(9, '$EXTMIN'); p(10, n(b.minX)); p(20, n(b.minY)); p(30, 0);
        p(9, '$EXTMAX'); p(10, n(b.maxX)); p(20, n(b.maxY)); p(30, 0);
        p(0, 'ENDSEC');
        // TABLES: viivatyypit ja tasot
        p(0, 'SECTION'); p(2, 'TABLES');
        p(0, 'TABLE'); p(2, 'LTYPE'); p(70, 2);
        p(0, 'LTYPE'); p(2, 'CONTINUOUS'); p(70, 0); p(3, 'Solid line'); p(72, 65); p(73, 0); p(40, 0);
        p(0, 'LTYPE'); p(2, 'DASHED'); p(70, 0); p(3, 'Dashed __ __ __'); p(72, 65); p(73, 2); p(40, 15); p(49, 10); p(49, -5);
        p(0, 'ENDTAB');
        p(0, 'TABLE'); p(2, 'LAYER'); p(70, TASOT.length + 1);
        p(0, 'LAYER'); p(2, '0'); p(70, 0); p(62, 7); p(6, 'CONTINUOUS');
        TASOT.forEach(([nimi, vari, tyyppi]) => { p(0, 'LAYER'); p(2, nimi); p(70, 0); p(62, vari); p(6, tyyppi); });
        p(0, 'ENDTAB');
        p(0, 'ENDSEC');
        p(0, 'SECTION'); p(2, 'ENTITIES');
        ent.forEach(([k, v]) => p(k, v));
        p(0, 'ENDSEC');
        p(0, 'EOF');
        return r.join('\r\n') + '\r\n';
      },
      // Lataa tiedoston selaimessa
      lataa(nimi) {
        const blob = new Blob([koodaa(d.sisalto())], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = turvallinenNimi(nimi);
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
    };
    return d;
  }

  // CAD-ohjelmien viivafonteista puuttuu merkkejä: Tomin CAD näytti · ja × kysymysmerkkeinä (26.11.2026).
  // Siksi erikoismerkit tavallisiksi (· → -, × → x) ja aste, plusmiinus ja halkaisija CAD:n omilla koodeilla (%%d, %%p, %%c).
  // Ä, ö ja å jäävät (Windows-1252), koska nimissä niitä tarvitaan.
  function tekstiCadille(s) {
    return String(s).replace(/[\r\n]+/g, ' ')
      .replace(/[·•]/g, '-').replace(/×/g, 'x').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/°/g, '%%d').replace(/±/g, '%%p').replace(/[⌀Ø]/g, '%%c');
  }

  // Teksti tavuiksi Windows-1252-merkistössä (R12 ei tunne UTF-8:aa). Ä, ö, å, × ja ° löytyvät; muut merkit → ?
  const CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x2026: 0x85, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2013: 0x96, 0x2014: 0x97 };
  function koodaa(s) {
    const t = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      t[i] = c < 0x80 || (c >= 0xA0 && c <= 0xFF) ? c : (CP1252[c] || 0x3F);
    }
    return t;
  }

  // Tiedostonimi ilman merkkejä, joita Windows ei hyväksy; pääte .dxf
  function turvallinenNimi(nimi) {
    let s = String(nimi || 'piirros').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'piirros';
    if (!/\.dxf$/i.test(s)) s += '.dxf';
    return s;
  }

  // Kaarevuus (bulge) kaaren kulmasta asteina: plus = vastapäivään. Yli 180° kaaret kannattaa jakaa kahteen pätkään.
  function kaarevuus(kulma) { return Math.tan(kulma * Math.PI / 180 / 4); }

  const KPT_DXF = { uusi, koodaa, turvallinenNimi, tekstiCadille, kaarevuus, TASOT };
  globalThis.KPT_DXF = KPT_DXF;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_DXF;
})();
