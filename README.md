# Ricordando la Tripoli ebraica / Remembering Jewish Tripoli

Struttura del progetto:
- `index.html`
- `index-it.html`
- `css/styles.css`
- `js/app.js`
- `data/places.json`
- `data/memos.json`
- `data/app-data.js`

## Link to  the map: https://digitalkoine.github.io/radiotripoli/

La home `index.html` apre la versione inglese. La versione italiana è disponibile in `index-it.html`, così il sito può collegare direttamente la mappa corretta in base alla lingua selezionata.

## Avvio locale consigliato
La mappa funziona anche aprendo `index.html` direttamente. Per lo sviluppo resta consigliato aprire la cartella con un piccolo server locale.

Esempio:

```bash
cd radiotripoli
python3 -m http.server 8000
```

Poi apri nel browser:
- inglese: `http://127.0.0.1:8000/`
- italiano: `http://127.0.0.1:8000/index-it.html`

## Nota
La mappa usa Leaflet da CDN e i dati del foglio `NEW sample data`.
Le versioni linguistiche principali sono `index.html` (inglese) e `index-it.html` (italiano). I parametri `?lang=it` e `?lang=en` restano disponibili come override tecnico.
Il basemap predefinito è ArcGIS/Esri World Street Map.
