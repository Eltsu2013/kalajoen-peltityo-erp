// Lähetys tilaukseen (orders/lahetys.js), vaihe T1 25.11.2026.
// Tässä testataan selaimesta riippumaton logiikka: odottavat lähetykset, vastaanottajan valinta, huomion yhdistäminen
// ja tilauslistan haku. Välilehtien välinen viestintä tarkistetaan selaimessa (Playwright, kaksi välilehteä).
const L = require('../../orders/lahetys.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }

function muisti() {
  const d = {};
  return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, _d: d };
}
const piippu = (groupId, n) => ({ type: 'REPLACE_PIIPPU', groupId, groupName: 'Lapepiippu 400×450 RR33', items: Array.from({ length: n || 3 }, (_, i) => ({ nimike: 'osa ' + i })) });

// ---- 1) Odottava jää talteen ja poistuu vasta pyydettäessä
(function () {
  const s = muisti();
  ok(L.lue(s).length === 0, '1a: tyhjä muisti → ei odottavia');
  const l = L.lisaaOdottava(s, L.luoLahetys(piippu('g1'), { kuvaus: 'Lapepiippu', huomio: '  ruskea pelti  ', lahde: 'piippu' }));
  ok(L.lue(s).length === 1 && L.haeOdottava(s, l.id).viesti.groupId === 'g1', '1b: lähetys tallessa groupId:n kanssa');
  ok(l.huomio === 'ruskea pelti' && l.ryhma === 'g1' && l.kohdeTilaus === null && /^l_/.test(l.id), '1c: huomio siistitty, ryhmä talteen, ei kohdetilausta');
  ok(L.poistaOdottava(s, l.id) === true && L.lue(s).length === 0, '1d: poisto tyhjentää');
  ok(L.poistaOdottava(s, l.id) === false, '1e: toinen poisto ei tee mitään (kaksi välilehteä ei kaada)');
  s.setItem(L.AVAIMET.ODOTTAVAT, 'rikki{');
  ok(Array.isArray(L.lue(s)) && L.lue(s).length === 0, '1f: rikkinäinen tallenne → tyhjä lista, ei kaadu');
})();

// ---- 2) Saman piipun uusi lähetys korvaa vanhan odottavan, eri piiput rinnakkain
(function () {
  const s = muisti();
  L.lisaaOdottava(s, L.luoLahetys(piippu('g1'), { kuvaus: 'eka' }));
  L.lisaaOdottava(s, L.luoLahetys(piippu('g2'), { kuvaus: 'toka' }));
  const uusi = L.lisaaOdottava(s, L.luoLahetys(piippu('g1', 5), { kuvaus: 'eka korjattu' }));
  const lista = L.lue(s);
  ok(lista.length === 2, '2a: kaksi odottavaa (g1 korvattiin, g2 jäi)');
  ok(lista.some(x => x.id === uusi.id && x.kuvaus === 'eka korjattu' && x.viesti.items.length === 5) && !lista.some(x => x.kuvaus === 'eka'), '2b: g1:stä vain uusin versio');
  const ilmanRyhmaa = L.luoLahetys({ type: 'ADD_TO_ORDER' }, {});
  L.lisaaOdottava(s, ilmanRyhmaa); L.lisaaOdottava(s, L.luoLahetys({ type: 'ADD_TO_ORDER' }, {}));
  ok(L.lue(s).length === 4, '2c: ilman ryhmää olevat eivät korvaa toisiaan');
  const pelti = () => ({ type: 'ADD_TO_ORDER', groupId: 'gX', nimike: 'Räystäspelti' });
  const s2 = muisti();
  L.lisaaOdottava(s2, L.luoLahetys(pelti(), {})); L.lisaaOdottava(s2, L.luoLahetys(pelti(), {}));
  ok(L.lue(s2).length === 2 && L.lue(s2).every(x => x.ryhma === null), '2d: kaksi peltiä samaan ryhmään ovat eri rivejä, eivät korvaa toisiaan (T2)');
})();

// ---- 3) Vanhat odottavat poistuvat kahden viikon jälkeen
(function () {
  const s = muisti();
  const vanha = L.luoLahetys(piippu('g1'), {}); vanha.aika = Date.now() - L.VANHENEE_MS - 1000;
  const tuore = L.luoLahetys(piippu('g2'), {});
  L.lisaaOdottava(s, vanha); L.lisaaOdottava(s, tuore);
  const jaljella = L.siivoa(s);
  ok(jaljella.length === 1 && jaljella[0].id === tuore.id && L.lue(s).length === 1, '3a: yli 14 vrk vanha poistui, tuore jäi');
})();

