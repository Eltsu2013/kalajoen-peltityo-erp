Kalajoen Peltityö ERP — Visio ja tavoitteet
Nykytilanne (lähtötilanne ennen ERP:iä)
Työnkulku käytännössä
Asiakas tilaa tuotteen → kirjataan paperille, malli piirretään käsin, mitat ja kääntökulmat käsin
Pellin leveys ja mitat lasketaan päässä tai laskimella paperille
Sopivat pellit mietitään muistista: missä hyllyssä, minkä kokoinen, jääkö huono hukkapala
Pellit leikataan, tilaus "päivitetään" riimuilla ja väkkyröillä
Pellit taivutellaan kanttikoneella, lisätyöt tehdään, tilaus merkataan valmiiksi
Tilaus siirretään laskutukseen, hinnat lasketaan käsin, lasku lähetetään PDF:nä tai postitse
Alkuperäinen tilauspaperi arkistoidaan mappiin, maksuseuranta pankin järjestelmästä käsin
Nykytilanteen ongelmat
Paperit sekavia — mittoja muutellaan, paperi täynnä suttua
Tilauspaperi vain yhdellä käyttäjällä kerrallaan
Laskenta hidasta ja virhealtista
Aikaa kuluu tavaran etsimiseen ja sopivien palojen miettimiseen
Samat luvut lasketaan useaan kertaan eri tarkoituksiin
Varasto käydään läpi jokaista tilausta varten erikseen
Access-järjestelmä 17 vuotta vanha, toimii vain tietokoneilla joihin asennettu
Laskuseuranta manuaalista: pankin viitelaskutuloste vs. laskutusohjelma käsin
---
Uuden järjestelmän tavoitteet
Tavoite 1 — Varastonhallinta
Reaaliaikainen tieto siitä mitä varastossa on. Varasto on hajanainen — peltejä pitkin verstasta eri hyllyissä ja piikeissä. Pihalla myös koppeja, hyllyjä ja varastoja (vesikourut, alastulot, kattoturvatuotteet ym.).
Tavoite 2 — Tilausjärjestelmä + leikkausoptimointi
Järjestelmä hakee materiaalin perusteella varastosta sopivat aihiot ja rullat pienimmällä mahdollisella hukalla. Tilausjärjestelmään merkataan pellin väri, materiaali ja mitat — järjestelmä laskee pellin pituuden ja haun varastosta.
Tavoite 3 — Paperittomuus
Yksi tieto tallennetaan kerran järjestelmään ja se säilyy koko tilauksen etenemisen ajan. Järjestelmä näyttää työvaiheen mukaan tekijälle tarvittavan tiedon — ei mitään ylimääräistä.
Tavoite 4 — Mobiilikäyttö
Työntekijöillä mobiilissa ohjelma, josta näkee tilauksen eri vaiheet ja mitkä pellit missäkin työvaiheessa. Vanhojen tilausten haku helppoa — asiakas pyytää "samanlaista kuin puoli vuotta sitten" → löytyy järjestelmästä, kopioidaan uudeksi tilaukseksi.
Tavoite 5 — Tilausten yhdistäminen
Järjestelmä optimoi useamman tilauksen pellit yhteen — saman värin ja materiaalin tilaukset yhdistetään, jolloin peltihukka vähenee ja työ nopeutuu.
Tavoite 6 — Etäkäyttö
Perjantaina voi kotoa tarkistaa puhelimesta paljonko kourua on autossa jäljellä, tarvitseeko ottaa toinen rulla. Näkee avoimet tilaukset ja varastotilanteen missä tahansa.
Tavoite 7 — Laskutus ja maksuseuranta
Pankin viitesiirrot ajetaan järjestelmään (manuaalisesti tai automaattisesti), ohjelma vertaa viitenumeroita ja merkitsee laskun maksetuksi automaattisesti jos kaikki täsmää. Epäselvät tapaukset käsitellään käsin.
---
Vanha Access-järjestelmä (viitetieto)
Yrityksellä on ollut käytössä 17 vuotta vanha Access-pohjainen laskutus- ja kirjanpitojärjestelmä. Se on toiminut pohjana uudelle järjestelmälle. Sisältää taulut: Asiakkaat, Hinnasto, Laskut, Myynnit, Ostot, Tunnit (työajanseuranta), Työntekijät.
Uudessa järjestelmässä nämä toteutetaan modernisti Supabase-tietokantaan.
---
Toteutusjärjestys (suunniteltu eteneminen)
✅ Varastonhallinta (VALMIS)
⏳ Tilausmoduuli (asiakkaat, tarjoukset, tilaukset)
⏳ Leikkausoptimointi (rulla → levy → siivu, hukkalaskenta)
⏳ Laskutus ja maksuseuranta
⏳ Tilausten yhdistäminen ja optimointi
⏳ Työajanseuranta
