import L from 'leaflet';
import { WildfireMap } from './components/WildfireMap.js';
import { DataLoader } from './utils/DataLoader.js';
import { UIControls } from './components/UIControls.js';

// Fix Leaflet default markers issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

class WildfireApp {
  constructor() {
    this.map = null;
    this.wildfireMap = null;
    this.dataLoader = null;
    this.uiControls = null;
    this.init();
  }

  async init() {
    try {
      // Initialize the map
      this.initializeMap();

      // Initialize components
      this.wildfireMap = new WildfireMap(this.map);
      this.dataLoader = new DataLoader();
      this.uiControls = new UIControls(this.wildfireMap);

      // Load and display wildfire data
      await this.loadWildfireData();

      // Hide loading indicator
      this.hideLoading();
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showError('Failed to load wildfire data. Please refresh the page.');
    }
  }

  initializeMap() {
    // Initialize the Leaflet map
    this.map = L.map('map', {
      center: [39.8283, -98.5795], // Center of US
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
    });

    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(this.map);

    // Add satellite layer option
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      }
    );

    // Layer control
    const baseLayers = {
      'Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }),
      Satellite: satelliteLayer,
    };

    L.control.layers(baseLayers).addTo(this.map);
  }

  async loadWildfireData() {
    try {
      const geojsonData = await this.dataLoader.loadGeoJSON('./wildfire_forecast_60min.geojson');
      this.wildfireMap.addWildfireLayer(geojsonData);

      // Fit map to data bounds
      this.wildfireMap.fitToBounds();
    } catch (error) {
      console.error('Error loading wildfire data:', error);
      throw error;
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  showError(message) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            `;
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WildfireApp();
});
