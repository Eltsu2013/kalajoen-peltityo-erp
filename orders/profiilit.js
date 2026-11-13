/**
 * profiilit.js — Kalajoen Peltityö ERP
 * Peltiprofiilien kaavat yhdessä paikassa (siirretty tänne 13.11.2026).
 *
 * Tätä tiedostoa käyttävät:
 *   - peltipiirturi.html (Mallisto)  → KPT_PROFIILIT.mallit
 *   - tuotanto.html (Tuotanto)       → KPT_PROFIILIT.tuotantoKuvat
 *   - yhteinen piirto                → KPT_PROFIILIT.piirraKuva (Mallisto 13.11.2026 alkaen)
 *
 * MALLIT (ent. TYPES, peltipiirturi.html):
 *   Malliston mallit: nimi, kentät, valinnat, aihion laskenta ja build(vals, opts),
 *   joka palauttaa pellin poikkileikkauksen pisteet. Tämä on mittojen ja muodon totuus.
 *
 * TUOTANTOKUVAT (ent. PROD_TYPES, tuotanto.html):
 *   Tuotannon kortin kuvat. Sisältää Malliston mallit uudelleen kirjoitettuina
 *   (mukana kulmamerkinnät) sekä Vakiomallien mallit. HUOM: nämä ovat eri toteutus kuin
 *   MALLIT, eivätkä kaikki mallit piirry täsmälleen samoin (ks. projektin dokumentti
 *   claude/mallisto_asento_kiila_kouru_suunnitelma.md). Yhdistetään yhdeksi toteutukseksi,
 *   kun uusi yhteinen piirto tehdään.
 *
 * Kun muutat tätä tiedostoa, kasvata sivujen script-tagin versiota
 * (profiilit.js?v=...), jotta selaimet hakevat uuden version.
 */
