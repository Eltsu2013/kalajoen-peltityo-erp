// Ajaa kaikki testit (testit/**/test_*.js) ja kertoo lopuksi yhteenvedon.
// Käyttö repon juuresta:   node testit/aja_kaikki.js
// Testi on läpi, kun se päättyy riviin "KAIKKI TESTIT OK" eikä palauta virhekoodia.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function etsi(kansio) {
  let tulos = [];
  fs.readdirSync(kansio, { withFileTypes: true }).forEach(e => {
    const polku = path.join(kansio, e.name);
    if (e.isDirectory()) tulos = tulos.concat(etsi(polku));
    else if (/^test_.*\.js$/.test(e.name)) tulos.push(polku);
  });
  return tulos.sort();
}

const testit = etsi(__dirname);
let hylatyt = 0, tarkistuksia = 0;
testit.forEach(t => {
  const r = spawnSync(process.execPath, [t], { cwd: path.dirname(t), encoding: 'utf8' });
  const tuloste = (r.stdout || '') + (r.stderr || '');
  const rivit = tuloste.trim().split('\n');
  const lapi = r.status === 0 && rivit[rivit.length - 1].trim() === 'KAIKKI TESTIT OK';
  const ok = rivit.filter(s => /^ok/.test(s)).length;
  tarkistuksia += ok;
  console.log((lapi ? 'OK     ' : 'VIRHE  ') + path.relative(__dirname, t) + '  (' + ok + ' tarkistusta)');
  if (!lapi) {
    hylatyt++;
    rivit.filter(s => /FAIL|Error|EPÄONNISTUI|VIRHE/.test(s)).slice(0, 15).forEach(s => console.log('         ' + s));
  }
});
console.log('\n' + testit.length + ' testisarjaa, ' + tarkistuksia + ' tarkistusta. '
  + (hylatyt ? hylatyt + ' sarjaa EPÄONNISTUI.' : 'KAIKKI TESTIT OK'));
if (hylatyt) process.exitCode = 1;
