// test_paat.js — sivutaitosten päät leikataan vaakaan (v10, 20.10.2026)
// Tarkistaa 3D:ssä: kun taitos on käännetty paikalleen, sen ala- ja yläpään ulkopiste on samalla korkeudella
// kuin reunan päätepiste (= pää on vaakasuora, tasan huuvan ala- ja yläreunan tasossa).
const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function near(a, b, t, m) { ok(Math.abs(a-b) <= t, m + ' (saatu ' + (typeof a==='number'?a.toFixed(3):a) + ', odotettu ' + b + ')'); }
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const polyArea = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const q = poly[(i+1) % poly.length]; a += poly[i][0]*q[1] - q[0]*poly[i][1]; } return Math.abs(a) / 2; };
const bt0 = { type: all('ei'), floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:{}, loveus:true };
const find = (a, n) => a.find(p => p.name === n);

// Samat oletukset kuin asetaEsiasetus: sivupaneeleilla 20 mm, seinää vasten 30 mm
function sideWFor(panelOn) {
  const sw = {};
  PANEL_NAMES.forEach((n, i) => {
    const isSide = (n === 'Oikea' || n === 'Vasen');
    const leftN = PANEL_NAMES[(i + 3) % 4], rightN = PANEL_NAMES[(i + 1) % 4];
    let L = isSide ? 20 : 0, R = isSide ? 20 : 0;
    if (!panelOn[leftN]) L = 30;
    if (!panelOn[rightN]) R = 30;
    sw[n] = { L, R };
  });
  return sw;
}
const opts = (panelOn, sideDir) => ({ panelOn, sideW: sideWFor(panelOn), sideDir: sideDir || {}, top: { type: all('ei'), w: 0, loveus: true }, bottom: bt0 });

// Varsinainen tarkistus yhdelle huuvalle
function tarkista(nimi, s, panelOn, sideDir) {
  const r = laskeKaikki(s, opts(panelOn, sideDir));
  const gp = geomPaneelit(s);
  let n = 0;
  r.forEach(p => {
    const P = gp.list[PANEL_NAMES.indexOf(p.name)];
    p.flanges.filter(f => f.kind === 'left' || f.kind === 'right').forEach(f => {
      const E1 = f.kind === 'left' ? P.Dc : P.Bc;     // reunan alku (vastaa litteän taitoksen P2-päätä)
      const E2 = f.kind === 'left' ? P.A  : P.Cc;     // reunan loppu (Q2-pää)
      const ux = (f.poly[1][0] - f.poly[0][0]) / f.len, uy = (f.poly[1][1] - f.poly[0][1]) / f.len;
      // ulkopisteen siirtymä reunan suuntaan, luettuna suoraan litteästä muodosta
      const siirtoLuettu = idx => {
        const base = idx === 3 ? f.poly[0] : f.poly[1];
        const ilmanSiirtoa = [base[0] + f.w * f.nx, base[1] + f.w * f.ny];
        return (f.poly[idx][0] - ilmanSiirtoa[0]) * ux + (f.poly[idx][1] - ilmanSiirtoa[1]) * uy;
      };
      const p1 = vadd(vadd(E1, vscale(f.e, siirtoLuettu(3))), vscale(f.dF, f.w));
      const p2 = vadd(vadd(E2, vscale(f.e, siirtoLuettu(2))), vscale(f.dF, f.w));
      const t = nimi + ' ' + p.name + ' ' + f.kind + ' (' + f.w + ' mm)';
      near(p1[2], E1[2], 1e-6, t + ': ensimmäinen pää vaakasuora');
      near(p2[2], E2[2], 1e-6, t + ': toinen pää vaakasuora');
      near(Math.abs(vdot(f.dF, f.e)), 0, 1e-9, t + ': taitoksen suunta kohtisuorassa reunaan');
      near(siirtoLuettu(3), siirtoLuettu(2), 1e-9, t + ': päät samansuuntaiset (suunnikas)');
      near(polyArea(f.poly), f.w * f.len, 1e-6, t + ': pinta-ala = leveys × reunan pituus');
      n++;
    });
  });
  ok(n > 0, nimi + ': taitoksia tarkistettu (' + n + ' kpl)');
  return r;
}

