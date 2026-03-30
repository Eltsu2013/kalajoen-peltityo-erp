Kalajoen Peltityö ERP — Tilanne ja tekolista
Projektin tila (30. maaliskuuta 2026)
---
VALMIS ✅
Varastonhallinta
Tietokantarakenne (Supabase)
Varastorakenne ja -paikat (locations-taulu)
Pellin lisäys, muokkaus, arkistointi, varastopaikan vaihto
Retool desktop UI: Varasto / Kartta / Yhteenveto / Tuotteet välilehdet
Retool mobiili UI: Selaa / Lisää / Muokkaa / Kartta välilehdet
Varastokartta GitHub Pagesissa (interaktiivinen SVG, mobiiliresponsiivinen)
Toinen käyttäjä lisätty (johtaja, viewer-rooli)
Tuotteet-välilehti (lista, suodattimet, lisäys, muokkaus, poisto käytöstä)
ITEM (Kpl) ja BULK (Metri) tyypit käyttöön varastossa
product_code-kenttä lisätty products-tauluun ja funktioihin
GitHub kansiorakenne siistiytyi (docs/, maps/, supabase/functions/)
Supabase unit-arvot päivitetty: mm/Mm → m², m/M → m, kpl/Kpl → kpl
---
Tilausmoduuli (GitHub Pages)
peltipiirturi.html — Mallisto, peltiprofiilien piirtotyökalu
Profiilityypit: Alavesipelti, Alavp 2, Ulkonurkka, Sisänurkka, Jiiripelti, Seinänvieripelti, Eturäystäspelti, Päätypelti, Päätypelti huopa, U-lista u/s, Kynnys, Hattulista, Z-lista, Peitelista, Vapaa profiili
Napit ryhmitelty: MUUT ja KATOLLE osiot
SVG-esikatselu reaaliajassa, pintamerkki, kaato/nousu/etenemä/kokonaismitta
Pituustaulukko (mitta, päät, kok, kpl, huomio)
Aihioleveyslaskenta
Nimike-kenttä muokattavissa ennen tilauksen lisäystä
Tuoteryhmä/materiaali/väri/paksuus-valinta — hakee Supabasesta, suodattuu unit=m² mukaan
Sidebar resize — vetoelementti, muistaa leveyden, 2/3/4 saraketta leveyden mukaan
Kulma-kentät siniharmaina (border + teksti), mitta-kentät normaalit — visuaalinen erottelu
Navigointipalkki (☰ Valikko) — linkit kaikkiin sivuihin ja Retooliin
Korjattu: Alavp 2 näyttää kaaton ja etenemän kuten Alavesipelti
Korjattu: Eturäystäspelti laskee Tippanokka mm ja Tupla B mm mukaan aihioleveyteen
Korjattu: Peruuta-nappi sulkee välilehden oikein (window.close)
vakiomallit.html — Parmaco-vakiomallien piirtotyökalu (yhtenäinen sivu)
Kaikki Parmaco-vakiomallit yhdellä sivulla profiilivalintanapein
Profiilityypit: Ikkunapellit (Yläpelti / Alapelti), Kynnyspelti 1, Alaslaskun kappalista, Hattupelti viipalesaumaan, Ulkoverhouksen katkaisulista, Kattolista, Räystäslista
Yläpelti ja Alapelti: Pythagoraan kaavalla lasketut päät, sama kuin Alavesipelti
Muut profiilit: käyttäjä syöttää Päät itse
Tuoteryhmä/materiaali/väri/paksuus-valinta Supabasesta
Tilaus-palkki headerin alla — Lisää tilaukseen sulkee ikkunan, Peruuta sulkee ikkunan
Sidebar resize, varoitus jos vaihtaa profiilia ja rivejä täytetty
Navigointipalkki (☰ Valikko) — linkit kaikkiin sivuihin ja Retooliin
Korjattu: Alaslaskun kappalista ja Hattupelti piirtyvät oikein (buildUlista-funktio lisätty)
Vanhat erilliset sivut (ylapelti.html jne.) jäävät GitHubiin mutta niitä ei enää käytetä
tilaus.html — tilauslomake
Ryhmät (lisää, kopioi, poista, nimeä uudelleen)
Pellit ryhmitelty aihioleveyden mukaan ryhmän sisällä
Kappalemäärä yhteensä ryhmän otsikossa
Tilauspäivä + toimituspäivä
Asiakkaat haetaan Supabasesta, haku kirjoittamalla
Tilaus tallentuu Supabaseen (orders + order_items)
Pellin muokkaus jälkikäteen Malliston kautta
Materiaali/väri/paksuus valitaan Mallistossa — näkyy tilausrivillä
Kappaletavara-lomake (nimike, pituus m, määrä, yksikkö, huomio)
Sidebar resize — vetoelementti, muistaa leveyden
Avaa Vakiomallit → -nappi sidebarissa ja headerissa
Tuotekohtainen ⧉ Kopioi -nappi jokaisen tuoterivin Muokkaa-napin vieressä
Asiakkaan ✎ Muokkaa -nappi ilmestyy kun asiakas valittu — avaa modaalin

