// Huuvan testien yhteinen lataus.
// Yhteiset tiedostot (orders/geom.js, orders/pellit.js ja orders/tyokortti.js) ladataan Nodeen requirella, ja Huuva-sivun
// (orders/huuva.html, vaihe 8.1 24.11.2026; ennen testisivu testit/huuva/savuhuuva-mockup.html) oma skripti palautetaan
// tekstinä, jonka testit ajavat evalilla.
const fs = require('fs');
const path = require('path');
require('../../orders/geom.js');
require('../../orders/pellit.js');
require('../../orders/menekki.js');
require('../../orders/dxf.js');
globalThis.KPT_TYOKORTTI = require('../../orders/tyokortti.js');

module.exports = function lataa() {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'orders', 'huuva.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  return { html, script };
};