const on4 = { Etu:true, Oikea:true, Taka:true, Vasen:true };
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };

// ---- 1. Esimerkkihuuva: käsin lasketut luvut (vastaavat piirrosta)
const rA = tarkista('keskitetty', sA, on4);
const oA = find(rA, 'Oikea');
const lf = oA.flanges.find(f => f.kind === 'left');
const rf = oA.flanges.find(f => f.kind === 'right');
near(lf.siirto, -7.761, 0.002, '1: vasen taitos siirto -7,761 mm (alapää lyhenee, yläpää pitenee)');
near(lf.poly[2][0], -17.73, 0.02, '1: vasen taitos alapää ulkopiste x'); near(lf.poly[2][1], 12.08, 0.02, '1: vasen taitos alapää ulkopiste y');
near(lf.poly[3][0], 107.27, 0.02, '1: vasen taitos yläpää ulkopiste x'); near(lf.poly[3][1], 550.60, 0.02, '1: vasen taitos yläpää ulkopiste y');
near(rf.poly[3][0], 517.73, 0.02, '1: oikea taitos alapää ulkopiste x'); near(rf.poly[3][1], 12.08, 0.02, '1: oikea taitos alapää ulkopiste y');
near(rf.poly[2][0], 392.73, 0.02, '1: oikea taitos yläpää ulkopiste x'); near(rf.poly[2][1], 550.60, 0.02, '1: oikea taitos yläpää ulkopiste y');
near(polyArea(lf.poly), 20 * 552.834, 0.05, '1: pinta-ala sama kuin suorakulmiolla (20 × 552,83)');
// Etu ja Taka eivät saa sivutaitoksia, joten niiden muoto ei muutu
ok(find(rA, 'Etu').flanges.filter(f => f.kind === 'left' || f.kind === 'right').length === 0, '1: Etulla ei sivutaitoksia (oletus 0 mm)');

// ---- 2. Epäkeskoinen
tarkista('epäkeskoinen', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:60, dy:40 }, on4);

// ---- 3. Seinää vasten (Taka pois), seinätaitos ulos ja sisään (piilossa)
const onSeina = { Etu:true, Oikea:true, Taka:false, Vasen:true };
const sSeina = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 };
tarkista('seinä/ulos', sSeina, onSeina);
tarkista('seinä/sisään', sSeina, onSeina, all({ L:'sisaan', R:'sisaan' }));
tarkista('seinä, epäkeskoinen kanava', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:80, dy:125 }, onSeina);

// ---- 4. Nurkkaan (Taka + Oikea pois)
const onNurkka = { Etu:true, Oikea:false, Taka:false, Vasen:true };
tarkista('nurkka/ulos', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:200, dy:125 }, onNurkka);
tarkista('nurkka/sisään', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:200, dy:125 }, onNurkka, all({ L:'sisaan', R:'sisaan' }));

// ---- 5. Suora laatikko: reuna pystysuora, ei siirtoa, taitos pysyy suorakulmiona
const sB = { Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 };
const rB = tarkista('laatikko', sB, on4);
rB.forEach(p => p.flanges.filter(f => f.kind === 'left' || f.kind === 'right').forEach(f => {
  near(f.siirto, 0, 1e-9, '5: laatikko ' + p.name + ' ' + f.kind + ': ei siirtoa');
}));

// ---- 6. Huuva joka levenee ylöspäin (yläreuna isompi): siirto vaihtaa merkkiä, vaakaleikkaus pätee silti
tarkista('levenevä', { Wb:400, Db:250, Wt:800, Dt:500, H:500, dx:0, dy:0 }, on4);

// ---- 7. Työkortissa maininta
const rS = laskeKaikki(sA, opts(on4));
const kortit = rakennaTyokortit(sA, ryhmitteleSamat(rS), 'T', 'V');
ok(kortit.indexOf('päät leikattu vaakaan') >= 0, '7: työkortissa maininta päiden vaakaleikkauksesta');

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '',
  classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
