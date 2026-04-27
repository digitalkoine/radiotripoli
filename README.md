# Ricordando la Tripoli ebraica / Remembering Jewish Tripoli

Struttura del progetto:
- `index.html`
- `css/styles.css`
- `js/app.js`
- `data/places.json`
- `data/memos.json`
- `data/app-data.js`

## Link to  the map: https://digitalkoine.github.io/radiotripoli/

## Avvio locale consigliato
La mappa funziona anche aprendo `index.html` direttamente. Per lo sviluppo resta consigliato aprire la cartella con un piccolo server locale.

Esempio:

```bash
cd radiotripoli
python3 -m http.server 8000
```

Poi apri nel browser:
- `http://127.0.0.1:8000/`

## Nota
La mappa usa Leaflet da CDN e i dati del foglio `NEW sample data`.
Le versioni linguistiche si aprono con `?lang=it` e `?lang=en`.
Il basemap predefinito è ArcGIS/Esri World Street Map.
