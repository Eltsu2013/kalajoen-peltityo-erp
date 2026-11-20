// Levityksen perustarkistukset. Ennen vaihetta 1 tässä oli oma kopio funktioista, nyt testataan oikeaa tiedostoa.
const { computeCorners, flattenSide, laskeLevitys } = require('../../orders/pellit.js');

function approx(a,b,eps){ eps=eps||0.05; return Math.abs(a-b)<eps; }
function fail(m){ console.error('FAIL: '+m); process.exitCode=1; }
function pass(m){ console.log('ok: '+m); }

// Testi 1: keskitetty symmetrinen, vertaa Node-prototyyppiin
const panels1 = laskeLevitys({Wb:800,Db:500,Wt:400,Dt:250,H:500,dx:0,dy:0});
panels1.forEach(p=>{
  console.log(p.name, 'a=',p.a.toFixed(1),'b=',p.b.toFixed(1),'c=',p.c.toFixed(1),'d=',p.d.toFixed(1));
});
const etu = panels1.find(p=>p.name==='Etu');
const taka = panels1.find(p=>p.name==='Taka');
if (!approx(etu.b, 552.8, 0.5)) fail('Etu b odotettu ~552.8, saatu '+etu.b); else pass('Etu b oikein');
if (!approx(etu.b, etu.d, 0.01)) fail('Etu ei symmetrinen'); else pass('Etu symmetrinen');
if (!approx(etu.b, taka.b, 0.01)) fail('Etu != Taka'); else pass('Etu == Taka (keskitetty)');

// Tarkista litistyksen sisäinen johdonmukaisuus kaikille paneeleille
panels1.forEach(p=>{
  const dAB = Math.hypot(p.B2[0]-p.A2[0], p.B2[1]-p.A2[1]);
  const dBC = Math.hypot(p.C2[0]-p.B2[0], p.C2[1]-p.B2[1]);
  const dCD = Math.hypot(p.D2[0]-p.C2[0], p.D2[1]-p.C2[1]);
  const dDA = Math.hypot(p.A2[0]-p.D2[0], p.A2[1]-p.D2[1]);
  const ok = approx(dAB,p.a) && approx(dBC,p.b) && approx(dCD,p.c) && approx(dDA,p.d);
  if (!ok) fail(p.name+' litistys ei täsmää: '+JSON.stringify({dAB,dBC,dCD,dDA,p}));
  else pass(p.name+' litistys täsmää');
});

// Testi 2: seinäkiinnitteinen (dy pinnattu) - Taka-paneelin ylä- ja alareunan syvyys sama
const Db=500, Dt=250;
const dyWall = (Db-Dt)/2;
const panels2 = laskeLevitys({Wb:800,Db,Wt:400,Dt,H:500,dx:0,dy:dyWall});
// Takareunan sivujen (b,d Taka-paneelissa) pitäisi olla erilaiset etu/taka koska pystysuora takareuna -> taka on pystysuora pelti.
const taka2 = panels2.find(p=>p.name==='Taka');
console.log('Taka (seina) a,b,c,d:', taka2.a.toFixed(1), taka2.b.toFixed(1), taka2.c.toFixed(1), taka2.d.toFixed(1));
// Seinämallissa Taka on pystysuora puolisuunnikas: alareuna 800, yläreuna 400, korkeus 500.
// Sivureunat ovat vinot (vaakasiirtymä (800-400)/2 = 200), joten sivun pituus = hypot(200, 500) = 538,5.
// (Korjattu 20.10.2026: aiempi odotusarvo 500 oli väärä, koska Taka ei ole suorakaide.)
const odotettuSivu = Math.hypot((800 - 400) / 2, 500);
if (!approx(taka2.a, 800, 0.01)) fail('Taka (seina) a odotettu 800, saatu '+taka2.a); else pass('Taka (seina) a=800');
if (!approx(taka2.c, 400, 0.01)) fail('Taka (seina) c odotettu 400, saatu '+taka2.c); else pass('Taka (seina) c=400');
if (!approx(taka2.b, odotettuSivu, 0.01)) fail('Taka (seina) b odotettu '+odotettuSivu.toFixed(1)+', saatu '+taka2.b);
else pass('Taka (seina) b = hypot(200,500) = '+odotettuSivu.toFixed(1));
if (!approx(taka2.d, odotettuSivu, 0.01)) fail('Taka (seina) d odotettu '+odotettuSivu.toFixed(1)+', saatu '+taka2.d);
else pass('Taka (seina) d = '+odotettuSivu.toFixed(1));

if (process.exitCode) { console.log('TESTEISSÄ VIRHEITÄ'); } else { console.log('KAIKKI TESTIT OK'); }
