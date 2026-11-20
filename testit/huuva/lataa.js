// Huuvan testien yhteinen lataus.
// Yhteiset tiedostot (orders/geom.js ja orders/pellit.js) ladataan Nodeen requirella, ja Huuva-mockupin
// oma skripti palautetaan tekstinä, jonka testit ajavat evalilla (kuten ennen vaihetta 1).
const fs = require('fs');
const path = require('path');
require('../../orders/geom.js');
require('../../orders/pellit.js');

module.exports = function lataa() {
  const html = fs.readFileSync(path.join(__dirname, 'savuhuuva-mockup.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  return { html, script };
};