(function () {

// ═══════════════════════════════════════════════════════════════════
//  MALLIT — Malliston kaavat (peltipiirturi.html)
// ═══════════════════════════════════════════════════════════════════
const TYPES = {
  avp: {
    name: 'Alavesipelti',
    fields: [
      { id: 'seg0_len', label: 'Takareuna mm', default: 15 },
      { id: 'seg1_len', label: 'Pinta mm', default: 150 },
      { id: 'seg2_len', label: 'Etureuna mm', default: 30 },
      { id: 'seg3_len', label: 'Etukäännös mm', default: 10 },
      { id: 'seg0_ang', label: 'Käännös taka °', default: 75, cls: 'angle' },
      { id: 'seg1_ang', label: 'Käännös etu °', default: 75, cls: 'angle' },
      { id: 'seg3_ang', label: 'Etur °', default: 125, cls: 'angle' },
    ],
    build: (vals) => {
      const deg = d => d * Math.PI / 180;

      // Kumulatiivinen ketjulogiikka — jokainen viiva jatkuu edellisen suunnasta
      // Aloitetaan etureunan yläpäästä, etureuna menee suoraan alas = 90°
      // Suunnat: 0°=oikealle, 90°=alas, 180°=vasemmalle, 270°=ylös (SVG-koordinaatisto)

      const pEtuylapaa = { x: 0, y: 0 };

      // 1. Etureuna: suoraan alas (90°)
      let suunta = 90;
      const pEtualapaa = {
        x: pEtuylapaa.x + vals.seg2_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg2_len * Math.sin(deg(suunta))
      };

      // 2. Etukäännös
      suunta += vals.seg3_ang;
      const pEtukaannos = vals.seg3_len > 0 ? {
        x: pEtualapaa.x + vals.seg3_len * Math.cos(deg(suunta)),
        y: pEtualapaa.y + vals.seg3_len * Math.sin(deg(suunta))
      } : null;

      // Pinta lähtee etureunan yläpäästä
      suunta = 90 + (180 - vals.seg1_ang);
      const pPintapaaty = {
        x: pEtuylapaa.x + vals.seg1_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg1_len * Math.sin(deg(suunta))
      };

      // 4. Takareuna
      suunta += vals.seg0_ang;
      const pTakaylapaa = {
        x: pPintapaaty.x + vals.seg0_len * Math.cos(deg(suunta)),
        y: pPintapaaty.y + vals.seg0_len * Math.sin(deg(suunta))
      };

      const pts = [pTakaylapaa, pPintapaaty, pEtuylapaa, pEtualapaa];
      if (pEtukaannos) pts.push(pEtukaannos);
      return { points: pts, labels: null, extraLines: [], pintaViiva: { p1: pPintapaaty, p2: pEtuylapaa } };
    }
  },
  avp2: {
    name: 'Alavp 2',
    fields: [
      { id: 'ikkuna_len', label: 'Karmiin mm', default: 10 },
      { id: 'seg0_len', label: 'Takareuna mm', default: 15 },
      { id: 'seg1_len', label: 'Pinta mm', default: 150 },
      { id: 'seg2_len', label: 'Etureuna mm', default: 30 },
      { id: 'seg3_len', label: 'Etukäännös mm', default: 10 },
      { id: 'ikkuna_ang', label: 'Käännös karmi °', default: 90, cls: 'angle' },
      { id: 'seg0_ang', label: 'Käännös taka °', default: 75, cls: 'angle' },
      { id: 'seg1_ang', label: 'Käännös etu °', default: 75, cls: 'angle' },
      { id: 'seg3_ang', label: 'Etur °', default: 125, cls: 'angle' },
    ],
    build: (vals) => {
      const deg = d => d * Math.PI / 180;

      const pEtuylapaa = { x: 0, y: 0 };

      // Etureuna alas
      let suunta = 90;
      const pEtualapaa = {
        x: pEtuylapaa.x + vals.seg2_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg2_len * Math.sin(deg(suunta))
      };

      // Etukäännös
      suunta += vals.seg3_ang;
      const pEtukaannos = vals.seg3_len > 0 ? {
        x: pEtualapaa.x + vals.seg3_len * Math.cos(deg(suunta)),
        y: pEtualapaa.y + vals.seg3_len * Math.sin(deg(suunta))
      } : null;

      // Pinta
      suunta = 90 + (180 - vals.seg1_ang);
      const pPintapaaty = {
        x: pEtuylapaa.x + vals.seg1_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg1_len * Math.sin(deg(suunta))
      };

      // Takareuna
      suunta += vals.seg0_ang;
      const pTakaylapaa = {
        x: pPintapaaty.x + vals.seg0_len * Math.cos(deg(suunta)),
        y: pPintapaaty.y + vals.seg0_len * Math.sin(deg(suunta))
      };

      // Karmi viiva: 90° = suoraan vasemmalle, kulma käännetty
      const karmiSuunta = 180 + (90 - vals.ikkuna_ang);
      const pKarmi = {
        x: pTakaylapaa.x + vals.ikkuna_len * Math.cos(deg(karmiSuunta)),
        y: pTakaylapaa.y + vals.ikkuna_len * Math.sin(deg(karmiSuunta))
      };

      const pts = [pKarmi, pTakaylapaa, pPintapaaty, pEtuylapaa, pEtualapaa];
      if (pEtukaannos) pts.push(pEtukaannos);

      const labels = [vals.ikkuna_len, vals.seg0_len, vals.seg1_len, vals.seg2_len, vals.seg3_len > 0 ? vals.seg3_len : null];

      return { points: pts, labels, extraLines: [], pintaViiva: { p1: pPintapaaty, p2: pEtuylapaa } };
    },
    aihio: (vals) => vals.seg0_len + vals.seg1_len + vals.seg2_len + vals.seg3_len + vals.ikkuna_len
  },
  ulkonurkka: {
    name: 'Ulkonurkka',
    fields: [
      { id: 'seg0_len', label: 'Sivu A mm', default: 50 },
      { id: 'seg1_len', label: 'Sivu B mm', default: 50 },
      { id: 'seg0_ang', label: 'Kulma °', default: 90, cls: 'angle' },
      { id: 'tiiA_len', label: 'Tiiviste A mm', default: 15 },
      { id: 'tiiB_len', label: 'Tiiviste B mm', default: 15 },
      { id: 'tupA_len', label: 'Tupla A mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B mm', default: 15 },
    ],
    options: [
      { id: 'tiiA', label: 'Tiiviste A (vasen reuna)' },
      { id: 'tiiB', label: 'Tiiviste B (alapää)' },
      { id: 'tupA', label: 'Tupla A (vasen reuna)' },
      { id: 'tupB', label: 'Tupla B (alapää)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];

      let x = 0, y = 0;
      let suunta = 0; // vaakasuora oikealle

      // === VASEN REUNA ===
      // Tiiviste A: vasemmalle ylöspäin 172°
      let tiiAEnd = { x, y }; // tiivisteen kärki (oletuksena alkupiste)
      if (opts?.tiiA) {
        const tiiStart = { x, y };
        const tiiSuunta = 180 - 8;
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(deg(tiiSuunta)), y: y + vals.tiiA_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiAEnd);
        labels.push(vals.tiiA_len);
        points.push(tiiStart);
        labels.push('');
      }

      // Tupla A: ilman tiivistettä 8°, tiivisteen kanssa 0° (vaakasuora)
      const extraLines = [];
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelOffset: [0, 20] });
      }

      // Sivu A: aina vaakasuora (suunta = 0, lukittu)
      suunta = 0;

      // === SIVU A ===
      const pA0 = { x, y };
      points.push(pA0);
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      x += aLen * Math.cos(deg(suunta));
      y += aLen * Math.sin(deg(suunta));
      labels.push(aLen);

      // === KULMA ===
      suunta += vals.seg0_ang;

      // === SIVU B ===
      const pKulma = { x, y };
      points.push(pKulma);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      x += bLen * Math.cos(deg(suunta));
      y += bLen * Math.sin(deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(bLen); // näytetään lyhennetty mitta kun tiiviste päällä

      // === ALAPÄÄ ===
      // Tiiviste B
      let tiiBEnd = { x, y }; // tiivisteen kärki (oletuksena B:n loppupiste)
      if (opts?.tiiB) {
        const tiiSuunta = suunta + 8;
        tiiBEnd = { x: x + vals.tiiB_len * Math.cos(deg(tiiSuunta)), y: y + vals.tiiB_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiBEnd);
        labels.push(vals.tiiB_len);
        points.push(pBend);
        labels.push('');
      }

      // Tupla B: ilman tiivistettä suunta+172, tiivisteen kanssa suunta+180
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suunta + 180 : suunta + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [-25, 0] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pKulma } };
    },
    aihio: (vals, opts) => {
      // Tiivisteet EI lisää aihioleveyttä, tuplat lisää
      let lev = vals.seg0_len + vals.seg1_len;
      if (opts?.tupA) lev += vals.tupA_len;
      if (opts?.tupB) lev += vals.tupB_len;
      return lev;
    }
  },
  sisanurkka: {
    name: 'Sisänurkka',
    fields: [
      { id: 'seg0_len', label: 'Sivu A mm', default: 50 },
      { id: 'seg1_len', label: 'Sivu B mm', default: 50 },
      { id: 'seg0_ang', label: 'Kulma °', default: 90, cls: 'angle' },
      { id: 'tiiA_len', label: 'Tiiviste A mm', default: 15 },
      { id: 'tiiB_len', label: 'Tiiviste B mm', default: 15 },
      { id: 'tupA_len', label: 'Tupla A mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B mm', default: 15 },
    ],
    options: [
      { id: 'tiiA', label: 'Tiiviste A (vasen reuna)' },
      { id: 'tiiB', label: 'Tiiviste B (yläpää)' },
      { id: 'tupA', label: 'Tupla A (vasen reuna)' },
      { id: 'tupB', label: 'Tupla B (yläpää)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      let x = 0, y = 0;
      let suunta = 0;

      // === VASEN REUNA === (sama kuin ulkonurkka)
      let tiiAEnd = { x, y };
      if (opts?.tiiA) {
        const tiiStart = { x, y };
        const tiiSuunta = 180 - 8;
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(deg(tiiSuunta)), y: y + vals.tiiA_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiAEnd);
        labels.push(vals.tiiA_len);
        points.push(tiiStart);
        labels.push('');
      }
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelOffset: [0, 20] });
      }

      // Sivu A: aina vaakasuora
      suunta = 0;
      const pA0 = { x, y };
      points.push(pA0);
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      x += aLen * Math.cos(deg(suunta));
      y += aLen * Math.sin(deg(suunta));
      labels.push(aLen);

      // === KULMA: sisänurkassa kääntyy -kulma (vastakkaiseen suuntaan) ===
      suunta -= vals.seg0_ang;

      // === SIVU B ===
      const pKulma = { x, y };
      points.push(pKulma);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      x += bLen * Math.cos(deg(suunta));
      y += bLen * Math.sin(deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(bLen);

      // === YLÄPÄÄ (sisänurkassa B kääntyy ylös) ===
      let tiiBEnd = { x, y };
      if (opts?.tiiB) {
        const tiiSuunta = suunta + 8; // sisänurkassa +8 menee oikeaan suuntaan
        tiiBEnd = { x: x + vals.tiiB_len * Math.cos(deg(tiiSuunta)), y: y + vals.tiiB_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiBEnd);
        labels.push(vals.tiiB_len);
        points.push(pBend);
        labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suunta + 180 : suunta + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [25, 0] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pKulma } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len;
      if (opts?.tupA) lev += vals.tupA_len;
      if (opts?.tupB) lev += vals.tupB_len;
      return lev;
    }
  },
  jiiri: {
    name: 'Jiiripelti',
    fields: [
      { id: 'ji_siv_a', label: 'Sivu A mm', default: 480 },
      { id: 'ji_siv_b', label: 'Sivu B mm', default: 480 },
      { id: 'ji_taitos_len', label: 'Taitos mm', default: 20 },
      { id: 'ji_kulma', label: 'Kulma °', default: 30, cls: 'angle' },
      { id: 'ji_taitos_ang', label: 'Taitos kulma °', default: 25, cls: 'angle' },
    ],
    options: [
      { id: 'taitosA', label: 'Taitos 1 (vasen)' },
      { id: 'taitosB', label: 'Taitos 2 (oikea)' },
    ],
    build: (vals, opts) => {
      // Oletuksena molemmat taitokset päällä
      if (opts === undefined || opts === null) opts = { taitosA: true, taitosB: true };
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      // Origin = V:n alimmainen piste
      // Sivu A lähtee origosta vasemmalle ylöspäin
      // Sivu B lähtee origosta oikealle ylöspäin (peilikuva)
      // Kulma = kanttikonekulma, 30° = loiva V

      // Sivu A suunta: 180° - (90° - kulma) = 90° + kulma
      const suuntaA = 180 + vals.ji_kulma / 2; // vasemmalle ylöspäin
      const pOrigin = { x: 0, y: 0 };

      // Sivu A yläpää
      const pA_top = {
        x: pOrigin.x + vals.ji_siv_a * Math.cos(deg(suuntaA)),
        y: pOrigin.y + vals.ji_siv_a * Math.sin(deg(suuntaA))
      };

      // Sivu B suunta: peilikuva A:sta (oikealle ylöspäin)
      const suuntaB = 360 - vals.ji_kulma / 2; // oikealle ylöspäin
      const pB_top = {
        x: pOrigin.x + vals.ji_siv_b * Math.cos(deg(suuntaB)),
        y: pOrigin.y + vals.ji_siv_b * Math.sin(deg(suuntaB))
      };

      // Taitos A: kääntyy V:n sisään (oikealle päin) 25°
      if (opts?.taitosA) {
        const taitosSuunta = suuntaA + (180 - vals.ji_taitos_ang); // sisään päin
        const pTaitosA = {
          x: pA_top.x + vals.ji_taitos_len * Math.cos(deg(taitosSuunta)),
          y: pA_top.y + vals.ji_taitos_len * Math.sin(deg(taitosSuunta))
        };
        extraLines.push({ p1: pA_top, p2: pTaitosA, label: vals.ji_taitos_len, labelOffset: [10, -10] });
      }

      // Taitos B: kääntyy V:n sisään (vasemmalle päin) 25°
      if (opts?.taitosB) {
        const taitosSuunta = suuntaB - (180 - vals.ji_taitos_ang); // sisään päin
        const pTaitosB = {
          x: pB_top.x + vals.ji_taitos_len * Math.cos(deg(taitosSuunta)),
          y: pB_top.y + vals.ji_taitos_len * Math.sin(deg(taitosSuunta))
        };
        extraLines.push({ p1: pB_top, p2: pTaitosB, label: vals.ji_taitos_len, labelOffset: [-10, -10] });
      }

      // Pisteketju: A yläpää → origin → B yläpää
      points.push(pA_top);   labels.push(vals.ji_siv_a);
      points.push(pOrigin);  labels.push(vals.ji_siv_b);
      points.push(pB_top);   labels.push('');

      // Pintamerkki sivu A:n puoliväliin
      const pPintaMid = {
        x: (pOrigin.x + pA_top.x) / 2,
        y: (pOrigin.y + pA_top.y) / 2
      };
      const pPintaMid2 = {
        x: pPintaMid.x + 20 * Math.cos(deg(suuntaA)),
        y: pPintaMid.y + 20 * Math.sin(deg(suuntaA))
      };

      return { points, labels, extraLines, pintaViiva: { p1: pPintaMid, p2: pPintaMid2 } };
    },
    aihio: (vals, opts) => {
      let lev = vals.ji_siv_a + vals.ji_siv_b;
      if (opts?.taitosA) lev += vals.ji_taitos_len;
      if (opts?.taitosB) lev += vals.ji_taitos_len;
      return lev;
    }
  },
  'seinänvieripelti': {
    name: 'Seinänvieripelti',
    fields: [
      { id: 'ura_len', label: 'Uran pohja mm', default: 20 },
      { id: 'seg0_len', label: 'Katolle mm', default: 150 },
      { id: 'seg1_len', label: 'Seinälle mm', default: 200 },
      { id: 'ura_ang', label: 'Uraan °', default: 45, cls: 'angle' },
      { id: 'seg0_ang', label: 'Kulma °', default: 90, cls: 'angle' },
      { id: 'tupA_len', label: 'Tupla A mm', default: 15 },
      { id: 'tiiB_len', label: 'Tiiviste B mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B mm', default: 15 },
    ],
    options: [
      { id: 'tiiB', label: 'Tiiviste B (yläpää)' },
      { id: 'tupB', label: 'Tupla B (yläpää)' },
    ],
    build: (vals, opts) => {
      opts = { ...opts, tupA: true };
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      // Seinälle = pystysuora (90°), Katolle lähtee seinän alapäästä vasemmalle
      const seinaSuunta = 90;
      const pSeinaYla = { x: 0, y: 0 };
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pSeinaAla = { x: 0, y: bLen };

      // Katolle lähtee seinän alapäästä vasemmalle, kulma muuttaa suuntaa
      const katolleSuunta = 180 - (90 - vals.seg0_ang);
      const pKatolle = {
        x: pSeinaAla.x + vals.seg0_len * Math.cos(deg(katolleSuunta)),
        y: pSeinaAla.y + vals.seg0_len * Math.sin(deg(katolleSuunta))
      };

      // Uran pohja lähtee Katolle-viivan päästä
      const uraLahtoSuunta = katolleSuunta - vals.ura_ang;
      const uraEnd = {
        x: pKatolle.x + vals.ura_len * Math.cos(deg(uraLahtoSuunta)),
        y: pKatolle.y + vals.ura_len * Math.sin(deg(uraLahtoSuunta))
      };

      // Tupla A lähtee uran päästä avautuen
      const tupAAng = uraLahtoSuunta - 172;
      const tupAEnd = {
        x: uraEnd.x + vals.tupA_len * Math.cos(deg(tupAAng)),
        y: uraEnd.y + vals.tupA_len * Math.sin(deg(tupAAng))
      };
      extraLines.push({ p1: uraEnd, p2: tupAEnd, label: vals.tupA_len, labelOffset: [20, 0] });

      // Tiiviste B ja Tupla B — seinän yläpäässä
      let tiiBEnd = { ...pSeinaYla };
      if (opts?.tiiB) {
        const tiiSuunta = seinaSuunta + 180 + 8;
        tiiBEnd = {
          x: pSeinaYla.x + vals.tiiB_len * Math.cos(deg(tiiSuunta)),
          y: pSeinaYla.y + vals.tiiB_len * Math.sin(deg(tiiSuunta))
        };
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? seinaSuunta + 180 + 180 : seinaSuunta + 180 + 172;
        const tupEnd = {
          x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)),
          y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [25, 0] });
      }

      // Pisteet: ura → katolle → seinä ala → seinä yla [→ tiiviste B]
      points.push(uraEnd);
      labels.push(vals.ura_len);
      points.push(pKatolle);
      labels.push(vals.seg0_len);
      points.push(pSeinaAla);
      labels.push(bLen);
      points.push(pSeinaYla);
      labels.push('');
      if (opts?.tiiB) {
        points.push(pSeinaYla);
        labels.push(vals.tiiB_len);
        points.push(tiiBEnd);
        labels.push('');
      }

      return { points, labels, extraLines, pintaViiva: { p1: pKatolle, p2: pSeinaAla } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len + vals.ura_len + vals.tupA_len;
      if (opts?.tupB) lev += vals.tupB_len;
      return lev;
    }
  },
  eturaaystaspelti: {
    name: 'Eturäystäspelti',
    fields: [
      { id: 'seg0_len', label: 'Katolle mm', default: 150 },
      { id: 'seg1_len', label: 'Räystäälle mm', default: 30 },
      { id: 'nokka_len', label: 'Tippanokka mm', default: 15 },
      { id: 'seg0_ang', label: 'Kulma °', default: 90, cls: 'angle' },
      { id: 'nokka_ang', label: 'Tippanokka kulma °', default: 45, cls: 'angle' },
      { id: 'tiiA_len', label: 'Tiiviste A mm', default: 15 },
      { id: 'tupA_len', label: 'Tupla A mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B mm', default: 15 },
    ],
    options: [
      { id: 'tiiA', label: 'Tiiviste A (vasen reuna)' },
      { id: 'tupA', label: 'Tupla A (vasen reuna)' },
    ],
    build: (vals, opts) => {
      // nokka ja tupB aina päällä
      opts = { ...opts, nokka: true, tupB: true };
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      let x = 0, y = 0;
      let suunta = 0;

      // === VASEN REUNA (sama kuin ulkonurkka) ===
      let tiiAEnd = { x, y };
      if (opts?.tiiA) {
        const tiiStart = { x, y };
        const tiiSuunta = 180 - 8;
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(deg(tiiSuunta)), y: y + vals.tiiA_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiAEnd);
        labels.push(vals.tiiA_len);
        points.push(tiiStart);
        labels.push('');
      }
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelOffset: [0, 20] });
      }

      // === SIVU A ===
      suunta = 0;
      const pA0 = { x, y };
      points.push(pA0);
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      x += aLen * Math.cos(deg(suunta));
      y += aLen * Math.sin(deg(suunta));
      labels.push(aLen);

      // === KULMA ===
      suunta += vals.seg0_ang;

      // === SIVU B: ei lyhene tippanokasta ===
      const pKulma = { x, y };
      points.push(pKulma);
      x += vals.seg1_len * Math.cos(deg(suunta));
      y += vals.seg1_len * Math.sin(deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(vals.seg1_len);

      // === TIPPANOKKA: kääntyy -45° sivu B:stä ===
      let nokkEnd = { x, y };
      if (opts?.nokka) {
        const nokkSuunta = suunta - vals.nokka_ang; // negatiivinen = toiseen suuntaan
        nokkEnd = { x: x + vals.nokka_len * Math.cos(deg(nokkSuunta)), y: y + vals.nokka_len * Math.sin(deg(nokkSuunta)) };
        points.push(nokkEnd);
        labels.push(vals.nokka_len);
        points.push(pBend);
        labels.push('');
      }

      // === TUPLA B: 8° avoimempi kuin tippanokka ===
      if (opts?.tupB) {
        const tupSuunta = opts?.nokka ? suunta - vals.nokka_ang + 180 - 8 : suunta + 172;
        const tupEnd = { x: nokkEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)), y: nokkEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: nokkEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [-25, 0] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pKulma } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len;
      if (opts?.tupA) lev += vals.tupA_len;
      lev += vals.nokka_len; // aina mukana
      lev += vals.tupB_len;  // aina mukana
      return lev;
    }
  },
  paatypelti: {
    name: 'Päätypelti',
    fields: [
      { id: 'harja_len', label: 'Uran pohja mm', default: 20 },
      { id: 'seg0_len', label: 'Katolle mm', default: 80 },
      { id: 'seg1_len', label: 'Räystäälle mm', default: 70 },
      { id: 'nokka_len', label: 'Tippanokka mm', default: 15 },
      { id: 'harja_ang', label: 'Uraan °', default: 45, cls: 'angle' },
      { id: 'seg0_ang', label: 'Kulma °', default: 90, cls: 'angle' },
      { id: 'nokka_ang', label: 'Tippanokka kulma °', default: 45, cls: 'angle' },
      { id: 'tupA_len', label: 'Tupla A mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B mm', default: 12 },
    ],
    options: [],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      let x = 0, y = 0;
      let suunta = 0;

      // === URAN POHJA: x- ja y- suuntaan (vasemmalle ylöspäin) ===
      const harjaStart = { x, y };
      const harjaEnd = {
        x: x - vals.harja_len * Math.cos(deg(vals.harja_ang)),
        y: y + vals.harja_len * Math.sin(deg(vals.harja_ang))
      };
      points.push(harjaEnd);
      labels.push(vals.harja_len);
      points.push(harjaStart);
      labels.push('');

      // Tupla A: lähtee harjan PÄÄSTÄ, kulma = harjakulma - 8°
      const tupASuunta = -(vals.harja_ang - 8);
      const tupAEnd = {
        x: harjaEnd.x + vals.tupA_len * Math.cos(deg(tupASuunta)),
        y: harjaEnd.y + vals.tupA_len * Math.sin(deg(tupASuunta))
      };
      extraLines.push({ p1: harjaEnd, p2: tupAEnd, label: vals.tupA_len, labelOffset: [0, 20] });

      // === SIVU A (Katolle) ===
      suunta = 0;
      const pA0 = { x, y };
      points.push(pA0);
      x += vals.seg0_len * Math.cos(deg(suunta));
      y += vals.seg0_len * Math.sin(deg(suunta));
      labels.push(vals.seg0_len);

      // === KULMA ===
      suunta += vals.seg0_ang;

      // === SIVU B (Räystäälle) ===
      const pKulma = { x, y };
      points.push(pKulma);
      x += vals.seg1_len * Math.cos(deg(suunta));
      y += vals.seg1_len * Math.sin(deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(vals.seg1_len);

      // === TIPPANOKKA ===
      const nokkSuunta = suunta - vals.nokka_ang;
      const nokkEnd = {
        x: x + vals.nokka_len * Math.cos(deg(nokkSuunta)),
        y: y + vals.nokka_len * Math.sin(deg(nokkSuunta))
      };
      points.push(nokkEnd);
      labels.push(vals.nokka_len);
      points.push(pBend);
      labels.push('');

      // === TUPLA B ===
      const tupBSuunta = nokkSuunta + 180 - 8;
      const tupBEnd = {
        x: nokkEnd.x + vals.tupB_len * Math.cos(deg(tupBSuunta)),
        y: nokkEnd.y + vals.tupB_len * Math.sin(deg(tupBSuunta))
      };
      extraLines.push({ p1: nokkEnd, p2: tupBEnd, label: vals.tupB_len, labelOffset: [-25, 0] });

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pKulma } };
    },
    aihio: (vals) => {
      return vals.seg0_len + vals.seg1_len + vals.harja_len + vals.nokka_len + vals.tupA_len + vals.tupB_len;
    }
  },
  paatypelti_huopa: {
    name: 'Päätypelti huopa',
    fields: [
      { id: 'hp_katolle_len', label: 'Katolle mm', default: 100 },
      { id: 'hp_nousu_len', label: 'Nousu mm', default: 20 },
      { id: 'hp_raystas_len', label: 'Räystäälle mm', default: 110 },
      { id: 'hp_nokka_len', label: 'Tippanokka mm', default: 15 },
      { id: 'hp_katolle_ang', label: 'Katolle °', default: 50, cls: 'angle', flip: true },
      { id: 'hp_kulma_ang', label: 'Nousu °', default: 130, cls: 'angle' },
      { id: 'hp_nokka_ang', label: 'Tippanokka kulma °', default: 45, cls: 'angle' },
      { id: 'hp_tupla_len', label: 'Tupla mm', default: 12 },
    ],
    build: (vals) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      // Origin = (0,0) — räystään yläpää / kulmapisteen paikka
      // Rakenne:
      //   Nousu: origosta YLÖSPÄIN (-y suuntaan SVG:ssä)
      //   Katolle: nousun yläpäästä vasemmalle (kulma säädettävissä)
      //   Räystäs: origosta suoraan alas (+y)
      //   Nokka: räystään alapäästä

      const pOrigin = { x: 0, y: 0 };

      // === NOUSU: origosta, kulma säädettävissä (oletus 130° = vasemmalle ylöspäin) ===
      const nousSuunta = 270 - vals.hp_kulma_ang; // kanttikulma 130° → geometria
      const pNousuEnd = {
        x: vals.hp_nousu_len * Math.cos(deg(nousSuunta)),
        y: vals.hp_nousu_len * Math.sin(deg(nousSuunta))
      };

      // === KATOLLE: nousun päästä, kanttikulma 50° ===
      const katSuunta = nousSuunta + (90 - vals.hp_katolle_ang);
      const pKatolleEnd = {
        x: pNousuEnd.x + vals.hp_katolle_len * Math.cos(deg(katSuunta)),
        y: pNousuEnd.y + vals.hp_katolle_len * Math.sin(deg(katSuunta))
      };

      // === RÄYSTÄÄLLE: origosta pystysuora alas ===
      const pRaysEnd = { x: 0, y: vals.hp_raystas_len };

      // === TIPPANOKKA ===
      const nokkSuunta = 90 - vals.hp_nokka_ang;
      const pNokkEnd = {
        x: pRaysEnd.x + vals.hp_nokka_len * Math.cos(deg(nokkSuunta)),
        y: pRaysEnd.y + vals.hp_nokka_len * Math.sin(deg(nokkSuunta))
      };
      const tupBSuunta = nokkSuunta + 180 - 8;
      const pTupBEnd = {
        x: pNokkEnd.x + vals.hp_tupla_len * Math.cos(deg(tupBSuunta)),
        y: pNokkEnd.y + vals.hp_tupla_len * Math.sin(deg(tupBSuunta))
      };
      extraLines.push({ p1: pNokkEnd, p2: pTupBEnd, label: vals.hp_tupla_len, labelOffset: [-20, 0] });

      // Pisteketju: katolleEnd → nousEnd → origin → räystäs → nokka
      points.push(pKatolleEnd); labels.push(vals.hp_katolle_len);
      points.push(pNousuEnd);   labels.push(vals.hp_nousu_len);
      points.push(pOrigin);     labels.push(vals.hp_raystas_len);
      points.push(pRaysEnd);    labels.push(vals.hp_nokka_len);
      points.push(pNokkEnd);    labels.push('');
      points.push(pRaysEnd);    labels.push('');

      // Korkeus = y-etäisyys nokasta katolle-viivan oikeaan reunaan (nousun yläpää)
      const korkeus = Math.abs(pNokkEnd.y - pNousuEnd.y).toFixed(0);

      return { points, labels, extraLines, pintaViiva: { p1: pNousuEnd, p2: pOrigin }, korkeus };
    },
    aihio: (vals) => vals.hp_katolle_len + vals.hp_nousu_len + vals.hp_raystas_len + vals.hp_nokka_len + vals.hp_tupla_len
  },
  ulista: {
    name: 'U-lista u',
    fields: [
      { id: 'seg0_len', label: 'A (pinta) mm', default: 100 },
      { id: 'seg1_len', label: 'Sivu B (vasen) mm', default: 100 },
      { id: 'seg2_len', label: 'Sivu C (oikea) mm', default: 100 },
      { id: 'seg0_ang', label: 'Kulma vasen °', default: 90, cls: 'angle', flip: true },
      { id: 'seg1_ang', label: 'Kulma oikea °', default: 90, cls: 'angle' },
      { id: 'tiiB_len', label: 'Tiiviste vasen mm', default: 15 },
      { id: 'tiiC_len', label: 'Tiiviste oikea mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla vasen mm', default: 15 },
      { id: 'tupC_len', label: 'Tupla oikea mm', default: 15 },
    ],
    options: [
      { id: 'tiiB', label: 'Tiiviste vasen (alapää)' },
      { id: 'tiiC', label: 'Tiiviste oikea (alapää)' },
      { id: 'tupB', label: 'Tupla vasen (alapää)' },
      { id: 'tupC', label: 'Tupla oikea (alapää)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };

      // Kulma vasen: käyttäjä syöttää kanttikonekulman, geometrinen = 180 - syötetty
      const suuntaB = 180 - vals.seg0_ang;
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = {
        x: pA0.x + vals.seg1_len * Math.cos(deg(suuntaB)),
        y: pA0.y + vals.seg1_len * Math.sin(deg(suuntaB))
      };
      const pBendShort = {
        x: pA0.x + bLen * Math.cos(deg(suuntaB)),
        y: pA0.y + bLen * Math.sin(deg(suuntaB))
      };

      // Sivu C (oikea): A:n oikeasta päästä alas
      // Kulma oikea = seg1_ang
      const suuntaC = vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = {
        x: pA1.x + vals.seg2_len * Math.cos(deg(suuntaC)),
        y: pA1.y + vals.seg2_len * Math.sin(deg(suuntaC))
      };
      const pCendShort = {
        x: pA1.x + cLen * Math.cos(deg(suuntaC)),
        y: pA1.y + cLen * Math.sin(deg(suuntaC))
      };

      // === VASEN ALAPÄÄ (B) — peilikuva ulkonurkan sivu B:stä ===
      // Ulkonurkassa tiiB: suuntaB + 8, tupB: suuntaB + 172/180
      // Vasen peilikuva: suuntaB - 8, tupB: suuntaB - 172/180
      let tiiBEnd = { x: pBend.x, y: pBend.y };
      if (opts?.tiiB) {
        tiiBEnd = {
          x: pBendShort.x + vals.tiiB_len * Math.cos(deg(suuntaB - 8)),
          y: pBendShort.y + vals.tiiB_len * Math.sin(deg(suuntaB - 8))
        };
        points.push(tiiBEnd);
        labels.push(vals.tiiB_len);
        points.push(pBendShort);
        labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB - 180 : suuntaB - 172;
        const tupEnd = {
          x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)),
          y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [16, 0] });
      }

      // === PIIRRÄ: B alapää → B → A vasen → A oikea → C → C alapää ===
      // Käytetään lyhyttä pistettä jos tiiviste päällä
      points.push(opts?.tiiB ? pBendShort : pBend);
      labels.push(opts?.tiiB ? bLen : vals.seg1_len);
      points.push(pA0);
      labels.push(vals.seg0_len);
      points.push(pA1);
      labels.push(opts?.tiiC ? cLen : vals.seg2_len);
      points.push(opts?.tiiC ? pCendShort : pCend);

      // === OIKEA ALAPÄÄ (C) — sama kuin ulkonurkan sivu B ===
      let tiiCEnd = { x: pCend.x, y: pCend.y };
      if (opts?.tiiC) {
        tiiCEnd = {
          x: pCendShort.x + vals.tiiC_len * Math.cos(deg(suuntaC + 8)),
          y: pCendShort.y + vals.tiiC_len * Math.sin(deg(suuntaC + 8))
        };
        points.push(tiiCEnd);
        labels.push(vals.tiiC_len);
        points.push(pCend);
        labels.push('');
      }
      if (opts?.tupC) {
        const tupSuunta = opts?.tiiC ? suuntaC + 180 : suuntaC + 172;
        const tupEnd = {
          x: tiiCEnd.x + vals.tupC_len * Math.cos(deg(tupSuunta)),
          y: tiiCEnd.y + vals.tupC_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiCEnd, p2: tupEnd, label: vals.tupC_len, labelOffset: [-16, 0] });
      }

      // Tupla B labelOffset oikealle
      // (päivitetään jo lisättyyn extraLineen jos se on olemassa)

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pA1 } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len + vals.seg2_len;
      if (opts?.tupB) lev += vals.tupB_len;
      if (opts?.tupC) lev += vals.tupC_len;
      return lev;
    }
  },
  ulistas: {
    name: 'U-lista s',
    fields: [
      { id: 'seg0_len', label: 'A (pinta) mm', default: 100 },
      { id: 'seg1_len', label: 'Sivu B (vasen) mm', default: 100 },
      { id: 'seg2_len', label: 'Sivu C (oikea) mm', default: 100 },
      { id: 'seg0_ang', label: 'Kulma vasen °', default: 90, cls: 'angle' },
      { id: 'seg1_ang', label: 'Kulma oikea °', default: 90, cls: 'angle' },
      { id: 'tiiB_len', label: 'Tiiviste vasen mm', default: 15 },
      { id: 'tiiC_len', label: 'Tiiviste oikea mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla vasen mm', default: 15 },
      { id: 'tupC_len', label: 'Tupla oikea mm', default: 15 },
    ],
    options: [
      { id: 'tiiB', label: 'Tiiviste vasen (yläpää)' },
      { id: 'tiiC', label: 'Tiiviste oikea (yläpää)' },
      { id: 'tupB', label: 'Tupla vasen (yläpää)' },
      { id: 'tupC', label: 'Tupla oikea (yläpää)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };

      // Sivu B (vasen): A:n vasemmasta päästä YLÖS
      // Kulma vasen: käyttäjä syöttää kanttikonekulman, geometrinen = -(180 - syötetty)
      const suuntaB = -(180 - vals.seg0_ang);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = {
        x: pA0.x + vals.seg1_len * Math.cos(deg(suuntaB)),
        y: pA0.y + vals.seg1_len * Math.sin(deg(suuntaB))
      };
      const pBendShort = {
        x: pA0.x + bLen * Math.cos(deg(suuntaB)),
        y: pA0.y + bLen * Math.sin(deg(suuntaB))
      };

      // Sivu C (oikea): A:n oikeasta päästä YLÖS
      const suuntaC = -vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = {
        x: pA1.x + vals.seg2_len * Math.cos(deg(suuntaC)),
        y: pA1.y + vals.seg2_len * Math.sin(deg(suuntaC))
      };
      const pCendShort = {
        x: pA1.x + cLen * Math.cos(deg(suuntaC)),
        y: pA1.y + cLen * Math.sin(deg(suuntaC))
      };

      // === VASEN YLÄPÄÄ (B) — peilikuva ulistan B:stä ===
      let tiiBEnd = { x: pBend.x, y: pBend.y };
      if (opts?.tiiB) {
        tiiBEnd = {
          x: pBendShort.x + vals.tiiB_len * Math.cos(deg(suuntaB - 8)),
          y: pBendShort.y + vals.tiiB_len * Math.sin(deg(suuntaB - 8))
        };
        points.push(tiiBEnd);
        labels.push(vals.tiiB_len);
        points.push(pBendShort);
        labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB - 180 : suuntaB - 172;
        const tupEnd = {
          x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)),
          y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [-16, 0] });
      }

      // === PIIRRÄ: B yläpää → B → A vasen → A oikea → C → C yläpää ===
      points.push(opts?.tiiB ? pBendShort : pBend);
      labels.push(opts?.tiiB ? bLen : vals.seg1_len);
      points.push(pA0);
      labels.push(vals.seg0_len);
      points.push(pA1);
      labels.push(opts?.tiiC ? cLen : vals.seg2_len);
      points.push(opts?.tiiC ? pCendShort : pCend);

      // === OIKEA YLÄPÄÄ (C) ===
      let tiiCEnd = { x: pCend.x, y: pCend.y };
      if (opts?.tiiC) {
        tiiCEnd = {
          x: pCendShort.x + vals.tiiC_len * Math.cos(deg(suuntaC + 8)),
          y: pCendShort.y + vals.tiiC_len * Math.sin(deg(suuntaC + 8))
        };
        points.push(tiiCEnd);
        labels.push(vals.tiiC_len);
        points.push(pCend);
        labels.push('');
      }
      if (opts?.tupC) {
        const tupSuunta = opts?.tiiC ? suuntaC + 180 : suuntaC + 172;
        const tupEnd = {
          x: tiiCEnd.x + vals.tupC_len * Math.cos(deg(tupSuunta)),
          y: tiiCEnd.y + vals.tupC_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiCEnd, p2: tupEnd, label: vals.tupC_len, labelOffset: [16, 0] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pA1 } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len + vals.seg2_len;
      if (opts?.tupB) lev += vals.tupB_len;
      if (opts?.tupC) lev += vals.tupC_len;
      return lev;
    }
  },
  kynnys: {
    name: 'Kynnys',
    fields: [
      { id: 'seg0_len', label: 'Takareuna mm', default: 10 },
      { id: 'seg1_len', label: 'Pinta mm', default: 120 },
      { id: 'seg2_len', label: 'Etureuna mm', default: 30 },
      { id: 'seg3_len', label: 'Etukäännös mm', default: 0 },
      { id: 'seg0_ang', label: 'Käännös taka °', default: 80, cls: 'angle' },
      { id: 'seg1_ang', label: 'Käännös etu °', default: 80, cls: 'angle' },
      { id: 'seg3_ang', label: 'Etur °', default: 125, cls: 'angle' },
    ],
    build: (vals) => {
      const deg = d => d * Math.PI / 180;

      const pEtuylapaa = { x: 0, y: 0 };

      // 1. Etureuna: suoraan alas (90°)
      let suunta = 90;
      const pEtualapaa = {
        x: pEtuylapaa.x + vals.seg2_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg2_len * Math.sin(deg(suunta))
      };

      // 2. Etukäännös
      suunta += vals.seg3_ang;
      const pEtukaannos = vals.seg3_len > 0 ? {
        x: pEtualapaa.x + vals.seg3_len * Math.cos(deg(suunta)),
        y: pEtualapaa.y + vals.seg3_len * Math.sin(deg(suunta))
      } : null;

      // 3. Pinta
      suunta = 90 + (180 - vals.seg1_ang);
      const pPintapaaty = {
        x: pEtuylapaa.x + vals.seg1_len * Math.cos(deg(suunta)),
        y: pEtuylapaa.y + vals.seg1_len * Math.sin(deg(suunta))
      };

      // 4. Takareuna
      suunta += vals.seg0_ang;
      const pTakaylapaa = {
        x: pPintapaaty.x + vals.seg0_len * Math.cos(deg(suunta)),
        y: pPintapaaty.y + vals.seg0_len * Math.sin(deg(suunta))
      };

      const pts = [pTakaylapaa, pPintapaaty, pEtuylapaa, pEtualapaa];
      if (pEtukaannos) pts.push(pEtukaannos);
      return { points: pts, labels: null, extraLines: [], pintaViiva: { p1: pPintapaaty, p2: pEtuylapaa } };
    }
  },
  hattulista: {
    name: 'Hattulista',
    fields: [
      { id: 'seg0_len', label: 'Pinta mm', default: 100 },
      { id: 'seg1_len', label: 'Vasen sivu mm', default: 100 },
      { id: 'seg2_len', label: 'Oikea sivu mm', default: 100 },
      { id: 'laippaV_len', label: 'Laippa vasen mm', default: 30 },
      { id: 'laippaO_len', label: 'Laippa oikea mm', default: 30 },
      { id: 'seg0_ang', label: 'Kulma vasen °', default: 90, cls: 'angle', flip: true },
      { id: 'laippaV_ang', label: 'Laippa vasen kulma °', default: 90, cls: 'angle' },
      { id: 'seg1_ang', label: 'Kulma oikea °', default: 90, cls: 'angle' },
      { id: 'laippaO_ang', label: 'Laippa oikea kulma °', default: 90, cls: 'angle' },
      { id: 'tiiB_len', label: 'Tiiviste vasen mm', default: 15 },
      { id: 'tiiC_len', label: 'Tiiviste oikea mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla vasen mm', default: 15 },
      { id: 'tupC_len', label: 'Tupla oikea mm', default: 15 },
    ],
    options: [
      { id: 'tiiB', label: 'Tiiviste vasen (laippa)' },
      { id: 'tiiC', label: 'Tiiviste oikea (laippa)' },
      { id: 'tupB', label: 'Tupla vasen (laippa)' },
      { id: 'tupC', label: 'Tupla oikea (laippa)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };

      // Sivu B (vasen): alas, kulma vasen käännetty
      const suuntaB = 180 - vals.seg0_ang;
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = { x: pA0.x + vals.seg1_len * Math.cos(deg(suuntaB)), y: pA0.y + vals.seg1_len * Math.sin(deg(suuntaB)) };
      const pBendShort = { x: pA0.x + bLen * Math.cos(deg(suuntaB)), y: pA0.y + bLen * Math.sin(deg(suuntaB)) };

      // Sivu C (oikea): alas
      const suuntaC = vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = { x: pA1.x + vals.seg2_len * Math.cos(deg(suuntaC)), y: pA1.y + vals.seg2_len * Math.sin(deg(suuntaC)) };
      const pCendShort = { x: pA1.x + cLen * Math.cos(deg(suuntaC)), y: pA1.y + cLen * Math.sin(deg(suuntaC)) };

      // Laippa vasen: sivu B:n päästä vasemmalle
      // suuntaB on alas, laippa kääntyy vasemmalle = suuntaB + 90°
      const laippaVSuunta = suuntaB + vals.laippaV_ang;
      const laippaVLen = opts?.tiiB ? vals.laippaV_len - vals.tiiB_len : vals.laippaV_len;
      const pLaippaV = { x: pBend.x + vals.laippaV_len * Math.cos(deg(laippaVSuunta)), y: pBend.y + vals.laippaV_len * Math.sin(deg(laippaVSuunta)) };
      const pLaippaVShort = { x: pBend.x + laippaVLen * Math.cos(deg(laippaVSuunta)), y: pBend.y + laippaVLen * Math.sin(deg(laippaVSuunta)) };

      // Laippa oikea: sivu C:n päästä oikealle = suuntaC - 90°
      const laippaOSuunta = suuntaC - vals.laippaO_ang;
      const laippaOLen = opts?.tiiC ? vals.laippaO_len - vals.tiiC_len : vals.laippaO_len;
      const pLaippaO = { x: pCend.x + vals.laippaO_len * Math.cos(deg(laippaOSuunta)), y: pCend.y + vals.laippaO_len * Math.sin(deg(laippaOSuunta)) };
      const pLaippaOShort = { x: pCend.x + laippaOLen * Math.cos(deg(laippaOSuunta)), y: pCend.y + laippaOLen * Math.sin(deg(laippaOSuunta)) };

      // === VASEN LAIPPA REUNAT ===
      let tiiBEnd = opts?.tiiB ? pLaippaVShort : pLaippaV;
      if (opts?.tiiB) {
        const tiiSuunta = laippaVSuunta - 8;
        tiiBEnd = { x: pLaippaVShort.x + vals.tiiB_len * Math.cos(deg(tiiSuunta)), y: pLaippaVShort.y + vals.tiiB_len * Math.sin(deg(tiiSuunta)) };
        extraLines.push({ p1: pLaippaVShort, p2: tiiBEnd, label: vals.tiiB_len, labelOffset: [16, 0] });
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? laippaVSuunta - 180 : laippaVSuunta - 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [0, 16] });
      }

      // === OIKEA LAIPPA REUNAT (peilikuva vasemmasta) ===
      let tiiCEnd = opts?.tiiC ? pLaippaOShort : pLaippaO;
      if (opts?.tiiC) {
        const tiiSuunta = laippaOSuunta + 8;
        tiiCEnd = { x: pLaippaOShort.x + vals.tiiC_len * Math.cos(deg(tiiSuunta)), y: pLaippaOShort.y + vals.tiiC_len * Math.sin(deg(tiiSuunta)) };
        extraLines.push({ p1: pLaippaOShort, p2: tiiCEnd, label: vals.tiiC_len, labelOffset: [-16, 0] });
      }
      if (opts?.tupC) {
        const tupSuunta = opts?.tiiC ? laippaOSuunta + 180 : laippaOSuunta + 172;
        const tupEnd = { x: tiiCEnd.x + vals.tupC_len * Math.cos(deg(tupSuunta)), y: tiiCEnd.y + vals.tupC_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: tiiCEnd, p2: tupEnd, label: vals.tupC_len, labelOffset: [0, 16] });
      }

      // PIIRRÄ: laippaV → B → A vasen → A oikea → C → laippaO
      points.push(opts?.tiiB ? pLaippaVShort : pLaippaV);
      labels.push(opts?.tiiB ? laippaVLen : vals.laippaV_len);
      points.push(pBend);
      labels.push(vals.seg1_len);
      points.push(pA0);
      labels.push(vals.seg0_len);
      points.push(pA1);
      labels.push(vals.seg2_len);
      points.push(pCend);
      labels.push(opts?.tiiC ? laippaOLen : vals.laippaO_len);
      points.push(opts?.tiiC ? pLaippaOShort : pLaippaO);

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pA1 }, nousuViiva: { p1: pA0, p2: pBend, p3: pA1, p4: pCend, p5: pLaippaV, p6: pLaippaO } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len + vals.seg2_len + vals.laippaV_len + vals.laippaO_len;
      if (opts?.tupB) lev += vals.tupB_len;
      if (opts?.tupC) lev += vals.tupC_len;
      return lev;
    }
  },
  zlista: {
    name: 'Z-lista',
    fields: [
      { id: 'seg0_len', label: 'A pinta mm', default: 80 },
      { id: 'seg1_len', label: 'Nousu mm', default: 30 },
      { id: 'seg2_len', label: 'B pinta mm', default: 80 },
      { id: 'seg0_ang', label: 'Alakulma °', default: 90, cls: 'angle' },
      { id: 'seg1_ang', label: 'Yläkulma °', default: 90, cls: 'angle' },
      { id: 'tiiA_len', label: 'Tiiviste A vasen mm', default: 15 },
      { id: 'tupA_len', label: 'Tupla A vasen mm', default: 15 },
      { id: 'tiiB_len', label: 'Tiiviste B oikea mm', default: 15 },
      { id: 'tupB_len', label: 'Tupla B oikea mm', default: 15 },
    ],
    options: [
      { id: 'tiiA', label: 'Tiiviste A (vasen reuna)' },
      { id: 'tiiB', label: 'Tiiviste B (oikea reuna)' },
      { id: 'tupA', label: 'Tupla A (vasen reuna)' },
      { id: 'tupB', label: 'Tupla B (oikea reuna)' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      // A pinta: vaakasuora vasemmalta oikealle
      // Tiiviste A lyhentää vasemmasta päästä — pA0 siirtyy oikealle tiivisteen verran

      const pA0 = { x: 0, y: 0 };
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      const pA1 = { x: vals.seg0_len, y: 0 };
      const pA1Short = { x: aLen, y: 0 }; // lyhennetty oikea pää

      // === VASEN REUNA — tiiviste lähtee pA0:sta vasemmalle ===
      let tiiAEnd = { x: 0, y: 0 };
      if (opts?.tiiA) {
        const tiiSuunta = 180 - 8;
        tiiAEnd = { x: pA0.x + vals.tiiA_len * Math.cos(deg(tiiSuunta)), y: pA0.y + vals.tiiA_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiAEnd);
        labels.push(vals.tiiA_len);
        points.push(pA0);
        labels.push('');
      }
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelOffset: [0, 20] });
      }

      // PIIRRÄ: sivu A pA0 → pA1Short (lyhennetty), nousu lähtee pA1Short:sta
      points.push(pA0);
      labels.push(aLen);
      points.push(opts?.tiiA ? pA1Short : pA1);
      labels.push(vals.seg1_len);
      const suuntaNousu = -(vals.seg0_ang);
      const nousAlku = opts?.tiiA ? pA1Short : pA1;
      const pNousuEnd = {
        x: nousAlku.x + vals.seg1_len * Math.cos(deg(suuntaNousu)),
        y: nousAlku.y + vals.seg1_len * Math.sin(deg(suuntaNousu))
      };

      // B pinta: nousun päästä oikealle
      const suuntaB = suuntaNousu + vals.seg1_ang;
      const bLen = opts?.tiiB ? vals.seg2_len - vals.tiiB_len : vals.seg2_len;
      const pB0 = pNousuEnd;
      const pB1 = {
        x: pB0.x + vals.seg2_len * Math.cos(deg(suuntaB)),
        y: pB0.y + vals.seg2_len * Math.sin(deg(suuntaB))
      };
      const pB1Short = {
        x: pB0.x + bLen * Math.cos(deg(suuntaB)),
        y: pB0.y + bLen * Math.sin(deg(suuntaB))
      };
      points.push(pNousuEnd);
      labels.push(bLen);
      points.push(opts?.tiiB ? pB1Short : pB1);

      // === OIKEA REUNA (B:n oikea pää) ===
      let tiiBEnd = opts?.tiiB ? pB1Short : pB1;
      if (opts?.tiiB) {
        const tiiSuunta = suuntaB + 8;
        tiiBEnd = { x: pB1Short.x + vals.tiiB_len * Math.cos(deg(tiiSuunta)), y: pB1Short.y + vals.tiiB_len * Math.sin(deg(tiiSuunta)) };
        points.push(tiiBEnd);
        labels.push(vals.tiiB_len);
        points.push(opts?.tiiB ? pB1Short : pB1);
        labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB + 180 : suuntaB + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelOffset: [0, 16] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA0, p2: pA1 }, nousuViiva: { p1: pA1, p2: pNousuEnd }, kokonaisViiva: { p1: pA0, p2: (opts?.tiiB ? pB1Short : pB1) } };
    },
    aihio: (vals, opts) => {
      let lev = vals.seg0_len + vals.seg1_len + vals.seg2_len;
      if (opts?.tiiA) lev -= 0; // tiiviste ei lisää eikä vähennä aihiota
      if (opts?.tupA) lev += vals.tupA_len;
      if (opts?.tupB) lev += vals.tupB_len;
      return lev;
    }
  },
  peitelista: {
    name: 'Peitelista',
    fields: [
      { id: 'pl_lev', label: 'Leveys mm', default: 100 },
      { id: 'pl_tiiA_len', label: 'Tiiviste vasen mm', default: 15 },
      { id: 'pl_tiiB_len', label: 'Tiiviste oikea mm', default: 15 },
      { id: 'pl_tupA_len', label: 'Tupla vasen mm', default: 15 },
      { id: 'pl_tupB_len', label: 'Tupla oikea mm', default: 15 },
      { id: 'pl_tiiA_ang', label: 'Tiiviste vasen °', default: 8, cls: 'angle' },
      { id: 'pl_tiiB_ang', label: 'Tiiviste oikea °', default: 8, cls: 'angle' },
    ],
    options: [
      { id: 'tiiA', label: 'Tiiviste vasen' },
      { id: 'tiiB', label: 'Tiiviste oikea' },
      { id: 'tupA', label: 'Tupla vasen' },
      { id: 'tupB', label: 'Tupla oikea' },
    ],
    build: (vals, opts) => {
      const deg = d => d * Math.PI / 180;
      const points = [];
      const labels = [];
      const extraLines = [];

      const pA = { x: 0, y: 0 };
      const pB = { x: vals.pl_lev, y: 0 };

      // Pääviiva ensin — alkaa tiivisteen sisäreunasta
      const pAinner = opts?.tiiA ? { x: pA.x + vals.pl_tiiA_len, y: 0 } : pA;
      const pBinner = opts?.tiiB ? { x: pB.x - vals.pl_tiiB_len, y: 0 } : pB;
      const levNaytto = vals.pl_lev
        - (opts?.tiiA ? vals.pl_tiiA_len : 0)
        - (opts?.tiiB ? vals.pl_tiiB_len : 0);
      points.push(pAinner); labels.push(levNaytto);
      points.push(pBinner); labels.push('');

      // Tiiviste vasen: lähtee pAinner:stä vasemmalle alas 172°
      let tiiAEnd = pAinner;
      if (opts?.tiiA) {
        const tiiSuunta = 180 - vals.pl_tiiA_ang;
        tiiAEnd = {
          x: pAinner.x + vals.pl_tiiA_len * Math.cos(deg(tiiSuunta)),
          y: pAinner.y + vals.pl_tiiA_len * Math.sin(deg(tiiSuunta))
        };
        extraLines.push({ p1: pAinner, p2: tiiAEnd, label: vals.pl_tiiA_len, labelOffset: [-20, 8] });
      }
      // Tupla vasen
      if (opts?.tupA) {
        const tupSuunta = opts?.tiiA ? 0 : 8;
        const tupEnd = {
          x: tiiAEnd.x + vals.pl_tupA_len * Math.cos(deg(tupSuunta)),
          y: tiiAEnd.y + vals.pl_tupA_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.pl_tupA_len, labelOffset: [0, 16] });
      }

      // Tiiviste oikea: lähtee pBinner:stä oikealle alas 8°
      let tiiBEnd = pBinner;
      if (opts?.tiiB) {
        const tiiSuunta = vals.pl_tiiB_ang;
        tiiBEnd = {
          x: pBinner.x + vals.pl_tiiB_len * Math.cos(deg(tiiSuunta)),
          y: pBinner.y + vals.pl_tiiB_len * Math.sin(deg(tiiSuunta))
        };
        extraLines.push({ p1: pBinner, p2: tiiBEnd, label: vals.pl_tiiB_len, labelOffset: [20, 8] });
      }
      // Tupla oikea
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? 180 : 180 - 8;
        const tupEnd = {
          x: tiiBEnd.x + vals.pl_tupB_len * Math.cos(deg(tupSuunta)),
          y: tiiBEnd.y + vals.pl_tupB_len * Math.sin(deg(tupSuunta))
        };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.pl_tupB_len, labelOffset: [0, 16] });
      }

      return { points, labels, extraLines, pintaViiva: { p1: pA, p2: pB } };
    },
    aihio: (vals, opts) => {
      let lev = vals.pl_lev;
      if (opts?.tupA) lev += vals.pl_tupA_len;
      if (opts?.tupB) lev += vals.pl_tupB_len;
      return lev;
    }
  },
  vapaa: {
    name: 'Vapaa profiili',
    fields: [],
    build: () => buildFromFreeSegments()
  }
};

