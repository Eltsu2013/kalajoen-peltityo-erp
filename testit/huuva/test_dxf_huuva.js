// test_dxf_huuva.js — Huuvan palat DXF-tiedostoksi (vaihe 8.5 D2, 26.11.2026)
// Riippumaton tarkistus: DXF:n ääriviivan kärjet = merkintäpisteet (aihioPisteet, ulkopinta ylöspäin), palat vierekkäin
// 50 mm välein, taitosviivat paneelin sisäreunoilla (ei ääriviivan päällä) ja alareunan taitoksissa, tekstissä nimi ja aihio.
const { script } = require('./lataa')();
const { parit, entiteetit, arvo } = require('../dxf/lue_dxf.js');
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const on4 = { Etu:true, Oikea:true, Taka:true, Vasen:true };
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const side = { Etu:{L:0,R:0}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:20,R:20} };
const lisa0 = { Etu:0, Oikea:0, Taka:0, Vasen:0 };
const bKouru = { type: all('kouru'), floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:lisa0, loveus:true };
const oA = { panelOn: on4, sideW: side, sideDir: {}, top: { type: all('sisaan'), w: 20, loveus: true }, bottom: bKouru };
const rA = ryhmitteleSamat(laskeKaikki(sA, oA));

const d = huuvaDxf(rA, 'Huuva 1');
ok(!!d, '1a: DXF syntyy esimerkkihuuvasta');
const t = d.sisalto();
const { p } = H.parit(t);
const e = H.entiteetit(p);
const polyt = [];
e.forEach((x, i) => { if (x.tyyppi === 'POLYLINE') { const v = []; for (let j = i + 1; e[j].tyyppi === 'VERTEX'; j++) v.push([Number(H.arvo(e[j], 10)), Number(H.arvo(e[j], 20))]); polyt.push({ e: x, v }); } });
ok(polyt.length === rA.length, '1b: yksi ääriviiva per palaryhmä (' + rA.length + ')');
ok(polyt.every(q => H.arvo(q.e, 8) === 'LEIKKAUS' && H.arvo(q.e, 70) === '1'), '1c: ääriviivat suljettuja ja LEIKKAUS-tasolla');

// kärjet = merkintäpisteet ulkopinta ylöspäin, palat vierekkäin 50 mm välein
let x0 = 0, kaikkiSamat = true, leveydet = true;
rA.forEach((pa, i) => {
  const pts = aihioPisteet(pa, false).pisteet;
  const v = polyt[i].v;
  if (v.length !== pts.length || pts.some((q, k) => Math.abs(v[k][0] - (x0 + q.x)) > 1e-3 || Math.abs(v[k][1] - q.y) > 1e-3)) kaikkiSamat = false;
  const xs = v.map(q => q[0]), ys = v.map(q => q[1]);
  if (Math.abs(Math.max(...xs) - Math.min(...xs) - pa.w) > 1e-3 || Math.abs(Math.max(...ys) - Math.min(...ys) - pa.h) > 1e-3 || Math.abs(Math.min(...xs) - x0) > 1e-3) leveydet = false;
  x0 += pa.w + 50;
});
ok(kaikkiSamat, '2a: ääriviivan kärjet = merkintäpisteet (ulkopinta ylöspäin), palat vierekkäin 50 mm välein');
ok(leveydet, '2b: jokaisen palan koko = aihio (leveys × korkeus)');
ok(Math.abs(polyt[0].v.reduce((m, q) => Math.max(m, q[0]), 0) - rA[0].w) < 1e-3 && Math.abs(rA[0].w - 860) < 0.01, '2c: Etu + Taka 860 mm leveä (käsin: 800 + 2 x 30 kourun nurkka)');
ok(huuvaDxf(rA, 'Huuva 1').sisalto() === t, '2d: sama tiedosto joka kerta');

// taitosviivat: TAITOS-tasolla, eivät ääriviivan päällä, ja jokaisella palalla vähintään ylä- ja alareunan taitos
const taitokset = e.filter(x => x.tyyppi === 'LINE');
ok(taitokset.length > 0 && taitokset.every(x => H.arvo(x, 8) === 'TAITOS'), '3a: taitosviivat TAITOS-tasolla (' + taitokset.length + ' kpl)');
const paalla = (x, pv) => {
  const a = [Number(H.arvo(x, 10)), Number(H.arvo(x, 20))], b = [Number(H.arvo(x, 11)), Number(H.arvo(x, 21))], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  for (let i = 0; i < pv.length; i++) {
    const s0 = pv[i], s1 = pv[(i + 1) % pv.length], vx = s1[0] - s0[0], vy = s1[1] - s0[1], L = Math.hypot(vx, vy);
    const et = q => Math.abs((q[0] - s0[0]) * vy - (q[1] - s0[1]) * vx) / L, tt = ((m[0] - s0[0]) * vx + (m[1] - s0[1]) * vy) / (L * L);
    if (L > 0 && et(a) < 0.05 && et(b) < 0.05 && tt >= 0 && tt <= 1) return true;
  }
  return false;
};
ok(!taitokset.some(x => polyt.some(q => paalla(x, q.v))), '3b: yksikään taitosviiva ei ole leikkausviivan päällä');
const ylaAla = polyt.every((q, i) => {
  const xs = q.v.map(v => v[0]), xa = Math.min(...xs), xb = Math.max(...xs);
  const omat = taitokset.filter(x => { const xm = (Number(H.arvo(x, 10)) + Number(H.arvo(x, 11))) / 2; return xm > xa && xm < xb; });
  return omat.length >= 3;   // yläreuna + alareunan kouru (pohja, nousu) vähintään
});
ok(ylaAla, '3c: jokaisella palalla vähintään kolme taitosviivaa (yläreuna ja alareunan kouru)');

// teksti
const tekstit = e.filter(x => x.tyyppi === 'TEXT').map(x => H.arvo(x, 1));
ok(tekstit.length === rA.length && tekstit[0] === 'Huuva 1 · ' + rA[0].name + ' · 2 kpl · aihio 860 × ' + Math.ceil(rA[0].h - 1e-6) + ' mm', '4a: teksti: työn nimi, pala, kpl ja aihio (' + tekstit[0] + ')');
ok(e.filter(x => x.tyyppi === 'TEXT').every(x => H.arvo(x, 8) === 'TEKSTI'), '4b: tekstit TEKSTI-tasolla');
ok(huuvaDxf([], 'X') === null && huuvaDxf(null) === null, '4c: ilman paloja ei tiedostoa');
// huuvien määrä näkyy kappalemäärässä
ok(huuvaDxf(kerroHuuvat(rA, 3), 'H').sisalto().indexOf(rA[0].name + ' · 6 kpl') > 0, '4d: 3 huuvaa -> 6 kpl tekstissä');
ok(t.indexOf('NaN') < 0 && t.indexOf('undefined') < 0, '4e: ei NaN / undefined');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '', classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
global.H = { parit, entiteetit, arvo };
eval(script + '\n' + testCode);
