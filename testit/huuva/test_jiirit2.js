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

// ---- Lisämitta pellikohtaisesti
const rL = laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa: { Etu:5, Oikea:0, Taka:0, Vasen:0 } })));
const eL = find(rL,'Etu'), oL = find(rL,'Oikea'), tL = find(rL,'Taka'), vL = find(rL,'Vasen');
ok(bot(eL).jiiri.S === 35 && bot(eL).jiiri.E === 35, 'L: Etu pidentyy 30 + 5 molemmin puolin');
ok(bot(oL).jiiri.S === 30 && bot(oL).jiiri.E === 30, 'L: Oikea ilman lisämittaa (30)');
ok(bot(tL).jiiri.S === 30 && bot(vL).jiiri.E === 30, 'L: Taka ja Vasen ilman lisämittaa');
near(eL.w, 870, 1e-6, 'L: Etu aihio 800 + 2×35');
near(oL.w, 560, 1e-6, 'L: Oikea aihio 500 + 2×30 (ei lisämittaa)');
// Etu ja Taka eivät enää ole samat
const gL = ryhmitteleSamat(rL);
ok(gL.map(x => x.name).join() === 'Etu,Oikea + Vasen,Taka', 'L: ryhmittely: Etu erikseen, Taka erikseen, Oikea + Vasen yhdessä (saatu ' + gL.map(x => x.name).join() + ')');
// Sivuille lisämitta, ei etulle
const rL2 = laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa: { Etu:0, Oikea:4, Taka:0, Vasen:4 } })));
ok(bot(find(rL2,'Etu')).jiiri.S === 30 && bot(find(rL2,'Oikea')).jiiri.S === 34, 'L: sivuille 4 mm, etulle ei');
// vanha numeromuoto toimii yhä
const rL3 = laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa: 5 })));
ok(bot(find(rL3,'Taka')).jiiri.S === 35, 'L: yksittäinen lukuarvo koskee kaikkia (taaksepäin yhteensopiva)');
// puuttuva paneelin avain = 0
const rL4 = laskeKaikki(sA, opts(allOn, mk(all('kouru'), { lisa: { Etu: 3 } })));
ok(bot(find(rL4,'Oikea')).jiiri.S === 30, 'L: puuttuva avain tulkitaan nollaksi');
// lisämitta ei vaikuta pellin, jolla kourua ei ole
const rL5 = laskeKaikki(sA, opts(allOn, mk({ Etu:'ei', Oikea:'kouru', Taka:'ei', Vasen:'kouru' }, { lisa: { Etu:9, Oikea:2, Taka:0, Vasen:0 } })));
ok(!bot(find(rL5,'Etu')), 'L: ei kourua -> ei alareunan profiilia');
ok(bot(find(rL5,'Oikea')).jiiri.S === 0 && bot(find(rL5,'Oikea')).jiiri.E === 0, 'L: Oikean naapureilla ei kourua -> suorat päät, lisämitta ei vaikuta');

// ---- 45° loveus sisäänpäin taitoksessa
const rS = laskeKaikki(sA, opts(allOn, mk(all('sisaan'))));
const eS = find(rS,'Etu'), oS = find(rS,'Oikea');
ok(bot(eS).loveus.S === 20 && bot(eS).loveus.E === 20, 'S: Etu molemmat päät loveuksella (20)');
near(eS.w, 800, 1e-6, 'S: aihion leveys ei kasva (loveus poistaa materiaalia)');
// ääriviiva: puolisuunnikas + tupla-suorakulmio: ((a)+(a-2w))/2*w + (a-2w)*hem
near(polyArea(bot(eS).poly), (800 + 760) / 2 * 20 + 760 * 10, 1e-6, 'S: Etu loveuksellinen pinta-ala');
near(polyArea(bot(oS).poly), (500 + 460) / 2 * 20 + 460 * 10, 1e-6, 'S: Oikea loveuksellinen pinta-ala');
(function () {
  const pts = bot(eS).poly;
  ok(pts.length === 6, 'S: kuusi pistettä (kaksi loveusta), saatu ' + pts.length);
  const dx = pts[2][0] - pts[1][0], dy = pts[2][1] - pts[1][1];
  near(Math.sqrt(dx*dx + dy*dy), 20 * Math.SQRT2, 1e-6, 'S: loveuslinjan pituus 20√2');
  const ex = eS.B2[0] - eS.A2[0], ey = eS.B2[1] - eS.A2[1], el = Math.sqrt(ex*ex + ey*ey);
  const cos = (dx*ex + dy*ey) / (Math.sqrt(dx*dx + dy*dy) * el);
  near(Math.acos(cos) * 180 / Math.PI, 135, 1e-6, 'S: loveus 45° sisäänpäin (135° alareunaan nähden mitattuna ulos)');
})();
// taitosviiva lyhenee: 760
const flS = bot(eS).foldLines[0];
near(Math.sqrt((flS.q[0]-flS.p[0])**2 + (flS.q[1]-flS.p[1])**2), 760, 1e-6, 'S: taitosviiva 760 mm (a − 2×20)');
// ilman tuplaa
const rS0 = laskeKaikki(sA, opts(allOn, mk(all('sisaan'), { inHem: 0 })));
near(polyArea(bot(find(rS0,'Etu')).poly), (800 + 760) / 2 * 20, 1e-6, 'S: ilman tuplaa pelkkä puolisuunnikas');
ok(bot(find(rS0,'Etu')).poly.length === 4, 'S: ilman tuplaa neljä pistettä');
// loveus pois
const rSoff = laskeKaikki(sA, opts(allOn, mk(all('sisaan'), { loveus:false })));
ok(bot(find(rSoff,'Etu')).loveus.S === 0 && bot(find(rSoff,'Etu')).poly.length === 4, 'S: loveus pois -> suorat päät');
near(polyArea(bot(find(rSoff,'Etu')).poly), 800 * 30, 1e-6, 'S: loveus pois -> a × 30');
// naapurina kouru -> suora
const rSm = laskeKaikki(sA, opts(allOn, mk({ Etu:'sisaan', Oikea:'kouru', Taka:'sisaan', Vasen:'sisaan' })));
ok(bot(find(rSm,'Etu')).loveus.S === 20 && bot(find(rSm,'Etu')).loveus.E === 0, 'S: Etu: vasen naapuri sisään -> loveus, oikea naapuri kouru -> suora');
// seinä: Taka pois -> sivujen takapää suora
const rSw = laskeKaikki({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 }, opts({ Etu:true, Oikea:true, Taka:false, Vasen:true }, mk(all('sisaan'))));
ok(bot(find(rSw,'Oikea')).loveus.S === 20 && bot(find(rSw,'Oikea')).loveus.E === 0, 'S: seinämalli: Oikean takapää suora');
// yhdistyminen säilyy
const gS = ryhmitteleSamat(rS);
ok(gS.length === 2 && gS[0].name === 'Etu + Taka', 'S: Etu + Taka yhdistyvät loveuksilla');
// teksti
ok(jiiriTeksti(bot(eS)).indexOf('45° loveus') >= 0, 'S: loveusteksti');
ok(rakennaTyokortit(sA, gS, 'T', 'V').indexOf('loveus') >= 0, 'S: työkortissa loveus');
// kuusikulmiolle ei vaikuta: jiirit kouruille pysyvät
const rK = laskeKaikki(sA, opts(allOn, mk(all('kouru'))));
near(polyArea(bot(find(rK,'Etu')).poly), 65*800 + 3000, 1e-6, 'K: kouru-jiiri ennallaan');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
