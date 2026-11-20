const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function near(a, b, t, m) { ok(Math.abs(a-b) <= t, m + ' (saatu ' + (typeof a==='number'?a.toFixed(3):a) + ', odotettu ' + b + ')'); }
const allOn = { Etu:true, Oikea:true, Taka:true, Vasen:true };
const noSide = { Etu:{L:0,R:0}, Oikea:{L:0,R:0}, Taka:{L:0,R:0}, Vasen:{L:0,R:0} };
function opts(panelOn, bottom, side, top) {
  return { panelOn, sideW: side || noSide, top: top || {on:false,w:0,dir:'sisaan'}, bottom };
}
const kAll = { on: { Etu:true, Oikea:true, Taka:true, Vasen:true }, floor:30, rise:20, hem:15 };
const find = (a, n) => a.find(p => p.name === n);
const bot = p => p.flanges.find(f => f.kind === 'bottom');
function area(poly) { return Math.abs(polygonSign(poly)) / 2; }





const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const bt0 = { type: { Etu:'ei', Oikea:'ei', Taka:'ei', Vasen:'ei' }, floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:{} };
const topN = (type, extra) => Object.assign({ type, w:20, loveus:true }, extra || {});
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const O = (panelOn, top) => ({ panelOn, sideW: noSide, top, bottom: bt0 });
const polyArea = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const q = poly[(i+1) % poly.length]; a += poly[i][0]*q[1] - q[0]*poly[i][1]; } return Math.abs(a) / 2; };
const topF = p => p.flanges.find(f => f.kind === 'top');

// ---- Ylöspäin-taitos
const rU = laskeKaikki(sA, O(allOn, topN(all('ylos'))));
const eU = find(rU,'Etu'), oU = find(rU,'Oikea');
near(topF(eU).angle, 14.04, 0.02, 'U: Etu ylöspäin-taitos 14,04° (= 90 − 75,96)');
near(topF(oU).angle, 21.80, 0.02, 'U: Oikea ylöspäin-taitos 21,80° (= 90 − 68,20)');
ok(topF(eU).suunta === 'ulos', 'U: ylöspäin = taitto ulos (kohti katsojaa)');
ok(topF(eU).vastaan === 'pystysuora, ylös', 'U: nimi pystysuora, ylös');
ok(topF(eU).poly.length === 4 && !topF(eU).loveus, 'U: ylöspäin-taitos suorakulmio, ei loveuksia');
near(polyArea(topF(eU).poly), 400 * 20, 1e-6, 'U: pinta-ala c × 20');
// suora laatikko: ylös = 0°, sisään = 90°
const sB = { Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 };
near(topF(laskeKaikki(sB, O(allOn, topN(all('ylos'))))[0]).angle, 0, 1e-6, 'U: laatikon ylöspäin-taitos 0° (suoraan jatkoa)');
near(topF(laskeKaikki(sB, O(allOn, topN(all('sisaan'))))[0]).angle, 90, 1e-6, 'U: laatikon sisäänpäin-taitos 90°');

// ---- Taitos ilman päälle tulevaa peltiä: tyyppi riittää, mitään "päälle pelti" -valintaa ei ole
const rN = laskeKaikki(sA, O(allOn, topN({ Etu:'ylos', Oikea:'ei', Taka:'ylos', Vasen:'ei' })));
ok(!!topF(find(rN,'Etu')) && !topF(find(rN,'Oikea')) && !!topF(find(rN,'Taka')) && !topF(find(rN,'Vasen')), 'N: taitos vain valituilla paneeleilla');
ok(laskeKaikki(sA, O(allOn, topN(all('sisaan'), { w:0 }))).every(p => !topF(p)), 'N: leveys 0 -> ei taitosta');

