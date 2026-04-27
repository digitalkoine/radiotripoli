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
  const lang = params.get('lang') === 'en' ? 'en' : 'it';
  const TEXT = {
    it: {
      title: 'Tripoli Jewish Memory Map',
      intro: 'Accendi la radio e attraversa la mappa: i punti rossi attivano le testimonianze sonore, i punti blu aprono i luoghi di interesse.',
      radio: 'Radio',
      fit: 'Inquadra punti',
      basemap: 'Mappa',
      route: 'Percorso',
      legendPlaces: 'Luoghi di interesse',
      legendMemos: 'Memorie sui luoghi di interesse',
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
      routeCommunity: 'Abitare la comunità',
      routeEducation: 'Scuola e vita italiana',
      routeSocial: 'Socialità e musica',
      routeDeparture: 'Partire da Tripoli',
      routeAllIntro: 'Mostra tutti i luoghi e tutte le memorie.',
      routeCommunityIntro: 'Dalla hara ai riti e ai luoghi comunitari: la città come spazio quotidiano e religioso.',
      routeEducationIntro: 'Scuole, gallerie e istituzioni italiane: il rapporto tra formazione, città coloniale e vita ebraica.',
      routeSocialIntro: 'Feste, musica, hotel e incontri: la Tripoli delle relazioni e del tempo libero.',
      routeDepartureIntro: 'Il porto come soglia: migrazione, separazione e ricomposizione della comunità.',
      routeHighlight: 'Punti evidenziati',
      routeExplore: 'Esplora liberamente la mappa: i punti del percorso restano in evidenza.',
      routeReset: 'Reset',
      testimony: 'Testimonianza',
      audioClip: 'Audio'
    },
    en: {
      title: 'Tripoli Jewish Memory Map',
      intro: 'Turn on the radio and move across the map: red points trigger audio memories, blue points open places of interest.',
      radio: 'Radio',
      fit: 'Fit points',
      basemap: 'Map',
      route: 'Route',
      legendPlaces: 'Places of interest',
      legendMemos: 'Memories about places of interest',
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
      routeCommunity: 'Living the community',
      routeEducation: 'School and Italian life',
      routeSocial: 'Social life and music',
      routeDeparture: 'Leaving Tripoli',
      routeAllIntro: 'Show all places and all memories.',
      routeCommunityIntro: 'From the hara to rituals and community places: the city as everyday and religious space.',
      routeEducationIntro: 'Schools, galleries, and Italian institutions: education, the colonial city, and Jewish life.',
      routeSocialIntro: 'Parties, music, hotels, and encounters: Tripoli as a social city.',
      routeDepartureIntro: 'The port as a threshold: migration, separation, and the community’s recomposition.',
      routeHighlight: 'Highlighted points',
      routeExplore: 'Explore the map freely: the route points stay highlighted.',
      routeReset: 'Reset',
      testimony: 'Testimony',
      audioClip: 'Audio'
    }
  };
  const t = key => TEXT[lang][key] || TEXT.it[key] || key;
  const ROUTE_COLORS = {
    community: '#86d0bd',
    education: '#f0c76c',
    social: '#d7a0df',
    departure: '#9bb9e9'
  };

  function routeColor(key) {
    return ROUTE_COLORS[key] || '#ffe69a';
  }

  function routeIconSvg(key) {
    const icons = {
      community: `
        <path d="M3.2 12.2V7.4L8 3.3l4.8 4.1v4.8" />
        <path d="M6.3 12.2V8.7h3.4v3.5" />
        <path d="M2.3 12.2h11.4" />
      `,
      education: `
        <path d="M3.2 4.2c1.7-.8 3.3-.8 4.8 0v8.2c-1.5-.8-3.1-.8-4.8 0V4.2z" />
        <path d="M8 4.2c1.5-.8 3.1-.8 4.8 0v8.2c-1.7-.8-3.3-.8-4.8 0V4.2z" />
        <path d="M8 4.2v8.2" />
      `,
      social: `
        <path d="M9.3 3.6v6.6" />
        <path d="M9.3 4.6l3.5-.9v2.4L9.3 7" />
        <circle cx="6.5" cy="10.9" r="1.7" />
      `,
      departure: `
        <path d="M4.1 9.4h7.8l-1.3 2H5.4L4.1 9.4z" />
        <path d="M6 9.4V5.5h3.1l2 2H7.8" />
        <path d="M3.2 12.7c.8.4 1.6.4 2.4 0 .8.4 1.6.4 2.4 0 .8.4 1.6.4 2.4 0 .8.4 1.6.4 2.4 0" />
      `
    };
    const icon = icons[key] || icons.community;
    return `<svg class="route-icon-svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${icon}</svg>`;
  }

  document.documentElement.lang = lang;
  document.title = lang === 'en'
    ? 'Tripoli Jewish Memory Map – audio prototype'
    : 'Tripoli Jewish Memory Map – prototipo audio';

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

    const routeSelect = document.getElementById('routeSelect');
    if (routeSelect) {
      routeSelect.innerHTML = `
        <option value="all">${t('routeAll')}</option>
        <option value="community">${t('routeCommunity')}</option>
        <option value="education">${t('routeEducation')}</option>
        <option value="social">${t('routeSocial')}</option>
        <option value="departure">${t('routeDeparture')}</option>
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
      updateStatus(t('statusTileFallback'));
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

  function renderDetailsBlock(label, text, className) {
    const content = String(text || '').trim();
    if (!content) return '';
    return `
      <details class="${className}">
        <summary>${escapeHtml(label)}</summary>
        <p>${escapeHtml(content)}</p>
      </details>
    `;
  }

  function renderPopup(item, isMemo = false) {
    const location = localized(item, 'locationIt', 'locationEn', 'specificLocation');
    const topic = localized(item, 'topicIt', 'topicEn', 'title');
    const context = localized(item, 'contextIt', 'contextEn', 'description');
    const testimony = localized(item, 'testimonyIt', 'testimonyEn', 'descriptionIt');
    const years = item.years ? `<div class="meta">${escapeHtml(item.years)}</div>` : '';
    const testimonyBlock = isMemo
      ? renderDetailsBlock(t('testimony'), testimony, 'popup-testimony')
      : '';
    const audio = isMemo && item.audioUrl
      ? `<details class="popup-audio"><summary>${escapeHtml(t('audioClip'))}</summary><audio controls preload="metadata" src="${escapeHtml(item.audioUrl)}"></audio></details>`
      : '';

    return `
      <div class="popup-content">
        <h3>${escapeHtml(location)}</h3>
        ${years}
        ${renderTextBlock(topic, 'popup-topic')}
        ${renderTextBlock(context, 'popup-context', { maxLength: 170 })}
        ${testimonyBlock}
        ${renderSource(item)}
        ${audio}
      </div>
    `;
  }

  PLACES.forEach(item => {
    const marker = L.marker([item.lon, item.lat], { icon: placeIcon });
    marker.bindPopup(renderPopup(item, false), popupOptions);
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('click', () => { marker.openPopup(); });
    marker.addTo(placesLayer);
    const entry = { item, marker, kind: 'place' };
    placeMarkers.push(entry);
    allMarkerEntries.push(entry);
  });




  const memoMarkers = [];
  const audioElements = [];
  const audioHotspots = [];

  MEMOS.forEach((item, index) => {
    const marker = L.marker([item.lon, item.lat], { icon: memoIcon });
    marker.bindPopup(renderPopup(item, true), popupOptions);
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('click', () => { marker.openPopup(); });
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

    const entry = { item, marker, audio, hotspot, kind: 'memo' };
    memoMarkers.push(entry);
    allMarkerEntries.push(entry);
  });

  const hotspotLayer = L.layerGroup(audioHotspots).addTo(map);
  const routeRenderer = L.svg({ padding: 0.5 });
  const routeLineHalo = L.polyline([], {
    renderer: routeRenderer,
    color: '#2a1b0f',
    weight: 9,
    opacity: 0,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false
  }).addTo(map);
  const routeLine = L.polyline([], {
    renderer: routeRenderer,
    color: '#ffe69a',
    weight: 4,
    opacity: 0,
    dashArray: '10 8',
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false
  }).addTo(map);
  const routeSelect = document.getElementById('routeSelect');
  const routeResetBtn = document.getElementById('routeResetBtn');
  const routeGuide = document.getElementById('routeGuide');
  const routeState = {
    key: 'all',
    entries: allMarkerEntries
  };
  const routeText = {
    community: {
      label: t('routeCommunity'),
      intro: t('routeCommunityIntro'),
      keywords: ['vita comunitaria', 'community life', 'hara', 'rituali', 'ritual', 'cimitero', 'cemetery']
    },
    education: {
      label: t('routeEducation'),
      intro: t('routeEducationIntro'),
      keywords: ['scuola', 'school', 'scuole', 'education', 'dante', 'roma', 'galleria de bono', 'de bono gallery']
    },
    social: {
      label: t('routeSocial'),
      intro: t('routeSocialIntro'),
      keywords: ['vita sociale', 'social life', 'hotel waddan', 'via g. collu', 'music', 'musica', 'galleria de bono', 'de bono gallery']
    },
    departure: {
      label: t('routeDeparture'),
      intro: t('routeDepartureIntro'),
      keywords: ['migrazione', 'migration', 'porto', 'port']
    }
  };

  function searchableText(item) {
    return [
      item.locationIt,
      item.locationEn,
      item.topicIt,
      item.topicEn,
      item.todayLocation,
      item.title
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function routeMatches(item, key) {
    if (key === 'all') return true;
    const route = routeText[key];
    if (!route) return true;
    const text = searchableText(item);
    return route.keywords.some(keyword => text.includes(keyword));
  }

  function entryLabel(entry) {
    const location = localized(entry.item, 'locationIt', 'locationEn', 'specificLocation');
    const topic = localized(entry.item, 'topicIt', 'topicEn', 'title');
    return topic && topic !== location ? `${location} · ${topic}` : location;
  }

  function setRouteMarkerIcon(entry, routeKey, active) {
    const routeClass = routeKey !== 'all' && active ? ' in-route' : '';
    const dimClass = routeKey !== 'all' && !active ? ' dimmed-route' : '';
    const iconText = routeKey !== 'all' && active
      ? `<span class="route-icon-badge route-${routeKey}">${routeIconSvg(routeKey)}</span>`
      : '';
    const baseClass = entry.kind === 'place' ? 'custom-place-icon' : 'custom-memo-icon';
    const icon = L.divIcon({
      className: '',
      html: `<div class="${baseClass}${routeClass}${dimClass}">${iconText}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10]
    });
    entry.marker.setIcon(icon);
  }

  function updateRouteGuide() {
    if (!routeGuide) return;
    if (routeState.key === 'all') {
      routeGuide.classList.remove('active');
      routeGuide.innerHTML = '';
      return;
    }

    const route = routeText[routeState.key];
    const points = routeState.entries.map(entry => entryLabel(entry)).join(' · ');
    routeGuide.classList.add('active');
    routeGuide.innerHTML = `
      <div class="route-guide-title"><span class="route-guide-icon route-${routeState.key}">${routeIconSvg(routeState.key)}</span>${escapeHtml(route.label)}</div>
      <div>${escapeHtml(route.intro)}</div>
      <div class="route-guide-step">${escapeHtml(t('routeExplore'))}</div>
      <div class="route-points">${escapeHtml(t('routeHighlight'))}: ${escapeHtml(points)}</div>
    `;
  }

  function applyRoute(key, fitSelection = false) {
    routeState.key = routeText[key] ? key : 'all';
    routeState.entries = allMarkerEntries.filter(entry => routeMatches(entry.item, routeState.key));

    allMarkerEntries.forEach(entry => {
      const active = routeState.key === 'all' || routeState.entries.includes(entry);
      entry.marker.setOpacity(active ? 1 : 0.22);
      setRouteMarkerIcon(entry, routeState.key, active);
      if (entry.hotspot) {
        entry.hotspot.setStyle({
          opacity: active ? 0.22 : 0.05,
          fillOpacity: active ? 0.035 : 0.008
        });
      }
    });

    if (routeSelect && routeSelect.value !== routeState.key) routeSelect.value = routeState.key;
    if (routeResetBtn) routeResetBtn.disabled = routeState.key === 'all';
    updateRouteGuide();

    if (routeState.key === 'all' || routeState.entries.length < 2) {
      routeLineHalo.setLatLngs([]);
      routeLineHalo.setStyle({ opacity: 0 });
      routeLine.setLatLngs([]);
      routeLine.setStyle({ opacity: 0 });
    } else {
      const routeLatLngs = routeState.entries.map(entry => entry.marker.getLatLng());
      routeLineHalo.setLatLngs(routeLatLngs);
      routeLine.setLatLngs(routeLatLngs);
      routeLineHalo.setStyle({ opacity: 0.55 });
      routeLine.setStyle({ color: routeColor(routeState.key), opacity: 0.98 });
      routeLineHalo.bringToFront();
      routeLine.bringToFront();
    }

    if (routeState.key === 'all') {
      closeAllMemoPopups();
      closeAllPlacePopups();
      if (fitSelection && allBounds.isValid()) map.fitBounds(allBounds.pad(0.15));
    } else if (fitSelection && routeState.entries.length) {
      const routeBounds = L.featureGroup(routeState.entries.map(entry => entry.marker)).getBounds();
      if (routeBounds.isValid()) map.fitBounds(routeBounds.pad(0.25));
    }
  }

  const allBounds = L.featureGroup([...placesLayer.getLayers(), ...memosLayer.getLayers()]).getBounds();
  if (allBounds.isValid()) {
    map.fitBounds(allBounds.pad(0.15));
  }

  if (routeSelect) {
    const requestedRoute = params.get('route') || 'all';
    routeSelect.value = routeText[requestedRoute] ? requestedRoute : 'all';
    routeSelect.addEventListener('change', ev => {
      const next = ev.target.value;
      const url = new URL(window.location.href);
      if (next === 'all') url.searchParams.delete('route');
      else url.searchParams.set('route', next);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      applyRoute(next, false);
    });
  }

  if (routeResetBtn) {
    routeResetBtn.addEventListener('click', () => {
      if (routeSelect) routeSelect.value = 'all';
      const url = new URL(window.location.href);
      url.searchParams.delete('route');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      applyRoute('all', true);
    });
  }

  applyRoute(routeSelect ? routeSelect.value : 'all', false);

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

  function updateStatus(text) {
    document.getElementById('status').innerHTML = text;
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
      updateStatus(t('statusNoWebAudio'));
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
      updateStatus(t('statusAudioBlocked'));
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

  function updatePointerAudioModel() {
    if (!audioEnabled || !radioPowered || !lastPointerLatLng) return;

    const { nearest, nearestIndex, nearestDistance } = findNearestMemo(lastPointerLatLng);
    if (!nearest) return;

    const silentKm = 0.42;
    const radioZoneKm = 0.26;
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
    if (audioEnabled && radioPowered) updatePointerAudioModel();
  });

  mapContainer.addEventListener('mouseleave', () => {
    lastPointerLatLng = null;
    if (audioEnabled && audioCtx) stopAllAudios();
    closeAllMemoPopups();
    closeAllPlacePopups();
    syncNeedle(null);
    updateStatus(t('statusMouseOut'));
  });

  map.on('move zoom', () => {
    if (lastPointerLatLng) {
      updatePlacePopupModel();
      if (audioEnabled && radioPowered) updatePointerAudioModel();
    }
  });

  // Mostra i popup delle memorie solo da uno zoom medio in su
  function updateMemoVisibility() {
    const z = map.getZoom();
    if (z >= 14) {
      if (!map.hasLayer(memosLayer)) map.addLayer(memosLayer);
    } else {
      if (map.hasLayer(memosLayer)) map.removeLayer(memosLayer);
    }
  }
  map.on('zoomend', updateMemoVisibility);
  updateMemoVisibility();
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
  }
});
