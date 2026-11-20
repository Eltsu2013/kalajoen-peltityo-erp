// Kalajoen Peltityö ERP — yhteiset geometriatyökalut (orders/geom.js)
//
// Vektorit, monikulmiot, ääriviivojen yhdistäminen, kupera kuori, leikkaus suoralla ja mm-muotoilu.
// Näitä käyttävät pellit.js ja myöhemmin piippu-, huuva- ja kartiolaskenta.
//
// Käyttö sivulla:   <script src="geom.js?v=1"></script>   ja sitten   KPT_GEOM.vsub(a, b)
// Käyttö Nodessa:   const G = require('../orders/geom.js');
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kaikilla sivuilla, jotka lataavat sen.
//
// Vaihe 1 (20.11.2026): siirretty Huuva-mockupista (v16) sellaisenaan, logiikkaa ei muutettu.
// Testit: testit/huuva/ (node testit/aja_kaikki.js).
(function () {

  // ---------- Vektorit ja kulmat (3D) sekä monikulmion kiertosuunta ----------

  function dist3(a, b) {
    const dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  function vsub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function vadd(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  function vscale(a, k) { return [a[0]*k, a[1]*k, a[2]*k]; }
  function vdot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function vcross(a, b) {
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  }
  function vnorm(a) {
    const l = Math.sqrt(vdot(a, a));
    return l > 0 ? [a[0]/l, a[1]/l, a[2]/l] : [0, 0, 0];
  }
  function vmid(a, b) { return vscale(vadd(a, b), 0.5); }
  function vcentroid(pts) {
    let s = [0, 0, 0];
    pts.forEach(p => { s = vadd(s, p); });
    return vscale(s, 1 / pts.length);
  }
  function kulmaAsteina(u, v) {
    const c = Math.max(-1, Math.min(1, vdot(u, v)));
    return Math.acos(c) * 180 / Math.PI;
  }
  // Monikulmion etumerkitty pinta-ala x2 (positiivinen = vastapäivään)
  function polygonSign(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      a += p[0]*q[1] - q[0]*p[1];
    }
    return a;
  }

  // ---------- Monikulmioiden yhdistäminen yhdeksi ääriviivaksi (esim. paneeli + taitokset = aihio) ----------

  function yhdistaMonikulmiot(polys) {
    const TOL = 1e-6;
    // kaikki vastapäivään
    const P = polys.map(pl => (polygonSign(pl) >= 0 ? pl : pl.slice().reverse()).map(q => [q[0], q[1]]));
    const distSeg = (q, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx*dx + dy*dy;
      let t = l2 > 0 ? ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(q[0] - (a[0] + t*dx), q[1] - (a[1] + t*dy));
    };
    const reunalla = (q, pl) => pl.some((a, k) => distSeg(q, a, pl[(k + 1) % pl.length]) < TOL);
    const sisalla = (q, pl) => {
      let c = false;
      for (let k = 0, m = pl.length - 1; k < pl.length; m = k++) {
        const a = pl[k], b = pl[m];
        if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    };
    // janan a→b parametri t, jossa se leikkaa janan c→d (tai null)
    const leikkaus = (a, b, c, d) => {
      const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
      const den = rx*sy - ry*sx;
      if (Math.abs(den) < 1e-12) return null;
      const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
      const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
      return (t > 1e-9 && t < 1 - 1e-9 && u >= -1e-9 && u <= 1 + 1e-9) ? t : null;
    };
    // samat pisteet yhdistetään (ettei liukulukuvirhe katkaise ketjua)
    const kanoniset = [];
    const snap = q => {
      for (let k = 0; k < kanoniset.length; k++) if (Math.hypot(q[0] - kanoniset[k][0], q[1] - kanoniset[k][1]) < 1e-5) return k;
      kanoniset.push(q);
      return kanoniset.length - 1;
    };
    const segs = [];   // [alkuId, loppuId]
    P.forEach((pl, i) => {
      pl.forEach((a, k) => {
        const b = pl[(k + 1) % pl.length];
        const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx*dx + dy*dy;
        if (l2 < 1e-12) return;
        const ts = [0, 1];
        P.forEach((o, j) => {
          if (j === i) return;
          o.forEach((c, m) => {
            const d = o[(m + 1) % o.length];
            const t = leikkaus(a, b, c, d);
            if (t !== null) ts.push(t);
            if (distSeg(c, a, b) < TOL) {
              const tc = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2;
              if (tc > 1e-9 && tc < 1 - 1e-9) ts.push(tc);
            }
          });
        });
        ts.sort((x, y) => x - y);
        for (let m = 0; m + 1 < ts.length; m++) {
          if (ts[m + 1] - ts[m] < 1e-9) continue;
          const u = [a[0] + ts[m] * dx, a[1] + ts[m] * dy], v = [a[0] + ts[m + 1] * dx, a[1] + ts[m + 1] * dy];
          const mid = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
          let pida = true;
          for (let j = 0; j < P.length && pida; j++) {
            if (j === i) continue;
            if (reunalla(mid, P[j])) {
              // yhteinen reuna: sama suunta -> säilytetään vain pienemmän indeksin reuna, vastakkainen -> sisäsauma, pois
              const o = P[j];
              let sama = false;
              o.forEach((c, k2) => {
                const d = o[(k2 + 1) % o.length];
                if (distSeg(mid, c, d) < TOL && ((d[0] - c[0]) * dx + (d[1] - c[1]) * dy) > 0) sama = true;
              });
              if (!sama || j < i) pida = false;
            } else if (sisalla(mid, P[j])) {
              pida = false;
            }
          }
          if (pida) segs.push([snap(u), snap(v)]);
        }
      });
    });
    // ketjutus silmukoiksi
    const alku = new Map();
    segs.forEach((sg, idx) => { if (!alku.has(sg[0])) alku.set(sg[0], []); alku.get(sg[0]).push(idx); });
    const kaytetty = new Array(segs.length).fill(false);
    const silmukat = [];
    segs.forEach((sg0, idx0) => {
      if (kaytetty[idx0]) return;
      const loop = [];
      let idx = idx0, vartija = 0;
      while (idx !== undefined && !kaytetty[idx] && vartija++ < 10000) {
        kaytetty[idx] = true;
        loop.push(kanoniset[segs[idx][0]]);
        idx = (alku.get(segs[idx][1]) || []).find(n => !kaytetty[n]);
      }
      if (loop.length >= 3) silmukat.push(loop);
    });
    // poistetaan suorilla olevat välipisteet (ei kulmaa) ja piikit
    const siisti = loop => {
      const pts = loop.slice();
      let muuttui = true;
      while (muuttui && pts.length > 3) {
        muuttui = false;
        for (let k = 0; k < pts.length; k++) {
          const a = pts[(k + pts.length - 1) % pts.length], b = pts[k], c = pts[(k + 1) % pts.length];
          const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
          const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
          if (l1 < 1e-9 || l2 < 1e-9 || Math.abs(cross) < 1e-7 * l1 * l2) { pts.splice(k, 1); muuttui = true; break; }
        }
      }
      return pts;
    };
    return silmukat.map(siisti).filter(l => l.length >= 3).sort((x, y) => polygonSign(y) - polygonSign(x));
  }

  // ---------- Kupera kuori ja kahden kuperan monikulmion erottava suora ----------

  // Kupera kuori (Andrewin ketju), vastapäivään
  function kuperaKuori(pts) {
    const p = pts.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach(q => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q); });
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q); }
    lo.pop(); up.pop();
    return lo.concat(up);
  }

  // Paras (suurimman raon) erottava suora kahden kuperan monikulmion välillä (A vasemmalla, B oikealla).
  // Palauttaa { gap, X, Y, c }: suora X*x + Y*y = c (X,Y yksikkövektori), gap = pienin etäisyys suorasta A:n ja B:n pisteisiin
  // kahden kappaleen välillä mitattuna (rako). gap < 0 = menevät päällekkäin.
  // Suunnat: molempien reunojen normaalit sekä kaikkien kärkiparien yhdysjanat (kärki–kärki-kosketuksessa paras suora on
  // kohtisuorassa yhdysjanaa vastaan; näin tulos on symmetrinen eikä riipu kuoren reunojen järjestyksestä).
  function kuoriErotus(A, B) {
    let best = null;
    const kokeile = (X, Y) => {
      let maxA = -Infinity, minB = Infinity;
      A.forEach(q => { maxA = Math.max(maxA, q[0] * X + q[1] * Y); });
      B.forEach(q => { minB = Math.min(minB, q[0] * X + q[1] * Y); });
      const gap = minB - maxA;
      if (!best || gap > best.gap + 1e-12 || (Math.abs(gap - best.gap) <= 1e-12 && X > best.X)) best = { gap, X, Y, c: (maxA + minB) / 2 };
    };
    [A, B].forEach(P => {
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length];
        const nx = b[1] - a[1], ny = -(b[0] - a[0]), l = Math.hypot(nx, ny);
        if (l < 1e-12) continue;
        kokeile(nx / l, ny / l); kokeile(-nx / l, -ny / l);
      }
    });
    A.forEach(a => B.forEach(b => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      if (l > 1e-12) kokeile(dx / l, dy / l);
    }));
    return best;
  }

  // ---------- Monikulmion leikkaus suoralla ----------

  // Leikkaa monikulmion suoralla P-Q: säilyy se puoli, jolla ref on (Sutherland-Hodgman).
  function leikkaaPuolitasolla(poly, P, Q, ref) {
    const s = v => (Q[0] - P[0]) * (v[1] - P[1]) - (Q[1] - P[1]) * (v[0] - P[0]);
    const sg = s(ref) >= 0 ? 1 : -1;
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const sa = sg * s(a), sb = sg * s(b);
      if (sa >= -1e-9) out.push(a);
      if ((sa > 1e-9 && sb < -1e-9) || (sa < -1e-9 && sb > 1e-9)) {
        const u = sa / (sa - sb);
        out.push([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]);
      }
    }
    return out;
  }

  // ---------- Pyöristys ja muotoilu (mm, m², asteet, HTML-turvallinen teksti) ----------

  const PISTE_TARKKUUS = 1;   // mm: pisteiden koordinaatit pyöristetään tähän
  function pyoristaPiste(v) { const r = Math.round(v / PISTE_TARKKUUS) * PISTE_TARKKUUS; return r === 0 ? 0 : r; }
  function fmtPiste(v) { return String(pyoristaPiste(v)).replace('.', ','); }
  function fmtMm(v) { return String(Math.round(v)).replace('.', ','); }
  function fmtM2(v) { return (v / 1e6).toFixed(2).replace('.', ',') + ' m²'; }
  function fmtKulma(a) { return a.toFixed(1).replace('.', ',') + '°'; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  const KPT_GEOM = {
    dist3, vsub, vadd, vscale, vdot, vcross, vnorm, vmid, vcentroid, kulmaAsteina, polygonSign,
    yhdistaMonikulmiot, kuperaKuori, kuoriErotus, leikkaaPuolitasolla, PISTE_TARKKUUS, pyoristaPiste,
    fmtPiste, fmtMm, fmtM2, fmtKulma, esc,
  };

  globalThis.KPT_GEOM = KPT_GEOM;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_GEOM;
})();
