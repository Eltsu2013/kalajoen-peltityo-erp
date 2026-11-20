const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti

// 1) syntaksi
new Function(script);

const testCode = `
let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
function near(a, b, tol, msg) { ok(Math.abs(a-b) <= tol, msg + ' (saatu ' + (typeof a==='number'?a.toFixed(3):a) + ', odotettu ' + b + ')'); }

const allOn = { Etu:true, Oikea:true, Taka:true, Vasen:true };
function opts(panelOn, side, top) {
  const sideW = {};
  PANEL_NAMES.forEach(n => { sideW[n] = (side && side[n]) || {L:0,R:0}; });
  return { panelOn, sideW, top: top || {on:false,w:0,dir:'sisaan'} };
}
const sideDef = { Oikea:{L:20,R:20}, Vasen:{L:20,R:20} };
function find(arr, name) { return arr.find(p => p.name === name); }
function fl(p, kind) { return p.flanges.find(f => f.kind === kind); }

// ---- A) Keskitetty 800x500 -> 400x250, H=500
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const rA = laskeKaikki(sA, opts(allOn, sideDef, {on:true, w:20, dir:'sisaan'}));
ok(rA.length === 4, 'A: neljä paneelia');
near(fl(find(rA,'Oikea'),'left').angle, 84.83, 0.02, 'A: Oikea vasen reuna vastaan Etu = 84,83°');
near(fl(find(rA,'Oikea'),'right').angle, 84.83, 0.02, 'A: Oikea oikea reuna vastaan Taka = 84,83°');
near(fl(find(rA,'Vasen'),'left').angle, 84.83, 0.02, 'A: Vasen vasen reuna (Taka) = 84,83°');
ok(fl(find(rA,'Oikea'),'left').vastaan === 'Etu', 'A: Oikea vasen vastaan = Etu');
ok(fl(find(rA,'Oikea'),'right').vastaan === 'Taka', 'A: Oikea oikea vastaan = Taka');
near(fl(find(rA,'Etu'),'top').angle, 75.96, 0.02, 'A: Etu yläreuna sisään = 75,96°');
near(fl(find(rA,'Oikea'),'top').angle, 68.20, 0.02, 'A: Oikea yläreuna sisään = 68,20°');
ok(find(rA,'Etu').flanges.length === 1, 'A: Etu: vain yläreunan taitos (sivut 0)');
ok(find(rA,'Oikea').flanges.length === 3, 'A: Oikea: kolme taitosta');

const rA2 = laskeKaikki(sA, opts(allOn, sideDef, {on:true, w:20, dir:'ulos'}));
near(fl(find(rA2,'Etu'),'top').angle, 104.04, 0.02, 'A: Etu yläreuna ulos = 104,04°');
near(fl(find(rA2,'Oikea'),'top').angle, 111.80, 0.02, 'A: Oikea yläreuna ulos = 111,80°');

// ---- B) Suora laatikko: kaikki 90°
const sB = { Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 };
const rB = laskeKaikki(sB, opts(allOn, { Etu:{L:10,R:10}, Oikea:{L:10,R:10}, Taka:{L:10,R:10}, Vasen:{L:10,R:10} }, {on:true,w:15,dir:'sisaan'}));
rB.forEach(p => p.flanges.forEach(f => near(f.angle, 90, 0.001, 'B: laatikko ' + p.name + ' ' + f.kind + ' = 90°')));

// ---- C) Seinää vasten (Taka pois), dy = 125
const sC = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 };
const onC = { Etu:true, Oikea:true, Taka:false, Vasen:true };
const rC = laskeKaikki(sC, opts(onC, { Oikea:{L:20,R:30}, Vasen:{L:30,R:20} }, {on:true,w:20,dir:'sisaan'}));
ok(rC.length === 3, 'C: kolme paneelia (Taka pois)');
near(fl(find(rC,'Oikea'),'right').angle, 90, 0.01, 'C: Oikea oikea reuna seinää vasten = 90°');
ok(fl(find(rC,'Oikea'),'right').vastaan === 'seinä', 'C: vastaan = seinä');
near(fl(find(rC,'Vasen'),'left').angle, 90, 0.01, 'C: Vasen vasen reuna seinää vasten = 90°');
near(fl(find(rC,'Oikea'),'left').angle, 80.44, 0.02, 'C: Oikea vasen reuna vastaan Etu (seinämalli) = 80,44°');

// ---- D) Nurkka: Taka + Oikea pois, jäljellä Etu + Vasen
const sD = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:(400-800)/2, dy:125 };
const onD = { Etu:true, Oikea:false, Taka:false, Vasen:true };
const rD = laskeKaikki(sD, opts(onD, { Etu:{L:0,R:30}, Vasen:{L:30,R:20} }, {on:false,w:0,dir:'sisaan'}));
ok(rD.length === 2, 'D: kaksi paneelia');
ok(fl(find(rD,'Etu'),'right').vastaan === 'seinä', 'D: Etu oikea reuna -> seinä');
near(fl(find(rD,'Etu'),'right').angle, 90, 0.5, 'D: Etu oikea reuna seinää vasten ~90° (' + fl(find(rD,'Etu'),'right').angle.toFixed(2) + ')');
ok(fl(find(rD,'Vasen'),'right').vastaan === 'Etu', 'D: Vasen oikea reuna -> Etu');

// ---- E) Litteän kuvion geometria: taitoksen suikale on ulkopuolella, oikean kokoinen
[sA, sC, { Wb:900, Db:600, Wt:300, Dt:200, H:450, dx:100, dy:60 }].forEach((s, si) => {
  const r = laskeKaikki(s, opts(allOn, { Etu:{L:20,R:20}, Oikea:{L:20,R:20}, Taka:{L:20,R:20}, Vasen:{L:20,R:20} }, {on:true,w:25,dir:'sisaan'}));
  r.forEach(p => {
    const pts = [p.A2, p.B2, p.C2, p.D2];
    ok(polygonSign(pts) > 0, 'E' + si + ': ' + p.name + ' ääriviiva vastapäivään');
    p.flanges.forEach(f => {
      // ulkoreunan pisteet ovat w:n päässä reunasta ja ulkopuolella
      const P = f.poly[0], Q = f.poly[1], O1 = f.poly[3];
      const ex = Q[0]-P[0], ey = Q[1]-P[1], len = Math.sqrt(ex*ex+ey*ey);
      const d = ((O1[0]-P[0])*(-ey) + (O1[1]-P[1])*ex) / len;   // vasen normaali = sisäpuoli
      near(Math.abs(d), f.w, 1e-6, 'E' + si + ': ' + p.name + ' ' + f.kind + ' leveys oikein');
      ok(d < 0, 'E' + si + ': ' + p.name + ' ' + f.kind + ' ulkopuolella');
      near(f.len, Math.sqrt(ex*ex+ey*ey), 1e-9, 'E' + si + ': ' + p.name + ' ' + f.kind + ' pituus = reunan pituus');
    });
    // aihio kattaa kaikki pisteet
    p.flanges.forEach(f => f.poly.forEach(q => {
      ok(q[0] >= p.minX - 1e-9 && q[0] <= p.minX + p.w + 1e-9 && q[1] >= p.minY - 1e-9 && q[1] <= p.minY + p.h + 1e-9, 'E' + si + ': ' + p.name + ' aihio kattaa taitoksen');
    }));
  });
});

// ---- F) Kaikki kulmat välillä (0,180) epäkeskoisessa tapauksessa
const sF = { Wb:900, Db:600, Wt:300, Dt:200, H:450, dx:100, dy:60 };
const rF = laskeKaikki(sF, opts(allOn, { Etu:{L:20,R:20}, Oikea:{L:20,R:20}, Taka:{L:20,R:20}, Vasen:{L:20,R:20} }, {on:true,w:25,dir:'sisaan'}));
rF.forEach(p => p.flanges.forEach(f => ok(f.angle > 1 && f.angle < 179, 'F: ' + p.name + ' ' + f.kind + ' kulma ' + f.angle.toFixed(2) + ' järkevä')));

// ---- G) Paneelien vektorinormaalit osoittavat ulospäin
[sA, sC, sF].forEach((s, si) => {
  const gp = geomPaneelit(s);
  const c = vcentroid(paneelimaaritykset(s).B.concat(paneelimaaritykset(s).T));
  gp.list.forEach(P => ok(vdot(P.n, vsub(P.cen, c)) > 0, 'G' + si + ': ' + P.name + ' normaali ulospäin'));
});

// ---- H) Vanhat tarkistukset: litistys itsekonsistentti
[sA, sC, sF].forEach((s, si) => {
  laskeLevitys(s).forEach(p => {
    const d = (u,v) => Math.hypot(u[0]-v[0], u[1]-v[1]);
    near(d(p.A2,p.B2), p.a, 0.01, 'H' + si + ': ' + p.name + ' a');
    near(d(p.B2,p.C2), p.b, 0.01, 'H' + si + ': ' + p.name + ' b');
    near(d(p.C2,p.D2), p.c, 0.01, 'H' + si + ': ' + p.name + ' c');
    near(d(p.D2,p.A2), p.d, 0.01, 'H' + si + ': ' + p.name + ' d');
  });
});

// ---- I) Esiasetukset
tyyppiState = 'seina'; asetaEsiasetus();
ok(panelOn.Taka === false && panelOn.Etu && panelOn.Oikea && panelOn.Vasen, 'I: seinä: Taka pois');
tyyppiState = 'nurkka'; nurkkaSivu = 'oikea'; asetaEsiasetus();
ok(!panelOn.Taka && !panelOn.Oikea && panelOn.Etu && panelOn.Vasen, 'I: nurkka/oikea: Taka+Oikea pois');
nurkkaSivu = 'vasen'; asetaEsiasetus();
ok(!panelOn.Taka && !panelOn.Vasen && panelOn.Etu && panelOn.Oikea, 'I: nurkka/vasen: Taka+Vasen pois');
tyyppiState = 'vapaa'; asetaEsiasetus();
ok(PANEL_NAMES.every(n => panelOn[n]), 'I: vapaa: kaikki päällä');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;

// Feikki-DOM: yksi jaettu elementti kaikille id:ille
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
