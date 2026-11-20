// Lapepiipun hupun levityskuvat (orders/piippu-levitys.js), Tomin päätökset 20.11.2026 (mockup v3).
const L = require('../../orders/piippu-levitys.js');
const PL = require('../../orders/pellit.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);

const OLETUS = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
  huptakalis: 5, saumatyyppi: 1, huppuEtuKpl: 1, huppuSivutKpl: 1, huppuTakaKpl: 1 };
const palat = v => L.hupunPalat(Object.assign({}, OLETUS, v)).palat;
const pala = (v, nimi) => palat(v).find(p => p.nimi === nimi);
const pisteet = pa => PL.aihioPisteet(L.levitaPala(pa).p).pisteet.map(q => [Math.round(q.x * 1000) / 1000, Math.round(q.y * 1000) / 1000]);

// ---- 1) Käsin laskettu etupala (sauma 1, yläreuna ulos)
const etu = pala({}, 'Huppu etu');
ok(etu.P === 410 && etu.vasen.tyyppi === 't90' && etu.oikea.tyyppi === 't90', 'etu: paneeli 410 (450 − 2 × 20), saumat 20 + 20 (90° ulos)');
ok(near(etu.hV, 1000 - 20 + 5 * 200 / 600), 'etu: todellinen korkeus 981,7 (ilman taitoksia)');
const ep = pisteet(etu);
const ODOTETTU = [[40, 0], [410, 0], [430, 20], [450, 20], [450, 1001.667], [430, 1001.667], [430, 1021.667], [20, 1021.667], [20, 1001.667], [0, 1001.667], [0, 20], [20, 20]];
ok(ep.length === 12, 'etu: 12 merkintäpistettä (saatu ' + ep.length + ')');
ok(JSON.stringify(ep) === JSON.stringify(ODOTETTU), 'etu: pisteet käsin laskettuina: alatuplan viiste 20 → alareuna 40…410, saumat 0…20 ja 430…450, yläreuna 20…430 (' + JSON.stringify(ep) + ')');
const elv = L.levitaPala(etu);
ok(Math.ceil(elv.p.w - 1e-6) === 450 && Math.ceil(elv.p.h - 1e-6) === 1022, 'etu: aihio 450 × 1022 = listan mitat');

// ---- 2) Sivupala: etupäässä 40 (20 suoraan + 20 tupla), takapäässä 20, alareuna katon kaltevuudessa
const siv = pala({}, 'Huppu sivut');
ok(siv.vasen.tyyppi === 'k40' && siv.vasen.w === 40 && siv.oikea.tyyppi === 't90', 'sivu (sauma 1): etupää 40 (kiertää), takapää 20');
ok(siv.P === 610 && near(siv.hV, 981.667, 1e-3) && near(siv.hO, 778.333, 1e-3), 'sivu: paneeli 610, korkeus 981,7 → 778,3');
const slv = L.levitaPala(siv);
const tuplaViiva = slv.viivat.find(v => v.tupla);
ok(tuplaViiva && near(tuplaViiva.p[0], -20) && slv.viivat.some(v => v.suunta === 'ei' && near(v.p[0], 0)), 'sivu: tuplan taitosviiva 20 mm nurkasta, nurkassa ei taitosta');
const vasenSauma = slv.p.flanges[0].poly;
ok(near(vasenSauma[2][1], vasenSauma[3][1]), 'sivu: 40 mm sauman alapää suora (90° sivureunasta)');
ok(slv.p.w <= siv.listaLev + 1e-6 && slv.p.h <= siv.listaPit + 1e-6, 'sivu: aihio mahtuu listan mittoihin (' + slv.p.w.toFixed(1) + ' × ' + slv.p.h.toFixed(1) + ' ≤ ' + siv.listaLev + ' × ' + siv.listaPit + ')');

// ---- 3) Saumatyyppi 2 ja jaetut palat
const s2 = palat({ saumatyyppi: 2, huppuSivutKpl: 2, huppuEtuKpl: 3 });
const s2s1 = s2.find(p => p.nimi === 'Huppu sivut 1'), s2s2 = s2.find(p => p.nimi === 'Huppu sivut 2');
ok(s2s1.vasen.tyyppi === 'k40' && s2s1.oikea.tyyppi === 't90' && !s2s1.oikea.nurkka, 'sauma 2, sivut 2 osaa: pala 1 etupää 40, liitoksessa 20 (aiempi pala)');
ok(s2s2.vasen.tyyppi === 'k40' && !s2s2.vasen.nurkka && s2s2.oikea.tyyppi === 'k40', 'sauma 2, sivut 2 osaa: pala 2 liitoksessa 40 (myöhempi pala), takapää 40');
ok(near(s2s2.hV, s2s1.hO), 'jaettu sivu: palan 2 etukorkeus = palan 1 takakorkeus (jatkuu samassa linjassa)');
const e3 = s2.filter(p => p.nimi.startsWith('Huppu etu'));
ok(e3.length === 3 && e3[0].oikea.tyyppi === 't90' && e3[1].vasen.tyyppi === 'k40' && e3[2].oikea.nurkka, 'etu 3 osaa: liitoksissa aiempi pala 20 ja myöhempi 40');
ok(palat({ saumatyyppi: 2 }).find(p => p.nimi === 'Huppu taka').vasen.tyyppi === 't90', 'sauma 2: taka 20 + 20 kuten etu');
ok(palat({}).find(p => p.nimi === 'Huppu taka').vasen.tyyppi === 'k40', 'sauma 1: taka 40 + 40');

