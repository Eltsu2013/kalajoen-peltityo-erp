// Kalajoen Peltityö ERP — piippujen laskenta (orders/piippu-laskenta.js)
//
// Lapepiipun peltien mitat syötöistä. Samaa laskentaa käyttävät Piippu-sivu (piippu.html) ja
// Tuotannon piippunäkymä (piippu_tuotanto.html), joten korjaus tehdään vain tänne.
// Myöhemmin tänne tulee myös harjapiippu (suunnitelma claude/yhteiset_tyokalut_suunnitelma.md).
//
// Käyttö sivulla:   <script src="piippu-laskenta.js?v=1"></script>
//                   const tulos = KPT_PIIPPU.laskeLapepiippu(vals, { juuret: true, huppu: true, kansi: true, hattu: true });
// Käyttö Nodessa:   const P = require('../orders/piippu-laskenta.js');
// Versiot: v1 vaihe 2 (20.11.2026), v2 hupun todellinen korkeus (hEtuTodellinen / hTakaTodellinen),
//          v3 hupun palat pyöristetään ylöspäin, v4 harjapiippu (laskeHarjapiippu, harjaPuoli2),
//          v5 harjapiipun sivuilta leikkausmitat pois (23.11.2026), v6 jakosauma seuraa hupun saumaa (harjaJakosauma),
//          v7 harjapiipun etukappaleet 1–3 osana kummallekin puolelle (harjaEtuJako, 23.11.2026),
//          v8 kansi ja sen reiät (laskeKansi, kansiAsetukset; vaihe 7b, 23.11.2026, mockup piippu/kansi-mockup.html),
//          v9 kanttisen reiän leikkausviivan pyöristys enintään 1/4 lyhyemmästä sivusta (24.11.2026),
//          v10 reikien mitat oletuksena muuratusta piipusta (24.11.2026).
// MUISTA: kun tätä tiedostoa muutetaan, nosta ?v=-numeroa kummallakin piippusivulla ja aja testit
//         (node testit/aja_kaikki.js).
//
// Vaihe 2 (20.11.2026): siirretty piippu.html:n laske()-funktiosta sellaisenaan. piippu_tuotanto.html:ssä
// oli siitä erillinen kopio (laskePellit), joka poistettiin. Testit: testit/piippu/.
(function () {
  const r = n => Math.round(n);
  // Hupun mitat pyöristetään seuraavaan täyteen milliin ylöspäin (Tomi 20.11.2026: mieluummin hieman iso kuin liian pieni).
  // 1e-9 estää liukulukuvirheen nostamasta tasalukua (esim. 450,0000000001 → 451).
  const ylos = n => Math.ceil(n - 1e-9);
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
        muut.push({ osa: 'Huppu etu', lev: ylos(leveys + sauma*2 + huplis), pit: ylos(hEtuKork), kpl: 1 });
      } else if (huppuEtuKpl === 2) {
        muut.push({ osa: 'Huppu etu 1', lev: ylos(leveys/2 + huplis/2 + sauma*2), pit: ylos(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 2', lev: ylos(leveys/2 + huplis/2 + sauma*3), pit: ylos(hEtuKork), kpl: 1 });
      } else {
        muut.push({ osa: 'Huppu etu 1', lev: ylos(leveys/3 + huplis/3 + sauma*2), pit: ylos(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 2', lev: ylos(leveys/3 + huplis/3 + sauma*3), pit: ylos(hEtuKork), kpl: 1 });
        muut.push({ osa: 'Huppu etu 3', lev: ylos(leveys/3 + huplis/3 + sauma*3), pit: ylos(hEtuKork), kpl: 1 });
      }

      // Sivut
      // Sauma 2: sivun molemmissa päissä 40 mm, joten liitokseen (20 + 40) tarvitaan viimeiseen palaan yksi sauma lisää (Tomi 20.11.2026)
      const lisaVika = saumatyyppi === 1 ? 0 : sauma;
      if (huppuSivutKpl === 1) {
        const hSivLev = saumatyyppi === 1
          ? suora + sauma*3 + huplis
          : suora + sauma*4 + huplis + huptakalis;
        muut.push({ osa: 'Huppu sivut', lev: ylos(hSivLev), pit: ylos(hEtuKork), kpl: 2 });
      } else if (huppuSivutKpl === 2) {
        const lev = sivuPalaLev(2);
        const pit2 = (hEtuKork + hTakaKork) / 2;
        muut.push({ osa: 'Huppu sivut 1', lev: ylos(lev), pit: ylos(hEtuKork), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 2', lev: ylos(lev + lisaVika), pit: ylos(pit2), kpl: 2 });
      } else {
        const lev = sivuPalaLev(3);
        const diff = hEtuKork - hTakaKork;
        const pit2 = hEtuKork - diff / 3;
        const pit3 = hEtuKork - diff * 2/3;
        muut.push({ osa: 'Huppu sivut 1', lev: ylos(lev), pit: ylos(hEtuKork), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 2', lev: ylos(lev), pit: ylos(pit2), kpl: 2 });
        muut.push({ osa: 'Huppu sivut 3', lev: ylos(lev + lisaVika), pit: ylos(pit3), kpl: 2 });
      }

      // Huppu taka — 1/2/3 osaa
      if (saumatyyppi === 2) {
        // Saumatyyppi 2: taka = sama kuin etu, huptakalis ei vaikuta
        if (huppuTakaKpl === 1) {
          muut.push({ osa: 'Huppu taka', lev: ylos(leveys + sauma*2 + huplis), pit: ylos(hTakaKork), kpl: 1 });
        } else if (huppuTakaKpl === 2) {
          muut.push({ osa: 'Huppu taka 1', lev: ylos(leveys/2 + huplis/2 + sauma*2), pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: ylos(leveys/2 + huplis/2 + sauma*3), pit: ylos(hTakaKork), kpl: 1 });
        } else {
          muut.push({ osa: 'Huppu taka 1', lev: ylos(leveys/3 + huplis/3 + sauma*2), pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: ylos(leveys/3 + huplis/3 + sauma*3), pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 3', lev: ylos(leveys/3 + huplis/3 + sauma*3), pit: ylos(hTakaKork), kpl: 1 });
        }
      } else {
        // Saumatyyppi 1: huptakalis mukana reunapaloissa
        if (huppuTakaKpl === 1) {
          muut.push({ osa: 'Huppu taka', lev: ylos(leveys + sauma*4 + huplis + huptakalis), pit: ylos(hTakaKork), kpl: 1 });
        } else if (huppuTakaKpl === 2) {
          muut.push({ osa: 'Huppu taka 1', lev: ylos(leveys/2 + huplis/2 + huptakalis/2 + sauma*3), pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: ylos(leveys/2 + huplis/2 + huptakalis/2 + sauma*4), pit: ylos(hTakaKork), kpl: 1 });
        } else {
          muut.push({ osa: 'Huppu taka 1', lev: ylos(leveys/3 + huplis/3 + huptakalis/2 + sauma*3), pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 2', lev: ylos(leveys/3 + huplis/3 + sauma*3),                pit: ylos(hTakaKork), kpl: 1 });
          muut.push({ osa: 'Huppu taka 3', lev: ylos(leveys/3 + huplis/3 + huptakalis/2 + sauma*4), pit: ylos(hTakaKork), kpl: 1 });
        }
      }
    }

    // KANSI
    let kansi = null;
    if (hasKansi) {
      kansi = laskeKansi(leveys, suora, v);
      muut.push({ osa: 'Kansi', lev: kansi.aihio.lev, pit: kansi.aihio.pit, kpl: 1 });
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
      kansi,
      geom: {
        korkeuserot, vinomitta, kattokulma_rad, kattokulma_deg, etukulma, takakulma, p10, q9, kaltkorj,
        hEtuKork, hTakaKork, hEtuKorkMerkinta, hTakaKorkMerkinta, hEtuTodellinen, hTakaTodellinen, hSivEtenema,
      },
    };
  }


  // ======================================================================================================
  // HARJAPIIPPU (vaihe 5, 20.11.2026). Piippu on harjalla: puoli 1 ja puoli 2 laskevat eri lappeille.
  // Päätökset: claude/harjapiippu_muistiinpanot.md ja mockup v2 (piippu/harjapiippu-mockup.html), Tomi 18.–20.11.2026.
  //  - kummallekin puolelle oma kattokulma (Excelin S9-bugi korjattu)
  //  - etujuuren pituus Excelin tavalla: (Alas tai tupla) + Eteen piipusta + Alas + nousu (ei lapepiipun +20:tä)
  //  - sivujuurten pituus lapepiipun tavalla: tupla + Alas + Eteen piipusta + vinomitta + nousukorjaus + lisävara (50)
  //  - huppu aina kahdella etukappaleella (etu 1, etu 2), sivut yhtenä tai poikki harjalta (jakosauma)
  //  - hupun sivujen liitosvara (5) kokonaismittaan, puolet kumpaankin päähän; hupun palat ylöspäin täysiin milleihin
  //  - kansi ja hattu leveämmän puolen mukaan, aina yhtä osaa
  //
  // vals: lev1, lev2 (tyhjä = lev1), suora1, suora2, kork1, korkH, kork2, poimu, ylit1V, ylit1O, ylit2V, ylit2O,
  //       k24_1, j25_1, k24_2, j25_2 (Eteen piipusta / Alas kummallekin puolelle), tupla, etulis, nousu, sivulisa,
  //       sauma, huplis, ylareunaV, alatupla, vahennys, hsivlisa, hattulis, sivutJako (1 = yhtenä, 2 = poikki harjalta),
  //       jakosauma, etuJako1, etuJako2 (etukappaleet 1–3 osana; etuJako2 tyhjä = sama kuin etu 1).
  // Rivit kuten lapepiipussa: { osa, lev, pit, kpl } ja hupun sivuissa lisäksi lisa (leikkausmitat tekstinä).
  function laskeHarjapiippu(vals, osat) {
    const v = vals || {};
    const o = osat || {};
    const lev1 = luku(v.lev1);
    const lev2 = (v.lev2 === null || v.lev2 === undefined || v.lev2 === '') ? lev1 : luku(v.lev2);
    const suora1 = luku(v.suora1), suora2 = luku(v.suora2);
    const kork1 = luku(v.kork1), korkH = luku(v.korkH), kork2 = luku(v.kork2);
    const tupla = luku(v.tupla), etulis = luku(v.etulis), nousu = luku(v.nousu), sivulisa = luku(v.sivulisa), poimu = luku(v.poimu);
    const sauma = luku(v.sauma), huplis = luku(v.huplis), ylareunaV = luku(v.ylareunaV), alatupla = luku(v.alatupla);
    const vahennys = luku(v.vahennys), hsivlisa = luku(v.hsivlisa), hattulis = luku(v.hattulis), jako = harjaJakosauma(v);
    const sivutJako = Number(v.sivutJako) === 2 ? 2 : 1;
    const { jako1, jako2 } = harjaEtuJako(v);

    // Kummankin puolen geometria omalla kulmallaan
    const puoli = (suora, kork) => {
      const ero = kork - korkH;
      const kulma = ero > 0 ? Math.atan(suora / ero) : Math.PI / 2;   // kulma pystysuorasta (kuten lapepiipun kattokulma)
      return {
        ero, kulma, kulmaDeg: kulma * 180 / Math.PI, kaltevuusDeg: 90 - kulma * 180 / Math.PI,
        vino: Math.sqrt(suora * suora + ero * ero),
        nousuKomp: Math.tan(kulma) > 0 && ero > 0 ? nousu / Math.tan(kulma) : 0,
        kaltkorj: suora > 0 ? (huplis / 2) * (ero / suora) : 0,
      };
    };
    const p1 = puoli(suora1, kork1), p2 = puoli(suora2, kork2);
    const virheet = [];
    if (!(kork1 > korkH)) virheet.push('Puolen 1 etukorkeuden pitää olla suurempi kuin korkeus harjan kohdalla.');
    if (!(kork2 > korkH)) virheet.push('Puolen 2 etukorkeuden pitää olla suurempi kuin korkeus harjan kohdalla.');

    const juuret = [], muut = [];
    if (o.juuret !== false) {
      [[1, lev1, p1, v.k24_1, v.j25_1, v.ylit1V, v.ylit1O], [2, lev2, p2, v.k24_2, v.j25_2, v.ylit2V, v.ylit2O]].forEach(([n, lev, p, k24x, j25x, vx, ox]) => {
        const k24 = luku(k24x), j25 = luku(j25x);
        juuret.push({ osa: 'Juuri etu ' + n, lev: r(lev + etulis), pit: r((j25 > 0 ? j25 : tupla) + k24 + j25 + nousu), kpl: 1 });
        const sivuPit = tupla + j25 + k24 + p.vino + p.nousuKomp + sivulisa;
        juuret.push({ osa: 'Juuri vasen ' + n, lev: r(tupla + poimu + luku(vx) + nousu), pit: r(sivuPit), kpl: 1 });
        juuret.push({ osa: 'Juuri oikea ' + n, lev: r(tupla + poimu + luku(ox) + nousu), pit: r(sivuPit), kpl: 1 });
      });
    }

    // Huppu. Korkeus pellille sisältää yläreunan ja alatuplan; harjalla ei kaltevuuskorjausta.
    const hE1 = kork1 + ylareunaV + alatupla + p1.kaltkorj - vahennys;
    const hE2 = kork2 + ylareunaV + alatupla + p2.kaltkorj - vahennys;
    const hH = korkH + ylareunaV + alatupla - vahennys;
    // Todelliset korkeudet asennettuna, ilman taitoksia (levityskuva ja Tuotannon kuva)
    const hE1Tod = kork1 + p1.kaltkorj - vahennys, hE2Tod = kork2 + p2.kaltkorj - vahennys, hHTod = korkH - vahennys;
    const sivuL = suora1 + suora2 + sauma * 4 + huplis + hsivlisa;                 // sivukappale yhtenä
    const harjaKohta = sauma * 2 + hsivlisa / 2 + huplis / 2 + suora1;             // harjan kohta sivukappaleen etu 1 -päästä
    if (o.huppu !== false) {
      // Etukappaleet yhtenä tai 2–3 osana kuten lapepiipussa (Tomi 23.11.2026): ensimmäinen osa + 2 × sauma, seuraavat + 3 × sauma
      // (liitokseen sauma + 2 × sauma). Puolilla voi olla eri jako, esim. korkeampi kahtena ja matalampi yhtenä.
      [[1, lev1, hE1, jako1], [2, lev2, hE2, jako2]].forEach(([n, lev, hE, k]) => {
        if (k === 1) { muut.push({ osa: 'Huppu etu ' + n, lev: ylos(lev + sauma * 2 + huplis), pit: ylos(hE), kpl: 1 }); return; }
        for (let i = 1; i <= k; i++) muut.push({ osa: 'Huppu etu ' + n + ' osa ' + i, lev: ylos(lev / k + huplis / k + sauma * (i === 1 ? 2 : 3)), pit: ylos(hE), kpl: 1 });
      });
      if (sivutJako === 1) {
        // Leikkausmitat (kaava, taitokset täysinä) poistettu 23.11.2026 (Tomi): ne olivat 10–20 mm todellista suurempia.
        // Leikkuu tehdään aihion ja levityskuvan merkintäpisteiden mukaan.
        muut.push({ osa: 'Huppu sivut', lev: ylos(sivuL), pit: ylos(Math.max(hE1, hE2)), kpl: 2 });
      } else {
        // Poikki harjalta: etu 1 -puolelle + jakosauma (90° ulos), etu 2 -puolelle + 2 × jakosauma (kiertää sen)
        const L1 = harjaKohta + jako, L2 = (sivuL - harjaKohta) + jako * 2;
        muut.push({ osa: 'Huppu sivu 1', lev: ylos(L1), pit: ylos(hE1), kpl: 2,
          lisa: 'Etu 1 -puoli, jakosauma ' + jako + ' harjan puolella' });
        muut.push({ osa: 'Huppu sivu 2', lev: ylos(L2), pit: ylos(hE2), kpl: 2,
          lisa: 'Etu 2 -puoli, jakosauma ' + (jako * 2) + ' (tupla) harjan puolella' });
      }
    }
    const levMax = Math.max(lev1, lev2), pituus = suora1 + suora2;
    let kansi = null;
    if (o.kansi !== false) {
      kansi = laskeKansi(levMax, pituus, Object.assign({ harja: true }, v));
      muut.push({ osa: 'Kansi', lev: kansi.aihio.lev, pit: kansi.aihio.pit, kpl: 1 });
    }
    if (o.hattu !== false) muut.push({ osa: 'Hattu', lev: r(levMax + hattulis), pit: r(pituus + hattulis), kpl: 1 });

    return {
      juuret, muut, virheet, kansi,
      geom: { lev1, lev2, puoli1: p1, puoli2: p2, hE1, hE2, hH, hE1Tod, hE2Tod, hHTod, sivuL, harjaKohta, sivutJako, etuJako1: jako1, etuJako2: jako2 },
    };
  }

  // Puolen 2 ehdotukset (mockup v2): suora mitta kokonaismitasta, korkeus ja vinomitta puolen 1 kaltevuudesta.
  // tila: { suora2: 'auto' | luku, puoli2: 'auto' | { kork: luku } | { vino: luku } }. Palauttaa { suora2, kork2, vino2, vino1, varoitukset }.
  function harjaPuoli2(vals, tila) {
    const v = vals || {}, t = tila || {};
    const suora1 = luku(v.suora1), kork1 = luku(v.kork1), korkH = luku(v.korkH), koko = luku(v.koko);
    const varoitukset = [];
    const suora2 = t.suora2 === 'auto' || t.suora2 === undefined ? Math.max(0, koko - suora1) : luku(t.suora2);
    if (t.suora2 !== 'auto' && t.suora2 !== undefined && koko > 0 && Math.abs(suora1 + suora2 - koko) > 0.5)
      varoitukset.push('Suorat mitat ' + suora1 + ' + ' + suora2 + ' = ' + (suora1 + suora2) + ' eivät täsmää kokonaismittaan ' + koko + '.');
    const kalt1 = suora1 > 0 ? (kork1 - korkH) / suora1 : 0;
    let kork2;
    const p2 = t.puoli2 || 'auto';
    if (p2 === 'auto') kork2 = korkH + suora2 * kalt1;
    else if (p2.kork !== undefined) kork2 = luku(p2.kork);
    else {
      const vino = luku(p2.vino);
      if (!(vino > suora2)) varoitukset.push('Puolen 2 vinomitan pitää olla pidempi kuin suora mitta.');
      kork2 = korkH + (vino > suora2 ? Math.sqrt(vino * vino - suora2 * suora2) : 0);
    }
    return { suora2, kork2, vino2: Math.hypot(suora2, kork2 - korkH), vino1: Math.hypot(suora1, kork1 - korkH), varoitukset };
  }

  // Harjapiipun etukappaleiden jako (1–3 osaa): etuJako1, etuJako2 (tyhjä = sama kuin etu 1). Vanhat tilaukset: 1.
  function harjaEtuJako(v) {
    const k = x => [1, 2, 3].includes(Number(x)) ? Number(x) : 1;
    const jako1 = k(v && v.etuJako1);
    const j2 = v ? v.etuJako2 : null;
    return { jako1, jako2: j2 === null || j2 === undefined || j2 === '' ? jako1 : k(j2) };
  }

  // Harjapiipun jakosauma (poikki harjalta): tyhjä = sama kuin hupun saumat, jotta saumasäätö muuttaa kaikki saumat
  // (Tomi 23.11.2026). Oma arvo on mahdollinen, jos jonkin piipun harjan liitos tehdään eri tavalla.
  function harjaJakosauma(v) {
    const j = v ? v.jakosauma : null;
    return j === null || j === undefined || j === '' ? luku(v && v.sauma) : luku(j);
  }

  // ======================================================================================================
  // KANSI (vaihe 7b, 23.11.2026). Mockup piippu/kansi-mockup.html, Tomin päätökset 23.11.:
  //  - kannen sisämitta = piipun ulkomitta (muurattu + hupun lisä + 2 × yläreuna, jos yläreuna on käännetty ulos)
  //    + väljyys 5 mm yhteensä (2,5 mm per puoli, jotta kansi liukuu paikalleen)
  //  - reunan taitos vie reunasta T (oletus = hupun yläreunan taitos, yleensä 20): tupla (180° yläreunan taitoksen ympäri, oletus) tai 90° alas
  //  - kulmat: 45° viisto aihion kulmasta T kumpaankin suuntaan (tai suora lovi T × T)
  //  - Tuotannossa piipun ulkomitan voi korvata mitatulla (kansi.mitattu), jolloin kansi ja reiät lasketaan siitä
  //  - reiät 1–8: pyöreä (d) tai suorakulmio (l = vasen–oikea, s = etu–taka). Paikka kummallakin akselilla
  //    'keski' | 'reuna' (reunasta reiän reunaan) | 'keskelle' (reunasta reiän keskelle), mitattuna valitusta reunasta
  //    (vaaka: vasen/oikea, syva: etu/taka) muuratusta piipusta (oletus 24.11.2026 alkaen) tai hupun pellin ulkopinnasta.
  //    Piippu oletetaan kannen keskelle. Karvaus (oletus 7 mm): leikkausviiva karvauksen verran reiän sisällä.
  // vals.kansi = { tyyppi, T, lovi, valjyys, viite, vaaka, syva, reiat: [...], mitattu: { lev, syv } }. Puuttuva = oletus,
  // joten vanhatkin tilaukset laskevat kannen samalla tavalla (aiempi kaava antoi 5 mm liikaa väljyyttä).
  const KANSI_REIKIA_MAX = 8, KARVAUS_R = 30;   // KARVAUS_R: kanttisen reiän leikkausviivan pyöristys, vain kuvaan
  function kansiAsetukset(v) {
    const k = (v && v.kansi) || {};
    const num = (x, d) => { const n = Number(x); return x === null || x === undefined || x === '' || !isFinite(n) ? d : n; };
    const val = (x, sallitut) => sallitut.includes(x) ? x : sallitut[0];
    const mit = k.mitattu || {};
    const pos = x => { const n = Number(x); return x !== null && x !== undefined && x !== '' && isFinite(n) && n > 0 ? n : null; };
    return {
      tyyppi: val(k.tyyppi, ['tupla', '90']),
      // taitoksen oletus = hupun yläreunan taitos ulos (yleensä sama 20 mm, Tomi 23.11.), muuten 20
      T: Math.max(0, num(k.T, (v && (v.ylaTyyppi || 'ulos') === 'ulos' && luku(v.ylareunaV) > 0) ? luku(v.ylareunaV) : 20)),
      lovi: val(k.lovi, ['45', 'suora']),
      valjyys: num(k.valjyys, 5),
      viite: val(k.viite, ['piippu', 'huppu']),   // oletus muurattu piippu (Tomi 24.11.2026), vanhat tilaukset tallensivat valinnan
      vaaka: val(k.vaaka, ['vasen', 'oikea']),
      syva: val(k.syva, ['etu', 'taka']),
      reiat: (Array.isArray(k.reiat) ? k.reiat : []).slice(0, KANSI_REIKIA_MAX).map(r => ({
        muoto: r && r.muoto === 'pyorea' ? 'pyorea' : 'nelio',
        d: num(r && r.d, 150), l: num(r && r.l, 150), s: num(r && r.s, 150),
        vTapa: val(r && r.vTapa, ['keski', 'reuna', 'keskelle']), vMm: num(r && r.vMm, 0),
        sTapa: val(r && r.sTapa, ['keski', 'reuna', 'keskelle']), sMm: num(r && r.sMm, 0),
        karvaus: !(r && r.karvaus === false), karvMm: Math.max(0, num(r && r.karvMm, 7)),
      })),
      mitattu: { lev: pos(mit.lev), syv: pos(mit.syv) },
    };
  }

  // pLev = muurattu piippu vasen–oikea, pSyv = etu–taka (harjapiipussa etu 1 ↔ etu 2). v = vals (huplis, ylareunaV, ylaTyyppi, kansi).
  // Palauttaa { as, L, S, D, yla, aihio: { lev, pit }, reiat, varoitukset }. L ja S: { piippu, laskettu, ulko, huppu, sisa, aihio,
  // viite, viiteSiirto, piippuSiirto }. Reiän u = keskikohta ETU-leikkuureunasta, w = VASEN-leikkuureunasta (mm, tasoaihiossa).
  function laskeKansi(pLev, pSyv, vals) {
    const v = vals || {};
    const as = kansiAsetukset(v);
    const huplis = luku(v.huplis);
    const yla = (v.ylaTyyppi || 'ulos') === 'ulos' ? luku(v.ylareunaV) : 0;
    const D = as.T;
    const akseli = (piippu, mitattu) => {
      const laskettu = piippu + huplis + 2 * yla;
      const ulko = mitattu !== null ? mitattu : laskettu;
      const huppu = ulko - 2 * yla;
      const sisa = ulko + as.valjyys;
      const aihio = sisa + 2 * D;
      const viite = as.viite === 'huppu' ? huppu : piippu;
      return { piippu, laskettu, ulko, huppu, sisa, aihio, viite, viiteSiirto: (sisa - viite) / 2, piippuSiirto: (sisa - piippu) / 2 };
    };
    const L = akseli(luku(pLev), as.mitattu.lev), S = akseli(luku(pSyv), as.mitattu.syv);
    const keskikohta = (tapa, mitta, koko, viite) => tapa === 'keski' ? viite / 2 : tapa === 'reuna' ? mitta + koko / 2 : mitta;
    const reiat = as.reiat.map((r, i) => {
      const dw = r.muoto === 'pyorea' ? r.d : r.l, du = r.muoto === 'pyorea' ? r.d : r.s;
      const cL = L.viiteSiirto + keskikohta(r.vTapa, r.vMm, dw, L.viite);
      const cS = S.viiteSiirto + keskikohta(r.sTapa, r.sMm, du, S.viite);
      const k = r.karvaus ? r.karvMm : 0;
      const leikDw = dw - 2 * k, leikDu = du - 2 * k;
      // Pyöristys pienenee pienessä reiässä (Tomi 24.11.2026: pieni kanttinen reikä näytti pyöreältä): enintään 1/4 lyhyemmästä sivusta
      const rLeik = r.muoto !== 'pyorea' && k > 0 ? Math.max(0, Math.min(KARVAUS_R, Math.min(leikDw, leikDu) / 4)) : 0;
      return {
        nro: i + 1, muoto: r.muoto, dw, du,
        w: D + (as.vaaka === 'vasen' ? cL : L.sisa - cL),
        u: D + (as.syva === 'etu' ? cS : S.sisa - cS),
        karvaus: k, leikDw, leikDu, rLeik, rReika: rLeik > 0 ? rLeik + k : 0,
      };
    });
    const varoitukset = [];
    const pU0 = D + S.piippuSiirto, pU1 = pU0 + S.piippu, pW0 = D + L.piippuSiirto, pW1 = pW0 + L.piippu;
    reiat.forEach(r => {
      const u0 = r.u - r.du / 2, u1 = r.u + r.du / 2, w0 = r.w - r.dw / 2, w1 = r.w + r.dw / 2;
      if (u0 < D || u1 > D + S.sisa || w0 < D || w1 > D + L.sisa) varoitukset.push('Kannen reikä ' + r.nro + ' menee kannen reunan yli.');
      else if (u0 < pU0 - 0.01 || u1 > pU1 + 0.01 || w0 < pW0 - 0.01 || w1 > pW1 + 0.01) varoitukset.push('Kannen reikä ' + r.nro + ' ulottuu muuratun piipun reunan ulkopuolelle. Tarkista mitat.');
      if (r.karvaus && (r.leikDw <= 0 || r.leikDu <= 0)) varoitukset.push('Kannen reikä ' + r.nro + ' on liian pieni karvaukselle.');
    });
    for (let i = 0; i < reiat.length; i++) for (let j = i + 1; j < reiat.length; j++) {
      const p = reiat[i], q = reiat[j];
      const paalle = p.muoto === 'pyorea' && q.muoto === 'pyorea'
        ? Math.hypot(p.u - q.u, p.w - q.w) < (p.dw + q.dw) / 2
        : Math.abs(p.u - q.u) < (p.du + q.du) / 2 && Math.abs(p.w - q.w) < (p.dw + q.dw) / 2;
      if (paalle) varoitukset.push('Kannen reiät ' + p.nro + ' ja ' + q.nro + ' menevät päällekkäin.');
    }
    return { as, L, S, D, yla, harja: !!v.harja, aihio: { lev: ylos(L.aihio), pit: ylos(S.aihio) }, reiat, varoitukset };
  }

  // Reiän alku, keski ja loppu valitusta reunasta: mista = 'leikkuu' (tasoaihion leikkuureuna) tai 'taitettu' (taitettu reuna).
  function kansiReianMitat(r, k, mista) {
    const pois = mista === 'taitettu' ? k.D : 0;
    const cw = (k.as.vaaka === 'vasen' ? r.w : k.L.aihio - r.w) - pois;
    const cu = (k.as.syva === 'etu' ? r.u : k.S.aihio - r.u) - pois;
    return { vAlku: cw - r.dw / 2, vKeski: cw, vLoppu: cw + r.dw / 2, sAlku: cu - r.du / 2, sKeski: cu, sLoppu: cu + r.du / 2 };
  }

  const KPT_PIIPPU = { laskeLapepiippu, laskeHarjapiippu, harjaPuoli2, harjaJakosauma, harjaEtuJako,
    laskeKansi, kansiAsetukset, kansiReianMitat, KANSI_REIKIA_MAX };
  globalThis.KPT_PIIPPU = KPT_PIIPPU;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_PIIPPU;
})();
