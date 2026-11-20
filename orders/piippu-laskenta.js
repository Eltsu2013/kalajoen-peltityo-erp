// Kalajoen Peltityö ERP — piippujen laskenta (orders/piippu-laskenta.js)
//
// Lapepiipun peltien mitat syötöistä. Samaa laskentaa käyttävät Piippu-sivu (piippu.html) ja
// Tuotannon piippunäkymä (piippu_tuotanto.html), joten korjaus tehdään vain tänne.
// Myöhemmin tänne tulee myös harjapiippu (suunnitelma claude/yhteiset_tyokalut_suunnitelma.md).
//
// Käyttö sivulla:   <script src="piippu-laskenta.js?v=1"></script>
//                   const tulos = KPT_PIIPPU.laskeLapepiippu(vals, { juuret: true, huppu: true, kansi: true, hattu: true });
// Käyttö Nodessa:   const P = require('../orders/piippu-laskenta.js');
// Versiot: v1 vaihe 2 (20.11.2026), v2 hupun todellinen korkeus (hEtuTodellinen / hTakaTodellinen).
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kummallakin piippusivulla ja aja testit
//         (node testit/aja_kaikki.js).
//
// Vaihe 2 (20.11.2026): siirretty piippu.html:n laske()-funktiosta sellaisenaan. piippu_tuotanto.html:ssä
// oli siitä erillinen kopio (laskePellit), joka poistettiin. Testit: testit/piippu/.
(function () {
  const r = n => Math.round(n);
  const luku = x => Number(x) || 0;

  // vals = syötöt samoilla nimillä kuin tilausrivin profile_data.vals (leveys, suora, etukork, takakork, ...).
  // osat = mitkä osat lasketaan: { juuret, huppu, kansi, hattu } (puuttuva = true). Tuotanto laskee aina kaikki.
  // Palauttaa { juuret: [...], muut: [...], geom: {...} }. Rivi = { osa, lev, pit, kpl } (mm, pyöristetty).
  // Piipun jalat ja käsin lisätyt osat eivät ole mukana: Piippu-sivu lisää ne itse muut-listan perään.
  function laskeLapepiippu(vals, osat) {
    const v = vals || {};
    const o = osat || {};
    const hasJuuret = o.juuret !== false;
    const hasHuppu  = o.huppu  !== false;
    const hasKansi  = o.kansi  !== false;
    const hasHattu  = o.hattu  !== false;

    const leveys   = luku(v.leveys);
    const suora    = luku(v.suora);
    const etukork  = luku(v.etukork);
    const takakork = luku(v.takakork);
    const vasen    = luku(v.vasen);
    const oikea    = luku(v.oikea);
    const poimu    = luku(v.poimu);
    const k24      = luku(v.k24);
    const j25      = luku(v.j25);
    const harjalle = luku(v.harjalle);

    const tupla   = luku(v.tupla);
    const etulis  = luku(v.etulis);
    const takalis = luku(v.takalis);
    const nousu   = luku(v.nousu);

    const takareuna   = luku(v.takareuna);
    const harjaylitys = luku(v.harjaylitys);
    const juurisauma  = luku(v.juurisauma);
    const taka1mitta  = luku(v.taka1mitta);
    const taka2mitta  = luku(v.taka2mitta);
    const taka3mitta  = luku(v.taka3mitta);
    const sauma      = luku(v.sauma);
    const huplis     = luku(v.huplis);
    const ylareunaV  = luku(v.ylareunaV);
    const alatupla   = luku(v.alatupla);
    const vahennys   = luku(v.vahennys);
    const huptakalis = luku(v.huptakalis);
    const hattulis   = luku(v.hattulis);

    const saumatyyppi   = v.saumatyyppi || 1;
    const takaKpl       = v.takaKpl || 1;
    const huppuEtuKpl   = v.huppuEtuKpl || 1;
    const huppuSivutKpl = v.huppuSivutKpl || 1;
    const huppuTakaKpl  = v.huppuTakaKpl || 1;

    // Geometria
    const korkeuserot = etukork - takakork;
    const vinomitta = Math.sqrt(suora*suora + korkeuserot*korkeuserot);
    const kattokulma_rad = korkeuserot !== 0 ? Math.atan(suora / korkeuserot) : Math.PI/2;
    const kattokulma_deg = kattokulma_rad * 180 / Math.PI;
    const etukulma = r(kattokulma_deg);
    const takakulma = 180 - etukulma;

    // P10: vaakakomponentti kun nousu on pystysuorassa
    const p10 = Math.sin(kattokulma_rad) > 0 ? nousu / Math.sin(kattokulma_rad) : nousu;

    // Q9: juuri takaa piipulle
    const q9 = hasHuppu ? (nousu + 20) : p10;

    // Hupun kaltevuuskorjaus: huppu on huplis/2 piippua leveämpi joka suuntaan, joten sen alareuna on vinolla katolla
    // (huplis/2) × katon kaltevuus (korkeusero / suora) korkeammalla/matalammalla. Korjattu 18.11.2026: aiemmin suhde oli
    // käänteinen (tan(kattokulma) = suora / korkeusero), mikä teki loivalla katolla hupusta edestä liian korkean.
    const kaltkorj = suora > 0 ? (huplis / 2) * (korkeuserot / suora) : 0;

    const juuret = [];
    const muut = [];

    // JUURET
    if (hasJuuret) {
      const jEtuLev = leveys + etulis;
      const jEtuPit = (j25 > 0 ? j25 : tupla) + k24 + j25 + q9;
      juuret.push({ osa: 'Juuri etu', lev: r(jEtuLev), pit: r(jEtuPit), kpl: 1 });

      const nousuKomp = kattokulma_rad > 0 ? nousu / Math.tan(kattokulma_rad) : 0;
      const jSivuPit = tupla + j25 + k24 + vinomitta + nousuKomp + 20 + 30;
      const jOikLev  = oikea + poimu + nousu + tupla;
      const jVasLev  = vasen + poimu + nousu + tupla;
      juuret.push({ osa: 'Juuri oikea', lev: r(jOikLev), pit: r(jSivuPit), kpl: 1 });
      juuret.push({ osa: 'Juuri vasen', lev: r(jVasLev), pit: r(jSivuPit), kpl: 1 });

      // Taka: takalis EI vaikuta huppuun
      const jTakaLev = vasen + oikea + leveys + tupla*2 + poimu*2 + takalis;
      const harjaLisa = harjaylitys > 0 ? harjaylitys + j25 + tupla : 0;

      if (takaKpl === 1) {
        // Yksi takakappale
        const jTakaPit = harjalle + q9 + takareuna + harjaLisa;
        juuret.push({ osa: 'Juuri taka', lev: r(jTakaLev), pit: r(jTakaPit), kpl: 1 });
      } else if (takaKpl === 2) {
        // Taka 1: kiinnittyy piippuun
        const pit1 = taka1mitta + q9 + juurisauma;
        juuret.push({ osa: 'Juuri taka 1', lev: r(jTakaLev), pit: r(pit1), kpl: 1 });
        // Taka 2: ulottuu harjalle, kiertyy taka1 sauman ympäri 2x edestä
        const pit2 = (harjalle - taka1mitta) + juurisauma*2 + takareuna + harjaLisa;
        juuret.push({ osa: 'Juuri taka 2', lev: r(jTakaLev), pit: r(pit2), kpl: 1 });
      } else if (takaKpl === 3) {
        const pit1 = taka1mitta + q9 + juurisauma;
        juuret.push({ osa: 'Juuri taka 1', lev: r(jTakaLev), pit: r(pit1), kpl: 1 });
        // Taka 2: välikappale, kiertyy taka1 ympäri 2x edestä + nousee ylös taka3:a varten
        const pit2 = taka2mitta + juurisauma*3;
        juuret.push({ osa: 'Juuri taka 2', lev: r(jTakaLev), pit: r(pit2), kpl: 1 });
        // Taka 3: viimeinen, kiertyy taka2 ympäri 2x edestä
        const pit3 = (harjalle - taka1mitta - taka2mitta) + juurisauma*2 + takareuna + harjaLisa;
        juuret.push({ osa: 'Juuri taka 3', lev: r(jTakaLev), pit: r(pit3), kpl: 1 });
      } else if (takaKpl === 4) {
        const pit1 = taka1mitta + q9 + juurisauma;
        juuret.push({ osa: 'Juuri taka 1', lev: r(jTakaLev), pit: r(pit1), kpl: 1 });
        const pit2 = taka2mitta + juurisauma*3;
        juuret.push({ osa: 'Juuri taka 2', lev: r(jTakaLev), pit: r(pit2), kpl: 1 });
        const pit3 = taka3mitta + juurisauma*3;
        juuret.push({ osa: 'Juuri taka 3', lev: r(jTakaLev), pit: r(pit3), kpl: 1 });
        const pit4 = (harjalle - taka1mitta - taka2mitta - taka3mitta) + juurisauma*2 + takareuna + harjaLisa;
        juuret.push({ osa: 'Juuri taka 4', lev: r(jTakaLev), pit: r(pit4), kpl: 1 });
      }
    }

    // HUPPU
    // Hupun korkeus pellille (sisältää alatuplan). Kuvan merkintämitta ilman alatuplaa on alempana (hEtuKorkMerkinta).
    const hEtuKork  = etukork + ylareunaV + alatupla + kaltkorj - vahennys;
    const hTakaKork = takakork + ylareunaV + alatupla - kaltkorj - vahennys;

    // Sivupalan leveys, kun sivu on jaettu 2 tai 3 osaan (ensimmäinen pala)
    const sivuPalaLev = n => saumatyyppi === 1
      ? suora/n + huplis/n + sauma*3
      : suora/n + huplis/n + sauma*3 + huptakalis/n;

    if (hasHuppu) {
      // Huppu etu — 1/2/3 osaa
      if (huppuEtuKpl === 1) {
        muut.push({ osa: 'Huppu etu', lev: r(leveys + sauma*2 + huplis), pit: r(hEtuKork), kpl: 1 });
      } else if (huppuEtuKpl === 2) {
        muut.push({ osa: 'Huppu etu 1', lev: r(leveys/2 + huplis/2 + sauma*2), pit: r(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 2', lev: r(leveys/2 + huplis/2 + sauma*3), pit: r(hEtuKork), kpl: 1 });
      } else {
        muut.push({ osa: 'Huppu etu 1', lev: r(leveys/3 + huplis/3 + sauma*2), pit: r(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 2', lev: r(leveys/3 + huplis/3 + sauma*3), pit: r(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 3', lev: r(leveys/3 + huplis/3 + sauma*3), pit: r(hEtuKork), kpl: 1 });
      }

      // Sivut
      // Sauma 2: sivun molemmissa päissä 40 mm, joten liitokseen (20 + 40) tarvitaan viimeiseen palaan yksi sauma lisää (Tomi 20.11.2026)
      const lisaVika = saumatyyppi === 1 ? 0 : sauma;
      if (huppuSivutKpl === 1) {
        const hSivLev = saumatyyppi === 1
          ? suora + sauma*3 + huplis
          : suora + sauma*4 + huplis + huptakalis;
        muut.push({ osa: 'Huppu sivut', lev: r(hSivLev), pit: r(hEtuKork), kpl: 2 });
      } else if (huppuSivutKpl === 2) {
        const lev = sivuPalaLev(2);
        const pit2 = (hEtuKork + hTakaKork) / 2;
        muut.push({ osa: 'Huppu sivut 1', lev: r(lev), pit: r(hEtuKork), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 2', lev: r(lev + lisaVika), pit: r(pit2), kpl: 2 });
      } else {
        const lev = sivuPalaLev(3);
        const diff = hEtuKork - hTakaKork;
        const pit2 = hEtuKork - diff / 3;
        const pit3 = hEtuKork - diff * 2/3;
        muut.push({ osa: 'Huppu sivut 1', lev: r(lev), pit: r(hEtuKork), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 2', lev: r(lev), pit: r(pit2), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 3', lev: r(lev + lisaVika), pit: r(pit3), kpl: 2 });
      }

      // Huppu taka — 1/2/3 osaa
      if (saumatyyppi === 2) {
        // Saumatyyppi 2: taka = sama kuin etu, huptakalis ei vaikuta
        if (huppuTakaKpl === 1) {
          muut.push({ osa: 'Huppu taka', lev: r(leveys + sauma*2 + huplis), pit: r(hTakaKork), kpl: 1 });
        } else if (huppuTakaKpl === 2) {
          muut.push({ osa: 'Huppu taka 1', lev: r(leveys/2 + huplis/2 + sauma*2), pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: r(leveys/2 + huplis/2 + sauma*3), pit: r(hTakaKork), kpl: 1 });
        } else {
          muut.push({ osa: 'Huppu taka 1', lev: r(leveys/3 + huplis/3 + sauma*2), pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: r(leveys/3 + huplis/3 + sauma*3), pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 3', lev: r(leveys/3 + huplis/3 + sauma*3), pit: r(hTakaKork), kpl: 1 });
        }
      } else {
        // Saumatyyppi 1: huptakalis mukana reunapaloissa
        if (huppuTakaKpl === 1) {
          muut.push({ osa: 'Huppu taka', lev: r(leveys + sauma*4 + huplis + huptakalis), pit: r(hTakaKork), kpl: 1 });
        } else if (huppuTakaKpl === 2) {
          muut.push({ osa: 'Huppu taka 1', lev: r(leveys/2 + huplis/2 + huptakalis/2 + sauma*3), pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: r(leveys/2 + huplis/2 + huptakalis/2 + sauma*4), pit: r(hTakaKork), kpl: 1 });
        } else {
          muut.push({ osa: 'Huppu taka 1', lev: r(leveys/3 + huplis/3 + huptakalis/2 + sauma*3), pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: r(leveys/3 + huplis/3 + sauma*3),                pit: r(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 3', lev: r(leveys/3 + huplis/3 + huptakalis/2 + sauma*4), pit: r(hTakaKork), kpl: 1 });
        }
      }
    }

    // KANSI
    if (hasKansi) {
      const kLev = leveys + ylareunaV*4 + huplis + 10;
      const kPit = suora  + ylareunaV*4 + huplis + 10;
      muut.push({ osa: 'Kansi', lev: r(kLev), pit: r(kPit), kpl: 1 });
    }

    // HATTU
    if (hasHattu) {
      muut.push({ osa: 'Hattu', lev: r(leveys + hattulis), pit: r(suora + hattulis), kpl: 1 });
    }

    // Hupun merkintämitta pellille kuvaan: sama kuin hupun korkeus, mutta ilman alatuplaa
    const hEtuKorkMerkinta  = etukork + ylareunaV + kaltkorj - vahennys;
    const hTakaKorkMerkinta = takakork + ylareunaV - kaltkorj - vahennys;

    // Hupun todellinen korkeus asennettuna, ilman taitoksia (ei alatuplaa eikä yläreunan taitosta). Tuotannon kuva näyttää
    // tämän: pellissä näkyy se mitta, joka siitä pitää tulla (Tomi 20.11.2026). Esim. etu 1000, vähennys 20, lisää 10 → 982.
    const hEtuTodellinen  = etukork + kaltkorj - vahennys;
    const hTakaTodellinen = takakork - kaltkorj - vahennys;

    // Etenemä = sivupalan hyötyleveys (lev - sauma×3), lasketaan vain jos sivuja on useampi
    let hSivEtenema = 0;
    if (hasHuppu && huppuSivutKpl >= 2) {
      hSivEtenema = r(sivuPalaLev(huppuSivutKpl === 2 ? 2 : 3) - sauma*3);
    }

    return {
      juuret,
      muut,
      geom: {
        korkeuserot, vinomitta, kattokulma_rad, kattokulma_deg, etukulma, takakulma, p10, q9, kaltkorj,
        hEtuKork, hTakaKork, hEtuKorkMerkinta, hTakaKorkMerkinta, hEtuTodellinen, hTakaTodellinen, hSivEtenema,
      },
    };
  }

  const KPT_PIIPPU = { laskeLapepiippu };
  globalThis.KPT_PIIPPU = KPT_PIIPPU;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PIIPPU;
})();