// ═══════════════════════════════════════════════════════════════════
//  TUOTANTOKUVAT — Tuotannon kortin kuvat (tuotanto.html)
// ═══════════════════════════════════════════════════════════════════
// build(vals, opts) palauttaa { points, labels, extraLines, angleLabels }
// labels[i] = mitta segmentille i→i+1 (tai null jos ei näytetä)
// angleLabels[i] = kulmateksti pisteelle i (tai null)

const _deg = d => d * Math.PI / 180;

const PROD_TYPES = {
  // ── PELTIPIIRTURIN PROFIILIT ──────────────────────────────────────
  avp: {
    name: 'Alavesipelti',
    build: (vals) => {
      // Tukee sekä peltipiirturin (seg0_len/seg1_len/seg2_len) että
      // vakiomallien (takareuna/pinta tai paanYlos+paanAlas/etureuna) kenttänimiä
      const takareuna  = vals.seg0_len  || vals.takareuna  || 15;
      const pinta      = vals.seg1_len  || (vals.paanYlos != null ? vals.paanYlos + (vals.paanAlas||0) : null) || vals.pinta || 150;
      const etureuna   = vals.seg2_len  || vals.etureuna   || 30;
      const etukaannos = vals.seg3_len  != null ? vals.seg3_len  : (vals.etukaannos  || 0);
      const kaannos_taka = vals.seg0_ang != null ? vals.seg0_ang : (vals.kaannos_taka || 75);
      const kaannos_etu  = vals.seg1_ang != null ? vals.seg1_ang : (vals.kaannos_etu  || 75);
      const etur         = vals.seg3_ang != null ? vals.seg3_ang : (vals.etur         || 125);
      // Vakiomalleilla paanYlos ja paanAlas ovat erilliset — näytetään ne extraLinenä
      const paanYlos = vals.paanYlos || 0;
      const paanAlas = vals.paanAlas || 0;

      const pEtuYla = { x: 0, y: 0 };
      let suunta = 90;
      const pEtuAla = { x: pEtuYla.x + etureuna * Math.cos(_deg(suunta)), y: pEtuYla.y + etureuna * Math.sin(_deg(suunta)) };
      suunta += etur;
      const pEtuK = etukaannos > 0 ? { x: pEtuAla.x + etukaannos * Math.cos(_deg(suunta)), y: pEtuAla.y + etukaannos * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - kaannos_etu);
      const pPinta = { x: pEtuYla.x + pinta * Math.cos(_deg(suunta)), y: pEtuYla.y + pinta * Math.sin(_deg(suunta)) };
      suunta += kaannos_taka;
      const pTaka = { x: pPinta.x + takareuna * Math.cos(_deg(suunta)), y: pPinta.y + takareuna * Math.sin(_deg(suunta)) };
      const points = [pTaka, pPinta, pEtuYla, pEtuAla];
      if (pEtuK) points.push(pEtuK);

      const extraLines = [];
      // Jos vakiomalli-ikkunapelti: näytä paanYlos ja paanAlas erikseen oranssilla
      if (paanYlos > 0 && paanAlas > 0) {
        const pPaanYlosEnd = {
          x: pPinta.x + (pEtuYla.x - pPinta.x) * (paanYlos / pinta),
          y: pPinta.y + (pEtuYla.y - pPinta.y) * (paanYlos / pinta)
        };
        extraLines.push({ p1: pPinta, p2: pPaanYlosEnd, label: paanYlos, labelSide: -1 });
        extraLines.push({ p1: pPaanYlosEnd, p2: pEtuYla, label: paanAlas, labelSide: -1 });
      }

      const labels = [takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null];
      const angleLabels = [null, kaannos_taka + '°', kaannos_etu + '°', null, null];
      const angleOffsetSides = [null, 1, -1, null, null]; // etureuna-kulma vasemmalle
      return { points, labels, extraLines, angleLabels, angleOffsetSides };
    }
  },
  avp2: {
    name: 'Alavp 2',
    build: (vals) => {
      // Tukee sekä peltipiirturin (seg*) että vakiomallien (takareuna/pinta/ikkuna) kenttänimiä
      const ikkuna_len   = vals.ikkuna_len  || vals.ikkuna     || 0;
      const takareuna    = vals.seg0_len    || vals.takareuna   || 15;
      const pinta        = vals.seg1_len    || (vals.paanYlos != null ? vals.paanYlos + (vals.paanAlas||0) : null) || vals.pinta || 150;
      const etureuna     = vals.seg2_len    || vals.etureuna    || 30;
      const etukaannos   = vals.seg3_len    != null ? vals.seg3_len   : (vals.etukaannos   || 0);
      const ikkuna_ang   = vals.ikkuna_ang  != null ? vals.ikkuna_ang  : (vals.ikkuna_ang   || 90);
      const kaannos_taka = vals.seg0_ang    != null ? vals.seg0_ang    : (vals.kaannos_taka || 75);
      const kaannos_etu  = vals.seg1_ang    != null ? vals.seg1_ang    : (vals.kaannos_etu  || 75);
      const etur         = vals.seg3_ang    != null ? vals.seg3_ang    : (vals.etur         || 125);
      const paanYlos = vals.paanYlos || 0;
      const paanAlas = vals.paanAlas || 0;

      const pEtuYla = { x: 0, y: 0 };
      let suunta = 90;
      const pEtuAla = { x: pEtuYla.x + etureuna * Math.cos(_deg(suunta)), y: pEtuYla.y + etureuna * Math.sin(_deg(suunta)) };
      suunta += etur;
      const pEtuK = etukaannos > 0 ? { x: pEtuAla.x + etukaannos * Math.cos(_deg(suunta)), y: pEtuAla.y + etukaannos * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - kaannos_etu);
      const pPinta = { x: pEtuYla.x + pinta * Math.cos(_deg(suunta)), y: pEtuYla.y + pinta * Math.sin(_deg(suunta)) };
      suunta += kaannos_taka;
      const pTaka = { x: pPinta.x + takareuna * Math.cos(_deg(suunta)), y: pPinta.y + takareuna * Math.sin(_deg(suunta)) };
      const karmiSuunta = 180 + (90 - ikkuna_ang);
      const pKarmi = ikkuna_len > 0 ? { x: pTaka.x + ikkuna_len * Math.cos(_deg(karmiSuunta)), y: pTaka.y + ikkuna_len * Math.sin(_deg(karmiSuunta)) } : null;

      const points = pKarmi ? [pKarmi, pTaka, pPinta, pEtuYla, pEtuAla] : [pTaka, pPinta, pEtuYla, pEtuAla];
      if (pEtuK) points.push(pEtuK);

      const extraLines = [];
      if (paanYlos > 0 && paanAlas > 0) {
        const pPaanYlosEnd = {
          x: pPinta.x + (pEtuYla.x - pPinta.x) * (paanYlos / pinta),
          y: pPinta.y + (pEtuYla.y - pPinta.y) * (paanYlos / pinta)
        };
        extraLines.push({ p1: pPinta, p2: pPaanYlosEnd, label: paanYlos, labelSide: -1 });
        extraLines.push({ p1: pPaanYlosEnd, p2: pEtuYla, label: paanAlas, labelSide: -1 });
      }

      const baseLabels = pKarmi ? [ikkuna_len, takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null]
                                 : [takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null];
      const baseAngles = pKarmi ? [null, ikkuna_ang + '°', kaannos_taka + '°', kaannos_etu + '°', null, null]
                                 : [null, kaannos_taka + '°', kaannos_etu + '°', null, null];
      return { points, labels: baseLabels, extraLines, angleLabels: baseAngles };
    }
  },
  ulkonurkka: {
    name: 'Ulkonurkka',
    build: (vals, opts) => {
      const points = [];
      const labels = [];
      const extraLines = [];
      let x = 0, y = 0, suunta = 0;

      // Tiiviste A: vasemmalle ylös
      let tiiAEnd = { x, y };
      if (opts?.tiiA) {
        const tiiStart = { x, y };
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(_deg(180 - 8)), y: y + vals.tiiA_len * Math.sin(_deg(180 - 8)) };
        points.push(tiiAEnd); labels.push(vals.tiiA_len);
        points.push(tiiStart); labels.push('');
      }
      // Tupla A
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(_deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(_deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelSide: -1 });
      }

      // Sivu A: vaakasuora
      suunta = 0;
      const pA0 = { x, y };
      points.push(pA0);
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      x += aLen * Math.cos(_deg(suunta));
      y += aLen * Math.sin(_deg(suunta));
      labels.push(aLen);

      // Kulma
      suunta += vals.seg0_ang;

      // Sivu B
      const pKulma = { x, y };
      points.push(pKulma);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      x += bLen * Math.cos(_deg(suunta));
      y += bLen * Math.sin(_deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(bLen);

      // Tiiviste B: alapäässä, suunta + 8
      let tiiBEnd = { x, y };
      if (opts?.tiiB) {
        tiiBEnd = { x: x + vals.tiiB_len * Math.cos(_deg(suunta + 8)), y: y + vals.tiiB_len * Math.sin(_deg(suunta + 8)) };
        points.push(tiiBEnd); labels.push(vals.tiiB_len);
        points.push(pBend); labels.push('');
      }
      // Tupla B
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suunta + 180 : suunta + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelSide: 1 });
      }

      const angleLabels = new Array(points.length).fill(null);
      const kulmaIdx = opts?.tiiA ? 3 : 1;
      if (kulmaIdx < angleLabels.length) angleLabels[kulmaIdx] = vals.seg0_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  sisanurkka: {
    name: 'Sisänurkka',
    build: (vals, opts) => {
      const points = [];
      const labels = [];
      const extraLines = [];
      let x = 0, y = 0, suunta = 0;

      // Tiiviste A: vasemmalle ylös (sama kuin ulkonurkka)
      let tiiAEnd = { x, y };
      if (opts?.tiiA) {
        const tiiStart = { x, y };
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(_deg(180 - 8)), y: y + vals.tiiA_len * Math.sin(_deg(180 - 8)) };
        points.push(tiiAEnd); labels.push(vals.tiiA_len);
        points.push(tiiStart); labels.push('');
      }
      // Tupla A
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(_deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(_deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelSide: -1 });
      }

      // Sivu A: vaakasuora, lyhenee tiivisteen verran
      suunta = 0;
      const pA0 = { x, y };
      points.push(pA0);
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      x += aLen * Math.cos(_deg(suunta));
      y += aLen * Math.sin(_deg(suunta));
      labels.push(aLen);

      // Kulma: sisänurkassa kääntyy vastakkaiseen suuntaan kuin ulkonurkka
      suunta -= vals.seg0_ang;

      // Sivu B
      const pKulma = { x, y };
      points.push(pKulma);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      x += bLen * Math.cos(_deg(suunta));
      y += bLen * Math.sin(_deg(suunta));
      const pBend = { x, y };
      points.push(pBend);
      labels.push(bLen);

      // Tiiviste B: yläpäässä, suunta + 8
      let tiiBEnd = { x, y };
      if (opts?.tiiB) {
        tiiBEnd = { x: x + vals.tiiB_len * Math.cos(_deg(suunta + 8)), y: y + vals.tiiB_len * Math.sin(_deg(suunta + 8)) };
        points.push(tiiBEnd); labels.push(vals.tiiB_len);
        points.push(pBend); labels.push('');
      }
      // Tupla B
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suunta + 180 : suunta + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len });
      }

      const angleLabels = new Array(points.length).fill(null);
      // kulmapisteen indeksi: tiiA lisää 2 pistettä ennen pA0
      const kulmaIdx = opts?.tiiA ? 3 : 1;
      if (kulmaIdx < angleLabels.length) angleLabels[kulmaIdx] = vals.seg0_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  jiiri: {
    name: 'Jiiripelti',
    build: (vals, opts) => {
      const extraLines = [];
      const suuntaA = 180 + vals.ji_kulma / 2;
      const suuntaB = 360 - vals.ji_kulma / 2;
      const pOrigin = { x: 0, y: 0 };
      const pA_top = { x: pOrigin.x + vals.ji_siv_a * Math.cos(_deg(suuntaA)), y: pOrigin.y + vals.ji_siv_a * Math.sin(_deg(suuntaA)) };
      const pB_top = { x: pOrigin.x + vals.ji_siv_b * Math.cos(_deg(suuntaB)), y: pOrigin.y + vals.ji_siv_b * Math.sin(_deg(suuntaB)) };
      if (opts?.taitosA !== false) {
        const taitosSuunta = suuntaA + (180 - (vals.ji_taitos_ang || 25));
        const pT = { x: pA_top.x + (vals.ji_taitos_len||20) * Math.cos(_deg(taitosSuunta)), y: pA_top.y + (vals.ji_taitos_len||20) * Math.sin(_deg(taitosSuunta)) };
        extraLines.push({ p1: pA_top, p2: pT, label: vals.ji_taitos_len || 20 });
      }
      if (opts?.taitosB !== false) {
        const taitosSuunta = suuntaB - (180 - (vals.ji_taitos_ang || 25));
        const pT = { x: pB_top.x + (vals.ji_taitos_len||20) * Math.cos(_deg(taitosSuunta)), y: pB_top.y + (vals.ji_taitos_len||20) * Math.sin(_deg(taitosSuunta)) };
        extraLines.push({ p1: pB_top, p2: pT, label: vals.ji_taitos_len || 20, labelSide: -1 });
      }
      const points = [pA_top, pOrigin, pB_top];
      const labels = [vals.ji_siv_a, vals.ji_siv_b, null];
      const angleLabels = [null, vals.ji_kulma + '°', null];
      return { points, labels, extraLines, angleLabels };
    }
  },
  'seinänvieripelti': {
    name: 'Seinänvieripelti',
    build: (vals, opts) => {
      const extraLines = [];
      const pSeinaYla = { x: 0, y: 0 };
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pSeinaAla = { x: 0, y: bLen };
      const katolleSuunta = 180 - (90 - vals.seg0_ang);
      const pKatolle = { x: pSeinaAla.x + vals.seg0_len * Math.cos(_deg(katolleSuunta)), y: pSeinaAla.y + vals.seg0_len * Math.sin(_deg(katolleSuunta)) };
      const uraLahtoSuunta = katolleSuunta - vals.ura_ang;
      const uraEnd = { x: pKatolle.x + vals.ura_len * Math.cos(_deg(uraLahtoSuunta)), y: pKatolle.y + vals.ura_len * Math.sin(_deg(uraLahtoSuunta)) };
      const tupAAng = uraLahtoSuunta - 172;
      const tupAEnd = { x: uraEnd.x + vals.tupA_len * Math.cos(_deg(tupAAng)), y: uraEnd.y + vals.tupA_len * Math.sin(_deg(tupAAng)) };
      extraLines.push({ p1: uraEnd, p2: tupAEnd, label: vals.tupA_len, labelSide: -1 });
      let tiiBEnd = { ...pSeinaYla };
      if (opts?.tiiB) {
        tiiBEnd = { x: pSeinaYla.x + vals.tiiB_len * Math.cos(_deg(90 + 180 + 8)), y: pSeinaYla.y + vals.tiiB_len * Math.sin(_deg(90 + 180 + 8)) };
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? 90 + 360 : 90 + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len });
      }
      const points = [uraEnd, pKatolle, pSeinaAla, pSeinaYla];
      if (opts?.tiiB) points.push(tiiBEnd);
      const labels = [vals.ura_len, vals.seg0_len, bLen, null];
      const angleLabels = [null, vals.ura_ang + '°', vals.seg0_ang + '°', null, null];
      return { points, labels, extraLines, angleLabels };
    }
  },
  eturaaystaspelti: {
    name: 'Eturäystäspelti',
    build: (vals, opts) => {
      opts = { ...opts, nokka: true, tupB: true };
      const extraLines = [];
      let x = 0, y = 0, suunta = 0;
      let tiiAEnd = { x, y };
      if (opts?.tiiA) {
        tiiAEnd = { x: x + vals.tiiA_len * Math.cos(_deg(180 - 8)), y: y + vals.tiiA_len * Math.sin(_deg(180 - 8)) };
        if (opts?.tupA) {
          const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(_deg(8)), y: tiiAEnd.y + vals.tupA_len * Math.sin(_deg(8)) };
          extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len });
        }
      }
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      const pA0 = { x, y };
      suunta += vals.seg0_ang;
      const pKulma = { x: x + aLen, y };
      x = pKulma.x; y = pKulma.y;
      const pBend = { x: x + vals.seg1_len * Math.cos(_deg(suunta)), y: y + vals.seg1_len * Math.sin(_deg(suunta)) };
      x = pBend.x; y = pBend.y;
      const nokkSuunta = suunta - vals.nokka_ang;
      const nokkEnd = { x: x + vals.nokka_len * Math.cos(_deg(nokkSuunta)), y: y + vals.nokka_len * Math.sin(_deg(nokkSuunta)) };
      const tupSuunta = nokkSuunta + 180 - 8;
      const tupEnd = { x: nokkEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: nokkEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
      extraLines.push({ p1: nokkEnd, p2: tupEnd, label: vals.tupB_len });
      const points = opts?.tiiA ? [tiiAEnd, pA0, pKulma, pBend, nokkEnd] : [pA0, pKulma, pBend, nokkEnd];
      const labels = opts?.tiiA ? [vals.tiiA_len, aLen, vals.seg1_len, vals.nokka_len] : [aLen, vals.seg1_len, vals.nokka_len, null];
      const angleLabels = new Array(points.length).fill(null);
      const kulmaIdx = opts?.tiiA ? 2 : 1;
      angleLabels[kulmaIdx] = vals.seg0_ang + '°';
      angleLabels[kulmaIdx + 1] = vals.nokka_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  paatypelti: {
    name: 'Päätypelti',
    build: (vals) => {
      const extraLines = [];
      const harjaEnd = {
        x: -vals.harja_len * Math.cos(_deg(vals.harja_ang)),
        y: vals.harja_len * Math.sin(_deg(vals.harja_ang))
      };
      const tupASuunta = -(vals.harja_ang - 8);
      const tupAEnd = { x: harjaEnd.x + vals.tupA_len * Math.cos(_deg(tupASuunta)), y: harjaEnd.y + vals.tupA_len * Math.sin(_deg(tupASuunta)) };
      extraLines.push({ p1: harjaEnd, p2: tupAEnd, label: vals.tupA_len, labelSide: -1 });
      const pA0 = { x: 0, y: 0 };
      let suunta = 0;
      const pKulma = { x: vals.seg0_len, y: 0 };
      suunta += vals.seg0_ang;
      const pBend = { x: pKulma.x + vals.seg1_len * Math.cos(_deg(suunta)), y: pKulma.y + vals.seg1_len * Math.sin(_deg(suunta)) };
      const nokkSuunta = suunta - vals.nokka_ang;
      const nokkEnd = { x: pBend.x + vals.nokka_len * Math.cos(_deg(nokkSuunta)), y: pBend.y + vals.nokka_len * Math.sin(_deg(nokkSuunta)) };
      const tupBSuunta = nokkSuunta + 180 - 8;
      const tupBEnd = { x: nokkEnd.x + vals.tupB_len * Math.cos(_deg(tupBSuunta)), y: nokkEnd.y + vals.tupB_len * Math.sin(_deg(tupBSuunta)) };
      extraLines.push({ p1: nokkEnd, p2: tupBEnd, label: vals.tupB_len });
      const points = [harjaEnd, pA0, pKulma, pBend, nokkEnd];
      const labels = [vals.harja_len, vals.seg0_len, vals.seg1_len, vals.nokka_len, null];
      // nokka_ang bisektorin kautta mutta siirretään alas (angleOffsetSides -1 ei riitä)
      // käytetään angleOffsetPx joka antaa suoran pikselioffsetin
      const angleLabels = [null, null, vals.seg0_ang + '°', vals.nokka_ang + '°', null];
      const angleOffsetSides = [null, null, 1, -1, null];
      const angleOffsetPx = [null, null, null, [0, 12], null]; // nokka_ang 12px alaspäin
      // Uraan kulma tupla A:n yläpuolelle ja oikealle
      extraLines.push({ p1: harjaEnd, p2: tupAEnd, label: null, angleText: vals.harja_ang + '°', angleTextOffsetX: 14, angleTextOffsetY: -14 });
      return { points, labels, extraLines, angleLabels, angleOffsetSides, angleOffsetPx };
    }
  },
  paatypelti_huopa: {
    name: 'Päätypelti huopa',
    build: (vals) => {
      const extraLines = [];
      const pOrigin = { x: 0, y: 0 };
      const nousSuunta = 270 - vals.hp_kulma_ang;
      const pNousuEnd = { x: pOrigin.x + vals.hp_nousu_len * Math.cos(_deg(nousSuunta)), y: pOrigin.y + vals.hp_nousu_len * Math.sin(_deg(nousSuunta)) };
      const katolleSuunta = nousSuunta + (180 - vals.hp_katolle_ang);
      const pKatolle = { x: pNousuEnd.x + vals.hp_katolle_len * Math.cos(_deg(katolleSuunta)), y: pNousuEnd.y + vals.hp_katolle_len * Math.sin(_deg(katolleSuunta)) };
      const raystaSuunta = 90;
      const pRaysEnd = { x: pOrigin.x + vals.hp_raystas_len * Math.cos(_deg(raystaSuunta)), y: pOrigin.y + vals.hp_raystas_len * Math.sin(_deg(raystaSuunta)) };
      const nokkSuunta = raystaSuunta - vals.hp_nokka_ang;
      const nokkEnd = { x: pRaysEnd.x + vals.hp_nokka_len * Math.cos(_deg(nokkSuunta)), y: pRaysEnd.y + vals.hp_nokka_len * Math.sin(_deg(nokkSuunta)) };
      const tupSuunta = nokkSuunta + 180 - 8;
      const tupEnd = { x: nokkEnd.x + vals.hp_tupla_len * Math.cos(_deg(tupSuunta)), y: nokkEnd.y + vals.hp_tupla_len * Math.sin(_deg(tupSuunta)) };
      extraLines.push({ p1: nokkEnd, p2: tupEnd, label: vals.hp_tupla_len });
      const points = [pKatolle, pNousuEnd, pOrigin, pRaysEnd, nokkEnd];
      const labels = [vals.hp_katolle_len, vals.hp_nousu_len, vals.hp_raystas_len, vals.hp_nokka_len, null];
      const angleLabels = [null, vals.hp_katolle_ang + '°', vals.hp_kulma_ang + '°', vals.hp_nokka_ang + '°', null];
      return { points, labels, extraLines, angleLabels };
    }
  },
  // U-lista u — sivut menevät ALAS (pinta ylhäällä)
  ulista: {
    name: 'U-lista u',
    build: (vals, opts) => {
      const points = [], labels = [], extraLines = [];
      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };
      const suuntaB = 180 - vals.seg0_ang;
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = { x: pA0.x + vals.seg1_len * Math.cos(_deg(suuntaB)), y: pA0.y + vals.seg1_len * Math.sin(_deg(suuntaB)) };
      const pBendShort = { x: pA0.x + bLen * Math.cos(_deg(suuntaB)), y: pA0.y + bLen * Math.sin(_deg(suuntaB)) };
      const suuntaC = vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = { x: pA1.x + vals.seg2_len * Math.cos(_deg(suuntaC)), y: pA1.y + vals.seg2_len * Math.sin(_deg(suuntaC)) };
      const pCendShort = { x: pA1.x + cLen * Math.cos(_deg(suuntaC)), y: pA1.y + cLen * Math.sin(_deg(suuntaC)) };
      // Tiiviste B (vasen alapää) — lisätään pistelistaan
      let tiiBEnd = opts?.tiiB ? pBendShort : pBend;
      if (opts?.tiiB) {
        tiiBEnd = { x: pBendShort.x + vals.tiiB_len * Math.cos(_deg(suuntaB - 8)), y: pBendShort.y + vals.tiiB_len * Math.sin(_deg(suuntaB - 8)) };
        points.push(tiiBEnd); labels.push(vals.tiiB_len);
        points.push(pBendShort); labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB - 180 : suuntaB - 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelSide: -1 });
      }
      // Pääviiva
      points.push(opts?.tiiB ? pBendShort : pBend); labels.push(opts?.tiiB ? bLen : vals.seg1_len);
      points.push(pA0); labels.push(vals.seg0_len);
      points.push(pA1); labels.push(opts?.tiiC ? cLen : vals.seg2_len);
      points.push(opts?.tiiC ? pCendShort : pCend);
      // Tiiviste C (oikea alapää)
      let tiiCEnd = opts?.tiiC ? pCendShort : pCend;
      if (opts?.tiiC) {
        tiiCEnd = { x: pCendShort.x + vals.tiiC_len * Math.cos(_deg(suuntaC + 8)), y: pCendShort.y + vals.tiiC_len * Math.sin(_deg(suuntaC + 8)) };
        points.push(tiiCEnd); labels.push(vals.tiiC_len);
        points.push(pCendShort); labels.push('');
      }
      if (opts?.tupC) {
        const tupSuunta = opts?.tiiC ? suuntaC + 180 : suuntaC + 172;
        const tupEnd = { x: tiiCEnd.x + vals.tupC_len * Math.cos(_deg(tupSuunta)), y: tiiCEnd.y + vals.tupC_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiCEnd, p2: tupEnd, label: vals.tupC_len });
      }
      const angleLabels = new Array(points.length).fill(null);
      const a0idx = opts?.tiiB ? 3 : 1; const a1idx = a0idx + 1;
      if (a0idx < angleLabels.length) angleLabels[a0idx] = vals.seg0_ang + '°';
      if (a1idx < angleLabels.length) angleLabels[a1idx] = vals.seg1_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  ulistas: {
    name: 'U-lista s',
    build: (vals, opts) => {
      const points = [], labels = [], extraLines = [];
      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };
      const suuntaB = -(180 - vals.seg0_ang);
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = { x: pA0.x + vals.seg1_len * Math.cos(_deg(suuntaB)), y: pA0.y + vals.seg1_len * Math.sin(_deg(suuntaB)) };
      const pBendShort = { x: pA0.x + bLen * Math.cos(_deg(suuntaB)), y: pA0.y + bLen * Math.sin(_deg(suuntaB)) };
      const suuntaC = -vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = { x: pA1.x + vals.seg2_len * Math.cos(_deg(suuntaC)), y: pA1.y + vals.seg2_len * Math.sin(_deg(suuntaC)) };
      const pCendShort = { x: pA1.x + cLen * Math.cos(_deg(suuntaC)), y: pA1.y + cLen * Math.sin(_deg(suuntaC)) };
      // Tiiviste B (vasen yläpää)
      let tiiBEnd = opts?.tiiB ? pBendShort : pBend;
      if (opts?.tiiB) {
        tiiBEnd = { x: pBendShort.x + vals.tiiB_len * Math.cos(_deg(suuntaB - 8)), y: pBendShort.y + vals.tiiB_len * Math.sin(_deg(suuntaB - 8)) };
        points.push(tiiBEnd); labels.push(vals.tiiB_len);
        points.push(pBendShort); labels.push('');
      }
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB - 180 : suuntaB - 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len, labelSide: -1 });
      }
      // Pääviiva
      points.push(opts?.tiiB ? pBendShort : pBend); labels.push(opts?.tiiB ? bLen : vals.seg1_len);
      points.push(pA0); labels.push(vals.seg0_len);
      points.push(pA1); labels.push(opts?.tiiC ? cLen : vals.seg2_len);
      points.push(opts?.tiiC ? pCendShort : pCend);
      // Tiiviste C (oikea yläpää)
      let tiiCEnd = opts?.tiiC ? pCendShort : pCend;
      if (opts?.tiiC) {
        tiiCEnd = { x: pCendShort.x + vals.tiiC_len * Math.cos(_deg(suuntaC + 8)), y: pCendShort.y + vals.tiiC_len * Math.sin(_deg(suuntaC + 8)) };
        points.push(tiiCEnd); labels.push(vals.tiiC_len);
        points.push(pCendShort); labels.push('');
      }
      if (opts?.tupC) {
        const tupSuunta = opts?.tiiC ? suuntaC + 180 : suuntaC + 172;
        const tupEnd = { x: tiiCEnd.x + vals.tupC_len * Math.cos(_deg(tupSuunta)), y: tiiCEnd.y + vals.tupC_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiCEnd, p2: tupEnd, label: vals.tupC_len });
      }
      const angleLabels = new Array(points.length).fill(null);
      const a0idx = opts?.tiiB ? 3 : 1; const a1idx = a0idx + 1;
      if (a0idx < angleLabels.length) angleLabels[a0idx] = vals.seg0_ang + '°';
      if (a1idx < angleLabels.length) angleLabels[a1idx] = vals.seg1_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  kynnys: {
    name: 'Kynnys',
    build: (vals) => {
      const pEtuylapaa = { x: 0, y: 0 };
      let suunta = 90;
      const pEtualapaa = { x: pEtuylapaa.x + vals.seg2_len * Math.cos(_deg(suunta)), y: pEtuylapaa.y + vals.seg2_len * Math.sin(_deg(suunta)) };
      suunta += (vals.seg3_ang || 125);
      const pEtukaannos = (vals.seg3_len > 0) ? { x: pEtualapaa.x + vals.seg3_len * Math.cos(_deg(suunta)), y: pEtualapaa.y + vals.seg3_len * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - vals.seg1_ang);
      const pPintapaaty = { x: pEtuylapaa.x + vals.seg1_len * Math.cos(_deg(suunta)), y: pEtuylapaa.y + vals.seg1_len * Math.sin(_deg(suunta)) };
      suunta += vals.seg0_ang;
      const pTakaylapaa = { x: pPintapaaty.x + vals.seg0_len * Math.cos(_deg(suunta)), y: pPintapaaty.y + vals.seg0_len * Math.sin(_deg(suunta)) };
      const points = [pTakaylapaa, pPintapaaty, pEtuylapaa, pEtualapaa];
      if (pEtukaannos) points.push(pEtukaannos);
      const labels = [vals.seg0_len, vals.seg1_len, vals.seg2_len, vals.seg3_len > 0 ? vals.seg3_len : null];
      const angleLabels = [null, vals.seg0_ang + '°', vals.seg1_ang + '°', null, null];
      const angleOffsetSides = [null, 1, -1, null, null]; // etureuna-kulma vasemmalle
      return { points, labels, extraLines: [], angleLabels, angleOffsetSides };
    }
  },
  hattulista: {
    name: 'Hattulista',
    build: (vals, opts) => {
      const extraLines = [];
      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: vals.seg0_len, y: 0 };
      const suuntaB = 180 - vals.seg0_ang;
      const bLen = opts?.tiiB ? vals.seg1_len - vals.tiiB_len : vals.seg1_len;
      const pBend = { x: pA0.x + vals.seg1_len * Math.cos(_deg(suuntaB)), y: pA0.y + vals.seg1_len * Math.sin(_deg(suuntaB)) };
      const pBendShort = { x: pA0.x + bLen * Math.cos(_deg(suuntaB)), y: pA0.y + bLen * Math.sin(_deg(suuntaB)) };
      const suuntaC = vals.seg1_ang;
      const cLen = opts?.tiiC ? vals.seg2_len - vals.tiiC_len : vals.seg2_len;
      const pCend = { x: pA1.x + vals.seg2_len * Math.cos(_deg(suuntaC)), y: pA1.y + vals.seg2_len * Math.sin(_deg(suuntaC)) };
      const laippaVSuunta = suuntaB + (vals.laippaV_ang || 90);
      const pLaippaV = { x: pBend.x + vals.laippaV_len * Math.cos(_deg(laippaVSuunta)), y: pBend.y + vals.laippaV_len * Math.sin(_deg(laippaVSuunta)) };
      const laippaOSuunta = suuntaC - (vals.laippaO_ang || 90);
      const pLaippaO = { x: pCend.x + vals.laippaO_len * Math.cos(_deg(laippaOSuunta)), y: pCend.y + vals.laippaO_len * Math.sin(_deg(laippaOSuunta)) };
      if (opts?.tupB) {
        const tupSuunta = laippaVSuunta - 172;
        const tupEnd = { x: pLaippaV.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: pLaippaV.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: pLaippaV, p2: tupEnd, label: vals.tupB_len });
      }
      if (opts?.tupC) {
        const tupSuunta = laippaOSuunta + 172;
        const tupEnd = { x: pLaippaO.x + vals.tupC_len * Math.cos(_deg(tupSuunta)), y: pLaippaO.y + vals.tupC_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: pLaippaO, p2: tupEnd, label: vals.tupC_len });
      }
      const points = [pLaippaV, pBend, pA0, pA1, pCend, pLaippaO];
      const labels = [vals.laippaV_len, bLen, vals.seg0_len, cLen, vals.laippaO_len, null];
      const angleLabels = [null, vals.seg0_ang + '°', null, null, vals.seg1_ang + '°', null];
      return { points, labels, extraLines, angleLabels };
    }
  },
  zlista: {
    name: 'Z-lista',
    build: (vals, opts) => {
      const points = [], labels = [], extraLines = [];

      const pA0 = { x: 0, y: 0 };
      const aLen = opts?.tiiA ? vals.seg0_len - vals.tiiA_len : vals.seg0_len;
      const pA1 = { x: vals.seg0_len, y: 0 };
      const pA1Short = { x: aLen, y: 0 };

      // Tiiviste A: vasemmalle ylös, lisätään pistelistaan
      let tiiAEnd = { x: 0, y: 0 };
      if (opts?.tiiA) {
        tiiAEnd = { x: pA0.x + vals.tiiA_len * Math.cos(_deg(180 - 8)), y: pA0.y + vals.tiiA_len * Math.sin(_deg(180 - 8)) };
        points.push(tiiAEnd); labels.push(vals.tiiA_len);
        points.push(pA0); labels.push('');
      }
      // Tupla A
      if (opts?.tupA) {
        const tupAng = opts?.tiiA ? 0 : 8;
        const tupEnd = { x: tiiAEnd.x + vals.tupA_len * Math.cos(_deg(tupAng)), y: tiiAEnd.y + vals.tupA_len * Math.sin(_deg(tupAng)) };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.tupA_len, labelSide: -1 });
      }

      // Sivu A: pA0 → pA1Short
      points.push(pA0); labels.push(aLen);
      points.push(opts?.tiiA ? pA1Short : pA1); labels.push(vals.seg1_len);

      // Nousu: lähtee pA1Short:sta
      const suuntaNousu = -(vals.seg0_ang);
      const nousAlku = opts?.tiiA ? pA1Short : pA1;
      const pNousuEnd = {
        x: nousAlku.x + vals.seg1_len * Math.cos(_deg(suuntaNousu)),
        y: nousAlku.y + vals.seg1_len * Math.sin(_deg(suuntaNousu))
      };

      // B pinta: nousun päästä
      const suuntaB = suuntaNousu + vals.seg1_ang;
      const bLen = opts?.tiiB ? vals.seg2_len - vals.tiiB_len : vals.seg2_len;
      const pB1 = { x: pNousuEnd.x + vals.seg2_len * Math.cos(_deg(suuntaB)), y: pNousuEnd.y + vals.seg2_len * Math.sin(_deg(suuntaB)) };
      const pB1Short = { x: pNousuEnd.x + bLen * Math.cos(_deg(suuntaB)), y: pNousuEnd.y + bLen * Math.sin(_deg(suuntaB)) };

      points.push(pNousuEnd); labels.push(bLen);
      points.push(opts?.tiiB ? pB1Short : pB1);

      // Tiiviste B: oikealla, lisätään pistelistaan
      let tiiBEnd = opts?.tiiB ? pB1Short : pB1;
      if (opts?.tiiB) {
        const tiiSuunta = suuntaB + 8;
        tiiBEnd = { x: pB1Short.x + vals.tiiB_len * Math.cos(_deg(tiiSuunta)), y: pB1Short.y + vals.tiiB_len * Math.sin(_deg(tiiSuunta)) };
        points.push(tiiBEnd); labels.push(vals.tiiB_len);
        points.push(pB1Short); labels.push('');
      }
      // Tupla B
      if (opts?.tupB) {
        const tupSuunta = opts?.tiiB ? suuntaB + 180 : suuntaB + 172;
        const tupEnd = { x: tiiBEnd.x + vals.tupB_len * Math.cos(_deg(tupSuunta)), y: tiiBEnd.y + vals.tupB_len * Math.sin(_deg(tupSuunta)) };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.tupB_len });
      }

      // Kulmat: pA1/pA1Short on nousukulman piste, pNousuEnd on yläkulman piste
      const angleLabels = new Array(points.length).fill(null);
      // Tiiviste A lisää 2 pistettä ennen pA0
      const tiiOffset = opts?.tiiA ? 2 : 0;
      // pA1Short indeksi = tiiOffset + 2 (pA0 on tiiOffset+1, pA1Short on tiiOffset+2)
      const nousIdx = tiiOffset + 2;
      const ylaIdx = tiiOffset + 3;
      if (nousIdx < angleLabels.length) angleLabels[nousIdx] = vals.seg0_ang + '°';
      if (ylaIdx < angleLabels.length) angleLabels[ylaIdx] = vals.seg1_ang + '°';
      return { points, labels, extraLines, angleLabels };
    }
  },
  peitelista: {
    name: 'Peitelista',
    build: (vals, opts) => {
      const extraLines = [];
      const pA = { x: 0, y: 0 };
      const pB = { x: vals.pl_lev || vals.seg0_len || 100, y: 0 };

      // Pääviiva tiivisteen sisäreunasta sisäreunaan
      const pAinner = opts?.tiiA ? { x: pA.x + vals.pl_tiiA_len, y: 0 } : pA;
      const pBinner = opts?.tiiB ? { x: pB.x - vals.pl_tiiB_len, y: 0 } : pB;
      const levNaytto = (vals.pl_lev || vals.seg0_len || 100)
        - (opts?.tiiA ? (vals.pl_tiiA_len || 0) : 0)
        - (opts?.tiiB ? (vals.pl_tiiB_len || 0) : 0);

      // Tiiviste vasen: lähtee pAinner:stä vasemmalle alas
      let tiiAEnd = pAinner;
      if (opts?.tiiA && vals.pl_tiiA_len) {
        const tiiSuunta = 180 - (vals.pl_tiiA_ang || 8);
        tiiAEnd = {
          x: pAinner.x + vals.pl_tiiA_len * Math.cos(_deg(tiiSuunta)),
          y: pAinner.y + vals.pl_tiiA_len * Math.sin(_deg(tiiSuunta))
        };
        extraLines.push({ p1: pAinner, p2: tiiAEnd, label: vals.pl_tiiA_len, labelSide: -1 });
      }
      if (opts?.tupA && vals.pl_tupA_len) {
        const tupSuunta = opts?.tiiA ? 0 : 8;
        const tupEnd = {
          x: tiiAEnd.x + vals.pl_tupA_len * Math.cos(_deg(tupSuunta)),
          y: tiiAEnd.y + vals.pl_tupA_len * Math.sin(_deg(tupSuunta))
        };
        extraLines.push({ p1: tiiAEnd, p2: tupEnd, label: vals.pl_tupA_len, labelSide: -1 });
      }

      // Tiiviste oikea: lähtee pBinner:stä oikealle alas
      let tiiBEnd = pBinner;
      if (opts?.tiiB && vals.pl_tiiB_len) {
        const tiiSuunta = vals.pl_tiiB_ang || 8;
        tiiBEnd = {
          x: pBinner.x + vals.pl_tiiB_len * Math.cos(_deg(tiiSuunta)),
          y: pBinner.y + vals.pl_tiiB_len * Math.sin(_deg(tiiSuunta))
        };
        extraLines.push({ p1: pBinner, p2: tiiBEnd, label: vals.pl_tiiB_len });
      }
      if (opts?.tupB && vals.pl_tupB_len) {
        const tupSuunta = opts?.tiiB ? 180 : 180 - 8;
        const tupEnd = {
          x: tiiBEnd.x + vals.pl_tupB_len * Math.cos(_deg(tupSuunta)),
          y: tiiBEnd.y + vals.pl_tupB_len * Math.sin(_deg(tupSuunta))
        };
        extraLines.push({ p1: tiiBEnd, p2: tupEnd, label: vals.pl_tupB_len });
      }

      const points = [pAinner, pBinner];
      const labels = [levNaytto];
      return { points, labels, extraLines, angleLabels: [null, null] };
    }
  },

  // katkaisulista = Ulkoverhouksen katkaisulista — sama geometria kuin avp,
  // samat kentät (takareuna, pinta, etureuna, etukaannos, kaannos_taka, kaannos_etu, etur)
  katkaisulista: {
    name: 'Ulkoverh. katkaisulista',
    build: (vals) => {
      const pEtuYla = { x: 0, y: 0 };
      let suunta = 90;
      const pEtuAla = { x: pEtuYla.x + (vals.etureuna||50) * Math.cos(_deg(suunta)), y: pEtuYla.y + (vals.etureuna||50) * Math.sin(_deg(suunta)) };
      suunta += (vals.etur || 125);
      const pEtuK = (vals.etukaannos > 0) ? { x: pEtuAla.x + vals.etukaannos * Math.cos(_deg(suunta)), y: pEtuAla.y + vals.etukaannos * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - (vals.kaannos_etu || 72));
      const pPinta = { x: pEtuYla.x + (vals.pinta||100) * Math.cos(_deg(suunta)), y: pEtuYla.y + (vals.pinta||100) * Math.sin(_deg(suunta)) };
      suunta += (vals.kaannos_taka || 72);
      const pTaka = { x: pPinta.x + (vals.takareuna||90) * Math.cos(_deg(suunta)), y: pPinta.y + (vals.takareuna||90) * Math.sin(_deg(suunta)) };
      const points = [pTaka, pPinta, pEtuYla, pEtuAla];
      if (pEtuK) points.push(pEtuK);
      const labels = [vals.takareuna, vals.pinta, vals.etureuna, vals.etukaannos > 0 ? vals.etukaannos : null];
      const angleLabels = [null, (vals.kaannos_taka||72) + '°', (vals.kaannos_etu||72) + '°', null, null];
      const angleOffsetSides = [null, 1, -1, null, null];
      return { points, labels, extraLines: [], angleLabels, angleOffsetSides };
    }
  },

  // ── VAKIOMALLIT-PROFIILIT ─────────────────────────────────────────
  ikkunapellit: {
    name: 'Ikkunapelti',
    build: (vals) => {
      // ikkunapelti: pinta = paanYlos + paanAlas
      // vals-kentät: takareuna, paanYlos, paanAlas, etureuna, etukaannos,
      //              kaannos_taka, kaannos_etu, etur
      const takareuna   = vals.takareuna   || 0;
      const paanYlos    = vals.paanYlos    || 0;
      const paanAlas    = vals.paanAlas    || 0;
      const pinta       = paanYlos + paanAlas;
      const etureuna    = vals.etureuna    || 0;
      const etukaannos  = vals.etukaannos  || 0;
      const kaannos_taka = vals.kaannos_taka || 75;
      const kaannos_etu  = vals.kaannos_etu  || 75;
      const etur         = vals.etur         || 125;

      const pEtuYla = { x: 0, y: 0 };
      let suunta = 90;
      const pEtuAla = { x: pEtuYla.x + etureuna * Math.cos(_deg(suunta)), y: pEtuYla.y + etureuna * Math.sin(_deg(suunta)) };
      suunta += etur;
      const pEtuK = etukaannos > 0 ? { x: pEtuAla.x + etukaannos * Math.cos(_deg(suunta)), y: pEtuAla.y + etukaannos * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - kaannos_etu);
      const pPinta = { x: pEtuYla.x + pinta * Math.cos(_deg(suunta)), y: pEtuYla.y + pinta * Math.sin(_deg(suunta)) };
      suunta += kaannos_taka;
      const pTaka = { x: pPinta.x + takareuna * Math.cos(_deg(suunta)), y: pPinta.y + takareuna * Math.sin(_deg(suunta)) };

      // Päänkääntöpiste pinnan sisällä: paanYlos-verran etureunan päästä
      const pPaanYlosEnd = {
        x: pPinta.x + (pEtuYla.x - pPinta.x) * (paanYlos / (pinta || 1)),
        y: pPinta.y + (pEtuYla.y - pPinta.y) * (paanYlos / (pinta || 1))
      };

      const points = [pTaka, pPinta, pEtuYla, pEtuAla];
      if (pEtuK) points.push(pEtuK);

      // Mitat: takareuna, pinta yhteensä, etureuna, etukaannos
      // paanYlos ja paanAlas näytetään extraLinenä pinnan sisällä
      const extraLines = [];
      if (paanYlos > 0 && paanAlas > 0) {
        extraLines.push({ p1: pPinta, p2: pPaanYlosEnd, label: paanYlos });
        extraLines.push({ p1: pPaanYlosEnd, p2: pEtuYla, label: paanAlas });
      }

      const labels = [takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null];
      const angleLabels = [null, kaannos_taka + '°', kaannos_etu + '°', null, null];
      return { points, labels, extraLines, angleLabels };
    }
  },

  kynnys1: {
    name: 'Kynnyspelti 1',
    build: (vals) => {
      const suora1 = vals.suora1 || 32;
      const pinta = vals.pinta || 88;
      const etureuna = vals.etureuna || 113;
      const tippanokka = vals.tippanokka || 7;
      const takareuna = vals.takareuna || 20;
      const suora_ang = vals.suora_ang || 6;
      const kulma_ang = vals.kulma_ang || 84;
      const nokka_ang = vals.nokka_ang || 45;
      const kaannos_taka = vals.kaannos_taka || 0;
      const pA0 = { x: 0, y: 0 };
      const pintaKaato = 90 - kulma_ang;
      const pKulma = { x: pA0.x + pinta * Math.cos(_deg(pintaKaato)), y: pA0.y + pinta * Math.sin(_deg(pintaKaato)) };
      const pEtuAla = { x: pKulma.x, y: pKulma.y + etureuna };
      const nokkaSuunta = 90 - nokka_ang;
      const pNokka = { x: pEtuAla.x + tippanokka * Math.cos(_deg(nokkaSuunta)), y: pEtuAla.y + tippanokka * Math.sin(_deg(nokkaSuunta)) };
      const suora1Suunta = pintaKaato + (180 - suora_ang);
      const harjaEnd = { x: pA0.x + suora1 * Math.cos(_deg(suora1Suunta)), y: pA0.y + suora1 * Math.sin(_deg(suora1Suunta)) };
      const takaAng = suora1Suunta + kaannos_taka;
      const takaEnd = { x: harjaEnd.x + takareuna * Math.cos(_deg(takaAng)), y: harjaEnd.y + takareuna * Math.sin(_deg(takaAng)) };
      const points = [pNokka, pEtuAla, pKulma, pA0, harjaEnd, takaEnd];
      const labels = [tippanokka, etureuna, pinta, suora1, takareuna, null];
      const angleLabels = [null, null, kulma_ang + '°', suora_ang + '°', null, null];
      return { points, labels, extraLines: [], angleLabels };
    }
  },
  alaslaskun: {
    name: 'Alaslaskun kappalista',
    build: (vals) => {
      const seg0 = vals.seg0 || 82, seg1 = vals.seg1 || 40, seg2 = vals.seg2 || 10;
      const tupB = vals.tupB || 15, ang0 = vals.ang0 || 97, ang1 = vals.ang1 || 90;
      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: seg0, y: 0 };
      // Vasen sivu: alas, suuntaB = 180 - ang0
      const suuntaB = 180 - ang0;
      const pBend = { x: pA0.x + seg1 * Math.cos(_deg(suuntaB)), y: pA0.y + seg1 * Math.sin(_deg(suuntaB)) };
      // Tupla vasen: suuntaB - 172
      const tupBSuunta = suuntaB - 172;
      const pTupB = { x: pBend.x + tupB * Math.cos(_deg(tupBSuunta)), y: pBend.y + tupB * Math.sin(_deg(tupBSuunta)) };
      // Oikea sivu: alas, suuntaC = ang1
      const suuntaC = ang1;
      const pCend = { x: pA1.x + seg2 * Math.cos(_deg(suuntaC)), y: pA1.y + seg2 * Math.sin(_deg(suuntaC)) };
      // pTupB pääviivaan (kuten alkuperäisessä buildUlista)
      const points = [pTupB, pBend, pA0, pA1, pCend];
      const labels = [tupB, seg1, seg0, seg2, null];
      const angleLabels = [null, null, ang0 + '°', ang1 + '°', null];
      return { points, labels, extraLines: [], angleLabels };
    }
  },
  hattupelti: {
    name: 'Hattupelti viipalesaumaan',
    build: (vals) => {
      const seg0 = vals.seg0 || 280, seg1 = vals.seg1 || 55, seg2 = vals.seg2 || 55;
      const tupB = vals.tupB || 10, tupC = vals.tupC || 10;
      const ang0 = vals.ang0 || 45, ang1 = vals.ang1 || 45;
      const pA0 = { x: 0, y: 0 };
      const pA1 = { x: seg0, y: 0 };
      const suuntaB = 180 - ang0;
      const pBend = { x: pA0.x + seg1 * Math.cos(_deg(suuntaB)), y: pA0.y + seg1 * Math.sin(_deg(suuntaB)) };
      const tupBSuunta = suuntaB - 172;
      const pTupB = { x: pBend.x + tupB * Math.cos(_deg(tupBSuunta)), y: pBend.y + tupB * Math.sin(_deg(tupBSuunta)) };
      const suuntaC = ang1;
      const pCend = { x: pA1.x + seg2 * Math.cos(_deg(suuntaC)), y: pA1.y + seg2 * Math.sin(_deg(suuntaC)) };
      const tupCSuunta = suuntaC + 172;
      const pTupC = { x: pCend.x + tupC * Math.cos(_deg(tupCSuunta)), y: pCend.y + tupC * Math.sin(_deg(tupCSuunta)) };
      // Molemmat tuplat pääviivaan
      const points = [pTupB, pBend, pA0, pA1, pCend, pTupC];
      const labels = [tupB, seg1, seg0, seg2, tupC, null];
      const angleLabels = [null, null, ang0 + '°', ang1 + '°', null, null];
      return { points, labels, extraLines: [], angleLabels };
    }
  },
  kattolista: {
    name: 'Kattolista',
    build: (vals) => {
      const seg0 = vals.seg0 || 50, seg1 = vals.seg1 || 50;
      const tupA = vals.tupA || 15, tupB = vals.tupB || 15, ang0 = vals.ang0 || 90;
      const pA0 = { x: 0, y: 0 };
      const pKulma = { x: pA0.x + seg0, y: 0 };
      const suunta = -ang0;
      const pBend = { x: pKulma.x + seg1 * Math.cos(_deg(suunta)), y: pKulma.y + seg1 * Math.sin(_deg(suunta)) };
      // Tupla A: lähtee pA0:sta 8° suuntaan
      const pTupA = { x: pA0.x + tupA * Math.cos(_deg(8)), y: pA0.y + tupA * Math.sin(_deg(8)) };
      // Tupla B: lähtee pBend:stä suunta+172
      const tupBSuunta = suunta + 172;
      const pTupB = { x: pBend.x + tupB * Math.cos(_deg(tupBSuunta)), y: pBend.y + tupB * Math.sin(_deg(tupBSuunta)) };
      // Alkuperäisen mukaan: pts = [pTupA, pA0, pKulma, pBend], tuplat erillisinä viivoina
      // mutta skaalauksen kannalta lisätään pTupB pistelistaan
      const points = [pTupA, pA0, pKulma, pBend];
      const labels = [tupA, seg0, seg1, null];
      const angleLabels = [null, null, ang0 + '°', null];
      const extraLines = [{ p1: pBend, p2: pTupB, label: tupB }];
      return { points, labels, extraLines, angleLabels };
    }
  },
  raystaslista: {
    name: 'Räystäslista',
    build: (vals) => {
      const ikkuna = vals.ikkuna || 0, takareuna = vals.takareuna || 90;
      const pinta = vals.pinta || 100, etureuna = vals.etureuna || 50;
      const etukaannos = vals.etukaannos || 10;
      const ikkuna_ang = vals.ikkuna_ang || 90, kaannos_taka = vals.kaannos_taka || 72;
      const kaannos_etu = vals.kaannos_etu || 72, etur = vals.etur || 125;
      const pEtuYla = { x: 0, y: 0 };
      let suunta = 90;
      const pEtuAla = { x: pEtuYla.x + etureuna * Math.cos(_deg(suunta)), y: pEtuYla.y + etureuna * Math.sin(_deg(suunta)) };
      suunta += etur;
      const pEtuK = etukaannos > 0 ? { x: pEtuAla.x + etukaannos * Math.cos(_deg(suunta)), y: pEtuAla.y + etukaannos * Math.sin(_deg(suunta)) } : null;
      suunta = 90 + (180 - kaannos_etu);
      const pPinta = { x: pEtuYla.x + pinta * Math.cos(_deg(suunta)), y: pEtuYla.y + pinta * Math.sin(_deg(suunta)) };
      suunta += kaannos_taka;
      const pTaka = { x: pPinta.x + takareuna * Math.cos(_deg(suunta)), y: pPinta.y + takareuna * Math.sin(_deg(suunta)) };
      const karmiSuunta = 180 + (90 - ikkuna_ang);
      const pKarmi = { x: pTaka.x + ikkuna * Math.cos(_deg(karmiSuunta)), y: pTaka.y + ikkuna * Math.sin(_deg(karmiSuunta)) };
      const points = ikkuna > 0 ? [pKarmi, pTaka, pPinta, pEtuYla, pEtuAla] : [pTaka, pPinta, pEtuYla, pEtuAla];
      if (pEtuK) points.push(pEtuK);
      const labels = ikkuna > 0 ? [ikkuna, takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null]
                                 : [takareuna, pinta, etureuna, etukaannos > 0 ? etukaannos : null];
      const baseAngles = ikkuna > 0 ? [null, ikkuna_ang + '°', kaannos_taka + '°', kaannos_etu + '°', null, null]
                                    : [null, kaannos_taka + '°', kaannos_etu + '°', null, null];
      return { points, labels, extraLines: [], angleLabels: baseAngles };
    }
  }
};
// ═══════════════════════════════════════════════════════════════════
//  YHTEINEN PIIRTO — piirraKuva()
// ═══════════════════════════════════════════════════════════════════
// Piirtää pellin poikkileikkauksen SVG-merkkijonoksi. Yksi viewBox-yksikkö = yksi
// ruudun pikseli (kutsuja asettaa viewBoxin kuvan todelliseen kokoon), joten tekstit
// pysyvät luettavina myös puhelimella.
//
// - Mitat asettuvat itse: pinnan (värillisen puolen) puolelle, eivät viivan eivätkä
//   toistensa päälle. Ahtaassa kohdassa mitta siirtyy kauemmas ja saa apuviivan,
//   viimeisenä keinona vaihtaa puolta.
// - Kulmat ovat kanttikoneen lukuja: 180 − taitoksen sisäkulma (esim. 130° → 50°).
//   Kulma näytetään jokaisessa taitoksessa paitsi tuplassa (lähes kaksinkerroin).
// - Pinnan puoli päätellään mallin pintaViiva-tiedosta: pintaviivan yläpuoli mallin
//   omassa oletusasennossa. Pelti on yksi viivaketju, joten puoli on sama koko matkan.
// - asento = { viiva, suunta: 'vaaka'|'pysty', kierto: 0..3, peili } kääntää vain kuvaa.

