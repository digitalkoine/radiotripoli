async function loadJson(path) {
  const embeddedData = globalThis.TRIPOLI_DATA || {};
  const embeddedKey = path.includes('places') ? 'places' : path.includes('memos') ? 'memos' : null;

  if (window.location.protocol === 'file:' && embeddedKey && embeddedData[embeddedKey]) {
    return embeddedData[embeddedKey];
  }

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Errore caricando ${path}: ${res.status}`);
    return res.json();
  } catch (err) {
    if (embeddedKey && embeddedData[embeddedKey]) return embeddedData[embeddedKey];
    throw err;
  }
}

(async function init() {
  const [PLACES, MEMOS] = await Promise.all([
    loadJson('./data/places.json'),
    loadJson('./data/memos.json')
  ]);

  const params = new URLSearchParams(window.location.search);
  const documentLang = document.documentElement.lang.toLowerCase().startsWith('it') ? 'it' : 'en';
  const requestedLang = params.get('lang');
  const lang = requestedLang === 'it' || requestedLang === 'en' ? requestedLang : documentLang;
  const TEXT = {
    it: {
      title: 'Ricordando la Tripoli ebraica',
      intro: "Accendi la radio e attraversa la città: nei punti rossi affiorano le memorie di chi l'ha vissuta, nei punti blu si rivelano altri luoghi della vita ebraica tripolina.",
      radio: 'Radio',
      fit: 'Reset vista',
      basemap: 'Mappa',
      route: 'Filtri',
      legendPlaces: 'Luoghi degli ebrei di Tripoli',
      legendMemos: 'Memorie dei luoghi',
      on: 'ACCESA',
      off: 'SPENTA',
      statusOff: 'Radio spenta. Accendila dal pannello e poi esplora la mappa passando con il mouse.',
      statusPoweredOff: 'Radio spenta.',
      statusPoweredOn: 'Radio accesa. Esplora la mappa passando con il mouse.',
      statusNoWebAudio: 'Il browser non supporta Web Audio.',
      statusAudioBlocked: 'La radio è accesa, ma le interviste non partono. Gli URL audio esterni stanno probabilmente bloccando il playback nel browser.',
      statusMouseOut: 'Mouse fuori dalla mappa: ritorno al silenzio.',
      statusTileFallback: 'Basemap non disponibile: attivato fallback OpenStreetMap.',
      source: 'Fonte',
      activePoint: 'Punto attivo',
      distance: 'Distanza dal mouse',
      radioLevel: 'Radio',
      interviewLevel: 'Intervista',
      modeSilent: 'Silenzio',
      modeRadio: 'Entra la radio',
      modeTuning: 'Sintonizzazione',
      modeClean: 'Segnale pulito',
      mapEsri: 'Inglese / strade',
      mapCarto: 'Chiara OSM',
      mapOsmHot: 'OpenStreetMap locale',
      routeAll: 'Tutti i punti',
      routeCommunity: 'Comunità',
      routeSocial: 'Vita sociale e culturale',
      routeEvents: 'Eventi',
      routeAllIntro: 'Mostra tutti i luoghi e tutte le memorie.',
      routeCommunityIntro: 'Luoghi e memorie della vita comunitaria e religiosa.',
      routeSocialIntro: 'Scuole, cinema, musica, feste e spazi della socialità tripolina.',
      routeEventsIntro: 'Eventi storici, migrazioni e cesure nella vita della comunità.',
      routeHighlight: 'Punti evidenziati',
      routeExplore: 'Esplora liberamente la mappa: i punti del percorso restano in evidenza.',
      routeReset: 'Reset',
      testimony: 'Testimonianza',
      testimonyBy: 'Testimonianza di',
      read: 'Leggi',
      transcript: 'Trascrizione',
      audioClip: 'Audio'
    },
    en: {
      title: 'Remembering Jewish Tripoli',
      intro: 'Turn on the radio and cross the city: at the red points, memories of those who lived it surface; at the blue points, other places of Tripoli Jewish life are revealed.',
      radio: 'Radio',
      fit: 'Reset view',
      basemap: 'Map',
      route: 'Filters',
      legendPlaces: "Places of Tripoli's Jews",
      legendMemos: 'Memories of places',
      on: 'ON',
      off: 'OFF',
      statusOff: 'Radio off. Turn it on from the panel, then explore the map with the mouse.',
      statusPoweredOff: 'Radio off.',
      statusPoweredOn: 'Radio on. Explore the map with the mouse.',
      statusNoWebAudio: 'This browser does not support Web Audio.',
      statusAudioBlocked: 'The radio is on, but the interviews are not starting. The external audio URLs are probably blocking playback in the browser.',
      statusMouseOut: 'Mouse outside the map: returning to silence.',
      statusTileFallback: 'Basemap unavailable: OpenStreetMap fallback enabled.',
      source: 'Source',
      activePoint: 'Active point',
      distance: 'Mouse distance',
      radioLevel: 'Radio',
      interviewLevel: 'Interview',
      modeSilent: 'Silence',
      modeRadio: 'Radio fades in',
      modeTuning: 'Tuning',
      modeClean: 'Clean signal',
      mapEsri: 'English streets',
      mapCarto: 'Light OSM',
      mapOsmHot: 'Local OpenStreetMap',
      routeAll: 'All points',
      routeCommunity: 'Community',
      routeSocial: 'Social and cultural life',
      routeEvents: 'Events',
      routeAllIntro: 'Show all places and all memories.',
      routeCommunityIntro: 'Places and memories of communal and religious life.',
      routeSocialIntro: 'Schools, cinemas, music, parties, and spaces of Tripolitanian social life.',
      routeEventsIntro: 'Historical events, migrations, and turning points in the life of the community.',
      routeHighlight: 'Highlighted points',
      routeExplore: 'Explore the map freely: the route points stay highlighted.',
      routeReset: 'Reset',
      testimony: 'Testimony',
      testimonyBy: 'Testimony by',
      read: 'Read',
      transcript: 'Transcript',
      audioClip: 'Audio'
    }
  };
  const t = key => TEXT[lang][key] || TEXT.it[key] || key;
  const FILTER_BADGES = {
    community: 'C',
    social: 'S',
    events: 'E'
  };

  function filterBadge(key) {
    return FILTER_BADGES[key] || '';
  }

  document.documentElement.lang = lang;
  document.title = lang === 'en'
    ? 'Remembering Jewish Tripoli'
    : 'Ricordando la Tripoli ebraica';

  if (params.has('route')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('route');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function urlWithParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    return url.href;
  }

  function localizeStaticUi() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });

    const langIt = document.getElementById('langIt');
    const langEn = document.getElementById('langEn');
    if (langIt) {
      langIt.href = urlWithParam('lang', 'it');
      langIt.classList.toggle('active', lang === 'it');
    }
    if (langEn) {
      langEn.href = urlWithParam('lang', 'en');
      langEn.classList.toggle('active', lang === 'en');
    }

    const select = document.getElementById('basemapSelect');
    if (select) {
      select.innerHTML = `
        <option value="esri">${t('mapEsri')}</option>
        <option value="carto">${t('mapCarto')}</option>
        <option value="osmHot">${t('mapOsmHot')}</option>
      `;
    }

  }

  function localized(item, itKey, enKey, fallback = '') {
    const primary = lang === 'en' ? item[enKey] : item[itKey];
    const secondary = lang === 'en' ? item[itKey] : item[enKey];
    return String(primary || secondary || item[fallback] || '').trim();
  }

  localizeStaticUi();
  updateStatus(t('statusOff'));

  const map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
    dragging: true
  }).setView([32.8955, 13.1795], 15);

  map.dragging.enable();
  const panelWidth = Math.ceil(document.querySelector('.panel')?.getBoundingClientRect().width || 360);
  const popupOptions = {
    autoPan: true,
    autoPanPaddingTopLeft: L.point(24, 24),
    autoPanPaddingBottomRight: L.point(panelWidth + 32, 24),
    closeButton: true
  };

  const basemaps = {
    esri: () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community',
      maxZoom: 19
    }),
    carto: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }),
    osmHot: () => L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }),
    osmFallback: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20
    })
  };
  const basemapSelect = document.getElementById('basemapSelect');
  let activeBasemapKey = ['esri', 'carto', 'osmHot'].includes(params.get('basemap')) ? params.get('basemap') : 'esri';
  let baseLayer = null;

  function setBasemap(key) {
    activeBasemapKey = basemaps[key] ? key : 'carto';
    if (baseLayer && map.hasLayer(baseLayer)) map.removeLayer(baseLayer);
    baseLayer = basemaps[activeBasemapKey]().addTo(map);
    baseLayer.on('tileerror', () => {
      if (activeBasemapKey === 'osmFallback') return;
      if (baseLayer && map.hasLayer(baseLayer)) map.removeLayer(baseLayer);
      activeBasemapKey = 'osmFallback';
      baseLayer = basemaps.osmFallback().addTo(map);
      updateStatus(t('statusTileFallback'), true);
    });
    if (basemapSelect && basemapSelect.value !== key && key !== 'osmFallback') {
      basemapSelect.value = key;
    }
  }

  setBasemap(activeBasemapKey);

  if (basemapSelect) {
    basemapSelect.value = activeBasemapKey;
    basemapSelect.addEventListener('change', ev => {
      const next = ev.target.value;
      const url = new URL(window.location.href);
      url.searchParams.set('basemap', next);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setBasemap(next);
    });
  }

  const placeIcon = L.divIcon({
    className: '',
    html: '<div class="custom-place-icon"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -8]
  });

  const memoIcon = L.divIcon({
    className: '',
    html: '<div class="custom-memo-icon"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });

  const placesLayer = L.layerGroup().addTo(map);
  const memosLayer = L.layerGroup().addTo(map);
  const placeMarkers = [];
  const allMarkerEntries = [];

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function shortenText(text, maxLength = 190) {
    const content = String(text || '').trim();
    if (!content || content.length <= maxLength) return content;
    const clipped = content.slice(0, maxLength).replace(/\s+\S*$/, '');
    return `${clipped}...`;
  }

  function renderTextBlock(text, className, options = {}) {
    const content = String(text || '').trim();
    if (!content) return '';
    const displayText = options.maxLength ? shortenText(content, options.maxLength) : content;
    return `<div class="${className}"><p>${escapeHtml(displayText)}</p></div>`;
  }

  function renderSource(item) {
    const source = localized(item, 'sourceIt', 'sourceEn', 'source');
    if (!source) return '';
    return `<p class="source"><strong>${t('source')}:</strong> ${escapeHtml(source)}</p>`;
  }

  function witnessName(item) {
    const source = localized(item, 'sourceIt', 'sourceEn', 'source');
    const match = source.match(/(?:Intervista a|Interview with)\s+([^,]+)/i);
    return match ? match[1].trim() : '';
  }

  function renderMemoReadBlock(testimony, source) {
    const transcript = String(testimony || '').trim();
    const sourceText = String(source || '').trim();
    if (!transcript && !sourceText) return '';
    const transcriptBlock = transcript
      ? `<p><strong>${escapeHtml(t('transcript'))}</strong><br>${escapeHtml(transcript)}</p>`
      : '';
    const sourceBlock = sourceText
      ? `<p class="source"><strong>${escapeHtml(t('source'))}:</strong> ${escapeHtml(sourceText)}</p>`
      : '';
    return `
      <details class="popup-reading">
        <summary>${escapeHtml(t('read'))}</summary>
        ${transcriptBlock}
        ${sourceBlock}
      </details>
    `;
  }

  function renderPopup(item, isMemo = false) {
    const location = localized(item, 'locationIt', 'locationEn', 'specificLocation');
    const topic = localized(item, 'topicIt', 'topicEn', 'title');
    const context = localized(item, 'contextIt', 'contextEn', 'description');
    const testimony = localized(item, 'testimonyIt', 'testimonyEn', 'descriptionIt');
    const source = localized(item, 'sourceIt', 'sourceEn', 'source');
    const witness = witnessName(item);
    const years = item.years ? `<div class="meta">${escapeHtml(item.years)}</div>` : '';
    const witnessBlock = isMemo
      ? `<p class="popup-witness">${escapeHtml(witness ? `${t('testimonyBy')} ${witness}` : t('testimony'))}</p>`
      : '';
    const readBlock = isMemo ? renderMemoReadBlock(testimony, source) : renderSource(item);

    return `
      <div class="popup-content">
        <h3>${escapeHtml(location)}</h3>
        ${years}
        ${renderTextBlock(topic, 'popup-topic')}
        ${renderTextBlock(context, 'popup-context', { maxLength: 170 })}
        ${witnessBlock}
        ${readBlock}
      </div>
    `;
  }

  PLACES.forEach(item => {
    const marker = L.marker([item.lon, item.lat], { icon: placeIcon });
    marker.bindPopup(renderPopup(item, false), popupOptions);
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('click', () => { marker.openPopup(); });
    marker.addTo(placesLayer);
    const entry = { item, marker, layer: placesLayer, kind: 'place', routeActive: true };
    placeMarkers.push(entry);
    allMarkerEntries.push(entry);
  });




  const memoMarkers = [];
  const audioElements = [];
  const audioHotspots = [];

  MEMOS.forEach((item, index) => {
    const marker = L.marker([item.lon, item.lat], { icon: memoIcon });
    marker.bindPopup(renderPopup(item, true), popupOptions);
    marker.on('mouseover', () => {
      activeMemoIndex = index;
      marker.openPopup();
    });
    marker.on('click', () => {
      activeMemoIndex = index;
      marker.openPopup();
    });
    marker.on('popupopen', () => {
      activeMemoIndex = index;
    });
    marker.on('popupclose', () => {
      if (activeMemoIndex === index) activeMemoIndex = -1;
    });
    marker.addTo(memosLayer);

    const audio = new Audio(item.audioUrl || '');
    audio.loop = true;
    audio.preload = "metadata";
    audio.playsInline = true;
    audio.volume = 0;
    audioElements.push(audio);

    const hotspot = L.circle([item.lon, item.lat], {
      radius: 260,
      color: '#d64545',
      weight: 1,
      opacity: 0.22,
      fillColor: '#d64545',
      fillOpacity: 0.035,
      interactive: false
    });
    audioHotspots.push(hotspot);

    const entry = {
      item,
      marker,
      layer: memosLayer,
      audio,
      hotspot,
      kind: 'memo',
      routeActive: true
    };
    memoMarkers.push(entry);
    allMarkerEntries.push(entry);
  });

  const hotspotLayer = L.layerGroup(audioHotspots).addTo(map);
  const routeAllBtn = document.getElementById('routeAllBtn');
  const routeToggles = document.getElementById('routeToggles');
  const routeGuide = document.getElementById('routeGuide');
  const routeOrder = ['community', 'social', 'events'];
  const routeText = {
    community: {
      label: t('routeCommunity'),
      intro: t('routeCommunityIntro'),
      filters: ['comunita', 'community']
    },
    social: {
      label: t('routeSocial'),
      intro: t('routeSocialIntro'),
      filters: ['vita sociale e culturale', 'social and cultural life']
    },
    events: {
      label: t('routeEvents'),
      intro: t('routeEventsIntro'),
      filters: ['eventi', 'events']
    }
  };
  const routeState = {
    keys: [...routeOrder],
    entries: allMarkerEntries
  };

  function normalizeFilterValue(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function entryRouteKey(item) {
    const itemFilters = [item.filterIt, item.filterEn].map(normalizeFilterValue);
    return routeOrder.find(key => {
      const route = routeText[key];
      return route.filters.some(filter => itemFilters.includes(filter));
    }) || 'social';
  }

  function isAllRoute() {
    return routeState.keys.length === routeOrder.length;
  }

  function pointCountText(count) {
    if (lang === 'en') return `${count} ${count === 1 ? 'point' : 'points'}`;
    return `${count} ${count === 1 ? 'punto' : 'punti'}`;
  }

  function setSelectedRouteKeys(keys) {
    const uniqueKeys = routeOrder.filter(key => keys.includes(key));
    routeState.keys = uniqueKeys.length ? uniqueKeys : [...routeOrder];
    applyRoute(true);
  }

  function toggleRoute(key) {
    if (!routeText[key]) return;
    if (isAllRoute()) {
      setSelectedRouteKeys([key]);
      return;
    }
    const next = routeState.keys.includes(key)
      ? routeState.keys.filter(item => item !== key)
      : [...routeState.keys, key];
    setSelectedRouteKeys(next);
  }

  function renderRouteControls() {
    if (!routeToggles) return;
    routeToggles.innerHTML = routeOrder.map(key => `
      <button class="route-chip route-${key}" type="button" data-route="${key}" aria-pressed="false">
        <span class="route-chip-icon">${escapeHtml(filterBadge(key))}</span>
        <span class="route-chip-label">${escapeHtml(routeText[key].label)}</span>
        <strong>${allMarkerEntries.filter(entry => entryRouteKey(entry.item) === key).length}</strong>
      </button>
    `).join('');

    routeToggles.querySelectorAll('[data-route]').forEach(button => {
      button.addEventListener('click', () => toggleRoute(button.dataset.route));
    });
    if (routeAllBtn) {
      routeAllBtn.addEventListener('click', () => setSelectedRouteKeys(routeOrder));
    }
  }

  function syncRouteControls() {
    if (routeAllBtn) {
      routeAllBtn.classList.toggle('is-active', isAllRoute());
      routeAllBtn.setAttribute('aria-pressed', String(isAllRoute()));
    }
    if (!routeToggles) return;
    routeToggles.querySelectorAll('[data-route]').forEach(button => {
      const active = !isAllRoute() && routeState.keys.includes(button.dataset.route);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function entryLabel(entry) {
    const location = localized(entry.item, 'locationIt', 'locationEn', 'specificLocation');
    const topic = localized(entry.item, 'topicIt', 'topicEn', 'title');
    return topic && topic !== location ? `${location} · ${topic}` : location;
  }

  function setRouteMarkerIcon(entry, active) {
    const routeKey = entryRouteKey(entry.item);
    const filtered = !isAllRoute();
    const routeClass = filtered && active ? ' in-route' : '';
    const iconText = filtered && active
      ? `<span class="route-icon-badge route-${routeKey}">${escapeHtml(filterBadge(routeKey))}</span>`
      : '';
    const baseClass = entry.kind === 'place' ? 'custom-place-icon' : 'custom-memo-icon';
    const icon = L.divIcon({
      className: '',
      html: `<div class="${baseClass}${routeClass}">${iconText}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10]
    });
    entry.marker.setIcon(icon);
  }

  function updateRouteGuide() {
    if (!routeGuide) return;
    if (isAllRoute()) {
      routeGuide.classList.remove('active');
      routeGuide.innerHTML = '';
      return;
    }

    const selectedLabels = routeState.keys
      .map(key => routeText[key].label)
      .join(' · ');
    const points = routeState.entries
      .map(entry => `<li>${escapeHtml(entryLabel(entry))}</li>`)
      .join('');
    routeGuide.classList.add('active');
    routeGuide.innerHTML = `
      <div class="route-summary">
        <span>${escapeHtml(t('routeHighlight'))}</span>
        <strong>${escapeHtml(pointCountText(routeState.entries.length))}</strong>
      </div>
      <div class="route-selected">${escapeHtml(selectedLabels)}</div>
      <ul class="filter-list">${points}</ul>
    `;
  }

  function applyRoute(refreshAudio = false) {
    routeState.entries = isAllRoute()
      ? allMarkerEntries
      : allMarkerEntries.filter(entry => routeState.keys.includes(entryRouteKey(entry.item)));

    allMarkerEntries.forEach(entry => {
      const active = isAllRoute() || routeState.entries.includes(entry);
      entry.routeActive = active;
      setRouteMarkerIcon(entry, active);

      if (active) {
        if (!entry.layer.hasLayer(entry.marker)) entry.layer.addLayer(entry.marker);
      } else {
        entry.marker.closePopup();
        if (entry.layer.hasLayer(entry.marker)) entry.layer.removeLayer(entry.marker);
        if (entry.audio) entry.audio.volume = 0;
      }

      if (entry.hotspot) {
        if (active) {
          entry.hotspot.setStyle({ opacity: 0.22, fillOpacity: 0.035 });
          if (!hotspotLayer.hasLayer(entry.hotspot)) hotspotLayer.addLayer(entry.hotspot);
        } else if (hotspotLayer.hasLayer(entry.hotspot)) {
          hotspotLayer.removeLayer(entry.hotspot);
        }
      }
    });

    syncRouteControls();
    updateRouteGuide();

    if (refreshAudio && audioEnabled && radioPowered && lastPointerLatLng) {
      updatePointerAudioModel();
    }
  }

  const allBounds = L.featureGroup([...placesLayer.getLayers(), ...memosLayer.getLayers()]).getBounds();
  if (allBounds.isValid()) {
    map.fitBounds(allBounds.pad(0.15));
  }

  renderRouteControls();
  applyRoute();

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (allBounds.isValid()) map.fitBounds(allBounds.pad(0.15));
  });

  let audioEnabled = false;
  let radioPowered = false;
  let unlockTried = false;
  let audioCtx = null;
  let noiseGain = null;
  let noiseNode = null;
  let radioBandpass = null;
  let radioHighpass = null;
  let activeMemoIndex = -1;
  let activePlaceIndex = -1;
  let lastPointerLatLng = null;
  let masterVolume = 0.72;
  let toneValue = 0.55;
  const MAX_INTERVIEW_VOLUME = 0.42;
  const MAX_RADIO_NOISE_VOLUME = 0.075;
  const RADIO_BOOST = 1.45;
  const LISTENING_ZONE_KM = 0.26;

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function updateStatus(text, visible = false) {
    const status = document.getElementById('status');
    if (!status) return;
    status.innerHTML = text;
    status.classList.toggle('is-visible', visible);
  }

  function ensureRadioNoise() {
    if (audioCtx) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;

    audioCtx = new Ctx();

    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    radioBandpass = audioCtx.createBiquadFilter();
    radioBandpass.type = 'bandpass';
    radioBandpass.frequency.value = 1750;
    radioBandpass.Q.value = 0.9;

    radioHighpass = audioCtx.createBiquadFilter();
    radioHighpass.type = 'highpass';
    radioHighpass.frequency.value = 300;

    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0;

    noiseNode.connect(radioBandpass);
    radioBandpass.connect(radioHighpass);
    radioHighpass.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseNode.start();

    return true;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function syncControlKnobs() {
    const volIndicator = document.getElementById('volumeIndicator');
    const toneIndicator = document.getElementById('toneIndicator');
    const volAngle = -45 + (masterVolume * 90);
    const toneAngle = -45 + (toneValue * 90);
    if (volIndicator) volIndicator.style.transform = `rotate(${volAngle}deg)`;
    if (toneIndicator) toneIndicator.style.transform = `rotate(${toneAngle}deg)`;
  }

  function setMasterVolume(v) {
    masterVolume = clamp(v, 0, 1);
    syncControlKnobs();
    if (audioEnabled && radioPowered && lastPointerLatLng) updatePointerAudioModel();
  }

  function setToneValue(v) {
    toneValue = clamp(v, 0, 1);
    syncControlKnobs();

    if (radioBandpass && audioCtx) {
      const bp = 1200 + toneValue * 1800;
      const hp = 160 + toneValue * 260;
      radioBandpass.frequency.setTargetAtTime(bp, audioCtx.currentTime, 0.08);
      radioBandpass.Q.setTargetAtTime(0.7 + toneValue * 0.9, audioCtx.currentTime, 0.08);
      radioHighpass.frequency.setTargetAtTime(hp, audioCtx.currentTime, 0.08);
    }

    if (audioEnabled && radioPowered && lastPointerLatLng) updatePointerAudioModel();
  }

  function bindKnobInteraction(knobId, getter, setter) {
    const knob = document.getElementById(knobId);
    if (!knob) return;

    const startDrag = (startEvent) => {
      startEvent.preventDefault();
      const startY = startEvent.clientY;
      const startValue = getter();

      const move = (ev) => {
        const dy = startY - ev.clientY;
        setter(startValue + dy / 120);
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };

    knob.addEventListener('pointerdown', startDrag);
    knob.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 0.04 : -0.04;
      setter(getter() + delta);
    }, { passive: false });
  }

  function syncNeedle(distanceKm = null) {
    const needle = document.getElementById('tuningNeedle');
    if (!needle) return;
    if (distanceKm === null || !radioPowered) {
      needle.style.left = '58%';
      return;
    }
    const silentKm = 0.34;
    const cleanZoneKm = 0.06;
    const t = Math.max(0, Math.min(1, 1 - ((distanceKm - cleanZoneKm) / (silentKm - cleanZoneKm))));
    const left = 18 + (64 * t);
    needle.style.left = `${left}%`;
  }

  function syncPowerUI() {
    const label = document.getElementById('powerLabel');
    const sw = document.getElementById('powerSwitch');
    const knob = document.getElementById('powerKnob');
    if (sw) sw.checked = !!radioPowered;
    if (label) label.textContent = radioPowered ? t('on') : t('off');
    if (knob) knob.style.left = radioPowered ? '25px' : '3px';
  }

  function powerOffRadio() {
    radioPowered = false;
    stopAllAudios();
    closeAllMemoPopups();
    closeAllPlacePopups();
    syncPowerUI();
    syncNeedle(null);
    updateStatus(t('statusPoweredOff'));
  }

  async function powerOnRadio() {
    if (!audioEnabled) return unlockAudio();

    radioPowered = true;
    syncPowerUI();

    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (e) {
        console.warn('Resume AudioContext fallito', e);
      }
    }

    if (lastPointerLatLng) {
      updatePointerAudioModel();
      updatePlacePopupModel();
    } else {
      updateStatus(t('statusPoweredOn'));
    }
    return true;
  }

  async function unlockAudio() {
    unlockTried = true;

    const ok = ensureRadioNoise();
    if (!ok) {
      updateStatus(t('statusNoWebAudio'), true);
      return false;
    }

    try {
      await audioCtx.resume();
    } catch (e) {
      console.warn('Resume AudioContext fallito', e);
    }

    let started = 0;
    for (const audio of audioElements) {
      if (!audio.src) continue;
      try {
        await audio.play();
        audio.volume = 0;
        started += 1;
      } catch (e) {
        console.warn('Audio non avviato:', audio.src, e);
      }
    }

    audioEnabled = true;
    radioPowered = true;
    syncPowerUI();
    setToneValue(toneValue);
    syncControlKnobs();
    if (lastPointerLatLng) updatePointerAudioModel();

    if (started === 0) {
      updateStatus(t('statusAudioBlocked'), true);
    }
    return true;
  }

  function stopAllAudios() {
    audioElements.forEach(a => { a.volume = 0; });
    if (noiseGain) {
      noiseGain.gain.cancelScheduledValues(audioCtx.currentTime);
      noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.10);
    }
    activeMemoIndex = -1;
  }

  function closeAllMemoPopups() {
    memoMarkers.forEach(entry => entry.marker.closePopup());
  }

  function closeAllPlacePopups() {
    placeMarkers.forEach(entry => entry.marker.closePopup());
  }

  function findNearestMemo(latlng) {
    let nearest = null;
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    memoMarkers.forEach((entry, index) => {
      if (!entry.routeActive) return;
      const d = haversineKm(latlng.lat, latlng.lng, entry.item.lon, entry.item.lat);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = entry;
        nearestIndex = index;
      }
    });

    return { nearest, nearestIndex, nearestDistance };
  }

  function findNearestPlace(latlng) {
    let nearest = null;
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    placeMarkers.forEach((entry, index) => {
      if (!entry.routeActive) return;
      const d = haversineKm(latlng.lat, latlng.lng, entry.item.lon, entry.item.lat);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = entry;
        nearestIndex = index;
      }
    });

    return { nearest, nearestIndex, nearestDistance };
  }

  function updatePlacePopupModel() {
    // I popup degli edifici si aprono solo toccando l'icona col mouse.
    return;
  }

  function updateMemoPopupModel() {
    if (activeMemoIndex < 0 || !lastPointerLatLng) return;
    const activeEntry = memoMarkers[activeMemoIndex];
    if (!activeEntry || !activeEntry.routeActive) {
      if (activeEntry) activeEntry.marker.closePopup();
      activeMemoIndex = -1;
      return;
    }
    const distance = haversineKm(
      lastPointerLatLng.lat,
      lastPointerLatLng.lng,
      activeEntry.item.lon,
      activeEntry.item.lat
    );
    if (distance > LISTENING_ZONE_KM) {
      activeEntry.marker.closePopup();
      activeMemoIndex = -1;
    }
  }

  function updatePointerAudioModel() {
    if (!audioEnabled || !radioPowered || !lastPointerLatLng) return;

    const { nearest, nearestIndex, nearestDistance } = findNearestMemo(lastPointerLatLng);
    if (!nearest) {
      audioElements.forEach(audio => { audio.volume = 0; });
      if (noiseGain && audioCtx) {
        noiseGain.gain.cancelScheduledValues(audioCtx.currentTime);
        noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.10);
      }
      activeMemoIndex = -1;
      syncNeedle(null);
      updateStatus(t('statusPoweredOn'));
      return;
    }

    const silentKm = 0.42;
    const radioZoneKm = LISTENING_ZONE_KM;
    const cleanZoneKm = 0.055;

    let baseRadio = 0;
    let voiceNorm = 0;
    let mode = t('modeSilent');

    if (nearestDistance >= silentKm) {
      baseRadio = 0;
      voiceNorm = 0;
      mode = t('modeSilent');
    } else if (nearestDistance > radioZoneKm) {
      const signalT = 1 - (nearestDistance - radioZoneKm) / (silentKm - radioZoneKm);
      const s = smoothstep(0, 1, signalT);
      // radio più presente già entrando nella zona
      baseRadio = 0.040 * s;
      voiceNorm = 0;
      mode = t('modeRadio');
    } else if (nearestDistance > cleanZoneKm) {
      const signalT = 1 - (nearestDistance - cleanZoneKm) / (radioZoneKm - cleanZoneKm);
      const s = smoothstep(0, 1, signalT);
      // la radio resta percepibile durante la sintonizzazione
      baseRadio = 0.040 - (0.024 * s);
      voiceNorm = 0.10 + (0.78 * s);
      mode = t('modeTuning');
    } else {
      const signalT = 1 - (nearestDistance / cleanZoneKm);
      const s = smoothstep(0, 1, signalT);
      // vicino al punto resta solo una traccia minima di radio
      baseRadio = 0.014 * (1 - s) + 0.0022 * s;
      voiceNorm = 0.88 + (0.12 * s);
      mode = t('modeClean');
    }

    const radioLevel = Math.min(MAX_RADIO_NOISE_VOLUME, baseRadio * (0.7 + 0.95 * masterVolume) * RADIO_BOOST);
    const voiceLevel = MAX_INTERVIEW_VOLUME * masterVolume * voiceNorm;

    audioElements.forEach((a, idx) => {
      a.volume = idx === nearestIndex ? Math.max(0, Math.min(1, voiceLevel)) : 0;
    });

    if (noiseGain && audioCtx) {
      noiseGain.gain.cancelScheduledValues(audioCtx.currentTime);
      noiseGain.gain.setTargetAtTime(radioLevel, audioCtx.currentTime, 0.14);
    }

    syncNeedle(nearestDistance);

    const distMeters = Math.round(nearestDistance * 1000);
    const activeLabel = localized(nearest.item, 'locationIt', 'locationEn', 'title');
    updateStatus(`
      <strong>${mode}</strong><br>
      ${t('activePoint')}: <em>${escapeHtml(activeLabel)}</em><br>
      ${t('distance')}: ${distMeters} m<br>
      ${t('radioLevel')}: ${(radioLevel * 100).toFixed(0)}% · ${t('interviewLevel')}: ${(voiceLevel * 100).toFixed(0)}%
    `);
  }

  document.getElementById('powerSwitch').addEventListener('change', async (ev) => {
    if (ev.target.checked) {
      await powerOnRadio();
    } else {
      powerOffRadio();
    }
  });

  syncPowerUI();
  syncControlKnobs();
  bindKnobInteraction('volumeKnob', () => masterVolume, setMasterVolume);
  bindKnobInteraction('toneKnob', () => toneValue, setToneValue);

  const mapContainer = map.getContainer();

  mapContainer.addEventListener('mousemove', (ev) => {
    const rect = mapContainer.getBoundingClientRect();
    const point = L.point(ev.clientX - rect.left, ev.clientY - rect.top);
    lastPointerLatLng = map.containerPointToLatLng(point);
    updatePlacePopupModel();
    updateMemoPopupModel();
    if (audioEnabled && radioPowered) updatePointerAudioModel();
  });

  mapContainer.addEventListener('mouseleave', () => {
    lastPointerLatLng = null;
    if (audioEnabled && audioCtx) stopAllAudios();
    closeAllMemoPopups();
    closeAllPlacePopups();
    syncNeedle(null);
    updateStatus('');
  });

  map.on('move zoom', () => {
    if (lastPointerLatLng) {
      updatePlacePopupModel();
      updateMemoPopupModel();
      if (audioEnabled && radioPowered) updatePointerAudioModel();
    }
  });

  if (!map.hasLayer(memosLayer)) map.addLayer(memosLayer);
})().catch(err => {
  console.error(err);
  const status = document.getElementById('status');
  if (status) {
    const isEnglish = new URLSearchParams(window.location.search).get('lang') === 'en';
    const localHint = window.location.protocol === 'file:'
      ? (isEnglish
        ? 'If the map stays blank, open <code>http://127.0.0.1:8000/</code> after starting the local server.'
        : 'Se la mappa resta vuota, apri <code>http://127.0.0.1:8000/</code> dopo aver avviato il server locale.')
      : (isEnglish
        ? 'Reload the page or check that Leaflet and the basemap tiles are reachable.'
        : 'Ricarica la pagina o controlla che Leaflet e le tile della mappa siano raggiungibili.');
    status.innerHTML = `${isEnglish ? 'Map loading error.' : 'Errore nel caricamento della mappa.'} ${localHint}`;
    status.classList.add('is-visible');
  }
});