// ---- 4) Yläreunan taitos ja tuplien viisteet
const viistePituus = (lv, kind) => lv.p.flanges.filter(f => f.poly.length).map(f => f.poly);
const yla = tyyppi => L.levitaPala(pala({ ylaTyyppi: tyyppi }, 'Huppu etu'));
const ylaPoly = lv => lv.p.flanges.find(f => f.poly.some(q => q[1] > 1e-6) && f.poly.every(q => q[1] >= -1e-6)).poly;
const ylin = poly => { const ym = Math.max.apply(null, poly.map(q => q[1])); const xs = poly.filter(q => near(q[1], ym)).map(q => q[0]); return Math.max.apply(null, xs) - Math.min.apply(null, xs); };
ok(near(ylin(ylaPoly(yla('ulos'))), 410), 'yläreuna ulos: taitos koko paneelin levyinen (410), suorat päät');
ok(near(ylin(ylaPoly(yla('sisaan'))), 410 - 2 * 20), 'yläreuna sisään: päät 45° nurkissa (ulkoreuna 410 − 2 × 20)');
ok(near(ylin(ylaPoly(yla('tupla'))), 410 - 2 * 20), 'yläreuna tupla: päät viistetty 45° koko leveydeltä');
ok(L.levitaPala(pala({ ylaTyyppi: 'tuntematon' }, 'Huppu etu')).viivat.some(v => v.teksti.indexOf('90° ulos') >= 0 && v.p[1] === 0 && v.q[1] === 0), 'tuntematon tai puuttuva yläreunan tyyppi = ulos (vanhat tilaukset)');
const alaRivi = L.taitosRivit(etu).find(r => r[0] === 'Alareuna');
ok(alaRivi && alaRivi[2] === '180°' && alaRivi[3] === 'sisään' && /viistetty 45°/.test(alaRivi[4]), 'taitostaulukko: alatupla 180° sisään, päät viistetty 45°');

// ---- 5) Ominaisuustestit satunnaisilla piipuilla: yksi ääriviiva, aihio listan mitoissa, loveukset järkeviä
let siemen = 7;
const rnd = () => { siemen = (siemen * 1103515245 + 12345) % 2147483648; return siemen / 2147483648; };
const valitse = a => a[Math.floor(rnd() * a.length)];
let ominaisuusOk = true, tapauksia = 0, viesti = '';
for (let i = 0; i < 300; i++) {
  const etukork = 500 + Math.round(rnd() * 1300);
  const v = { leveys: 250 + Math.round(rnd() * 900), suora: 300 + Math.round(rnd() * 1100), etukork, takakork: Math.round(etukork * (0.35 + rnd() * 0.65)),
    sauma: valitse([15, 20, 25]), huplis: valitse([0, 5, 10, 20]), ylareunaV: valitse([10, 20, 40]), alatupla: valitse([0, 15, 20]), vahennys: valitse([0, 10, 20]),
    huptakalis: valitse([0, 5, 10]), saumatyyppi: valitse([1, 2]), huppuEtuKpl: valitse([1, 2, 3]), huppuSivutKpl: valitse([1, 2, 3]), huppuTakaKpl: valitse([1, 2, 3]),
    ylaTyyppi: valitse(['ulos', 'sisaan', 'tupla']) };
  L.hupunPalat(v).palat.forEach(pa => {
    tapauksia++;
    const lv = L.levitaPala(pa), r = PL.aihioPisteet(lv.p);
    const pinta = poly => { let a = 0; poly.forEach((q, k) => { const n = poly[(k + 1) % poly.length]; a += q[0] * n[1] - n[0] * q[1]; }); return Math.abs(a) / 2; };
    const virhe = r.silmukoita !== 1 ? 'monta ääriviivaa' : lv.p.w > pa.listaLev + 1e-6 ? 'aihio leveämpi kuin listassa' : lv.p.h > pa.listaPit + 1e-6 ? 'aihio korkeampi kuin listassa'
      : lv.lovet.some(l => l.length < 3 || pinta(l) <= 0) ? 'tyhjä loveus' : !(pa.P > 0) ? 'paneeli ei positiivinen' : '';
    if (virhe && ominaisuusOk) { ominaisuusOk = false; viesti = virhe + ' ' + pa.nimi + ' ' + JSON.stringify(v); }
  });
}
ok(ominaisuusOk, '300 satunnaista piippua, ' + tapauksia + ' palaa: yksi ääriviiva, aihio listan mitoissa, loveukset ei tyhjiä ' + viesti);

// ---- 6) HTML-kortti
const html = L.palaHtml(siv);
ok(/<details class="plv-pala"/.test(html) && !/<details class="plv-pala" open/.test(html), 'palan kortti on oletuksena kiinni');
ok((html.match(/Kulmien lähikuvat/g) || []).length === 1 && /Merkintäpisteet \(\d+ pistettä/.test(html), 'kortissa lähikuvat ja merkintäpisteet napin takana');
ok((L.palaHtml(etu).match(/(vasen|oikea) (ala|ylä)kulma</g) || []).length === 2 && (html.match(/(vasen|oikea) (ala|ylä)kulma</g) || []).length === 4, 'symmetrisestä etupalasta 2 lähikuvaa, vinosta sivusta 4');
const idt = (L.palaHtml(etu) + L.palaHtml(etu)).match(/id="(plv\d+[rc])"/g);
ok(new Set(idt).size === idt.length, 'SVG-tunnisteet yksilöllisiä, vaikka samaa palaa piirretään monta kertaa');

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