const RR_VARIT = {
  // Likimääräiset sävyt väriraitaa varten (ei värimalliksi asiakkaalle)
  RR11: '#1f3d2b', RR20: '#f1f1ec', RR21: '#b9bbb8', RR22: '#8d8f8f', RR23: '#474b4e',
  RR29: '#7e2520', RR32: '#3a2a22', RR33: '#1a1a1c', RR35: '#2d4a66', RR37: '#3c5a40',
  RR750: '#7a3b2a', RR887: '#3b2b25'
};

function variHex(teksti) {
  if (!teksti) return null;
  const s = String(teksti).trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  const m = s.toUpperCase().match(/RR\s?(\d{2,3})/);
  if (m && RR_VARIT['RR' + m[1]]) return RR_VARIT['RR' + m[1]];
  return null;
}

function muotoile(n) {
  if (typeof n !== 'number') return String(n);
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

function piirraKuva(p) {
  const tulos = p.tulos || {};
  const raaka = (Array.isArray(tulos) ? tulos : (tulos.points || [])).filter(q => q && isFinite(q.x) && isFinite(q.y));
  const labels = Array.isArray(tulos) ? null : (tulos.labels || null);
  const extra0 = (Array.isArray(tulos) ? [] : (tulos.extraLines || [])).filter(e => e && e.p1 && e.p2);
  const pintaViiva = Array.isArray(tulos) ? null : (tulos.pintaViiva || null);
  const W = p.W || 700, H = p.H || 340;
  const alaTila = p.alaTila || 0;
  const reunus = p.reunus != null ? p.reunus : 52;
  const asento = p.asento || {};
  const merkinta = p.merkinta || 'raita';
  const naytaMitat = p.naytaMitat !== false;
  const naytaKulmat = p.naytaKulmat !== false;
  const T = Object.assign({
    viiva: '#222', mitta: '#1a6fc4', kulma: '#c0392b', himmea: '#666', tausta: '#ffffff',
    paa: '#e8a020', karki: '#555', raita: '#e8a020', fontti: 'IBM Plex Mono, monospace'
  }, p.teema || {});
  const raitaVari = variHex(p.vari) || T.raita;

  if (raaka.length < 2) return { svg: '', mitat: [], pisteet: [] };
  const n = raaka.length;
  const EPS = 0.01;
  const pit0 = i => Math.hypot(raaka[i + 1].x - raaka[i].x, raaka[i + 1].y - raaka[i].y);

  // ── Pinnan puoli (mallin omassa asennossa) ──
  function oletusPuoli() {
    let idx = -1;
    const lahella = (a, b) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
    if (pintaViiva && pintaViiva.p1 && pintaViiva.p2) {
      for (let i = 0; i < n - 1; i++) {
        if ((lahella(raaka[i], pintaViiva.p1) && lahella(raaka[i + 1], pintaViiva.p2)) ||
            (lahella(raaka[i], pintaViiva.p2) && lahella(raaka[i + 1], pintaViiva.p1))) { idx = i; break; }
      }
      if (idx < 0) {
        // pintaviiva ei ole ketjun viiva: käytetään sen suuntaa lähimpään ketjun viivaan
        const dx = pintaViiva.p2.x - pintaViiva.p1.x, dy = pintaViiva.p2.y - pintaViiva.p1.y;
        let paras = -1;
        for (let i = 0; i < n - 1; i++) {
          const l = pit0(i); if (l < EPS) continue;
          const c = Math.abs(((raaka[i + 1].x - raaka[i].x) * dx + (raaka[i + 1].y - raaka[i].y) * dy) / (l * (Math.hypot(dx, dy) || 1)));
          if (c * l > paras) { paras = c * l; idx = i; }
        }
      }
    }
    if (idx < 0) return 0; // ei tietoa pinnasta
    const dx = raaka[idx + 1].x - raaka[idx].x, dy = raaka[idx + 1].y - raaka[idx].y;
    if (Math.abs(dx) < 0.001) return dy > 0 ? -1 : 1;
    return dx > 0 ? 1 : -1;
  }
  const peili = !!asento.peili;
  const puoli0 = oletusPuoli();
  const puoli = puoli0 * (peili ? -1 : 1);
  const pintaTiedossa = puoli0 !== 0;

  // ── Asento ──
  let kulma = 0;
  const sv = asento.viiva;
  if (sv != null && sv >= 0 && sv < n - 1 && pit0(sv) > EPS) {
    kulma = -Math.atan2(raaka[sv + 1].y - raaka[sv].y, raaka[sv + 1].x - raaka[sv].x);
    if (asento.suunta === 'pysty') kulma += Math.PI / 2;
  }
  kulma += (asento.kierto || 0) * Math.PI / 2;
  const kaanna = q => {
    const c = Math.cos(kulma), s = Math.sin(kulma);
    const x = q.x * c - q.y * s, y = q.x * s + q.y * c;
    return { x: peili ? -x : x, y: y };
  };
  const kp = raaka.map(kaanna);
  const ke = extra0.map(e => ({ p1: kaanna(e.p1), p2: kaanna(e.p2), label: e.label }));

  // ── Sovitus kuvaan ──
  const kaikki = kp.concat(...ke.map(e => [e.p1, e.p2]));
  const xs = kaikki.map(q => q.x), ys = kaikki.map(q => q.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = (maxX - minX) || 1, ry = (maxY - minY) || 1;
  const kayttoH = H - alaTila;
  const mk = Math.max(0.05, Math.min((W - reunus * 2) / rx, (kayttoH - reunus * 2) / ry, p.maxMittakaava || 3));
  const ox = (W - rx * mk) / 2 - minX * mk, oy = (kayttoH - ry * mk) / 2 - minY * mk;
  const ruutu = q => ({ x: ox + q.x * mk, y: oy + q.y * mk });
  const sp = kp.map(ruutu);
  const ex = ke.map(e => ({ p1: ruutu(e.p1), p2: ruutu(e.p2), label: e.label }));

  const normaali = (a, b, s) => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    return { x: s * dy / d, y: -s * dx / d };
  };
  const f = v => v.toFixed(1);
  const polku = pts => pts.map((q, i) => (i ? 'L' : 'M') + f(q.x) + ' ' + f(q.y)).join(' ');

  // ── Viivat: nollapituiset ja takaisin samaa viivaa palaavat osat merkitään ──
  const segs = [];
  for (let i = 0; i < n - 1; i++) {
    const a = sp[i], b = sp[i + 1];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ i, a, b, px: l, mm: pit0(i), nolla: pit0(i) < EPS, paluu: false });
  }
  let edel = null;
  segs.forEach(s => {
    if (s.nolla) return;
    if (edel) {
      const d = ((s.b.x - s.a.x) * (edel.b.x - edel.a.x) + (s.b.y - s.a.y) * (edel.b.y - edel.a.y)) / (s.px * edel.px || 1);
      if (d < -0.9999 && s.mm <= edel.mm + EPS) s.paluu = true; // palaa samaa viivaa takaisin
    }
    edel = s;
  });
  const nakyvat = segs.filter(s => !s.nolla && !s.paluu);

  // Yhtenäiset pätkät (katkeaa paluukohdassa)
  const patkat = [];
  let nyk = null;
  segs.forEach(s => {
    if (s.nolla) return;
    if (s.paluu) { nyk = null; return; }
    if (nyk && Math.abs(nyk[nyk.length - 1].x - s.a.x) < 0.05 && Math.abs(nyk[nyk.length - 1].y - s.a.y) < 0.05) nyk.push(s.b);
    else { nyk = [s.a, s.b]; patkat.push(nyk); }
  });

  // ── Törmäystarkistus ──
  const varatut = (p.varaa || []).map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
  const naytteet = [];
  const lisaaNaytteet = (a, b) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y), askeleet = Math.max(1, Math.ceil(d / 3));
    for (let i = 0; i <= askeleet; i++) naytteet.push({ x: a.x + (b.x - a.x) * i / askeleet, y: a.y + (b.y - a.y) * i / askeleet });
  };
  nakyvat.forEach(s => lisaaNaytteet(s.a, s.b));
  ex.forEach(e => lisaaNaytteet(e.p1, e.p2));
  const osuu = (cx, cy, w, h, viivat, vali) => {
    const m = vali == null ? 2 : vali;
    if (cx - w / 2 < 2 || cx + w / 2 > W - 2 || cy - h / 2 < 2 || cy + h / 2 > kayttoH - 1) return true;
    for (const r of varatut) if (Math.abs(cx - r.x) < (w + r.w) / 2 + m && Math.abs(cy - r.y) < (h + r.h) / 2 + m) return true;
    if (viivat) for (const s of naytteet) if (Math.abs(s.x - cx) < w / 2 + 3 && Math.abs(s.y - cy) < h / 2 + 3) return true;
    return false;
  };
  const tekstiW = (t, koko) => String(t).length * koko * 0.62 + 4;

  let svgViivat = '', svgRaita = '', svgApu = '', svgTekstit = '', svgPisteet = '';
  const teksti = (x, y, t, koko, vari, paino) =>
    `<text x="${f(x)}" y="${f(y)}" font-size="${koko}" font-family="${T.fontti}" font-weight="${paino || 600}" fill="${vari}" text-anchor="middle" dominant-baseline="central" stroke="${T.tausta}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${t}</text>`;

  // ── Kulmat (kanttikoneen luku = 180 − sisäkulma), ei tuplaan ──
  const kulmat = [];
  function lisaaKulma(v, pa, pb) {
    let ax = pa.x - v.x, ay = pa.y - v.y, bx = pb.x - v.x, by = pb.y - v.y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 0.5 || lb < 0.5) return;
    if (la / mk < 3 || lb / mk < 3) return; // alle 3 mm pätkä on piirtotekninen, ei taitos
    ax /= la; ay /= la; bx /= lb; by /= lb;
    const sisa = Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by))) * 180 / Math.PI;
    const kone = 180 - sisa;
    if (kone < 0.5 || kone > 165) return; // suora tai tupla
    const t = muotoile(kone) + '°';
    const w = tekstiW(t, 11), h = 14;
    let hx = ax + bx, hy = ay + by; const hl = Math.hypot(hx, hy);
    if (hl < 0.01) return;
    hx /= hl; hy /= hl;
    // Ensin taitoksen sisäpuolelle, sitten ulkopuolelle, lopuksi kauemmas
    const yritykset = [[1, 15], [-1, 14], [1, 26], [-1, 24], [1, 38], [-1, 36], [1, 50], [-1, 48]];
    let x = v.x + hx * 15, y = v.y + hy * 15, ok = false;
    for (const [s, d] of yritykset) {
      const dd = d + Math.abs(hx) * w / 2 * 0.6;
      x = v.x + s * hx * dd; y = v.y + s * hy * dd;
      if (!osuu(x, y, w, h, true)) { ok = true; break; }
    }
    if (!ok) {
      for (const [s, d] of yritykset) {
        const dd = d + Math.abs(hx) * w / 2 * 0.6;
        x = v.x + s * hx * dd; y = v.y + s * hy * dd;
        if (!osuu(x, y, w, h, false)) { ok = true; break; }
      }
    }
    if (!ok) { x = v.x + hx * 15; y = v.y + hy * 15; }
    varatut.push({ x, y, w, h });
    kulmat.push({ x, y, t, kone });
  }
  if (naytaKulmat) {
    patkat.forEach(pt => { for (let i = 1; i < pt.length - 1; i++) lisaaKulma(pt[i], pt[i - 1], pt[i + 1]); });
    // Erillisen lisäviivan (tiiviste, jiiritaitos) kulma ketjun päässä
    const paat = [];
    patkat.forEach(pt => { paat.push([pt[0], pt[1]]); paat.push([pt[pt.length - 1], pt[pt.length - 2]]); });
    ex.forEach(e => {
      [[e.p1, e.p2], [e.p2, e.p1]].forEach(([liitos, toinen]) => {
        paat.forEach(([paa, viereinen]) => {
          if (Math.abs(paa.x - liitos.x) < 0.3 && Math.abs(paa.y - liitos.y) < 0.3) lisaaKulma(liitos, viereinen, toinen);
        });
      });
    });
  }

  // ── Pinnan merkintä ──
  let pisin = null;
  nakyvat.forEach(s => { if (!pisin || s.px > pisin.px) pisin = s; });
  if (pintaTiedossa && merkinta === 'raita') {
    const siirto = 3.9;
    patkat.forEach(pt => {
      const ulos = pt.map((q, i) => {
        const n1 = i > 0 ? normaali(pt[i - 1], q, puoli) : null;
        const n2 = i < pt.length - 1 ? normaali(q, pt[i + 1], puoli) : null;
        let vx, vy;
        if (n1 && n2) { const den = Math.max(0.3, 1 + n1.x * n2.x + n1.y * n2.y); vx = (n1.x + n2.x) / den; vy = (n1.y + n2.y) / den; }
        else { const nn = n1 || n2; vx = nn.x; vy = nn.y; }
        return { x: q.x + vx * siirto, y: q.y + vy * siirto };
      });
      svgRaita += `<path d="${polku(ulos)}" fill="none" stroke="${T.viiva}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
      svgRaita += `<path d="${polku(ulos)}" fill="none" stroke="${raitaVari}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
  }
  if (pintaTiedossa && pisin) {
    const nL = normaali(pisin.a, pisin.b, puoli);
    const ux = (pisin.b.x - pisin.a.x) / pisin.px, uy = (pisin.b.y - pisin.a.y) / pisin.px;
    if (merkinta === 'kolmio') {
      const kohta = pisin.px > 80 ? 0.72 : 0.5;
      const mx = pisin.a.x + (pisin.b.x - pisin.a.x) * kohta, my = pisin.a.y + (pisin.b.y - pisin.a.y) * kohta;
      const karki = { x: mx + nL.x * 4, y: my + nL.y * 4 }, kanta = { x: mx + nL.x * 13, y: my + nL.y * 13 };
      svgRaita += `<path d="${polku([karki, { x: kanta.x + ux * 5.5, y: kanta.y + uy * 5.5 }, { x: kanta.x - ux * 5.5, y: kanta.y - uy * 5.5 }])} Z" fill="${T.kulma}"/>`;
      varatut.push({ x: (karki.x + kanta.x) / 2, y: (karki.y + kanta.y) / 2, w: 14, h: 14 });
    }
  }

  // ── Mitat ──
  const mitat = [];
  function sijoitaMitta(a, b, nrm, t, salliSiirto) {
    const koko = 12, w = tekstiW(t, koko), h = 15;
    const px = Math.hypot(b.x - a.x, b.y - a.y);
    const puolikas = Math.abs(nrm.x) * w / 2 + Math.abs(nrm.y) * h / 2;
    const perus = 11 + puolikas;
    const kohdat = (salliSiirto && px > 70) ? [0.5, 0.36, 0.64] : [0.5];
    const kokeile = (suunta, viivat) => {
      for (let s = 0; s < 8; s++) {
        for (const k of kohdat) {
          const mx = a.x + (b.x - a.x) * k, my = a.y + (b.y - a.y) * k;
          const x = mx + suunta * nrm.x * (perus + s * 11), y = my + suunta * nrm.y * (perus + s * 11);
          if (!osuu(x, y, w, h, viivat)) return { x, y, s, mx, my, suunta };
        }
      }
      return null;
    };
    let r = kokeile(1, true) || kokeile(1, false) || kokeile(-1, true) || kokeile(-1, false);
    if (!r) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      r = { x: Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, mx + nrm.x * perus)), y: Math.max(h / 2 + 2, Math.min(kayttoH - h / 2 - 2, my + nrm.y * perus)), s: 0, mx, my, suunta: 1 };
    }
    varatut.push({ x: r.x, y: r.y, w, h });
    if (r.s >= 2) {
      for (let q = 8; q < (perus + r.s * 11) - puolikas; q += 6) varatut.push({ x: r.mx + r.suunta * nrm.x * q, y: r.my + r.suunta * nrm.y * q, w: 3, h: 3 });
      svgApu += `<path d="${polku([{ x: r.mx + r.suunta * nrm.x * 5, y: r.my + r.suunta * nrm.y * 5 }, { x: r.x - r.suunta * nrm.x * (puolikas + 1), y: r.y - r.suunta * nrm.y * (puolikas + 1) }])}" fill="none" stroke="${T.himmea}" stroke-width="0.8"/>`;
    }
    svgTekstit += teksti(r.x, r.y, t, koko, T.mitta);
    return { x: r.x, y: r.y, w, h };
  }

  // Keskipiste ulkopuolen arviointiin, kun pinnan puolta ei tiedetä
  let kx = 0, ky = 0; sp.forEach(q => { kx += q.x; ky += q.y; }); kx /= n; ky /= n;
  const mitanNormaali = s => {
    if (pintaTiedossa) return normaali(s.a, s.b, puoli);
    const nn = normaali(s.a, s.b, 1), mx = (s.a.x + s.b.x) / 2, my = (s.a.y + s.b.y) / 2;
    return ((mx - kx) * nn.x + (my - ky) * nn.y < 0) ? { x: -nn.x, y: -nn.y } : nn;
  };

  if (naytaMitat) {
    const jarj = nakyvat.slice().sort((a, b) => b.px - a.px);
    jarj.forEach(s => {
      let t;
      if (labels) { const l = labels[s.i]; if (l === null || l === undefined || l === '' || l === 0) return; t = muotoile(l); }
      else t = muotoile(s.mm);
      const paikka = sijoitaMitta(s.a, s.b, mitanNormaali(s), t, true);
      mitat.push({ viiva: s.i, teksti: t, x: paikka.x, y: paikka.y, w: paikka.w, h: paikka.h });
    });
    ex.forEach(e => {
      if (e.label === undefined || e.label === null || e.label === '' || e.label === 0 || !nakyvat.length) return;
      const mx = (e.p1.x + e.p2.x) / 2, my = (e.p1.y + e.p2.y) / 2;
      let lahin = nakyvat[0], et = Infinity;
      nakyvat.forEach(s => { const d = Math.hypot((s.a.x + s.b.x) / 2 - mx, (s.a.y + s.b.y) / 2 - my); if (d < et) { et = d; lahin = s; } });
      const viite = mitanNormaali(lahin);
      let nn = normaali(e.p1, e.p2, 1);
      if (nn.x * viite.x + nn.y * viite.y < 0) nn = { x: -nn.x, y: -nn.y };
      sijoitaMitta(e.p1, e.p2, nn, muotoile(e.label), false);
    });
  }

  // PINTA-teksti pisimmälle viivalle (mittojen jälkeen, ettei jää mitan tai apuviivan alle)
  if (pintaTiedossa && pisin) {
    const nL = normaali(pisin.a, pisin.b, puoli);
    if (pisin.px > 90) {
      const w = tekstiW('PINTA', 9) + 8, h = 11;
      for (const kohta of [0.24, 0.76]) {
        const fx = pisin.a.x + (pisin.b.x - pisin.a.x) * kohta, fy = pisin.a.y + (pisin.b.y - pisin.a.y) * kohta;
        const d = 12 + Math.abs(nL.x) * w / 2 + Math.abs(nL.y) * h / 2;
        const x = fx + nL.x * d, y = fy + nL.y * d;
        if (!osuu(x, y, w, h, false)) {
          varatut.push({ x, y, w, h });
          svgTekstit += `<text x="${f(x)}" y="${f(y)}" font-size="9" font-family="${T.fontti}" font-weight="600" letter-spacing="1.2" fill="${T.himmea}" text-anchor="middle" dominant-baseline="central" stroke="${T.tausta}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">PINTA</text>`;
          break;
        }
      }
    }
  }

  // ── Viivat ja pisteet ──
  nakyvat.forEach(s => {
    svgViivat += `<line x1="${f(s.a.x)}" y1="${f(s.a.y)}" x2="${f(s.b.x)}" y2="${f(s.b.y)}" stroke="${T.viiva}" stroke-width="2.5" stroke-linecap="round"/>`;
  });
  ex.forEach(e => {
    svgViivat += `<line x1="${f(e.p1.x)}" y1="${f(e.p1.y)}" x2="${f(e.p2.x)}" y2="${f(e.p2.y)}" stroke="${T.viiva}" stroke-width="2.5" stroke-linecap="round"/>`;
  });
  if (p.korostaViiva != null && segs[p.korostaViiva] && !segs[p.korostaViiva].nolla) {
    const s = segs[p.korostaViiva];
    svgViivat += `<line x1="${f(s.a.x)}" y1="${f(s.a.y)}" x2="${f(s.b.x)}" y2="${f(s.b.y)}" stroke="${T.paa}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (p.naytaPisteet !== false) {
    sp.forEach((q, i) => {
      const paa = i === 0 || i === n - 1;
      svgPisteet += `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${paa ? 4 : 3}" fill="${paa ? T.paa : T.karki}"/>`;
    });
  }
  kulmat.forEach(k => { svgTekstit += teksti(k.x, k.y, k.t, 11, T.kulma); });

  return {
    svg: svgApu + svgRaita + svgViivat + svgPisteet + svgTekstit,
    mitat: mitat,
    kulmat: kulmat.map(k => k.kone),
    pisteet: sp,
    pintaTiedossa: pintaTiedossa,
    puoli: puoli
  };
}


window.KPT_PROFIILIT = {
  versio: '2026-11-13',
  mallit: TYPES,
  tuotantoKuvat: PROD_TYPES,
  piirraKuva: piirraKuva,
  variHex: variHex
};

})();
