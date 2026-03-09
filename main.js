
const SCENARIOS_URL = 'https://raw.githubusercontent.com/NONONOexe/rcrs-scenario-hub/refs/heads/main/scenarios.json';

// ---- Map ----
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  zoom: 3,
  center: [139, 35],
  scrollZoom: false,
  dragRotate: false
});

// ---- Scenario section ----
const scenarioHeading      = document.getElementById('scenario-heading');
const scenarioPlaceholder  = document.getElementById('scenario-placeholder');
const scenarioContent      = document.getElementById('scenario-content');
const scenarioCity         = document.getElementById('scenario-city');
const scenarioCountry      = document.getElementById('scenario-country');
const scenarioList         = document.getElementById('scenario-list');
const thumbnailPlaceholder = document.getElementById('scenario-thumbnail-placeholder');

function showScenarios(mapData) {
  const existing = document.getElementById('scenario-thumbnail');
  if (existing) existing.remove();

  scenarioPlaceholder.style.display = 'flex';
  scenarioPlaceholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
  scenarioContent.style.display = 'none';

  function render() {
    scenarioCity.textContent    = mapData.city;
    scenarioCountry.textContent = mapData.country;

    scenarioList.innerHTML = mapData.scenarios.map(s => `
      <li class="scenario-item">
        <div class="scenario-name">${s.name}</div>
        ${s.download_url ? `
          <a href="${s.download_url}" target="_blank" class="scenario-download">
            <i class="fa-solid fa-download"></i> Download
          </a>
        ` : ''}
      </li>
    `).join('');

      scenarioPlaceholder.style.display = 'none';
      scenarioContent.style.display     = 'flex';
  }

  if (mapData.thumbnail_url) {
    thumbnailPlaceholder.style.display = 'none';
    const img = document.createElement('img');
    img.id  = 'scenario-thumbnail';
    img.src = mapData.thumbnail_url;
    img.alt = mapData.city;
    img.onload = () => {
      thumbnailPlaceholder.parentNode.insertBefore(img, thumbnailPlaceholder);
      render();
    };
    img.onerror = () => {
      thumbnailPlaceholder.style.display = 'flex';
      render();
    }
  } else {
    thumbnailPlaceholder.style.display = 'flex';
    render();
  }
}

function scrollToScenarios() {
  scenarioHeading.scrollIntoView({ behavior: 'smooth' });
}

// ---- Markers ----
function addMarkers(maps) {
  maps.forEach(mapData => {
    const el = document.createElement('div');
    el.className = 'marker';

    const countLabel = mapData.scenarios.length > 1
      ? `${mapData.scenarios.length} scenarios available`
      : '1 scenario available';

    const popup = new maplibregl.Popup({
      offset: 15,
      closeButton: false,
      closeOnClick: true,
      maxWidth: 'none'
    }).setHTML(`
      <div class="popup-info">
        <div class="popup-city">${mapData.city}</div>
        <div class="popup-country">${mapData.country}</div>
        <span class="popup-link" data-id="${mapData.id}">
          <i class="fa-solid fa-table"></i> ${countLabel}
        </span>
      </div>
    `);

    new maplibregl.Marker({ element: el })
      .setLngLat([mapData.lon, mapData.lat])
      .setPopup(popup)
      .addTo(map);
    
    el.addEventListener('click', () => {
      map.flyTo({ center: [mapData.lon, mapData.lat], speed: 0.8 });
      showScenarios(mapData);
    });

    popup.on('open', () => {
      const link = popup.getElement().querySelector('.popup-link');
      if (link) {
        link.addEventListener('click', () => {
          scrollToScenarios();
          popup.remove();
        });
      }
    })
  });
}

map.on('load', () => {
  map.setProjection({ type: 'globe' });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  fetch(SCENARIOS_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return res.json();
    })
    .then(data => addMarkers(data.maps))
    .catch(err => console.error('Failed to load scenarios:', err));
});
