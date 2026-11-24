// Lapepiipun hupun levityskuvat ja kiila (orders/piippu-levitys.js), Tomin päätökset 20.11.2026 (mockupit hupun-levitys v3 ja kiila v2).
const L = require('../../orders/piippu-levitys.js');
const PL = require('../../orders/pellit.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);

const OLETUS = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
  huptakalis: 5, saumatyyppi: 1, huppuEtuKpl: 1, huppuSivutKpl: 1, huppuTakaKpl: 1 };
const palat = v => L.hupunPalat(Object.assign({}, OLETUS, v)).palat;
const pala = (v, nimi) => palat(v).find(p => p.nimi === nimi);
const mitat = pa => L.levitaPala(pa).mitat;
const pisteet = pa => PL.aihioPisteet(L.levitaPala(pa).p).pisteet.map(q => [Math.round(q.x * 1000) / 1000, Math.round(q.y * 1000) / 1000]);

// ---- 1) Käsin laskettu etupala (sauma 1, yläreuna ulos)
const etu = pala({}, 'Huppu etu');
ok(near(mitat(etu).yla, 410) && etu.vasen.tyyppi === 't90' && etu.oikea.tyyppi === 't90', 'etu: paneeli 410 (450 − 2 × 20), saumat 20 + 20 (90° ulos)');
ok(near(mitat(etu).vasen, 1000 - 20 + 5 * 200 / 600), 'etu: todellinen korkeus 981,7 (ilman taitoksia)');
const ep = pisteet(etu);
const ODOTETTU = [[40, 0], [410, 0], [430, 20], [450, 20], [450, 1001.667], [430, 1001.667], [430, 1021.667], [20, 1021.667], [20, 1001.667], [0, 1001.667], [0, 20], [20, 20]];
ok(ep.length === 12, 'etu: 12 merkintäpistettä (saatu ' + ep.length + ')');
ok(JSON.stringify(ep) === JSON.stringify(ODOTETTU), 'etu: pisteet käsin laskettuina: alatuplan viiste 20 → alareuna 40…410, saumat 0…20 ja 430…450, yläreuna 20…430 (' + JSON.stringify(ep) + ')');
const elv = L.levitaPala(etu);
ok(Math.ceil(elv.p.w - 1e-6) === 450 && Math.ceil(elv.p.h - 1e-6) === 1022, 'etu: aihio 450 × 1022 = listan mitat');

// ---- 2) Sivupala: etupäässä 40 (20 suoraan + 20 tupla), takapäässä 20, alareuna katon kaltevuudessa
const siv = pala({}, 'Huppu sivut');
ok(siv.vasen.tyyppi === 'k40' && siv.vasen.w === 40 && siv.oikea.tyyppi === 't90', 'sivu (sauma 1): etupää 40 (kiertää), takapää 20');
ok(near(mitat(siv).yla, 610) && near(mitat(siv).vasen, 981.667, 1e-3) && near(mitat(siv).oikea, 778.333, 1e-3), 'sivu: paneeli 610, korkeus 981,7 → 778,3');
const slv = L.levitaPala(siv);
const tuplaViiva = slv.viivat.find(v => v.tupla);
ok(tuplaViiva && near(tuplaViiva.p[0], -20) && slv.viivat.some(v => v.suunta === 'ei' && near(v.p[0], 0)), 'sivu: tuplan taitosviiva 20 mm nurkasta, nurkassa ei taitosta');
const vasenSauma = slv.p.flanges[0].poly;
const saumanAla = vasenSauma.slice().sort((a, b) => a[1] - b[1]);
ok(near(saumanAla[0][1], saumanAla[1][1]), 'sivu: 40 mm sauman alapää suora (90° sivureunasta)');
ok(slv.p.w <= siv.listaLev + 1e-6 && slv.p.h <= siv.listaPit + 1e-6, 'sivu: aihio mahtuu listan mittoihin (' + slv.p.w.toFixed(1) + ' × ' + slv.p.h.toFixed(1) + ' ≤ ' + siv.listaLev + ' × ' + siv.listaPit + ')');

