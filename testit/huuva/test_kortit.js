// test_kortit.js — avattavat kortit ja yhteenveto-rivit (v16, 21.10.2026)
const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }

// ---------- 1. HTML-rakenne: jokaisella kortilla id, yhteenveto-kenttä ja sulkeva tagi
(function () {
  const H = HTML_TEKSTI;
  const avaus = (H.match(/<details /g) || []).length, sulku = (H.match(/<\\/details>/g) || []).length;
  ok(avaus === 9 && sulku === 9, '1a: yhdeksän korttia, avaavia ja sulkevia tageja yhtä paljon (' + avaus + '/' + sulku + ')');
  const idt = (H.match(/<details id="(k-[a-z]+)" data-kortti/g) || []).map(x => x.match(/id="([^"]+)"/)[1]);
  ok(new Set(idt).size === 9, '1b: kortti-id:t ovat yksilölliset: ' + idt.join(','));
  ok(idt.every(id => H.indexOf('id="ky-' + id.slice(2) + '"') >= 0), '1c: jokaisella kortilla on yhteenveto-kenttä');
  ok(['in-wb','in-h','in-huuvia','fl-table','yt-table','rt-table','kaista-sisalto','merkinta-sisalto','svg-levitys','svg-hahmotelma','in-paksuus'].every(id => H.indexOf('id="' + id + '"') >= 0), '1d: syöttökentät ja tulosalueet ovat yhä sivulla (ei hävinnyt korttien sisään)');
  ok(H.indexOf('<summary') >= 0 && (H.match(/<summary>/g) || []).length === 9, '1e: yhdeksän summary-riviä');
})();

// ---------- 2. Oletustila: työpöydällä pitkät tuloskortit kiinni, puhelimella vain tulokset auki
(function () {
  ['k-perus','k-paneelit','k-sivut','k-yla','k-ala','k-hahmo','k-levitys'].forEach(id => ok(korttiOletusAuki(id, false) === true, '2a: työpöydällä auki: ' + id));
  ['k-merkinta','k-kaista'].forEach(id => ok(korttiOletusAuki(id, false) === false, '2a: työpöydällä kiinni: ' + id));
  ['k-perus','k-paneelit','k-sivut','k-yla','k-ala','k-hahmo'].forEach(id => ok(korttiOletusAuki(id, true) === false, '2b: puhelimella kiinni: ' + id));
  ['k-levitys','k-merkinta','k-kaista'].forEach(id => ok(korttiOletusAuki(id, true) === true, '2b: puhelimella auki: ' + id));
})();

// ---------- 3. Tallennus: puuttuva tai rikkinäinen localStorage ei kaada mitään
(function () {
  ok(typeof localStorage === 'undefined', '3a: testiympäristössä ei ole localStorage-oliota');
  ok(JSON.stringify(korttiTilaLue()) === '{}', '3a: lukeminen palauttaa tyhjän tilan eikä heitä virhettä');
  let heitti = false; try { korttiTilaKirjoita({ 'k-perus': false }); } catch (e) { heitti = true; }
  ok(!heitti, '3b: kirjoitus ilman localStoragea ei heitä virhettä');
  const muisti = {};
  global.localStorage = { getItem: k => (k in muisti ? muisti[k] : null), setItem: (k, v) => { muisti[k] = v; } };
  korttiTilaKirjoita({ 'k-perus': false, 'k-kaista': true });
  const luettu = korttiTilaLue();
  ok(luettu['k-perus'] === false && luettu['k-kaista'] === true, '3c: tallennettu tila luetaan takaisin');
  muisti['huuva_kortit_v1'] = 'roskaa{{';
  ok(JSON.stringify(korttiTilaLue()) === '{}', '3d: rikkinäinen tallenne ei kaada, tila palautuu tyhjäksi');
  global.localStorage = { getItem() { throw new Error('estetty'); }, setItem() { throw new Error('estetty'); } };
  let h2 = false; try { korttiTilaLue(); korttiTilaKirjoita({}); } catch (e) { h2 = true; }
  ok(!h2, '3e: selain joka heittää virheen (yksityinen ikkuna) ei kaada korttien toimintaa');
  delete global.localStorage;
})();