Uusi asiakas -nappi — lisää asiakkaan suoraan tilauksen teon yhteydessä
Asiakasmodaalissa: Asiakasnimi, Yhteyshenkilö, Y-tunnus, Laskutusosoite, Postinumero, Kaupunki, Puhelin, Sähköposti, Sähköposti 2, OVT-numero, Muistiinpanot
Navigointipalkki (☰ Valikko) — linkit kaikkiin sivuihin ja Retooliin
Asiakkaan esivalinta localStorage:sta — asiakkaat.html:stä avattaessa asiakas valitaan automaattisesti
---
Asiakashallinta (GitHub Pages)
asiakkaat.html — asiakashallinta ja -arkisto
Asiakaslista vasemmassa paneelissa, haku nimellä/numerolla/yhteyshenkilöllä/puhelimella
Asiakaskortti oikealla: perustiedot, laskutusosoite, yhteystiedot, OVT, muistiinpanot
4-sarakeinen asettelu isolla näytöllä (cols4-variantit kentille)
Muokkaa/Tallenna/Peruuta-toiminnot — kentät lukittu oletuksena
Arkistoi/Palauta-toiminto (is_active), kolme nappia: Aktiiviset / Arkistoidut / Kaikki
Tilaushistoria asiakaskortin alla — tilausriviä klikkaamalla avautuu tilaus.html
Uusi tilaus -nappi avaa tilaus.html uuteen välilehteen asiakas esivalittuna (localStorage)
Tunnusväri: violetti #a855f7 (erottuu muista sivuista)
Navigointipalkki (☰ Valikko) — linkit kaikkiin sivuihin ja Retooliin
Sidebar resize, logo, yhteinen väripohja
Mobiiliparannukset: media query 700px, right-panel koko ruudulle, "← Takaisin listaan" -nappi
Isompi fontti syöttökentissä (14px) ja readonly-tilassa (15px)
Asiakasnumero luodaan automaattisesti (next_customer_number()), ei muokattavissa
Nimi, osoite ja kaupunki tallennetaan automaattisesti isoilla kirjaimilla
---
Ulkoasu — GitHub Pages -sivut
Yhteinen värimaailma kaikille sivuille: bg=#2e2e38, panel=#3a3a45, border=#555563
Sivukohtaiset tunnusvärit headerissa: tilaus=oranssi (#e8a020), peltipiirturi=sininen (#3a8fe8), vakiomallit=vihreä (#3dba6e), asiakkaat=violetti (#a855f7)
Logo valkoiseksi CSS-filterillä brightness(0) invert(1) kaikilla sivuilla
vakiomallit.html: oikea SVG-logo (aiemmin vain teksti "KPT")
Navigointipalkki kaikilla sivuilla: Asiakkaat / Tilaukset / Varasto (Retool)
Aktiivinen sivu korostettuna valikossa (current-luokka, accent-väri)
---
Supabase — customers-taulu
Lisätty sarakkeet: contact_person, customer_number, email2, ovt_number
Lisätty RLS-politiikat: INSERT ja UPDATE anon-käyttäjälle
next_customer_number() -funktio luotu — antaa seuraavan vapaan asiakasnumeron
Supabase rivi-rajoitus nostettu 10000:een (ALTER ROLE + restart)
4902 asiakasta siirretty Accessista — merkistö latin-1→UTF-8, aktiivisuus käännetty oikein
Nimet, osoitteet ja kaupungit muunnettu isoiksi kirjaimiksi (UPPER)
---
KESKEN / TEKOLISTA ⏳
Pienet karttatyöt
[ ] IN-R-02 klikattavaksi kartalla
[ ] IN-R-01 tasot 1 ja 2 kartalle
[ ] Vasen seinä (IN-L) tarkistus
Tilausmoduuli — viimeistelyä
[ ] Seinänvieripelti: kulma ei toimi oikein — seinälle-viiva pysyy pystysuorana mutta muut viivat eivät seuraa kulmaa. Tarvitsee oman rauhallisen chatin.
tilaus.html — korjaukset (tehdään samalla kertaa)
[ ] newOrderCustomerId-korjaus — asiakas ei siirry automaattisesti kun avataan uusi tilaus asiakkaat.html:stä. Koodi: lue localStorage:sta newOrderCustomerId ja newOrderCustomerName fetchCustomers()-kutsun jälkeen
[ ] openOrderId-lukeminen — kun asiakkaat.html:stä klikataan tilaushistoriasta tilausta, tilaus.html pitää ladata oikea tilaus localStoragen openOrderId-arvon perusteella
Ulkoasu — Retool
[ ] Retool-teemat vaativat business-version — palataan kun otetaan käyttöön
[ ] Suunnitelma valmiina: bg=#2e2e38, primary=#e8a020, välilehtien tunnusvärit (Varasto/Tuotteet=oranssi, Kartta=vihreä, Yhteenveto=harmaa)
Isommat kokonaisuudet
[ ] Kartta + taulukko yhdistäminen Retoolissa
[ ] QR-koodit hyllyihin
[ ] Leikkausoptimointi (rulla → levy → siivu, parent_stock_item_id)
[ ] Laskutus ja maksuseuranta
[ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
[ ] Johtajan resurssioikeudet — vaatii maksullisen Retool-version
---
GitHub Pages — tiedostorakenne (orders/)
Tiedosto	Kuvaus
asiakkaat.html	Asiakashallinta ja -arkisto
tilaus.html	Tilauslomake
peltipiirturi.html	Mallisto — kaikki profiilityypit
vakiomallit.html	Parmaco-vakiomallit — yhtenäinen sivu
ylapelti.html	Vanha erillinen sivu (ei enää käytössä)
alapellit.html	Vanha erillinen sivu (ei enää käytössä)
kynnys1.html	Vanha erillinen sivu (ei enää käytössä)
alaslaskun_kappalista.html	Vanha erillinen sivu (ei enää käytössä)
hattupelti.html	Vanha erillinen sivu (ei enää käytössä)
ulkoverhouksen_katkaisulista.html	Vanha erillinen sivu (ei enää käytössä)
kattolista.html	Vanha erillinen sivu (ei enää käytössä)
raystaslista.html	Vanha erillinen sivu (ei enää käytössä)
---
Ohjeet uuden chat-ketjun aloitukseen
"Jatketaan Kalajoen Peltityö ERP-projektia. Stack: Supabase + Retool + GitHub Pages. Warehouse ID: e56f3534-50f9-4081-8840-f81f03905113. Liitän projektidokumentit. Tänään tehdään: [mitä tehdään]."
---
Tärkeimmät tiedot pikaisesti
Asia	Arvo
Warehouse ID (Verstas)	e56f3534-50f9-4081-8840-f81f03905113
GitHub repo	eltsu2013/kalajoen-peltityo-erp
Kartta	maps/verstaspohja_mitoitettu.html
Asiakkaat	orders/asiakkaat.html
Tilauslomake	orders/tilaus.html
Peltipiirturi	orders/peltipiirturi.html
Vakiomallit	orders/vakiomallit.html
Supabase projekti	hjyeugeqmyavxisndlwp
Supabase anon key	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4
Edge fn: lisää pelti	create_initial_stock_items
Edge fn: muokkaa pelti	adjust_stock_item_edge
Edge fn: hae pellit	get_stock_items
Edge fn: hae tuotteet	get_products
Edge fn: lisää tuote	create_product
Edge fn: muokkaa tuote	update_product
Edge fn: poista tuote	deactivate_product