// ---- 3) Saumatyyppi 2 ja jaetut palat
const s2 = palat({ saumatyyppi: 2, huppuSivutKpl: 2, huppuEtuKpl: 3 });
const s2s1 = s2.find(p => p.nimi === 'Huppu sivut 1'), s2s2 = s2.find(p => p.nimi === 'Huppu sivut 2');
ok(s2s1.vasen.tyyppi === 'k40' && s2s1.oikea.tyyppi === 't90' && !s2s1.oikea.nurkka, 'sauma 2, sivut 2 osaa: pala 1 etupää 40, liitoksessa 20 (aiempi pala)');
ok(s2s2.vasen.tyyppi === 'k40' && !s2s2.vasen.nurkka && s2s2.oikea.tyyppi === 'k40', 'sauma 2, sivut 2 osaa: pala 2 liitoksessa 40 (myöhempi pala), takapää 40');
ok(near(mitat(s2s2).vasen, mitat(s2s1).oikea), 'jaettu sivu: palan 2 etukorkeus = palan 1 takakorkeus (jatkuu samassa linjassa)');
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
ok(L.levitaPala(pala({ ylaTyyppi: 'tuntematon' }, 'Huppu etu')).viivat.some(v => v.teksti.indexOf('90° ulos') >= 0 && near(v.p[1], 0) && near(v.q[1], 0)), 'tuntematon tai puuttuva yläreunan tyyppi = ulos (vanhat tilaukset)');
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
      : lv.lovet.some(l => l.length < 3 || pinta(l) <= 0) ? 'tyhjä loveus' : !(lv.mitat.yla > 0) ? 'paneeli ei positiivinen' : '';
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

// ---- 7) Suora piippu: v2 (3D-malli) antaa samat palat kuin julkaistu v1 (vertailuarvot levitys_v1_vertailu.json)
const V1 = require('./levitys_v1_vertailu.json');
let v1ero = '', v1palat = 0;
V1.tapaukset.forEach((t, i) => {
  const uudet = L.hupunPalat(t.vals).palat;
  if (uudet.length !== t.palat.length) { v1ero = v1ero || 'tapaus ' + i + ': palojen määrä ' + uudet.length + ' ≠ ' + t.palat.length; return; }
  t.palat.forEach((vanha, k) => {
    v1palat++;
    const pa = uudet[k], pp = pisteet(pa);
    if (pa.nimi !== vanha.nimi || pa.kpl !== vanha.kpl) v1ero = v1ero || 'tapaus ' + i + ': ' + pa.nimi + ' ' + pa.kpl + ' ≠ ' + vanha.nimi + ' ' + vanha.kpl;
    else if (pp.length !== vanha.pisteet.length || pp.some((q, j) => Math.abs(q[0] - vanha.pisteet[j][0]) > 0.002 || Math.abs(q[1] - vanha.pisteet[j][1]) > 0.002)) v1ero = v1ero || 'tapaus ' + i + ' ' + pa.nimi + ': merkintäpisteet eroavat';
    else if (JSON.stringify(L.taitosRivit(pa)) !== JSON.stringify(vanha.taitokset)) v1ero = v1ero || 'tapaus ' + i + ' ' + pa.nimi + ': taitostaulukko eroaa';
  });
});
ok(!v1ero && v1palat > 150, 'suora piippu: ' + v1palat + ' palaa täsmälleen kuten v1:ssä (nimet, kpl, merkintäpisteet, taitostaulukko) ' + v1ero);

// ---- 8) Kiila ja mutkapiippu
const K = v => Object.assign({}, OLETUS, { kiilaPaalla: true }, v);
const PI = require('../../orders/piippu-laskenta.js');
// Suora piippu (Tomi 20.11. illalla: ei varmuusvaraa): hupun rivit = todellinen aihio ylöspäin, muuten kuten laskeLapepiippu
const suoraKaikki = L.laskeKaikki(OLETUS), suoraKaava = PI.laskeLapepiippu(OLETUS);
const aihioRivi = (v, r) => { const pa = L.hupunPalat(v).palat.find(x => x.nimi === r.osa), lv = L.levitaPala(pa); return Object.assign({}, r, { lev: Math.ceil(lv.p.w - 1e-6), pit: Math.ceil(lv.p.h - 1e-6) }); };
ok(JSON.stringify(suoraKaikki.juuret) === JSON.stringify(suoraKaava.juuret) && suoraKaikki.kiila === false
  && JSON.stringify(suoraKaikki.muut) === JSON.stringify(suoraKaava.muut.map(r => /^Huppu/.test(r.osa) ? aihioRivi(OLETUS, r) : r)), 'suora piippu: juuret, kansi ja hattu kuten laskeLapepiippu, hupun rivit = todellinen aihio');
