/**
 * nav.js — Kalajoen Peltityö ERP: yhteinen ☰-valikko kaikille sivuille
 *
 * Valikon sisältö on vain tässä tiedostossa. Uusi sivu lisätään valikkoon
 * lisäämällä yksi rivi alla olevaan VALIKKO-listaan.
 *
 * Sivulla tarvitaan:
 *   <div class="nav-dropdown" id="navDropdown"> ... </div>   (tai id="navDropdownLasku")
 *   <script src="nav.js?v=N"></script>   heti valikon jälkeen
 * Valikon avaus/sulku ja ulkoasu (.nav-item, .nav-divider jne.) ovat sivun omia.
 *
 * Toiminta:
 *   - Ylimpänä Etusivu ja kolme viimeksi käytettyä sivua (muistetaan selaimessa).
 *   - Kategoriat ovat kiinni, paitsi se jossa nykyinen sivu on.
 *   - Kategorian otsikon napautus avaa tai sulkee sen.
 */
(function () {
  'use strict';

  const ETUSIVU = { href: 'etusivu.html', label: '🏠 Etusivu' };
  // Tuotanto on oma kohtansa heti Etusivun alla, aina näkyvissä (Tomi 24.11.2026: puhelimella helposti auki)
  const TUOTANTO = { href: 'tuotanto.html', label: '⚙️ Tuotanto', id: 'tuotanto' };

  // Valikkorakenne 24.11.2026 (ulkoasuremontti, projektin claude/ulkoasu_remontti_suunnitelma.md).
  // id = kategorian tunnus, josta tyyli.css antaa korostusvärin (html[data-kategoria="..."]).
  // Tiedostonimet eivät muutu, vain näkyvä nimi (esim. peltipiirturi.html = Peltilistat).
  const VALIKKO = [
    { nimi: 'Tilaukset', id: 'tilaukset', sivut: [
      { href: 'tilaukset.html',     label: '📋 Tilaukset' },
      { href: 'tilaus.html',        label: '✏️ Uusi tilaus' },
      { href: 'asiakkaat.html',     label: '👤 Asiakkaat' },
      { href: 'lasku.html',         label: '🧾 Laskutus' },
    ]},
    // Mallisto: peltilistat, vakiomallit ja erikoismallit (piippu, huuva, kartio, myöhemmin katto- ja seinäpellit).
    // Kun kohtia on yli 8, ryhmään väliotsikot (suunnitelma, kohta 2).
    { nimi: 'Mallisto', id: 'mallisto', sivut: [
      { href: 'peltipiirturi.html', label: '🔨 Peltilistat' },
      { href: 'vakiomallit.html',   label: '🔧 Vakiomallit' },
      { href: 'piippu.html',        label: '🏭 Piippu' },
      { href: 'huuva.html',         label: '🔥 Huuva' },
      { href: 'kartio.html',        label: '📐 Kartio' },
    ]},
    { nimi: 'Varasto', id: 'varasto', sivut: [
      { href: 'varasto.html',       label: '📦 Varasto' },
      { href: 'varastotyo.html',    label: '📱 Varastotyö' },
      { href: '../maps/verstaspohja_mitoitettu.html', label: '🗺 Varastokartta' },
    ]},
    { nimi: 'Ajat ja henkilöstö', id: 'ajat', sivut: [
      { href: 'tunnit.html',        label: '⏱ Tunnit' },
      { href: 'ajanseuranta.html',  label: '⏲ Ajanseuranta' },
      { href: 'henkilosto.html',    label: '👥 Henkilöstö' },
    ]},
    { nimi: 'Toimisto', id: 'toimisto', sivut: [
      { href: 'tehtavat.html',      label: '✅ Tehtävät' },
      { href: 'kalenteri.html',     label: '📅 Kalenteri' },
      { href: 'hinnasto.html',      label: '💰 Hinnasto' },
      { href: 'laskin.html',        label: '🧮 Laskin' },
    ]},
  ];

  // Sivut, jotka eivät ole valikossa, mutta kuuluvat jonkin valikkosivun alle
  const ALISIVUT = {
    'piippu_tuotanto.html': 'tuotanto.html',
    'harjapiippu.html':     'piippu.html',
    'varasto_qr.html':      'varasto.html',
  };

  const LS_VIIMEISET = 'kpt_nav_viimeiset';
  const VIIMEISIA = 3;

  const kaikki = [ETUSIVU, TUOTANTO];
  VALIKKO.forEach(k => k.sivut.forEach(s => kaikki.push(s)));
  const sivuHrefilla = href => kaikki.find(s => s.href === href);

  const tiedosto = (location.pathname.split('/').pop() || 'etusivu.html').toLowerCase();
  const nykyinen = ALISIVUT[tiedosto] || tiedosto;
  const onAlisivu = !!ALISIVUT[tiedosto];

  // Sivun kategoria → html[data-kategoria], josta tyyli.css antaa korostusvärin (vain sivuilla, jotka käyttävät tyyli.css:ää)
  const kategoria = nykyinen === TUOTANTO.href ? TUOTANTO.id
    : ((VALIKKO.find(k => k.sivut.some(s => s.href === nykyinen)) || {}).id || '');
  if (kategoria && !document.documentElement.dataset.kategoria) document.documentElement.dataset.kategoria = kategoria;

  // Etusivu (ja muut) voivat lukea valikon tästä, ettei rakennetta kirjoiteta kahteen paikkaan
  window.KPT_VALIKKO = { ETUSIVU, TUOTANTO, VALIKKO, kategoria };

  const dd = document.getElementById('navDropdown') || document.getElementById('navDropdownLasku');
  if (!dd) return;

  // ── Viimeksi käytetyt (selaimen muistissa) ──
  function lueViimeiset() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_VIIMEISET) || '[]');
      return Array.isArray(v) ? v.filter(h => typeof h === 'string' && sivuHrefilla(h)) : [];
    } catch (e) { return []; }
  }
  // Kirjataan vain oikeat valikkosivut (ei etusivua eikä Tuotantoa, jotka ovat aina näkyvissä, ei alisivuja kuten QR-tarrat)
  if (!onAlisivu && nykyinen !== ETUSIVU.href && nykyinen !== TUOTANTO.href && sivuHrefilla(nykyinen)) {
    try {
      const v = lueViimeiset().filter(h => h !== nykyinen);
      v.unshift(nykyinen);
      localStorage.setItem(LS_VIIMEISET, JSON.stringify(v.slice(0, 8)));
    } catch (e) { /* yksityinen selaustila tms. — valikko toimii ilman muistia */ }
  }

  // Auki on se kategoria, jossa nykyinen sivu on
  const auki = new Set();
  VALIKKO.forEach(k => { if (k.sivut.some(s => s.href === nykyinen)) auki.add(k.nimi); });

  // ── Valikon omat lisätyylit (muut tyylit tulevat sivulta) ──
  if (!document.getElementById('kpt-nav-tyylit')) {
    const st = document.createElement('style');
    st.id = 'kpt-nav-tyylit';
    st.textContent = `
      /* Kategoriarivi on <button>. Nollataan selaimen oletusnapin ulkoasu (harmaa tausta,
         reunus, oma fontti) — kaikkien sivujen .nav-item-tyyli ei sitä tee (17.11. tilaukset.html).
         :where() = tämän säännön painoarvo on nolla, joten sivun oma .nav-item-tyyli voittaa
         aina, kun se määrittää saman asian (fontti, väri, hover-tausta). */
      :where(#navDropdown .nav-kat, #navDropdownLasku .nav-kat) {
        -webkit-appearance: none; appearance: none;
        background: transparent; border: 0; border-radius: 0; box-shadow: none; margin: 0;
        font: inherit; color: inherit; text-align: left; cursor: pointer;
      }
      #navDropdown .nav-kat, #navDropdownLasku .nav-kat {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        font-weight: 600; width: 100%;
      }
      #navDropdown .nav-kat .nav-maara, #navDropdownLasku .nav-kat .nav-maara {
        font-weight: 400; opacity: 0.55; margin-left: 6px;
      }
      #navDropdown .nav-kat .nav-nuoli, #navDropdownLasku .nav-kat .nav-nuoli {
        opacity: 0.6; font-size: 0.9em; transition: transform 0.15s;
      }
      #navDropdown .nav-kat[aria-expanded="true"] .nav-nuoli,
      #navDropdownLasku .nav-kat[aria-expanded="true"] .nav-nuoli { transform: rotate(180deg); }
      #navDropdown .nav-ala .nav-item, #navDropdownLasku .nav-ala .nav-item { padding-left: 30px; }
    `;
    document.head.appendChild(st);
  }

  // ── Piirto ──
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const linkki = s =>
    `<a class="nav-item${s.href === nykyinen ? ' current' : ''}" href="${esc(s.href)}">${esc(s.label)}</a>`;

  function piirra() {
    let h = linkki(ETUSIVU) + linkki(TUOTANTO);

    const viimeiset = lueViimeiset().filter(x => x !== nykyinen && x !== TUOTANTO.href).slice(0, VIIMEISIA);
    if (viimeiset.length) {
      h += '<div class="nav-section-label">Viimeksi käytetyt</div>';
      viimeiset.forEach(x => { h += linkki(sivuHrefilla(x)); });
    }
    h += '<hr class="nav-divider">';

    VALIKKO.forEach((k, i) => {
      const onAuki = auki.has(k.nimi);
      h += `<button type="button" class="nav-item nav-kat" data-kat="${i}" data-kat-id="${esc(k.id)}" aria-expanded="${onAuki}">` +
           `<span>${esc(k.nimi)}${onAuki ? '' : `<span class="nav-maara">${k.sivut.length}</span>`}</span>` +
           `<span class="nav-nuoli" aria-hidden="true">▾</span></button>`;
      if (onAuki) h += '<div class="nav-ala">' + k.sivut.map(linkki).join('') + '</div>';
    });

    dd.innerHTML = h;
  }

  // Kategorian avaus/sulku. stopPropagation: muuten sivun "klikkaus muualle sulkee valikon" sulkisi koko valikon.
  dd.addEventListener('click', e => {
    const b = e.target.closest('.nav-kat');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const nimi = VALIKKO[+b.dataset.kat].nimi;
    if (auki.has(nimi)) auki.delete(nimi); else auki.add(nimi);
    piirra();
    const uusi = dd.querySelector(`.nav-kat[data-kat="${b.dataset.kat}"]`);
    if (uusi) uusi.focus({ preventScroll: true });
  });

  piirra();

  // ── Uuden ulkoasun sivut (tyyli.css, R0 24.11.2026) ──
  // Valikkonappi .kpt-valikko-nappi avaa ja sulkee valikon itse, joten sivulle ei tarvita omaa toggleNav-funktiota.
  const nappi = dd.parentElement && dd.parentElement.querySelector('.kpt-valikko-nappi');
  if (nappi && !nappi.onclick) {
    nappi.setAttribute('aria-haspopup', 'true');
    nappi.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('open'); });
    document.addEventListener('click', e => { if (!dd.contains(e.target)) dd.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') dd.classList.remove('open'); });
  }
  // Yläpalkin kategorian nimi (<span class="kpt-kategoria"></span>) täytetään valikosta, jos se on tyhjä
  const katNimi = kategoria === TUOTANTO.id ? 'Tuotanto' : ((VALIKKO.find(k => k.id === kategoria) || {}).nimi || '');
  const taytaKategoria = () => document.querySelectorAll('.kpt-kategoria').forEach(el => { if (!el.textContent.trim()) el.textContent = katNimi; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', taytaKategoria); else taytaKategoria();
})();
