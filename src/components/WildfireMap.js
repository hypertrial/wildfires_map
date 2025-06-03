import L from 'leaflet';

export class WildfireMap {
  constructor(map) {
    this.map = map;
    this.wildfireLayer = null;
    this.layerGroup = L.layerGroup().addTo(map);
    this.bounds = null;
    this.originalData = null; // Store original data
  }

  addWildfireLayer(geojsonData) {
    // Store original data
    this.originalData = geojsonData;

    // Remove existing layer if present
    if (this.wildfireLayer) {
      this.layerGroup.removeLayer(this.wildfireLayer);
    }

    // Create the GeoJSON layer with custom styling
    this.wildfireLayer = L.geoJSON(geojsonData, {
      style: this.getFeatureStyle.bind(this),
      pointToLayer: this.createClusterCenterMarker.bind(this),
      onEachFeature: this.onEachFeature.bind(this),
    });

    // Add to layer group
    this.layerGroup.addLayer(this.wildfireLayer);

    // Calculate bounds for map fitting
    this.bounds = this.wildfireLayer.getBounds();

    // Auto-fit map to data
    if (this.bounds.isValid()) {
      this.map.fitBounds(this.bounds, { padding: [20, 20] });
    }
  }

  getFeatureStyle(feature) {
    const baseStyle = {
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
    };

    // Style based on the type of feature
    if (feature.properties && feature.properties.cluster_center === true) {
      return {
        ...baseStyle,
        color: '#ff4444',
        fillColor: '#ff6666',
        radius: 8,
      };
    } else {
      // Forecast area styling
      return {
        ...baseStyle,
        color: '#ff8800',
        fillColor: '#ffaa44',
      };
    }
  }

  createClusterCenterMarker(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: '#ff4444',
      color: '#cc0000',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    });
  }

  onEachFeature(feature, layer) {
    if (feature.properties) {
      let popupContent = '<div class="wildfire-popup">';

      // Add basic fire information
      if (feature.properties.cluster_center === true) {
        popupContent += '<h3>🔥 Wildfire Cluster Center</h3>';
      } else {
        popupContent += '<h3>🌡️ Forecast Area</h3>';
      }

      // Add available properties
      Object.entries(feature.properties).forEach(([key, value]) => {
        if (key !== 'cluster_center' && value !== null && value !== undefined) {
          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          popupContent += `<p><strong>${displayKey}:</strong> ${value}</p>`;
        }
      });

      // Add coordinates
      const coords = this.getFeatureCoordinates(feature);
      if (coords) {
        popupContent += `<p><strong>Coordinates:</strong> ${coords[1].toFixed(
          4
        )}, ${coords[0].toFixed(4)}</p>`;
      }

      popupContent += '</div>';
      layer.bindPopup(popupContent);
    }
  }

  getFeatureCoordinates(feature) {
    if (!feature.geometry) return null;

    const { type, coordinates } = feature.geometry;

    switch (type) {
      case 'Point':
        return coordinates;
      case 'Polygon':
        // Return centroid of first ring
        return this.getPolygonCentroid(coordinates[0]);
      case 'MultiPolygon':
        // Return centroid of first polygon's first ring
        return this.getPolygonCentroid(coordinates[0][0]);
      default:
        return null;
    }
  }

  getPolygonCentroid(coordinates) {
    let x = 0,
      y = 0,
      area = 0;
    const len = coordinates.length - 1; // Last point same as first

    for (let i = 0; i < len; i++) {
      const [x1, y1] = coordinates[i];
      const [x2, y2] = coordinates[i + 1];
      const cross = x1 * y2 - x2 * y1;
      area += cross;
      x += (x1 + x2) * cross;
      y += (y1 + y2) * cross;
    }

    area = area / 2;
    return area === 0 ? [coordinates[0][0], coordinates[0][1]] : [x / (6 * area), y / (6 * area)];
  }

  fitToBounds() {
    if (this.bounds && this.bounds.isValid()) {
      this.map.fitBounds(this.bounds, { padding: [20, 20] });
    }
  }

  clearLayers() {
    this.layerGroup.clearLayers();
    this.wildfireLayer = null;
    this.bounds = null;
  }
}
