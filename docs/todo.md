Kalajoen Peltityö ERP — Tilanne ja tekolista
Projektin tila (27. maaliskuuta 2026)
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
Tilausmoduuli (GitHub Pages)
peltipiirturi.html — peltiprofiilien piirtotyökalu (Mallisto)
Profiilityypit: Alavesipelti, Alavp 2, Ulkonurkka, Sisänurkka, Jiiripelti, Seinänvieripelti, Eturäystäspelti, Päätypelti, Päätypelti huopa, U-lista u/s, Kynnys, Hattulista, Z-lista, Peitelista, Vapaa profiili
Napit ryhmitelty: MUUT ja KATOLLE osiot
SVG-esikatselu reaaliajassa, pintamerkki, kaato/nousu/etenemä/kokonaismitta
Pituustaulukko (mitta, päät, kok, kpl, huomio)
Aihioleveyslaskenta
Nimike-kenttä muokattavissa ennen tilauksen lisäystä
Tuoteryhmä/materiaali/väri/paksuus-valinta — hakee Supabasesta, suodattuu unit=m² mukaan
Sidebar resize — vetoelementti, muistaa leveyden, 2/3/4 saraketta leveyden mukaan
Kulma-kentät siniharmaina (border + teksti), mitta-kentät normaalit — visuaalinen erottelu
KORJATTU: Alavp 2 näyttää kaaton ja etenemän kuten Alavesipelti
KORJATTU: Eturäystäspelti laskee Tippanokka mm ja Tupla B mm mukaan aihioleveyteen
KORJATTU: Peruuta-nappi sulkee välilehden oikein (window.close)
vakiomallit.html — Parmaco-vakiomallien piirtotyökalu (yhtenäinen sivu)
Kaikki Parmaco-vakiomallit yhdellä sivulla profiilivalintanapein
Profiilityypit: Ikkunapellit (Yläpelti / Alapelti), Kynnyspelti 1, Alaslaskun kappalista, Hattupelti viipalesaumaan, Ulkoverhouksen katkaisulista, Kattolista, Räystäslista
Yläpelti ja Alapelti: Pythagoraan kaavalla lasketut päät, sama kuin Alavesipelti
Muut profiilit: käyttäjä syöttää Päät itse
Tuoteryhmä/materiaali/väri/paksuus-valinta Supabasesta
Tilaus-palkki headerin alla — Lisää tilaukseen sulkee ikkunan, Peruuta sulkee ikkunan
Sidebar resize, varoitus jos vaihtaa profiilia ja rivejä täytetty
KORJATTU: Alaslaskun kappalista ja Hattupelti piirtyvät oikein (buildUlista-funktio lisätty)
Vanhat erilliset sivut (ylapelti.html, alapellit.html jne.) jäävät GitHubiin mutta niitä ei enää käytetä
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
Ulkoasu — GitHub Pages -sivut
Yhteinen värimaailma kaikille kolmelle sivulle (tumma antrasiitti, sinertävä sävy)
Sivukohtaiset tunnusvärit: tilaus=oranssi viiva, peltipiirturi=sininen viiva, vakiomallit=vihreä viiva
Logo valkoiseksi CSS-filterillä (brightness(0) invert(1)) kaikilla sivuilla
vakiomallit.html: oikea SVG-logo lisätty (aiemmin vain teksti "KPT")
Väripaletti dokumentoitu: bg=#2e2e38, panel=#3a3a45, border=#555563, accent=#e8a020 (oranssi säilyy)
Supabase — customers-taulu päivitykset
Lisätty sarakkeet: contact_person, customer_number, email2, ovt_number
Lisätty RLS-politiikat: INSERT ja UPDATE anon-käyttäjälle
Lisätty Uusi asiakas -nappi
KESKEN / TEKOLISTA ⏳
Pienet karttatyöt
[ ] IN-R-02 klikattavaksi kartalla
[ ] IN-R-01 tasot 1 ja 2 kartalle
[ ] Vasen seinä (IN-L) tarkistus
Tilausmoduuli — viimeistelyä

[ ] Asiakkaat-sivu (erillinen hallintasivu) — perusmuokkaus toimii jo tilaus.html:stä
[ ] Access-siirto asiakkaat — notes-sarakkeessa on yhteyshenkilötietoja vanhoilta asiakkailta, siirron yhteydessä pitää siirtää notes → contact_person oikeille asiakkaille
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
[ ] Access-siirto asiakkaat
---
GitHub Pages — tiedostorakenne (orders/)
Tiedosto	Kuvaus
peltipiirturi.html	Mallisto — kaikki profiilityypit
vakiomallit.html	Parmaco-vakiomallit — yhtenäinen sivu
tilaus.html	Tilauslomake
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
Peltipiirturi	orders/peltipiirturi.html
Vakiomallit	orders/vakiomallit.html
Tilauslomake	orders/tilaus.html
Supabase projekti	hjyeugeqmyavxisndlwp
Supabase anon key	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4
Edge fn: lisää pelti	create_initial_stock_items
Edge fn: muokkaa	adjust_stock_item_edge
Edge fn: hae pellit	get_stock_items
Edge fn: hae tuotteet	get_products
Edge fn: lisää tuote	create_product
Edge fn: muokkaa tuote	update_product
Edge fn: poista tuote	deactivate_product
