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
const mk = (tyyppi, extra) => Object.assign({ type: tyyppi, floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:0 }, extra || {});
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const polyArea = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const q = poly[(i+1) % poly.length]; a += poly[i][0]*q[1] - q[0]*poly[i][1]; } return Math.abs(a) / 2; };

// A) Kaikki kourut: jiirit kaikissa neljässä kulmassa
const rA = laskeKaikki(sA, opts(allOn, mk(all('kouru'))));
const eA = find(rA, 'Etu'), oA = find(rA, 'Oikea');
ok(bot(eA).jiiri.S === 30 && bot(eA).jiiri.E === 30, 'A: Etu molemmat päät jiirissä, +30');
near(eA.w, 860, 1e-6, 'A: Etu aihion leveys 800 + 2×30');
near(oA.w, 560, 1e-6, 'A: Oikea aihion leveys 500 + 2×30');
near(polyArea(bot(eA).poly), 65*800 + 3000, 1e-6, 'A: Etu kourun pinta-ala = 65a + 3000');
near(eA.h - laskeKaikki(sA, opts(allOn, mk(all('ei')))).find(p => p.name === 'Etu').h, 65, 1e-6, 'A: syvyys edelleen +65');
// jiirilinja 45°: kaksi peräkkäistä pistettä [a,0] -> [a+30,30] (flat-koordinaateissa)
(function () {
  const f = bot(eA), P = eA;
  const pts = f.poly;
  ok(pts.length === 6, 'A: ääriviivassa kuusi pistettä (kaksi jiiripäätä), saatu ' + pts.length);
  // pisteet 1->2 on oikean pään jiirilinja: pituus 30*sqrt2 ja suunta 45° alareunaan nähden
  const dx = pts[2][0] - pts[1][0], dy = pts[2][1] - pts[1][1];
  near(Math.sqrt(dx*dx + dy*dy), 30 * Math.SQRT2, 1e-6, 'A: jiirilinjan pituus 30√2');
  const ex = P.B2[0] - P.A2[0], ey = P.B2[1] - P.A2[1], el = Math.sqrt(ex*ex + ey*ey);
  const cos = (dx*ex + dy*ey) / (Math.sqrt(dx*dx + dy*dy) * el);
  near(Math.acos(cos) * 180 / Math.PI, 45, 1e-6, 'A: jiiri 45° alareunaan nähden');
})();
// jiiri kahden naapurin välillä sulkeutuu: Etun oikean pään jiirilinja = Oikean vasemman pään jiirilinja (suuruus)
near(bot(oA).jiiri.S, 30, 1e-9, 'A: Oikea vasen pää jiirissä');

// B) Lisämitta
const rB = laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa:5 })));
const eB = find(rB, 'Etu');
near(bot(eB).jiiri.E, 35, 1e-9, 'B: jiiripidennys 30 + 5');
near(eB.w, 870, 1e-6, 'B: aihion leveys 800 + 2×35');
near(polyArea(bot(eB).poly), 65*800 + 3650, 1e-6, 'B: pinta-ala lisämitalla (65a + 3650)');
ok(bot(eB).jiiri.lisa === 5, 'B: lisämitta tallessa');

// C) Seinää vasten: Taka pois -> Oikean ja Vasemman takapää suora
const sC = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 };
const onC = { Etu:true, Oikea:true, Taka:false, Vasen:true };
const rC = laskeKaikki(sC, opts(onC, mk(all('kouru'))));
const eC = find(rC,'Etu'), oC = find(rC,'Oikea'), vC = find(rC,'Vasen');
ok(bot(eC).jiiri.S > 0 && bot(eC).jiiri.E > 0, 'C: Etu molemmat päät jiirissä');
ok(bot(oC).jiiri.S === 30 && bot(oC).jiiri.E === 0, 'C: Oikea: etupää jiirissä, takapää (seinä) suora');
ok(bot(vC).jiiri.S === 0 && bot(vC).jiiri.E === 30, 'C: Vasen: takapää (seinä) suora, etupää jiirissä');
near(oC.w, 530, 1e-6, 'C: Oikea aihio 500 + 30 (vain toinen pää)');

