// Kiilapelti, kun jokin mitta on toisessa päässä 0 (vikalista 13.11.2026, korjattu 27.11.2026):
// U-listojen tiiviste ja Kynnyksen etukäännös. Ennen korjausta laskeLevitys palautti null
// (ei levityskuvaa eikä merkkausmittoja), koska päissä oli eri määrä osia.
// Ajo: node testit/profiilit/test_kiila_nolla.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', '..', 'orders', 'profiilit.js'));
const P = window.KPT_PROFIILIT;

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function near(a, b, t, m) { ok(typeof a === 'number' && Math.abs(a - b) <= t, m + ' (saatu ' + (typeof a === 'number' ? a.toFixed(3) : a) + ', odotettu ' + b + ')'); }

const oletus = t => { const o = {}; (P.mallit[t].fields || []).forEach(f => o[f.id] = f.default); return o; };
const lev = (t, vals, valsB, opts, viite) => P.laskeLevitys(t, Object.assign(oletus(t), vals), valsB, opts || {}, 2000, viite || 0);
const kuva = (t, vals, valsB, opts, viite) => P.kiilaKuva(t, Object.assign(oletus(t), vals), valsB, opts || {}, viite || 0);
const taitokset = r => r.viivat.filter(v => v.nro !== null);
const kuvanKiilat = k => k.tulos.labels.filter(x => typeof x === 'string' && x.indexOf('–') >= 0);

// 1. Kynnys: etukäännös 0 → 15 (oletukset: taka 10, pinta 120, etu 30, kulmat 80/80/125)
(function () {
  const r = lev('kynnys', { seg3_len: 0 }, { seg3_len: 15 });
  ok(!!r, '1a: Kynnys etukäännös 0 → 15 lasketaan');
  if (!r) return;
  near(r.aihioA, 160, 0.01, '1b: aihio pää A 160');
  near(r.aihioB, 175, 0.01, '1c: aihio pää B 175');
  ok(r.kiila, '1d: kiila tunnistetaan');
  const t = taitokset(r);
  ok(t.length === 3, '1e: kolme taitosta (myös etukäännöksen taitos)');
  near(t[0].kulma, 80, 0.01, '1f: taitos 1 80°');
  near(t[1].kulma, 80, 0.01, '1g: taitos 2 80°');
  near(t[2].kulma, 125, 0.01, '1h: etukäännöksen taitos 125° (kulma pää B:stä)');
  near(t[2].ya, 160, 0.01, '1i: etukäännöksen taitos pää A:ssa reunalla (160)');
  near(t[2].yb, 160, 0.01, '1j: etukäännöksen taitos pää B:ssä 160');
  const loppu = r.viivat[r.viivat.length - 1];
  near(loppu.ya, 160, 0.01, '1k: loppureuna A 160');
  near(loppu.yb, 175, 0.01, '1l: loppureuna B 175');
  const k = kuva('kynnys', { seg3_len: 0 }, { seg3_len: 15 });
  ok(!!k && kuvanKiilat(k).indexOf('0–15') >= 0, '1m: poikkileikkauksessa mitta 0–15');
  ok(!!k && k.haamu.length > 0, '1n: pää B haamuna');
  // keskilinja viitteenä
  const rk = lev('kynnys', { seg3_len: 0 }, { seg3_len: 15 }, {}, 1.5);
  ok(!!rk && rk.viivat.some(v => v.keski), '1o: keskilinja viitteenä toimii');
  // toisin päin
  const r2 = lev('kynnys', { seg3_len: 15 }, { seg3_len: 0 });
  ok(!!r2 && Math.abs(r2.aihioA - 175) < 0.01 && Math.abs(r2.aihioB - 160) < 0.01, '1p: etukäännös 15 → 0 (aihio 175 → 160)');
})();

// 2. U-listat: tiiviste 0 → 15 kummallakin puolella
[['ulista', 'tiiC', 'oikea'], ['ulista', 'tiiB', 'vasen'], ['ulistas', 'tiiC', 'oikea'], ['ulistas', 'tiiB', 'vasen']].forEach(([t, o, puoli], i) => {
  const n = '2' + 'abcd'[i] + ': ' + P.mallit[t].name + ' tiiviste ' + puoli + ' 0 → 15';
  const r = lev(t, { [o + '_len']: 0 }, { [o + '_len']: 15 }, { [o]: true });
  ok(!!r, n + ' lasketaan');
  if (!r) return;
  near(r.aihioA, 300, 0.01, n + ': aihio A 300');
  near(r.aihioB, 300, 0.01, n + ': aihio B 300');
  const t8 = taitokset(r).filter(v => v.kulma !== null && Math.abs(v.kulma - 8) < 0.01);
  ok(t8.length === 1, n + ': tiivisteen taitos 8°');
  if (t8.length) {
    const reunassaA = Math.abs(t8[0].ya) < 0.01 || Math.abs(t8[0].ya - 300) < 0.01;
    const sisallaB = Math.abs(t8[0].yb - 15) < 0.01 || Math.abs(t8[0].yb - 285) < 0.01;
    ok(reunassaA && sisallaB, n + ': taitos A:ssa reunalla, B:ssä 15 mm sisällä');
  }
  const k = kuva(t, { [o + '_len']: 0 }, { [o + '_len']: 15 }, { [o]: true });
  ok(!!k && kuvanKiilat(k).indexOf('0–15') >= 0 && k.haamu.length > 0, n + ': poikkileikkauksessa 0–15 ja haamu');
});

// 3. Tupla 0 → 15: taitos näkyy tuplana (ennen 90°, koska nollapätkän suunta puuttui)
(function () {
  const r = lev('ulkonurkka', { tupA_len: 0 }, { tupA_len: 15 }, { tiiA: true, tiiB: true, tupA: true, tupB: true });
  ok(!!r && r.viivat[1].tupla && r.viivat[1].kulma === null, '3a: Ulkonurkka tupla A 0 → 15: taitos 1 = tupla');
})();

// 4. Ennallaan: nollasta poikkeavat kiilat ja suorat pellit
(function () {
  const r = lev('kynnys', { seg3_len: 10 }, { seg3_len: 15 });
  ok(!!r && Math.abs(r.aihioA - 170) < 0.01 && Math.abs(r.aihioB - 175) < 0.01, '4a: Kynnys etukäännös 10 → 15 kuten ennen');
  const r2 = lev('ulista', { tiiC_len: 10 }, { tiiC_len: 15 }, { tiiC: true });
  ok(!!r2 && Math.abs(taitokset(r2)[2].ya - 290) < 0.01, '4b: U-lista tiiviste 10 → 15 kuten ennen (taitos A 290)');
  const r3 = lev('ulista', {}, {}, {});
  ok(!!r3 && !r3.kiila && Math.abs(r3.aihioA - 300) < 0.01, '4c: suora U-lista ei kiila');
  const r4 = lev('kynnys', { seg3_len: 0 }, {});
  ok(!!r4 && !r4.kiila && taitokset(r4).length === 2, '4d: suora Kynnys ilman etukäännöstä: kaksi taitosta');
})();

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