const sivuK = suoraKaikki.muut.find(r => r.osa === 'Huppu sivut'), sivuL = suoraKaava.muut.find(r => r.osa === 'Huppu sivut');
ok(sivuK.lev === 670 && sivuL.lev === 670 && sivuK.pit === 1015 && sivuL.pit === 1022
  && JSON.stringify(suoraKaikki.muut.filter(r => /etu|taka/.test(r.osa))) === JSON.stringify(suoraKaava.muut.filter(r => /etu|taka/.test(r.osa))),
  'suora piippu: hupun sivut 670 × 1015 (kaava 1022, ylimääräinen korkeus pois), etu ja taka ennallaan');
let suoraIsompi = 0;
for (let i = 0; i < 300; i++) {
  const v = Object.assign({}, OLETUS, { leveys: 300 + Math.round(rnd() * 600), suora: 300 + Math.round(rnd() * 900), saumatyyppi: valitse([1, 2]),
    huppuEtuKpl: valitse([1, 2, 3]), huppuSivutKpl: valitse([1, 2, 3]), huppuTakaKpl: valitse([1, 2, 3]), ylaTyyppi: valitse(['ulos', 'sisaan', 'tupla']) });
  const a = L.laskeKaikki(v).muut, b = PI.laskeLapepiippu(v).muut;
  if (a.length !== b.length || a.some((r, k) => r.osa !== b[k].osa || r.kpl !== b[k].kpl || r.lev !== b[k].lev || r.pit > b[k].pit)) suoraIsompi++;
}
ok(suoraIsompi === 0, '300 satunnaista suoraa piippua: samat rivit ja leveydet, korkeus ei koskaan kasva kaavasta');
ok(JSON.stringify(L.laskeKaikki(K({})).muut) === JSON.stringify(suoraKaikki.muut) && L.laskeKaikki(K({})).kiila === false, 'kiila päällä mutta lisämitat tyhjät = suora piippu (lista sama)');
ok(JSON.stringify(L.laskeKaikki(K({ takaLeveys: 400, vasenPituus: 600, korkeusEV: 1000, kiilaEtu: 0 })).muut) === JSON.stringify(suoraKaikki.muut), 'kiila päällä, lisämitat samat kuin suorassa = suora piippu');

// Suora mitta = oikea sivu, lisäkenttä vasenPituus = vasen sivu (Tomi 20.11. illalla). Ensimmäisen version tilaus (oikeaPituus) kuten ennen.
const mU = L.kiilaTiedot(K({ vasenPituus: 640 })).muoto, mV = L.kiilaTiedot(K({ oikeaPituus: 640 })).muoto;
ok(mU.vasen === 640 && mU.oikea === 600 && mV.vasen === 600 && mV.oikea === 640, 'sivut: vasenPituus = vasen sivu ja suora = oikea; vanha oikeaPituus lasketaan kuten ennen');

// Yläpään muoto: sivut ja suora kulma pitävät jokaisella suoran kulman valinnalla
const etaisyys = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const kulmaC = (C, i) => { const a = C[(i + 3) % 4], k = C[i], b = C[(i + 1) % 4], u = [a[0] - k[0], a[1] - k[1]], w = [b[0] - k[0], b[1] - k[1]]; return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(u[0], u[1]) / Math.hypot(w[0], w[1])) * 180 / Math.PI; };
let muotoOk = true;
[0, 1, 2, 3].forEach(sk => {
  const m = { etu: 400, oikea: 640, taka: 430, vasen: 600, suora: sk }, C = L.ylapaa(m);
  const sivut = [etaisyys(C[0], C[1]), etaisyys(C[1], C[2]), etaisyys(C[2], C[3]), etaisyys(C[3], C[0])];
  if (!C || !near(sivut[0], 400, 1e-6) || !near(sivut[1], 640, 1e-6) || !near(sivut[2], 430, 1e-6) || !near(sivut[3], 600, 1e-6) || !near(kulmaC(C, sk), 90, 1e-6)) muotoOk = false;
});
ok(muotoOk, 'yläpää: neljä sivua ja valittu suora kulma pitävät kaikilla neljällä valinnalla');
ok(L.ylapaa({ etu: 400, oikea: 600, taka: 400, vasen: 600, suora: 0 }).every((q, i) => near(Math.abs(q[0]), 200, 1e-9) && near(q[1], i < 2 ? 0 : 600, 1e-9)), 'yläpää: tavallinen piippu on suorakaide');
ok(L.ylapaa({ etu: 400, oikea: 600, taka: 2000, vasen: 600, suora: 0 }) === null && /eivät sovi yhteen/.test(L.laskeKaikki(K({ takaLeveys: 2000 })).virhe || ''), 'mahdottomat mitat: ei muotoa, selkeä virheilmoitus');

