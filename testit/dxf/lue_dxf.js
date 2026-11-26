// DXF-tiedoston luku testeille (ei testi itse): parit, entiteetit, arvo, arvot.
// DXF-tiedosto pareiksi [koodi, arvo]
function parit(teksti) {
  const r = teksti.split('\r\n');
  if (r[r.length - 1] === '') r.pop();
  const p = [];
  for (let i = 0; i < r.length; i += 2) p.push([r[i].trim(), r[i + 1]]);
  return { p, parillinen: r.length % 2 === 0 };
}
// Entiteetit ENTITIES-osiosta: [{ tyyppi, koodit: [[k, v], ...] }]
function entiteetit(p) {
  const a = p.findIndex((x, i) => x[0] === '2' && x[1] === 'ENTITIES' && p[i - 1][1] === 'SECTION');
  const out = [];
  for (let i = a + 1; i < p.length && !(p[i][0] === '0' && p[i][1] === 'ENDSEC'); i++) {
    if (p[i][0] === '0') out.push({ tyyppi: p[i][1], k: [] }); else out[out.length - 1].k.push(p[i]);
  }
  return out;
}
const arvo = (e, k) => (e.k.find(x => x[0] === String(k)) || [])[1];
const arvot = (e, k) => e.k.filter(x => x[0] === String(k)).map(x => x[1]);

module.exports = { parit, entiteetit, arvo, arvot };
