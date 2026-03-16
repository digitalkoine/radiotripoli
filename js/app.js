async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Errore caricando ${path}: ${res.status}`);
  return res.json();
}

(async function init() {
  const [PLACES, MEMOS] = await Promise.all([
    loadJson('./data/places.json'),
    loadJson('./data/memos.json')
  ]);

  // Basemap senza API key.

  const map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
    dragging: true
  }).setView([32.8955, 13.1795], 15);

  map.dragging.enable();

  let baseLayer;
  try {
    baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);

    baseLayer.on('tileerror', () => {
      if (baseLayer && map.hasLayer(baseLayer)) map.removeLayer(baseLayer);
      baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20
      }).addTo(map);
      updateStatus('OpenStreetMap HOT non disponibile: attivato fallback OpenStreetMap.');
    });
  } catch (e) {
    baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(map);
    console.warn('OpenStreetMap HOT non disponibile, uso OpenStreetMap.', e);
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

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function trimText(text, max = 280) {
    const t = String(text || '').trim();
    return t.length > max ? t.slice(0, max).trim() + '…' : t;
  }

  PLACES.forEach(item => {
    const marker = L.marker([item.lon, item.lat], { icon: placeIcon });
    const html = `
      <div class="popup-content">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta">${escapeHtml(item.specificLocation || item.todayLocation || '')}</div>
        <p>${escapeHtml(item.description || '')}</p>
        <p><strong>Fonte:</strong> ${escapeHtml(item.source || '')}</p>
      </div>
    `;
    marker.bindPopup(html, { autoPan: false, closeButton: true });
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('mouseout', () => { marker.closePopup(); });
    marker.addTo(placesLayer);
    placeMarkers.push({ item, marker });
  });




  const memoMarkers = [];
  const audioElements = [];
  const audioHotspots = [];

  MEMOS.forEach((item, index) => {
    const marker = L.marker([item.lon, item.lat], { icon: memoIcon });
    const html = `
      <div class="popup-content">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta">
          ${escapeHtml(item.specificLocation || '')}
          ${item.years ? ' · ' + escapeHtml(item.years) : ''}
        </div>
        <p>${escapeHtml(item.descriptionIt || '')}</p>
        <p><strong>Fonte:</strong> ${escapeHtml(item.source || '')}</p>
        ${item.audioUrl ? `<audio controls preload="metadata" src="${escapeHtml(item.audioUrl)}"></audio>` : ''}
      </div>
    `;
    marker.bindPopup(html, { autoPan: false, closeButton: true });
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('mouseout', () => { marker.closePopup(); });
    marker.addTo(memosLayer);

    const audio = new Audio(item.audioUrl || '');
    audio.loop = true;
    audio.preload = "metadata";
    audio.playsInline = true;
    audio.volume = 0;
    audioElements.push(audio);

    memoMarkers.push({ item, marker, audio });

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
  });

  const hotspotLayer = L.layerGroup(audioHotspots).addTo(map);

  const allBounds = L.featureGroup([...placesLayer.getLayers(), ...memosLayer.getLayers()]).getBounds();
  if (allBounds.isValid()) {
    map.fitBounds(allBounds.pad(0.15));
  }

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
  let masterVolume = 1.0;
  let toneValue = 0.55;
  const MAX_INTERVIEW_VOLUME = 0.5;
  const RADIO_BOOST = 2.85;

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
    if (label) label.textContent = radioPowered ? 'ACCESA' : 'SPENTA';
    if (knob) knob.style.left = radioPowered ? '29px' : '3px';
  }

  function powerOffRadio() {
    radioPowered = false;
    stopAllAudios();
    closeAllMemoPopups();
    closeAllPlacePopups();
    syncPowerUI();
    syncNeedle(null);
    updateStatus('Radio spenta.');
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
      updateStatus('Radio accesa. Esplora la mappa passando con il mouse.');
    }
    return true;
  }

  async function unlockAudio() {
    unlockTried = true;

    const ok = ensureRadioNoise();
    if (!ok) {
      updateStatus('Il browser non supporta Web Audio.');
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
      updateStatus('La radio è accesa, ma le interviste non partono. Qui il problema non è il fade: gli URL audio esterni stanno probabilmente bloccando il playback nel browser.');
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
    let mode = 'Silenzio';

    if (nearestDistance >= silentKm) {
      baseRadio = 0;
      voiceNorm = 0;
      mode = 'Silenzio';
    } else if (nearestDistance > radioZoneKm) {
      const t = 1 - (nearestDistance - radioZoneKm) / (silentKm - radioZoneKm);
      const s = smoothstep(0, 1, t);
      // radio più presente già entrando nella zona
      baseRadio = 0.040 * s;
      voiceNorm = 0;
      mode = 'Entra la radio';
    } else if (nearestDistance > cleanZoneKm) {
      const t = 1 - (nearestDistance - cleanZoneKm) / (radioZoneKm - cleanZoneKm);
      const s = smoothstep(0, 1, t);
      // la radio resta percepibile durante la sintonizzazione
      baseRadio = 0.040 - (0.024 * s);
      voiceNorm = 0.10 + (0.78 * s);
      mode = 'Sintonizzazione';
    } else {
      const t = 1 - (nearestDistance / cleanZoneKm);
      const s = smoothstep(0, 1, t);
      // vicino al punto resta solo una traccia minima di radio
      baseRadio = 0.014 * (1 - s) + 0.0022 * s;
      voiceNorm = 0.88 + (0.12 * s);
      mode = 'Segnale pulito';
    }

    const radioLevel = Math.min(0.14, baseRadio * (0.7 + 0.95 * masterVolume) * RADIO_BOOST);
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
    updateStatus(`
      <strong>${mode}</strong><br>
      Punto attivo: <em>${escapeHtml(nearest.item.title)}</em><br>
      Distanza dal mouse: ${distMeters} m<br>
      Radio: ${(radioLevel * 100).toFixed(0)}% · Intervista: ${(voiceLevel * 100).toFixed(0)}%
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
    updateStatus('Mouse fuori dalla mappa: ritorno al silenzio.');
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
    status.innerHTML = 'Errore nel caricamento della mappa. Avvia il progetto con un server locale, ad esempio <code>python3 -m http.server</code>.';
  }
});