// Kiila: miinus = kapenee alaspäin, mitattu katon kohdalla sivun korkeimmasta kulmasta
const mk = L.hupunMalli(K({ kiilaVasen: -30 }));
ok(near(mk.ala[0][0] - mk.C[0][0], 30, 1e-6) && near(mk.ala[3][0] - mk.C[3][0], 30 * 800 / 1000, 1e-6), 'kiila vasen −30: etuvasen kulma 30 mm sisempänä katolla (korkein kulma), takavasen 24 mm (matalampi)');
const mkp = L.hupunMalli(K({ kiilaEtu: 20 }));
ok(near(mkp.C[0][1] - mkp.ala[0][1], 20, 1e-6), 'kiila etu +20: etuseinä levenee alaspäin 20 mm (katon kohdalla)');

// Symmetria ja nimet
const sym = L.hupunPalat(K({ kiilaEtu: 20 }));
ok(sym.symmetrinen && sym.palat.some(p => p.nimi === 'Huppu sivut' && p.kpl === 2 && p.peili), 'etukiila: sivut yhä peilikuvat, yksi rivi "Huppu sivut" 2 kpl');
const asym = L.hupunPalat(K({ kiilaVasen: -30 }));
const so = asym.palat.find(p => p.nimi === 'Huppu sivut oikea'), sv = asym.palat.find(p => p.nimi === 'Huppu sivut vasen');
ok(!asym.symmetrinen && so && sv && so.kpl === 1 && sv.kpl === 1, 'vasen kiila: sivut eri, rivit "Huppu sivut oikea" ja "Huppu sivut vasen" 1 kpl kumpikin');
const ke = asym.palat.find(p => p.nimi === 'Huppu etu');
ok(mitat(ke).ala < mitat(ke).yla - 20 && near(mitat(so).vasen, mitat(pala({}, 'Huppu sivut')).vasen, 1e-6), 'vasen kiila: hupun etupala kapenee alaspäin (' + Math.round(mitat(ke).yla) + ' → ' + Math.round(mitat(ke).ala) + '), oikea sivu ennallaan');
ok(sv.ylaKulma < 89.5 && near(so.ylaKulma, 90, 0.05), 'vasen kiila: vasemman sivun yläreunan kanttausluku muuttuu (' + sv.ylaKulma.toFixed(1) + '°), oikea 90°');
ok(L.taitosRivit(sv).some(r => /^\d+,\d°$/.test(r[2])) && L.taitosRivit(so).every(r => !/,/.test(r[2])), 'taitostaulukko: vino kulma yhdellä desimaalilla, 90° tasan ilman desimaaleja');

// Lista: hupun rivit = todellinen aihio ylöspäin, kansi ja hattu leveimmän ja pisimmän mukaan, juuret pisimmän sivun mukaan
const mv = K({ takaLeveys: 420, vasenPituus: 620, korkeusTO: 780 }), mt = L.laskeKaikki(mv), mp = L.hupunPalat(mv);
ok(mt.kiila === true && mp.palat.every(pa => { const r = mt.muut.find(x => x.osa === pa.nimi), lv = L.levitaPala(pa); return r && r.lev === Math.ceil(lv.p.w - 1e-6) && r.pit === Math.ceil(lv.p.h - 1e-6) && r.kpl === pa.kpl; }), 'mutkapiippu: hupun rivit = levityskuvan aihio ylöspäin');
const leveinKH = PI.laskeLapepiippu(Object.assign({}, OLETUS, { leveys: 420, suora: 620 })).muut.filter(r => /^(Kansi|Hattu)/.test(r.osa));
ok(JSON.stringify(mt.muut.filter(r => /^(Kansi|Hattu)/.test(r.osa))) === JSON.stringify(leveinKH), 'mutkapiippu: kansi ja hattu leveimmän (420) ja pisimmän (620) kohdan mukaan');
const as = mt.malli.alaSivut;
const juuretOdotus = PI.laskeLapepiippu(Object.assign({}, mv, { leveys: Math.max(as.etu, as.taka), suora: Math.max(as.vasen, as.oikea) })).juuret;
ok(JSON.stringify(mt.juuret) === JSON.stringify(juuretOdotus) && near(Math.max(as.etu, as.taka), 420, 1e-6), 'mutkapiippu: juuret pisimmän sivun mukaan (katon kohdalla)');
ok(/<svg/.test(L.kuvaYlhaalta(mv)) && L.kuvaYlhaalta(K({ takaLeveys: 2000 })) === '', 'kuva ylhäältä piirtyy, mahdottomilla mitoilla tyhjä');
ok(/alhaalla \d+/.test(L.palaHtml(ke)) && !/alhaalla/.test(L.palaHtml(pala({}, 'Huppu etu'))), 'kiilapalan kuvassa myös alareunan pituus, suorassa ei (kuten ennen)');

