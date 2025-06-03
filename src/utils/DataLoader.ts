// GeoJSON type definitions
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

interface Point extends Geometry {
  type: 'Point';
  coordinates: number[];
}

interface Polygon extends Geometry {
  type: 'Polygon';
  coordinates: number[][][];
}

interface MultiPolygon extends Geometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

interface StandardizedProperties {
  [key: string]: any;
  processed_at?: string;
  risk_level?: string;
  severity?: string;
  intensity?: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  name?: string;
  last_update?: string;
  forecast_time?: string;
  calculated_area?: number;
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';

export class DataLoader {
  private cache: Map<string, FeatureCollection>;

  constructor() {
    this.cache = new Map();
  }

  async loadGeoJSON(url: string): Promise<FeatureCollection> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as GeoJsonObject;

      // Validate GeoJSON structure
      if (!this.isValidGeoJSON(data)) {
        throw new Error('Invalid GeoJSON format');
      }

      // Process the data
      const processedData = this.processGeoJSON(data);

      // Cache the result
      this.cache.set(url, processedData);

      return processedData;
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
      throw new Error(`Failed to load data from ${url}: ${(error as Error).message}`);
    }
  }

  private isValidGeoJSON(data: any): data is GeoJsonObject {
    // Basic GeoJSON validation
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.type) {
      return false;
    }

    const validTypes = [
      'FeatureCollection',
      'Feature',
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection',
    ];

    if (!validTypes.includes(data.type)) {
      return false;
    }

    // For FeatureCollection, check if features array exists
    if (data.type === 'FeatureCollection') {
      return Array.isArray(data.features);
    }

    return true;
  }

  private processGeoJSON(data: GeoJsonObject): FeatureCollection {
    // Clone the data to avoid mutations
    let processedData: GeoJsonObject = JSON.parse(JSON.stringify(data));

    if (processedData.type === 'FeatureCollection') {
      processedData.features = processedData.features.map((feature: Feature) => {
        return this.processFeature(feature);
      });
      return processedData as FeatureCollection;
    } else if (processedData.type === 'Feature') {
      const processedFeature = this.processFeature(processedData as Feature);
      return {
        type: 'FeatureCollection' as const,
        features: [processedFeature],
      };
    }

    // If it's a geometry, wrap it in a feature collection
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: processedData as Geometry,
          properties: {},
        },
      ],
    };
  }

  private processFeature(feature: Feature): Feature<Geometry, StandardizedProperties> {
    if (!feature.properties) {
      feature.properties = {};
    }

    // Add processed timestamp if not present
    if (!feature.properties.processed_at) {
      feature.properties.processed_at = new Date().toISOString();
    }

    // Standardize property names
    feature.properties = this.standardizeProperties(feature.properties);

    // Calculate area for polygon features (approximate)
    if (feature.geometry && ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
      feature.properties.calculated_area = this.calculateApproximateArea(
        feature.geometry as Polygon | MultiPolygon
      );
    }

    return feature as Feature<Geometry, StandardizedProperties>;
  }

  private standardizeProperties(properties: { [key: string]: any }): StandardizedProperties {
    const standardized: StandardizedProperties = { ...properties };

    // Common property name mappings
    const propertyMappings: { [key: string]: string } = {
      RISK_LEVEL: 'risk_level',
      riskLevel: 'risk_level',
      SEVERITY: 'severity',
      INTENSITY: 'intensity',
      TEMP: 'temperature',
      temperature_f: 'temperature',
      HUMIDITY: 'humidity',
      humidity_percent: 'humidity',
      WIND_SPEED: 'wind_speed',
      windSpeed: 'wind_speed',
      wind_mph: 'wind_speed',
      NAME: 'name',
      area_name: 'name',
      AREA_NAME: 'name',
      LAST_UPDATE: 'last_update',
      lastUpdate: 'last_update',
      FORECAST_TIME: 'forecast_time',
      forecastTime: 'forecast_time',
    };

    // Apply mappings
    Object.keys(propertyMappings).forEach((oldKey) => {
      if (standardized[oldKey] !== undefined) {
        const newKey = propertyMappings[oldKey];
        standardized[newKey] = standardized[oldKey];
        if (oldKey !== newKey) {
          delete standardized[oldKey];
        }
      }
    });

    // Standardize risk level values
    if (standardized.risk_level) {
      standardized.risk_level = this.standardizeRiskLevel(standardized.risk_level);
    }

    if (standardized.severity) {
      standardized.severity = this.standardizeRiskLevel(standardized.severity);
    }

    return standardized;
  }

  private standardizeRiskLevel(value: any): RiskLevel | string {
    if (typeof value !== 'string') {
      return value;
    }

    const lowercaseValue = value.toLowerCase().trim();

    // Map various risk level formats to standard values
    const riskMappings: { [key: string]: RiskLevel } = {
      low: 'low',
      minimal: 'low',
      green: 'low',
      moderate: 'moderate',
      medium: 'moderate',
      yellow: 'moderate',
      high: 'high',
      orange: 'high',
      'very high': 'very_high',
      very_high: 'very_high',
      veryhigh: 'very_high',
      extreme: 'extreme',
      critical: 'extreme',
      red: 'extreme',
    };

    return riskMappings[lowercaseValue] || lowercaseValue;
  }

  private calculateApproximateArea(geometry: Polygon | MultiPolygon): number {
    // This is a very rough approximation for display purposes only
    // For accurate area calculations, use a proper geographic library

    if (geometry.type === 'Polygon') {
      return this.calculatePolygonArea(geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.reduce((total: number, polygon: number[][][]) => {
        return total + this.calculatePolygonArea(polygon[0]);
      }, 0);
    }

    return 0;
  }

  private calculatePolygonArea(coordinates: number[][]): number {
    // Simple area calculation using the shoelace formula (very approximate for lat/lon)
    if (coordinates.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      area += coordinates[i][0] * coordinates[i + 1][1];
      area -= coordinates[i + 1][0] * coordinates[i][1];
    }
    return Math.abs(area) / 2;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