// ---- Loveus vaakasuoralle sisäänpäin taitokselle yläreunassa
const rS = laskeKaikki(sA, O(allOn, topN(all('sisaan'))));
const eS = find(rS,'Etu'), oS = find(rS,'Oikea');
ok(topF(eS).loveus.C === 20 && topF(eS).loveus.D === 20, 'S: Etu ylä-loveus molemmissa päissä');
near(polyArea(topF(eS).poly), (400 + 360) / 2 * 20, 1e-6, 'S: Etu loveuksellinen pinta-ala (400+360)/2×20');
near(polyArea(topF(oS).poly), (250 + 210) / 2 * 20, 1e-6, 'S: Oikea loveuksellinen pinta-ala');
(function () {
  const pts = topF(eS).poly;
  ok(pts.length === 4, 'S: neljä pistettä');
  const L = (a, b) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);
  near(L(pts[3], pts[2]), 360, 1e-6, 'S: ulkoreuna c − 2×20 = 360');
  near(L(pts[0], pts[3]), 20 * Math.SQRT2, 1e-6, 'S: loveuslinja 20√2');
  near(L(pts[1], pts[2]), 20 * Math.SQRT2, 1e-6, 'S: toinen loveuslinja 20√2');
})();
// loveus on alkuperäisen suorakulmion sisällä (ei kasvata aihiota)
rS.forEach(p => { const f = topF(p); f.poly.forEach(q => ok(q[1] >= p.minY - 1e-9 && q[1] <= p.minY + p.h + 1e-9, 'S: ' + p.name + ' loveuspiste aihion sisällä')); });
// Aihion korkeus sama kuin ilman loveusta
const rSoff = laskeKaikki(sA, O(allOn, topN(all('sisaan'), { loveus:false })));
near(find(rSoff,'Etu').h, eS.h, 1e-9, 'S: aihion korkeus sama loveuksella ja ilman');
ok(topF(find(rSoff,'Etu')).poly.length === 4 && !topF(find(rSoff,'Etu')).loveus, 'S: loveus pois -> suorakulmio, ei loveustietoa');
near(polyArea(topF(find(rSoff,'Etu')).poly), 400 * 20, 1e-6, 'S: loveus pois -> c × 20');
// naapuri ylös -> suora pää
const rM = laskeKaikki(sA, O(allOn, topN({ Etu:'sisaan', Oikea:'ylos', Taka:'sisaan', Vasen:'sisaan' })));
ok(topF(find(rM,'Etu')).loveus.C === 0 && topF(find(rM,'Etu')).loveus.D === 20, 'M: Etu: oikea naapuri (Oikea) ylös -> suora, vasen naapuri sisään -> loveus');
// naapuri pois (seinä) -> suora
const rW = laskeKaikki({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 }, O({ Etu:true, Oikea:true, Taka:false, Vasen:true }, topN(all('sisaan'))));
ok(topF(find(rW,'Oikea')).loveus.C === 0 && topF(find(rW,'Oikea')).loveus.D === 20, 'W: seinämalli: Oikean takapää suora');
// Vanha asetusmuoto (on/dir) toimii ilman loveuksia
const rOld = laskeKaikki(sA, { panelOn: allOn, sideW: noSide, top: { on:true, w:25, dir:'sisaan' }, bottom: bt0 });
ok(!topF(find(rOld,'Etu')).loveus && topF(find(rOld,'Etu')).poly.length === 4, 'O: vanha muoto ei loveuksia');
near(topF(find(rOld,'Etu')).angle, 75.96, 0.02, 'O: vanha muoto 75,96°');
// ryhmittely: Etu + Taka yhdistyvät loveuksilla ja ylös-taitoksilla
const g1 = ryhmitteleSamat(rS), g2 = ryhmitteleSamat(rU);
ok(g1.length === 2 && g1[0].name === 'Etu + Taka', 'G: Etu + Taka yhdistyvät yläloveuksilla');
ok(g2.length === 2 && g2[0].name === 'Etu + Taka', 'G: Etu + Taka yhdistyvät ylös-taitoksilla');
// eri yläreunatyyppi erottaa ryhmät
const g3 = ryhmitteleSamat(laskeKaikki(sA, O(allOn, topN({ Etu:'ylos', Oikea:'sisaan', Taka:'sisaan', Vasen:'sisaan' }))));
ok(g3.length === 4, 'G: Etu ylös, Taka sisään -> erilliset');
// UI-asetukset
ylaTyyppi = { Etu:'ylos', Oikea:'ei', Taka:'sisaan', Vasen:'sisaan' };
const ls = lueTaitosAsetukset();
ok(ls.top.type.Etu === 'ylos' && ls.top.type.Oikea === 'ei' && 'w' in ls.top && ls.top.loveus === true, 'UI: asetukset sisältävät yläreunan tyypit ja loveuksen');
ok(!('on' in ls.top), 'UI: ei enää "päälle tuleva pelti" -kytkintä taitoksen yhteydessä');
asetaEsiasetus();
ok(PANEL_NAMES.every(n => ylaTyyppi[n] === 'sisaan'), 'UI: esiasetus palauttaa yläreunan sisäänpäin-taitoksiksi');
// Tulosteet
const kortit = rakennaTyokortit(sA, ryhmitteleSamat(rS), 'T', 'V');
ok(kortit.indexOf('loveus') >= 0 && kortit.indexOf('Yläreuna') >= 0, 'T: työkortissa yläreunan loveus');
const kortitU = rakennaTyokortit(sA, ryhmitteleSamat(rU), 'T', 'V');
ok(kortitU.indexOf('pystysuora, ylös') >= 0 && kortitU.indexOf('14,0°') >= 0, 'T: työkortissa ylöspäin-taitos ja 14,0°');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