// Ominaisuustesti: satunnaiset kiila- ja mutkapiiput
let kiilaOk = true, kiilaViesti = '', kiilaPaloja = 0;
for (let i = 0; i < 200; i++) {
  const etukork = 600 + Math.round(rnd() * 1200), lev = 300 + Math.round(rnd() * 600), suo = 400 + Math.round(rnd() * 900);
  const takakork = Math.round(etukork - rnd() * Math.min(suo * 0.7, etukork - 300));
  const v = Object.assign({}, OLETUS, { leveys: lev, suora: suo, etukork, takakork, kiilaPaalla: true, saumatyyppi: valitse([1, 2]),
    huppuEtuKpl: valitse([1, 2]), huppuSivutKpl: valitse([1, 2]), huppuTakaKpl: valitse([1, 2]), ylaTyyppi: valitse(['ulos', 'sisaan', 'tupla']),
    takaLeveys: lev + valitse([-20, 0, 15]), vasenPituus: suo + valitse([-25, 0, 10]), suoraKulma: valitse([0, 1, 2, 3]),
    korkeusEV: etukork + valitse([-30, 0, 20]), korkeusTO: takakork + valitse([-20, 0, 25]),
    kiilaVasen: valitse([-30, 0, 20]), kiilaOikea: valitse([-15, 0, 25]), kiilaEtu: valitse([0, 20, -10]), kiilaTaka: valitse([0, -20]) });
  const t = L.hupunPalat(v);
  if (!t) { kiilaOk = false; kiilaViesti = 'ei muotoa ' + JSON.stringify(v); break; }
  t.palat.forEach(pa => {
    kiilaPaloja++;
    const lv = L.levitaPala(pa), r = PL.aihioPisteet(lv.p);
    const kulmat = [pa.vasen.kulma, pa.oikea.kulma, pa.ylaKulma].filter(k => k !== 180);
    const virhe = r.silmukoita !== 1 ? 'monta ääriviivaa' : !(lv.mitat.yla > 0 && lv.mitat.ala > 0) ? 'paneeli ei positiivinen'
      : kulmat.some(k => k < 75 || k > 105) ? 'outo kanttausluku ' + kulmat.map(k => k.toFixed(1)).join('/') : '';
    if (virhe && kiilaOk) { kiilaOk = false; kiilaViesti = virhe + ' ' + pa.nimi + ' ' + JSON.stringify(v); }
  });
}
ok(kiilaOk, '200 satunnaista kiila-/mutkapiippua, ' + kiilaPaloja + ' palaa: yksi ääriviiva, järkevät kanttausluvut ' + kiilaViesti);

// --- Etukuva (v8, 23.11.2026) ---
{
  const e1 = L.etukuva({ tyyppi: 'lapepiippu', leveys: 450, vasen: 150, oikea: 200, poimu: 20, harjakulma: 90, nousu: 200 });
  ok(/^<svg /.test(e1) && />450</.test(e1) && />150</.test(e1) && />200</.test(e1) && /Uraan 20 · kulma 90°/.test(e1) && /juuri nousee 200/.test(e1),
    'etukuva lapepiippu: leveys, ylitykset, uraan + kulma ja juuren nousu');
  const e2 = L.etukuva({ tyyppi: 'harjapiippu', lev1: 400, lev2: null, ylit1V: 150, ylit1O: 160, ylit2V: 250, ylit2O: 120, poimu: 30, nousu: 200 });
  const xTeksti = (svg, teksti) => { const m = svg.match(new RegExp('<text x="([\\d.]+)"[^>]*>' + teksti + '<')); return m ? Number(m[1]) : NaN; };
  ok(/>400</.test(e2) && /ETU 1 -PUOLI/.test(e2) && /ETU 2 -PUOLI/.test(e2) && /kulma 90°/.test(e2)
    && xTeksti(e2, 'vasen 250') > 200 && xTeksti(e2, 'oikea 120') < 200,
    'etukuva harjapiippu: etu 2 -puolen ylitykset yläreunassa peilikuvana (vasen oikealla), uraan kulma oletuksena 90');
  ok(L.etukuva({ leveys: 0 }) === '' && L.etukuva(null) === '', 'etukuva ilman leveyttä on tyhjä');
}

