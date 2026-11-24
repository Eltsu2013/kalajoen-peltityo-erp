/*
 * Kalajoen Peltityö ERP — ulkoasun valinta tumma / vaalea (orders/teema.js)
 *
 * Ulkoasuremontti R0 (24.11.2026). Ladataan <head>issa heti tyyli.css:n jälkeen, jotta valinta on voimassa
 * ennen kuin sivu piirtyy (ei välähdystä väärällä värillä):
 *   <link rel="stylesheet" href="tyyli.css?v=1"> <script src="teema.js?v=1"></script>
 * Valinta muistetaan selaimessa (laitekohtainen). Oletus tumma.
 * Kytkin: mikä tahansa <button class="kpt-teema-kytkin"></button> sivulla saa tekstin ja toiminnon itsestään.
 * Sivut, jotka piirtävät kuvia omilla väreillään, voivat kuunnella vaihtoa:
 *   document.addEventListener('kpt-teema', e => piirraUudelleen(e.detail.teema));
 * MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kaikilla sivuilla, jotka lataavat sen.
 */
(function () {
  'use strict';
  const AVAIN = 'kpt_teema';
  const html = document.documentElement;

  function lue() {
    try { return localStorage.getItem(AVAIN) === 'vaalea' ? 'vaalea' : 'tumma'; } catch (e) { return 'tumma'; }
  }
  html.dataset.teema = lue();

  function paivitaKytkimet() {
    const vaalea = html.dataset.teema === 'vaalea';
    document.querySelectorAll('.kpt-teema-kytkin').forEach(b => {
      // Napissa lukee se, mihin vaihdetaan
      b.textContent = vaalea ? '☾ Tumma' : '☀ Vaalea';
      b.title = vaalea ? 'Vaihda tummaan ulkoasuun' : 'Vaihda vaaleaan ulkoasuun';
      b.setAttribute('aria-pressed', vaalea ? 'true' : 'false');
    });
  }

  function aseta(teema) {
    const t = teema === 'vaalea' ? 'vaalea' : 'tumma';
    html.dataset.teema = t;
    try { localStorage.setItem(AVAIN, t); } catch (e) { /* ei selainmuistia: valinta voimassa tämän sivun ajan */ }
    paivitaKytkimet();
    document.dispatchEvent(new CustomEvent('kpt-teema', { detail: { teema: t } }));
  }
  function vaihda() { aseta(html.dataset.teema === 'vaalea' ? 'tumma' : 'vaalea'); }

  // Kytkimet: klikkaus mihin tahansa .kpt-teema-kytkin-nappiin (myös myöhemmin lisättyyn)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.kpt-teema-kytkin');
    if (b) { e.preventDefault(); vaihda(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paivitaKytkimet);
  else paivitaKytkimet();

  // Toisessa välilehdessä vaihdettu → tämäkin vaihtuu
  window.addEventListener('storage', e => { if (e.key === AVAIN) { html.dataset.teema = lue(); paivitaKytkimet(); } });

  window.KPT_TEEMA = { aseta, vaihda, nykyinen: () => html.dataset.teema };
})();
