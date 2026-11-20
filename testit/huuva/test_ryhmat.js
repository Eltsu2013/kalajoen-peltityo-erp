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
const mk = t => ({ type: { Etu:t, Oikea:t, Taka:t, Vasen:t }, floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15 });
const side = { Etu:{L:0,R:0}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:20,R:20} };
const top = { on:true, w:20, dir:'sisaan' };

// Keskitetty: Etu = Taka ja Oikea = Vasen
let g = ryhmitteleSamat(laskeKaikki(sA, opts(allOn, mk('kouru'), side, top)));
ok(g.length === 2, 'G: kaksi ryhmää (saatu ' + g.length + ')');
ok(g[0].name === 'Etu + Taka' && g[0].kpl === 2, 'G: Etu + Taka, 2 kpl');
ok(g[1].name === 'Oikea + Vasen' && g[1].kpl === 2, 'G: Oikea + Vasen, 2 kpl');

// Eri alareunan käsittely erottaa ryhmät
const bt = mk('kouru'); bt.type.Taka = 'tuplat';
g = ryhmitteleSamat(laskeKaikki(sA, opts(allOn, bt, side, top)));
ok(g.length === 4 && g.map(x => x.name).join() === 'Etu,Oikea,Taka,Vasen', 'G: Taka eri profiili -> Oikea ja Vasen eivät enää ole samat (jiiri vain toisessa päässä), kaikki erikseen: ' + g.map(x => x.name).join());
// Eri taitosleveys erottaa
const side2 = JSON.parse(JSON.stringify(side)); side2.Vasen.L = 25;
g = ryhmitteleSamat(laskeKaikki(sA, opts(allOn, mk('kouru'), side2, top)));
ok(g.length === 3, 'G: eri sivutaitos -> Oikea ja Vasen erikseen');
// Epäkeskoinen huuva: Etu ja Taka eivät ole samat
g = ryhmitteleSamat(laskeKaikki({ Wb:900, Db:600, Wt:300, Dt:200, H:450, dx:100, dy:60 }, opts(allOn, mk('kouru'), side, top)));
ok(g.length === 4, 'G: epäkeskoinen -> ei yhdistetä (saatu ' + g.length + ')');
// Seinää vasten: Taka pois -> Etu yksin
const onW = { Etu:true, Oikea:true, Taka:false, Vasen:true };
g = ryhmitteleSamat(laskeKaikki({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 }, opts(onW, mk('kouru'), side, top)));
ok(g.some(x => x.name === 'Etu' && x.kpl === 1), 'G: seinämalli, Etu 1 kpl');
// Kpl lasketaan oikein koko listasta
g = ryhmitteleSamat(laskeKaikki(sA, opts(allOn, mk('ei'), side, top)));
ok(g.reduce((a, x) => a + x.kpl, 0) === 4, 'G: kappaleita yhteensä 4');

// Työkortti rakentuu ja sisältää oikeat tiedot
const kortit = rakennaTyokortit(sA, ryhmitteleSamat(laskeKaikki(sA, opts(allOn, mk('kouru'), side, top))), 'Testihuuva', 'Vapaasti seisova');
ok(kortit.indexOf('Etu + Taka') >= 0 && kortit.indexOf('2 kpl') >= 0, 'K: kortissa Etu + Taka, 2 kpl');
ok((kortit.match(/class="tk-page"/g) || []).length === 3, 'K: yhteenveto + 2 korttia');
ok(kortit.indexOf('76,0°') >= 0 && kortit.indexOf('kouru') >= 0, 'K: kanttausluku ja profiili mukana');
ok(kortit.indexOf('515') >= 0, 'K: korkeus 515 mm mukana');
ok(kortit.indexOf('Testihuuva') >= 0, 'K: huuvan nimi mukana');
// taitosRivit
const rv = taitosRivit(g[0]);
ok(Array.isArray(rv), 'K: taitosRivit toimii');
const rvK = taitosRivit(ryhmitteleSamat(laskeKaikki(sA, opts(allOn, mk('kouru'), side, top)))[0]);
ok(rvK.filter(r => r[0].indexOf('Alareuna') === 0).length === 3, 'K: kourun kolme osaa omilla riveillään');
ok(rvK.every(r => r[4] === 'ulos' || r[4] === 'sisään'), 'K: jokaisella rivillä taittosuunta');
// seinä-sivutaitos taittuu ulos, naapuria vasten sisään
const gw = ryhmitteleSamat(laskeKaikki({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 }, opts(onW, mk('kouru'), { Etu:{L:0,R:0}, Oikea:{L:20,R:30}, Taka:{L:0,R:0}, Vasen:{L:30,R:20} }, top)));
const fo = gw.find(x => x.name.indexOf('Oikea') >= 0).flanges;
ok(fo.find(f => f.kind === 'right').suunta === 'ulos' && fo.find(f => f.kind === 'left').suunta === 'sisään', 'K: seinäreuna ulos, naapurireuna sisään');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