// ---------- 4. Yhteenveto-rivit: sisältö oikeilla luvuilla
(function () {
  const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
  const all = x => ({ Etu:x, Oikea:x, Taka:x, Vasen:x });
  const oA = { panelOn: all(true), sideW: { Etu:{L:0,R:0}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:20,R:20} }, sideDir: {}, top: { type: all('sisaan'), w: 20, loveus: true },
    bottom: { type: all('kouru'), floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa: all(0), loveus:true } };
  const pl = kerroHuuvat(ryhmitteleSamat(laskeKaikki(sA, oA)), 1);
  const kr = laskeKaistat(pl, { tila: 'lomitus', rulla: 1250 });
  const t = korttiYhteenvedot(sA, pl, kr, oA);
  ok(t.perus.indexOf('alhaalla 800×500') >= 0 && t.perus.indexOf('ylhäällä 400×250') >= 0 && t.perus.indexOf('korkeus 500') >= 0, '4a: perusmitat yhteenvedossa: ' + t.perus);
  ok(t.perus.indexOf('siirtymä') < 0 && t.perus.indexOf(' kpl') < 0, '4b: ei siirtymää eikä kappalemäärää kun 0 / 1 huuva');
  ok(korttiYhteenvedot(Object.assign({}, sA, { dx: 30, dy: 10 }), pl, kr, oA).perus.indexOf('siirtymä 30/10') >= 0, '4c: siirtymä näkyy kun se on nollasta poikkeava');
  ok(korttiYhteenvedot(null, [], null).perus === 'Syötä kaikki mitat', '4d: virheellisillä mitoilla yhteenveto kehottaa syöttämään mitat');
  ok(t.levitys.indexOf('Etu + Taka') >= 0 && t.levitys.indexOf('Oikea + Vasen') >= 0, '4e: levityskuvan yhteenveto listaa palaryhmät: ' + t.levitys);
  ok(/Etu \\+ Taka 10 pistettä/.test(t.merkinta) && /Oikea \\+ Vasen 14 pistettä/.test(t.merkinta), '4f: merkintäpisteiden määrät (10 ja 14)');
  ok(t.kaista.indexOf('lomitettu') === 0 && t.kaista.indexOf('2 kaistaa') >= 0 && t.kaista.indexOf('rullaa kuluu ' + Math.round(kr.pituus) + ' mm') >= 0, '4g: kaistayhteenveto: ' + t.kaista);
  ok(t.paneelit === 'Etu, Oikea, Taka, Vasen', '4h: paneelit listattu');
  ok(t.sivut === 'Oikea 20/20 · Vasen 20/20', '4i: sivutaitokset vain nollasta poikkeavat (testin oletuksilla): ' + t.sivut);
  ok(t.yla.indexOf('sisään') >= 0 && t.yla.indexOf('20 mm') >= 0, '4j: yläreunan taitos: ' + t.yla);
  ok(t.ala.indexOf('Kouru') === 0, '4k: alareuna: ' + t.ala);
  const oV = JSON.parse(JSON.stringify(oA)); oV.top.type.Etu = 'ei'; oV.bottom.type.Taka = 'sisaan'; oV.panelOn.Vasen = false;
  const tv = korttiYhteenvedot(sA, pl, kr, oV);
  ok(tv.yla.indexOf('vaihtelee') === 0 && tv.ala === 'vaihtelee paneeleittain', '4m: eri tyypit eri paneeleilla -> vaihtelee paneeleittain');
  ok(tv.paneelit === 'Etu, Oikea, Taka' && tv.sivut === 'Oikea 20/20', '4n: pois kytketty paneeli ei näy yhteenvedossa');
  const oE = JSON.parse(JSON.stringify(oA)); PANEL_NAMES.forEach(n => { oE.top.type[n] = 'ei'; oE.panelOn[n] = n === 'Etu'; });
  ok(korttiYhteenvedot(sA, pl, kr, oE).yla === 'ei taitosta', '4o: ei yläreunan taitosta');
  ok(korttiYhteenvedot(sA, pl, kr, Object.assign({}, oA, { panelOn: all(false) })).paneelit === 'ei yhtään paneelia', '4p: ei paneeleita -> ei yhtään paneelia');
  ok(Object.keys(t).length === 9 && Object.keys(t).every(k => HTML_TEKSTI.indexOf('id="ky-' + k + '"') >= 0), '4l: jokaiselle yhteenvetoavaimelle löytyy kenttä sivulta');
})();
if (fails) process.exitCode = 1;
console.log(fails === 0 ? 'KAIKKI TESTIT OK' : fails + ' TESTIÄ EPÄONNISTUI');
`.replace('HTML_TEKSTI', 'HTML_TEKSTI');
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '', classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
global.HTML_TEKSTI = html;
eval(script + '\n' + testCode);
