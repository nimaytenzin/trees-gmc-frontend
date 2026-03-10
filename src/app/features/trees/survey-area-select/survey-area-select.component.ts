import {
  AfterViewInit,
  Component,
  ElementRef,
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
import * as L from 'leaflet';

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

  private map: L.Map | null = null;
  private baseLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;
  currentLayer: 'street' | 'satellite' = 'street';
  private areasLayer: L.GeoJSON | null = null;

  constructor(
    private readonly surveyAreasService: SurveyAreasService,
    private readonly router: Router,
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadAreas();
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
    this.highlightSelected(true);
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
    if (this.currentLayer === 'street') {
      this.map.removeLayer(this.satelliteLayer);
      this.baseLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.baseLayer);
      this.satelliteLayer.addTo(this.map);
    }
  }

  zoomToAll(): void {
    if (!this.map || !this.areasLayer) return;
    try {
      const bounds = this.areasLayer.getBounds();
      if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      // ignore
    }
  }

  locateMe(): void {
    if (!this.map) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }
    this.locating = true;
    // Use Leaflet's locate to integrate with map events
    this.map.locate({ enableHighAccuracy: true, timeout: 8000 });
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    const map = L.map(this.mapContainer.nativeElement, {
      center: [26.8516, 90.5042],
      zoom: 13,
      zoomControl: false,
    });
    this.baseLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; CARTO, OSM', maxZoom: 19 },
    );
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 },
    );
    this.baseLayer.addTo(map);

    map.on('locationfound', (e: L.LocationEvent) => {
      this.locating = false;
      const latlng = e.latlng;
      map.setView(latlng, 17);
      L.circleMarker(latlng, {
        radius: 6,
        color: '#00563E',
        fillColor: '#22c55e',
        fillOpacity: 0.7,
      }).addTo(map);
    });
    map.on('locationerror', () => {
      this.locating = false;
      alert('Unable to access your location. Please check browser permissions.');
    });

    this.map = map;
  }

  private renderAllAreas(): void {
    if (!this.map) return;
    if (this.areasLayer) this.map.removeLayer(this.areasLayer);

    const collection: any = {
      type: 'FeatureCollection',
      features: this.areas.map((a) => {
        const g: any = a.geom;
        if (g?.type === 'FeatureCollection') {
          const first = g.features?.[0];
          return {
            ...(first ?? { type: 'Feature', geometry: null, properties: {} }),
            properties: { ...(first?.properties ?? {}), __id: a.id, __name: a.name },
          };
        }
        if (g?.type === 'Feature') {
          return {
            ...g,
            properties: { ...(g.properties ?? {}), __id: a.id, __name: a.name },
          };
        }
        return { type: 'Feature', geometry: g, properties: { __id: a.id, __name: a.name } };
      }),
    };

    const layer = L.geoJSON(collection, {
      style: (feature: any) => {
        const id = feature?.properties?.__id as string | undefined;
        const color = this.colorForId(id ?? '');
        const isSelected = !!id && id === this.selected?.id;
        return {
          color,
          weight: isSelected ? 4 : 2,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: isSelected ? 0.18 : 0.10,
        };
      },
      onEachFeature: (feature: any, featureLayer: any) => {
        const id = feature?.properties?.__id as string | undefined;
        const name = (feature?.properties?.__name as string | undefined) ?? 'Survey area';
        featureLayer.on('click', () => {
          const area = this.areas.find((a) => a.id === id);
          if (area) this.select(area);
        });
        featureLayer.bindTooltip(name, { sticky: true, direction: 'top', opacity: 0.9 });
      },
    });

    layer.addTo(this.map);
    this.areasLayer = layer;

    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      // ignore
    }
  }

  private highlightSelected(zoomToSelected = false): void {
    if (!this.map || !this.areasLayer) return;
    this.areasLayer.setStyle((feature: any) => {
      const id = feature?.properties?.__id as string | undefined;
      const color = this.colorForId(id ?? '');
      const isSelected = !!id && id === this.selected?.id;
      return {
        color,
        weight: isSelected ? 4 : 2,
        opacity: 0.95,
        fillColor: color,
        fillOpacity: isSelected ? 0.18 : 0.10,
      };
    });

    if (zoomToSelected && this.selected) {
      try {
        const selectedId = this.selected.id;
        let targetLayer: any = null;
        this.areasLayer.eachLayer((l: any) => {
          if (l?.feature?.properties?.__id === selectedId) targetLayer = l;
        });
        if (targetLayer?.getBounds) {
          const bounds = targetLayer.getBounds();
          if (bounds?.isValid?.()) this.map.fitBounds(bounds, { padding: [24, 24] });
        }
      } catch {
        // ignore
      }
    }
  }

  private colorForId(id: string): string {
    const palette = ['#00563E', '#2D5016', '#4A7C59', '#2F6F8F', '#6B7B8E', '#7C3AED'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }
}

