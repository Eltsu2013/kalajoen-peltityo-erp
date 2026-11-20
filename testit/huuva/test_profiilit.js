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
const mk = (tyyppi, extra) => Object.assign({ type: tyyppi, floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15 }, extra || {});
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });

// Sisäänpäin taitos 20 + tupla 10
const rS = laskeKaikki(sA, opts(allOn, mk(all('sisaan'))));
const eS = find(rS,'Etu'), oS = find(rS,'Oikea');
ok(rS.every(p => !!bot(p)), 'S: kaikilla sisäänpäin taitos');
near(bot(eS).segments[0].angle, 104.04, 0.02, 'S: Etu taitos 104,04° (= 180 - 75,96)');
near(bot(oS).segments[0].angle, 111.80, 0.02, 'S: Oikea taitos 111,80°');
near(bot(eS).segments[1].angle, 180, 1e-9, 'S: tupla 180°');
ok(bot(eS).segments.every(sg => sg.suunta === 'sisään'), 'S: suunta sisään');
near(bot(eS).w, 30, 1e-9, 'S: litteä lisäys 20+10 = 30');
ok(bot(eS).profNimi === 'sisään', 'S: profiilin nimi');
// summa: kouru-pohja + sisään-kulma = 180 (sama reuna, vastakkaiset suunnat)
const rK = laskeKaikki(sA, opts(allOn, mk(all('kouru'))));
near(bot(find(rK,'Etu')).segments[0].angle + bot(eS).segments[0].angle, 180, 1e-6, 'S: kouru + sisään = 180° (Etu)');
near(bot(find(rK,'Oikea')).segments[0].angle + bot(oS).segments[0].angle, 180, 1e-6, 'S: kouru + sisään = 180° (Oikea)');
ok(bot(find(rK,'Etu')).segments.every(sg => sg.suunta === 'ulos'), 'K: kourun suunta ulos');
// suora laatikko: 90°
laskeKaikki({ Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 }, opts(allOn, mk(all('sisaan')))).forEach(p => near(bot(p).segments[0].angle, 90, 1e-6, 'S: laatikko ' + p.name + ' 90°'));
// ilman tuplaa
const rS0 = laskeKaikki(sA, opts(allOn, mk(all('sisaan'), { inHem:0 })));
ok(bot(find(rS0,'Etu')).segments.length === 1 && Math.abs(bot(find(rS0,'Etu')).w - 20) < 1e-9, 'S: tupla 0 -> yksi osa, 20 mm');
// taitos 0 -> ei profiilia
ok(laskeKaikki(sA, opts(allOn, mk(all('sisaan'), { inW:0 }))).every(p => !bot(p)), 'S: taitos 0 -> ei alareunan profiilia');

// Kaksi tuplaa
const rT = laskeKaikki(sA, opts(allOn, mk(all('tuplat'))));
const eT = find(rT,'Etu');
ok(bot(eT).segments.length === 2 && bot(eT).segments.every(sg => sg.angle === 180), 'T: kaksi 180° taitosta');
near(bot(eT).w, 30, 1e-9, 'T: litteä lisäys 15+15');
ok(bot(eT).segments.every(sg => sg.suunta === 'sisään'), 'T: suunta sisään');
ok(bot(eT).profNimi === '2×tupla', 'T: nimi');
const rT2 = laskeKaikki(sA, opts(allOn, mk(all('tuplat'), { d1:12, d2:0 })));
ok(bot(find(rT2,'Etu')).segments.length === 1, 'T: d2 = 0 -> yksi tupla');
ok(laskeKaikki(sA, opts(allOn, mk(all('tuplat'), { d1:0, d2:0 }))).every(p => !bot(p)), 'T: molemmat 0 -> ei profiilia');

// Sekoitus per paneeli: Etu kouru, Oikea sisään, Taka tuplat, Vasen ei mitään
const rM = laskeKaikki(sA, opts(allOn, mk({ Etu:'kouru', Oikea:'sisaan', Taka:'tuplat', Vasen:'ei' })));
ok(bot(find(rM,'Etu')).profNimi === 'kouru' && bot(find(rM,'Oikea')).profNimi === 'sisään' && bot(find(rM,'Taka')).profNimi === '2×tupla' && !bot(find(rM,'Vasen')), 'M: profiili per paneeli');
near(find(rM,'Etu').h - find(laskeKaikki(sA, opts(allOn, mk(all('ei')))),'Etu').h, 65, 1e-6, 'M: Etu aihio +65');
near(find(rM,'Taka').h - find(laskeKaikki(sA, opts(allOn, mk(all('ei')))),'Taka').h, 30, 1e-6, 'M: Taka aihio +30');
// kaikki suikaleet alareunan alapuolella
rM.forEach(p => { const b = bot(p); if (b) b.poly.forEach(q => ok(q[1] <= 1e-9, 'M: ' + p.name + ' suikale alareunan alapuolella')); });

// Seinää vasten: sisäänpäin taitos Etu 
const rW = laskeKaikki({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 }, opts({ Etu:true, Oikea:true, Taka:false, Vasen:true }, mk(all('sisaan'))));
near(bot(find(rW,'Etu')).segments[0].angle, 180 - 63.43, 0.02, 'W: seinä-Etu sisään 116,57°');

// UI-tila: lueTaitosAsetukset välittää tyypit
reunaTyyppi = { Etu:'sisaan', Oikea:'ei', Taka:'tuplat', Vasen:'kouru' };
const ls = lueTaitosAsetukset();
ok(ls.bottom.type.Etu === 'sisaan' && ls.bottom.type.Taka === 'tuplat' && ls.bottom.type.Vasen === 'kouru', 'U: asetukset sisältävät tyypit');
ok('inW' in ls.bottom && 'inHem' in ls.bottom && 'd1' in ls.bottom && 'd2' in ls.bottom, 'U: asetukset sisältävät profiilien mitat');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
