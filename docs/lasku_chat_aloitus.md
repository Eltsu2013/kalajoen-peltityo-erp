[lasku_chat_aloitus.md](https://github.com/user-attachments/files/26896073/lasku_chat_aloitus.md)
# Kalajoen Peltityö ERP — Lasku-chat aloitusohje

## Päivitetty: 20. huhtikuuta 2026

---

## Mitä tähän mennessä on tehty

Hinnasto-chatissa sovittiin ja toteutettiin:
- Tietokantaan luotu pricing_list, pricing_fixed, pricing_materials, pricing_bend_surcharge, order_item_prices
- Pural-hinnat (121 riviä) ja kiinteät hinnat (128 riviä) tietokannassa

---

## Laskutus — mitä sovittiin

### Tarjous vs. lasku
- Lähes sama dokumentti, eri otsikko
- **Tarjouksessa:** tekstipohjat (käyttäjä voi lisätä/muokata/valita), rivihinnat voi piilottaa ja näyttää vain kokonaishinta, maksuehto ja muuta kirjoitusta
- **Laskussa:** rivihinnat aina näkyvissä

### Laskun rakenne (malli nykyisestä Accessista)
Laskulla näkyy:
- Logo + yrityksen tiedot
- Asiakkaan tiedot (nimi, osoite, asiakasnumero)
- Laskunumero, ostopäivä, maksuaika (14 pv), eräpäivä, viivästyskorko (8%)
- Rivit: Kohde | Tuote | Pit | Lev | Kpl | A-hinta (alv0%) | Ale% | Yht alv0% | Alv% | Alv | Rivihinta
- Yhteensä: Alv 0% | Alv | YHT
- Tilisiirtokaavake: tilinumero, IBAN, BIC, viitenumero, eräpäivä, summa
- Alatunniste: yrityksen yhteystiedot, Y-tunnus

### Laskunumerointi
- Jatkuu Accessin viimeisestä numerosta (nyt ~22681)
- Viitenumero = laskunumero + suomalainen tarkistesumma (painokerroin 7-3-1)
- EI enää asiakasnumero mukana viitenumerossa

### Laskurivit
- **Automaattinen pohja** tilauksen riveistä — käyttäjä voi muokata ennen lähetystä
- Rivejä voi **lisätä** laskutusvaiheessa (asiakas tilaa lisää hakiessa)
- Rivejä voi **piilottaa** laskulta ja korvata summarivilla (esim. "Piipun pellit 150€")
- **Manuaalinen hinta:** käyttäjä voi korvata koko yksikköhinnan käsin (johtajan laskimella laskettu) — järjestelmä lisää vain ALV päälle
- Hinnat lukittuvat kun lasku lähetetty

### Sähköpostitus
- Järjestelmä generoi PDF:n
- Avautuu sähköpostiviesti asiakkaan osoitteella esitäytettynä, PDF liitteenä
- Käyttäjä tarkistaa ja lähettää itse
- PDF tallennusmahdollisuus myös erikseen (paperilaskua varten)

### Kopiointi
- Laskua kopioitaessa kysytään: **vanhat hinnat vai lasketaan uudelleen nykyisellä hinnastolla**

### Maksuseuranta
- Viitesiirrot ei ole akuutti — lisätään myöhemmin

---

## Aloitusohje uudelle lasku-chatille

"Jatketaan Kalajoen Peltityö ERP-projektia — nyt tehdään laskutussivu (lasku.html). Liitän lasku_chat_aloitus.md ja todo8_4.md. Stack: Supabase + GitHub Pages. Tänään tehdään: [mitä tehdään]."