// D) Naapurilla ei kouru -> pää suora
const rD = laskeKaikki(sA, opts(allOn, mk({ Etu:'kouru', Oikea:'sisaan', Taka:'kouru', Vasen:'ei' })));
const eD = find(rD, 'Etu');
ok(bot(eD).jiiri.S === 0 && bot(eD).jiiri.E === 0, 'D: naapureilla sisään / ei mitään -> Etun päät suorat');
near(eD.w, 800, 1e-6, 'D: Etu aihion leveys 800 (suorat päät)');
ok(bot(eD).poly.length === 4, 'D: suorapäisen kourun ääriviiva nelikulmio');
near(polyArea(bot(eD).poly), 800 * 65, 1e-6, 'D: suorapäisen kourun pinta-ala a×65');
ok(!bot(find(rD,'Oikea')).jiiri, 'D: sisäänpäin taitoksella ei jiirejä');
// Kouru vain toisessa naapurissa
const rD2 = laskeKaikki(sA, opts(allOn, mk({ Etu:'kouru', Oikea:'kouru', Taka:'ei', Vasen:'ei' })));
ok(bot(find(rD2,'Etu')).jiiri.S === 0 && bot(find(rD2,'Etu')).jiiri.E === 30, 'D: Etu: vasen suora, oikea jiirissä (Oikea on kouru)');
ok(bot(find(rD2,'Oikea')).jiiri.S === 30 && bot(find(rD2,'Oikea')).jiiri.E === 0, 'D: Oikea: vasen jiirissä, oikea suora');
near(find(rD2,'Etu').w, 830, 1e-6, 'D: Etu aihio 830');
// Jiiri-pää ei saa mennä paneelin päälle: kouru on alareunan alapuolella
laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa:5 }))).forEach(p => bot(p).poly.forEach(q => ok(q[1] <= 1e-9, 'D: ' + p.name + ' kourun piste alareunan alapuolella')));

// E) Taitosviivat ja nimi
const fE = bot(eA);
ok(fE.foldLines.length === 2, 'E: kourussa kaksi taitosviivaa (pohja|nousu, nousu|tupla)');
const fl0 = fE.foldLines[0];
const L0 = Math.sqrt((fl0.q[0]-fl0.p[0])**2 + (fl0.q[1]-fl0.p[1])**2);
near(L0, 860, 1e-6, 'E: pohja/nousu-taitoksen pituus 860 (a + 2×30)');
ok(fE.lblPos && fE.lblPos.length === 2, 'E: tekstin sijainti olemassa');
ok(jiiriTeksti(fE).indexOf('jiirissä') >= 0, 'E: jiiriteksti');
ok(jiiriTeksti(bot(eD)).indexOf('suora') >= 0, 'E: suora pää tekstinä');
// Ryhmittely: Etu + Taka yhdistyvät edelleen, kun molemmat jiirissä molemmin puolin
const gA = ryhmitteleSamat(rA);
ok(gA.length === 2 && gA[0].name === 'Etu + Taka', 'E: Etu + Taka yhdistyvät jiirien kanssa');
// Käsikäyttö: vanha asetusmuoto ei tee jiirejä
const rOld = laskeKaikki(sA, opts(allOn, { on: all(true), floor:30, rise:20, hem:15 }));
ok(!bot(find(rOld,'Etu')).jiiri.S && find(rOld,'Etu').w === 800, 'E: vanha asetusmuoto (on) -> ei jiirejä');
// Työkortin huomautus
const kt = rakennaTyokortit(sA, gA, 'T', 'V');
ok(kt.indexOf('jiirissä') >= 0, 'E: työkortissa jiiri-huomautus');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
