# Tripoli Jewish Memory Map

Struttura del progetto:
- `index.html`
- `css/styles.css`
- `js/app.js`
- `data/places.json`
- `data/memos.json`

## Avvio locale consigliato
Per caricare correttamente i file JSON, apri la cartella con un piccolo server locale invece di fare doppio click su `index.html`.

Esempio:

```bash
cd tripoli_memory_map_split
python3 -m http.server 8000
```

Poi apri nel browser:
- `http://localhost:8000`

## Nota
La mappa usa librerie Leaflet e leaflet-providers da CDN.
