// 역사/신화 지도 엔진 — v1 (그리스 신화: 오디세우스의 항해)
// 이 파일은 데이터 형식(스키마)이 같다면 다른 이야기(예: 임진왜란)에도
// data 경로만 바꿔서 재사용할 수 있도록 작성되어 있습니다.

const DATA_PATHS = {
  places: 'data/greek/places.json',
  narrative: 'data/greek/narrative.json',
};

const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron';

async function loadData() {
  const [places, narrative] = await Promise.all([
    fetch(DATA_PATHS.places).then((r) => r.json()),
    fetch(DATA_PATHS.narrative).then((r) => r.json()),
  ]);
  const placeById = Object.fromEntries(places.map((p) => [p.id, p]));
  return { places, narrative, placeById };
}

function confidenceLabel(c) {
  return { certain: '실증 확인', traditional: '전통적 비정', disputed: '위치 논쟁' }[c] || c;
}

async function init() {
  const { narrative, placeById } = await loadData();

  document.getElementById('figure-name').textContent = narrative.figure;
  document.getElementById('source-work').textContent = narrative.source_work;

  const toggle = document.getElementById('name-toggle');
  let showAncient = !toggle.checked; // 체크 해제 = 고대 지명 우선 표시 (기본값)

  const map = new maplibregl.Map({
    container: 'map',
    style: BASE_STYLE,
    center: [16, 38.5],
    zoom: 4.3,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  const markers = {};

  function buildPopupHTML(place, step) {
    const primary = showAncient ? place.ancient_name : place.modern_name;
    const secondary = showAncient ? place.modern_name : place.ancient_name;
    return `
      <p class="popup-ancient">${primary}</p>
      <p class="popup-modern">${secondary}</p>
      <p class="popup-desc">${step.event}</p>
      <p class="popup-source">${place.source}</p>
    `;
  }

  function refreshPopups() {
    narrative.sequence.forEach((step) => {
      const place = placeById[step.place_id];
      const popup = markers[step.step].marker.getPopup();
      popup.setHTML(buildPopupHTML(place, step));
    });
  }

  function renderLog() {
    const list = document.getElementById('log-list');
    list.innerHTML = '';
    narrative.sequence.forEach((step) => {
      const place = placeById[step.place_id];
      const primary = showAncient ? place.ancient_name : place.modern_name;
      const secondary = showAncient ? place.modern_name : place.ancient_name;
      const li = document.createElement('li');
      li.className = 'log-item';
      li.dataset.step = step.step;
      li.innerHTML = `
        <span class="step-num">${step.step}</span>
        <div>
          <span class="place-name">${primary}</span><span class="place-modern">${secondary}</span>
        </div>
        <div class="event">${step.event}</div>
        <span class="confidence-tag confidence-${place.confidence}">${confidenceLabel(place.confidence)}</span>
      `;
      li.addEventListener('click', () => selectStep(step.step));
      list.appendChild(li);
    });
  }

  function selectStep(stepNum) {
    document.querySelectorAll('.log-item').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.step) === stepNum);
    });
    Object.entries(markers).forEach(([num, m]) => {
      m.el.classList.toggle('active', Number(num) === stepNum);
    });
    const step = narrative.sequence.find((s) => s.step === stepNum);
    const place = placeById[step.place_id];
    map.flyTo({ center: place.coords, zoom: 6.2, duration: 900 });
    markers[stepNum].marker.togglePopup();
  }

  map.on('load', () => {
    // 항로 레이어 (내러티브 레이어)
    const coords = narrative.sequence.map((s) => placeById[s.place_id].coords);
    map.addSource('voyage-route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    });
    map.addLayer({
      id: 'voyage-route-glow',
      type: 'line',
      source: 'voyage-route',
      paint: { 'line-color': '#c08a3e', 'line-width': 4, 'line-opacity': 0.15 },
    });
    map.addLayer({
      id: 'voyage-route-line',
      type: 'line',
      source: 'voyage-route',
      paint: { 'line-color': '#c08a3e', 'line-width': 1.4, 'line-dasharray': [2, 2] },
    });

    // 지명 마커 (시대 오버레이 레이어)
    narrative.sequence.forEach((step) => {
      const place = placeById[step.place_id];
      const el = document.createElement('div');
      el.className = 'place-marker' + (place.confidence === 'disputed' ? ' disputed' : '');
      const popup = new maplibregl.Popup({ offset: 16, closeButton: true }).setHTML(
        buildPopupHTML(place, step)
      );
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(place.coords)
        .setPopup(popup)
        .addTo(map);
      el.addEventListener('click', () => selectStep(step.step));
      markers[step.step] = { marker, el };
    });

    renderLog();
  });

  toggle.addEventListener('change', (e) => {
    showAncient = !e.target.checked;
    renderLog();
    refreshPopups();
  });
}

init();