// ---- Kiilapiipun sivukuva oikeasta sivusta (vaihe 5c, 24.11.2026)
{
  const P = require('../../orders/piippu-laskenta.js');
  ok(L.kiilaSivukuva(OLETUS) === null && L.kiilaSivukuva(Object.assign({}, OLETUS, { kiilaPaalla: true })) === null, 'kiilaSivukuva: suora piippu → null (kuva kuten ennen)');
  const mut = Object.assign({}, OLETUS, { kiilaPaalla: true, korkeusEO: 1040, korkeusTO: 840 });   // oikea puoli 40 korkeampi, katto tasainen
  const ks = L.kiilaSivukuva(mut), g = P.laskeLapepiippu(Object.assign({}, OLETUS, { etukork: 1040, takakork: 840 })).geom;
  ok(ks && ks.etu === 1040 && ks.taka === 840 && Math.abs(ks.etuTod - g.hEtuTodellinen) < 1 && Math.abs(ks.takaTod - g.hTakaTodellinen) < 1,
    'kiilaSivukuva: mutka oikealla → korkeudet oikean sivun kulmista ja todelliset korkeudet oikeasta sivupalasta (' + (ks && ks.etuTod.toFixed(1)) + ' / ' + (ks && ks.takaTod.toFixed(1)) + ')');
  const kv = L.kiilaSivukuva(Object.assign({}, OLETUS, { kiilaPaalla: true, kiilaVasen: -20 }));
  ok(kv && kv.etu === 1000 && kv.taka === 800, 'kiilaSivukuva: kiila vain vasemmalla → oikean sivun korkeudet ennallaan');
}

// ---- Lapepiipun kiila: tyhjät vasemmat korkeudet katon tasosta ja kiero katto -varoitus (24.11.2026)
{
  const K = o => Object.assign({}, OLETUS, { kiilaPaalla: true }, o);
  const las = (m, kentta) => (m.lasketut.find(x => x.kentta === kentta) || {}).arvo;
  const m1 = L.hupunMalli(K({ korkeusEO: 1040 }));
  ok(Math.abs(las(m1, 'korkeusEV') - 1040) < 1e-6 && las(m1, 'korkeusTV') === undefined && m1.varoitukset.length === 1 && /^LASKETTU, EI MITATTU: etuvasen 1040 mm/.test(m1.varoitukset[0]),
    'vain etuoikea 1040: etuvasen lasketaan 1040 (katto sivusuunnassa vaaka), takavasen = takakorkeus, varoitus LASKETTU');
  const m2 = L.hupunMalli(K({ korkeusEV: 1040 }));
  ok(Math.abs(las(m2, 'korkeusTV') - 840) < 1e-6 && m2.heitto < 0.01, 'etuvasen 1040 annettu: takavasen lasketaan 840 kolmen kulman tasosta');
  const m3 = L.hupunMalli(K({ korkeusEV: 1040, korkeusTV: 800 }));
  ok(m3.lasketut.length === 0 && m3.varoitukset.length === 1 && /^Katto on kiero: kulmien korkeudet heittävät noin 40 mm/.test(m3.varoitukset[0]),
    'kaikki neljä kulmaa annettu, yksi 40 mm pielessä: varoitus kierosta katosta');
  ok(L.hupunMalli(K({ korkeusEV: 1003, korkeusTV: 800 })).varoitukset.length === 0, 'pieni heitto (3 mm): ei varoitusta');
  const m4 = L.hupunMalli(K({ vasenPituus: 580 }));
  ok(Math.abs(las(m4, 'korkeusTV') - (800 + 20 * 200 / 600)) < 0.01 && m4.heitto < 0.01,
    'vasen sivu 20 lyhyempi: takavasen lasketaan ' + (las(m4, 'korkeusTV') || 0).toFixed(1) + ' (lähempänä etureunaa → kauempana katosta)');
  ok(L.hupunMalli(K({ kiilaOikea: -20 })).varoitukset.length === 0, 'kiila ilman korkeuksia: ei varoituksia');
  ok(L.laskeKaikki(K({ korkeusEO: 1040 })).varoitukset.length === 1, 'laskeKaikki palauttaa varoitukset');
}

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
