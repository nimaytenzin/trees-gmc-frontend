import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { SurveyArea } from '../../../core/models/survey-area.model';
import maplibregl from 'maplibre-gl';

const POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'satellite-bg', type: 'raster', source: 'satellite' }],
};

@Component({
  selector: 'app-survey-area-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule],
  templateUrl: './survey-area-select.component.html',
  styleUrl: './survey-area-select.component.scss',
})
export class SurveyAreaSelectComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  areas: SurveyArea[] = [];
  loading = false;
  selected: SurveyArea | null = null;
  locating = false;
  currentLayer: 'street' | 'satellite' = 'street';

  private map: maplibregl.Map | null = null;
  private lastGeoJSON: any = { type: 'FeatureCollection', features: [] };

  constructor(
    private readonly surveyAreasService: SurveyAreasService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  loadAreas(): void {
    this.loading = true;
    this.surveyAreasService.getAll().subscribe({
      next: (areas) => {
        this.areas = areas ?? [];
        this.loading = false;
        this.renderAllAreas();
      },
      error: () => (this.loading = false),
    });
  }

  select(area: SurveyArea): void {
    this.selected = area;
    this.renderAllAreas();
    this.zoomToArea(area);
  }

  continue(): void {
    if (!this.selected) return;
    this.router.navigate(['/app/trees/register'], {
      queryParams: { surveyAreaId: this.selected.id },
    });
  }

  goBack(): void {
    this.router.navigate(['/app/dashboard']);
  }

  toggleLayer(): void {
    if (!this.map) return;
    this.currentLayer = this.currentLayer === 'street' ? 'satellite' : 'street';
    this.map.setStyle(this.currentLayer === 'street' ? POSITRON_STYLE : SATELLITE_STYLE);
    this.map.once('styledata', () => this.addAreaLayers());
  }

  zoomToAll(): void {
    if (!this.map) return;
    const bounds = new maplibregl.LngLatBounds();
    let hasCoords = false;
    for (const f of this.lastGeoJSON.features) {
      if (f.geometry) { this.extendBounds(bounds, f.geometry); hasCoords = true; }
    }
    if (hasCoords) try { this.map.fitBounds(bounds, { padding: 24 }); } catch {}
  }

  locateMe(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ngZone.run(() => {
          this.locating = false;
          if (!this.map) return;
          const { longitude: lng, latitude: lat } = pos.coords;
          this.map.flyTo({ center: [lng, lat], zoom: 17 });

          const locationData: any = {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }],
          };
          const src = this.map.getSource('user-location') as maplibregl.GeoJSONSource | undefined;
          if (src) {
            src.setData(locationData);
          } else if (this.map.isStyleLoaded()) {
            this.map.addSource('user-location', { type: 'geojson', data: locationData });
            this.map.addLayer({
              id: 'user-location-dot',
              type: 'circle',
              source: 'user-location',
              paint: {
                'circle-radius': 8,
                'circle-color': '#22c55e',
                'circle-opacity': 0.85,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#00563E',
              },
            });
          }
        });
      },
      () => {
        this.ngZone.run(() => {
          this.locating = false;
          alert('Unable to access your location. Please check browser permissions.');
        });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: POSITRON_STYLE,
      center: [90.5042, 26.8516],
      zoom: 13,
      attributionControl: false,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    this.map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    this.map.on('load', () => {
      this.addAreaLayers();
      this.loadAreas();
    });
  }

  private addAreaLayers(): void {
    if (!this.map) return;

    if (!this.map.getSource('areas')) {
      this.map.addSource('areas', { type: 'geojson', data: this.lastGeoJSON });
    }

    if (!this.map.getLayer('areas-fill')) {
      this.map.addLayer({
        id: 'areas-fill',
        type: 'fill',
        source: 'areas',
        paint: {
          'fill-color': ['get', '__color'] as any,
          'fill-opacity': ['case', ['get', '__selected'], 0.18, 0.10] as any,
        },
      });
    }

    if (!this.map.getLayer('areas-line')) {
      this.map.addLayer({
        id: 'areas-line',
        type: 'line',
        source: 'areas',
        paint: {
          'line-color': ['get', '__color'] as any,
          'line-width': ['case', ['get', '__selected'], 4, 2] as any,
          'line-opacity': 0.95,
        },
      });
    }

    // Restore data after style switch
    if (this.lastGeoJSON.features.length > 0) {
      (this.map.getSource('areas') as maplibregl.GeoJSONSource).setData(this.lastGeoJSON);
    }

    this.map.on('click', 'areas-fill', (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.['__id'] as string | undefined;
      const area = id ? this.areas.find((a) => a.id === id) : undefined;
      if (area) this.ngZone.run(() => this.select(area));
    });

    this.map.on('mouseenter', 'areas-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'areas-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });
  }

  private renderAllAreas(): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    const features = this.areas.map((a) => {
      const g: any = a.geom;
      const color = this.colorForId(a.id);
      const isSelected = a.id === this.selected?.id;
      let geometry: any = null;
      if (g?.type === 'FeatureCollection') geometry = g.features?.[0]?.geometry ?? null;
      else if (g?.type === 'Feature') geometry = g.geometry;
      else geometry = g;
      return { type: 'Feature', geometry, properties: { __id: a.id, __name: a.name, __color: color, __selected: isSelected } };
    });

    const collection = { type: 'FeatureCollection', features };
    this.lastGeoJSON = collection;

    const src = this.map.getSource('areas') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(collection as any);

    if (!this.selected && features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      let hasCoords = false;
      for (const f of features) {
        if (f.geometry) { this.extendBounds(bounds, f.geometry); hasCoords = true; }
      }
      if (hasCoords) try { this.map.fitBounds(bounds, { padding: 24, duration: 800 }); } catch {}
    }
  }

  private zoomToArea(area: SurveyArea): void {
    if (!this.map) return;
    const g: any = area.geom;
    let geometry: any = null;
    if (g?.type === 'FeatureCollection') geometry = g.features?.[0]?.geometry ?? null;
    else if (g?.type === 'Feature') geometry = g.geometry;
    else geometry = g;
    if (!geometry) return;
    const bounds = new maplibregl.LngLatBounds();
    this.extendBounds(bounds, geometry);
    try { if (!bounds.isEmpty()) this.map.fitBounds(bounds, { padding: 24, duration: 500 }); } catch {}
  }

  private extendBounds(bounds: maplibregl.LngLatBounds, geometry: any): void {
    if (!geometry?.coordinates) return;
    const walk = (coords: any): void => {
      if (typeof coords[0] === 'number') bounds.extend(coords as [number, number]);
      else for (const c of coords) walk(c);
    };
    walk(geometry.coordinates);
  }

  private colorForId(id: string): string {
    const palette = ['#00563E', '#2D5016', '#4A7C59', '#2F6F8F', '#6B7B8E', '#7C3AED'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }
}
