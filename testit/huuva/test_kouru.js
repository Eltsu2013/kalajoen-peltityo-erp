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

// A) Keskitetty 800x500 -> 400x250, H=500
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const rA = laskeKaikki(sA, opts(allOn, kAll));
ok(rA.length === 4, 'A: neljä paneelia');
rA.forEach(p => ok(!!bot(p), 'A: ' + p.name + ' sai kourun'));
const eA = find(rA, 'Etu'), oA = find(rA, 'Oikea');
near(bot(eA).segments[0].angle, 75.96, 0.02, 'A: Etu pohja kanttausluku 75,96°');
near(bot(oA).segments[0].angle, 68.20, 0.02, 'A: Oikea pohja kanttausluku 68,20°');
near(bot(eA).segments[1].angle, 90, 1e-9, 'A: nousu 90°');
near(bot(eA).segments[2].angle, 180, 1e-9, 'A: tupla 180°');
ok(bot(eA).segments.map(s => s.nimi).join() === 'pohja,nousu,tupla', 'A: segmenttien järjestys pohja,nousu,tupla');
ok(bot(eA).segments.map(s => s.w).join() === '30,20,15', 'A: segmenttien leveydet 30,20,15');
near(bot(eA).w, 65, 1e-9, 'A: litteä lisäys 65 mm');
near(area(bot(eA).poly), eA.a * 65, 1e-6, 'A: Etu kourusuikaleen pinta-ala = alareuna × 65');
// aihio kasvaa täsmälleen 65 mm alaspäin
const rA0 = laskeKaikki(sA, opts(allOn, { on: {}, floor:30, rise:20, hem:15 }));
const eA0 = find(rA0, 'Etu');
near(eA.h - eA0.h, 65, 1e-6, 'A: Etu aihion korkeus kasvaa 65 mm');
near(eA0.minY - eA.minY, 65, 1e-6, 'A: aihio kasvaa alaspäin');
near(eA.w, eA0.w, 1e-6, 'A: aihion leveys ei muutu (päät suorat)');
ok(eA0.flanges.length === 0, 'A: kouru pois -> ei taitoksia');
// suikale on alareunan alapuolella
bot(eA).poly.forEach(q => ok(q[1] <= 1e-9, 'A: kourun piste y=' + q[1].toFixed(2) + ' alareunan alapuolella'));

// B) Suora laatikko: pohjan kanttausluku 90°
const sB = { Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 };
laskeKaikki(sB, opts(allOn, kAll)).forEach(p => near(bot(p).segments[0].angle, 90, 1e-6, 'B: laatikko ' + p.name + ' pohja = 90°'));

// C) Seinää vasten (Taka pois, dy=125): Etu β = 63,43°, Oikea 68,20°
const sC = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 };
const onC = { Etu:true, Oikea:true, Taka:false, Vasen:true };
const rC = laskeKaikki(sC, opts(onC, kAll));
ok(rC.length === 3, 'C: kolme paneelia');
near(bot(find(rC,'Etu')).segments[0].angle, 63.43, 0.02, 'C: Etu pohja 63,43°');
near(bot(find(rC,'Oikea')).segments[0].angle, 68.20, 0.02, 'C: Oikea pohja 68,20°');

// D) Paneelikohtainen päälle/pois ja nollat
const rD = laskeKaikki(sA, opts(allOn, { on: { Etu:true, Oikea:false, Taka:true, Vasen:false }, floor:30, rise:20, hem:15 }));
ok(!!bot(find(rD,'Etu')) && !bot(find(rD,'Oikea')) && !!bot(find(rD,'Taka')) && !bot(find(rD,'Vasen')), 'D: kouru vain Etu ja Taka');
const rD2 = laskeKaikki(sA, opts(allOn, { on: kAll.on, floor:0, rise:20, hem:15 }));
ok(rD2.every(p => !bot(p)), 'D: pohja 0 -> ei kourua');
const rD3 = laskeKaikki(sA, opts(allOn, { on: kAll.on, floor:30, rise:20, hem:0 }));
ok(bot(find(rD3,'Etu')).segments.length === 2 && Math.abs(bot(find(rD3,'Etu')).w - 50) < 1e-9, 'D: tupla 0 -> kaksi osaa, 50 mm');
const rD4 = laskeKaikki(sA, { panelOn: allOn, sideW: noSide, top: {on:false,w:0,dir:'sisaan'} });
ok(rD4.every(p => p.flanges.length === 0), 'D: ilman bottom-asetusta ei kouruja (taaksepäin yhteensopiva)');

// E) Epäkeskoinen: kulmat järkeviä, kaikki kolme taitosta yhdessä sivu- ja yläreunan kanssa
const sE = { Wb:900, Db:600, Wt:300, Dt:200, H:450, dx:100, dy:60 };
const side = { Etu:{L:20,R:20}, Oikea:{L:20,R:20}, Taka:{L:20,R:20}, Vasen:{L:20,R:20} };
const rE = laskeKaikki(sE, opts(allOn, kAll, side, {on:true,w:25,dir:'sisaan'}));
rE.forEach(p => {
  ok(p.flanges.length === 4, 'E: ' + p.name + ' neljä taitosta (vasen, oikea, yläreuna, kouru)');
  const k = bot(p).segments[0].angle;
  ok(k > 1 && k < 179, 'E: ' + p.name + ' pohjan kulma ' + k.toFixed(2) + ' järkevä');
  p.flanges.forEach(f => f.poly.forEach(q => ok(q[0] >= p.minX - 1e-9 && q[0] <= p.minX + p.w + 1e-9 && q[1] >= p.minY - 1e-9 && q[1] <= p.minY + p.h + 1e-9, 'E: ' + p.name + ' aihio kattaa ' + f.kind)));
});

// F) Esiasetus palauttaa kourut päälle
reunaTyyppi = { Etu:'ei', Oikea:'ei', Taka:'ei', Vasen:'ei' };
asetaEsiasetus();
ok(PANEL_NAMES.every(n => reunaTyyppi[n] === 'kouru'), 'F: esiasetus palauttaa kourut päälle');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