// ---- 4) Vain yksi vastaanottaja
(function () {
  const ilman = L.luoLahetys(piippu('g1'), {});
  const kohde = L.luoLahetys(piippu('g1'), { kohdeTilaus: 'T1' });
  const A = { tabId: 'a', orderId: 'T1' }, B = { tabId: 'b', orderId: 'T2' }, C = { tabId: 'c', orderId: null };
  const akt = { tabId: 'b', orderId: 'T2' };
  ok(!L.onkoMinun(ilman, A, akt) && L.onkoMinun(ilman, B, akt) && !L.onkoMinun(ilman, C, akt), '4a: ilman kohdetta vain viimeksi käytetty tilaus (B) ottaa');
  ok(L.onkoMinun(kohde, A, akt) && !L.onkoMinun(kohde, B, akt), '4b: kohdetilauksella vain sen oma tilaus (A), vaikka B on viimeksi käytetty');
  ok(!L.onkoMinun(kohde, C, { tabId: 'c' }), '4c: tallentamaton uusi tilaus ei ota toisen tilauksen työtä');
  ok(L.onkoMinun(ilman, C, { tabId: 'c' }), '4d: tallentamaton uusi tilaus ottaa kohteettoman työn, jos se on viimeksi käytetty');
  ok(!L.onkoMinun(ilman, A, null) && !L.onkoMinun(null, A, akt), '4e: ei aktiivista tietoa / ei lähetystä → ei oteta');
})();

// ---- 5) Huomio tilauksen huomioihin
(function () {
  ok(L.yhdistaHuomio('', 'Lapepiippu 400×450', 'RR33 ruskea, nosturi') === 'Lapepiippu 400×450: RR33 ruskea, nosturi', '5a: tyhjään huomioon kuvaus + huomio');
  ok(L.yhdistaHuomio('Soita ennen toimitusta', 'Piippu', 'ruskea') === 'Soita ennen toimitusta\nPiippu: ruskea', '5b: olemassa olevan perään uudelle riville');
  ok(L.yhdistaHuomio('Piippu: ruskea', 'Piippu', 'ruskea') === 'Piippu: ruskea', '5c: sama huomio ei tuplaannu (uudelleenlähetys)');
  ok(L.yhdistaHuomio('vanha\n\n', 'P', '  ') === 'vanha\n\n', '5d: tyhjä huomio ei muuta mitään');
  ok(L.yhdistaHuomio(null, '', 'x') === 'x', '5e: ilman kuvausta pelkkä huomio');
})();

// ---- 6) Tilauslista: kaikki tilat suomeksi, haku
(function () {
  const r = L.tilausRivi({ id: 'abc12345-xyz', order_number: 2026123, order_date: '2026-11-20', status: 'COMPLETED', kohde: 'Mökki', customers: { name: 'Virtanen Oy' } });
  ok(r.numero === '2026123' && r.asiakas === 'Virtanen Oy' && r.tila === 'Valmis' && r.kohde === 'Mökki', '6a: valmis tilaus mukana, tila suomeksi');
  const r2 = L.tilausRivi({ id: 'abc12345-xyz', order_date: '2026-11-20T08:00:00', status: 'DRAFT', customers: null });
  ok(r2.numero === '20.11.2026' && r2.asiakas === 'ei asiakasta' && r2.tila === 'Luonnos', '6b: ilman numeroa päiväys, ilman asiakasta teksti');
  const r3 = L.tilausRivi({ id: 'abcdef1234', status: 'XYZ' });
  ok(r3.numero === 'abcdef12' && r3.tila === 'XYZ', '6c: ei päiväystä → id:n alku; tuntematon tila sellaisenaan');
  const rivit = [r, r2, L.tilausRivi({ id: '3', status: 'INVOICED', customers: { name: 'Mäkelä' }, kohde: 'Halli' })];
  ok(L.suodataTilaukset(rivit, '').length === 3, '6d: tyhjä haku → kaikki');
  ok(L.suodataTilaukset(rivit, 'VIRTA').length === 1 && L.suodataTilaukset(rivit, 'halli').length === 1, '6e: haku asiakkaalla ja kohteella, kirjainkoko ei haittaa');
  ok(L.suodataTilaukset(rivit, 'laskutettu')[0].asiakas === 'Mäkelä', '6f: haku tilalla');
})();

// ---- 7) Aikateksti
(function () {
  const t = new Date(2026, 10, 25, 7, 5).getTime();
  ok(L.aikaTeksti(t) === '25.11. klo 7.05', '7a: aika muodossa 25.11. klo 7.05');
})();

console.log(fails ? fails + ' TESTIÄ EPÄONNISTUI' : 'KAIKKI TESTIT OK');
if (fails) process.exitCode = 1;
