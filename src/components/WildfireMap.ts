import * as L from 'leaflet';

// Basic GeoJSON type definitions for this component
interface GeoJsonObject {
  type: string;
  [key: string]: any;
}

interface Feature<G = any, P = any> extends GeoJsonObject {
  type: 'Feature';
  geometry: G;
  properties: P;
}

interface FeatureCollection<G = any, P = any> extends GeoJsonObject {
  type: 'FeatureCollection';
  features: Feature<G, P>[];
}

interface Geometry extends GeoJsonObject {
  type: string;
  coordinates?: any;
}

export class WildfireMap {
  public map: L.Map;
  private wildfireLayer: L.GeoJSON | null;
  private layerGroup: L.LayerGroup;
  private bounds: L.LatLngBounds | null;
  private originalData: FeatureCollection | null;

  constructor(map: L.Map) {
    this.map = map;
    this.wildfireLayer = null;
    this.layerGroup = L.layerGroup().addTo(map);
    this.bounds = null;
    this.originalData = null; // Store original data
  }

  addWildfireLayer(geojsonData: FeatureCollection): void {
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

  private getFeatureStyle(feature?: Feature): L.PathOptions {
    // Return minimal style - actual styling will be handled by CSS classes
    return {
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.6,
    };
  }

  private createClusterCenterMarker(feature: Feature, latlng: L.LatLng): L.CircleMarker {
    const marker = L.circleMarker(latlng, {
      radius: 8,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    });

    // Add CSS class for styling
    marker.on('add', () => {
      const element = marker.getElement();
      if (element) {
        element.classList.add('wildfire-cluster-center');
      }
    });

    return marker;
  }

  private onEachFeature(feature: Feature, layer: L.Layer): void {
    // Add CSS classes for styling
    if (layer instanceof L.Path) {
      layer.on('add', () => {
        const element = layer.getElement();
        if (element) {
          if (feature.properties?.cluster_center === true) {
            element.classList.add('wildfire-cluster-center');
          } else {
            element.classList.add('wildfire-forecast-area');
          }
        }
      });
    }

    if (feature.properties) {
      let popupContent = '<div class="wildfire-popup">';

      // Add basic fire information
      if (feature.properties.cluster_center === true) {
        popupContent += '<h3>Wildfire Cluster Center</h3>';
      } else {
        popupContent += '<h3>Forecast Area</h3>';
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

  private getFeatureCoordinates(feature: Feature): number[] | null {
    if (!feature.geometry) return null;

    const { type, coordinates } = feature.geometry;

    switch (type) {
      case 'Point':
        return coordinates as number[];
      case 'Polygon':
        // Return centroid of first ring
        return this.getPolygonCentroid((coordinates as number[][][])[0]);
      case 'MultiPolygon':
        // Return centroid of first polygon's first ring
        return this.getPolygonCentroid((coordinates as number[][][][])[0][0]);
      default:
        return null;
    }
  }

  private getPolygonCentroid(coordinates: number[][]): number[] {
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

  fitToBounds(): void {
    if (this.bounds && this.bounds.isValid()) {
      this.map.fitBounds(this.bounds, { padding: [20, 20] });
    }
  }

  clearLayers(): void {
    this.layerGroup.clearLayers();
    this.wildfireLayer = null;
    this.bounds = null;
  }
}
