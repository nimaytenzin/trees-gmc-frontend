import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { SurveyArea } from '../../../core/models/survey-area.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-survey-areas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './survey-areas.component.html',
  styleUrl: './survey-areas.component.scss',
})
export class SurveyAreasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private baseLayer!: L.TileLayer;
  private areasLayer: L.GeoJSON | null = null;
  private legendControl: L.Control | null = null;

  areas: SurveyArea[] = [];
  loading = false;
  uploading = false;
  selectedArea: SurveyArea | null = null;

  name = '';
  file: File | null = null;
  fileError = '';

  showEditDialog = false;
  editingArea: SurveyArea | null = null;
  editName = '';
  editFile: File | null = null;
  editError = '';
  savingEdit = false;

  constructor(
    private readonly surveyAreasService: SurveyAreasService,
    private readonly messageService: MessageService,
  ) {
    this.load();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.renderAllAreasOnMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  load(): void {
    this.loading = true;
    this.surveyAreasService.getAll().subscribe({
      next: (areas) => {
        this.areas = areas;
        this.loading = false;
        this.renderAllAreasOnMap();
        if (!this.selectedArea && areas.length > 0) {
          this.selectArea(areas[0]);
        } else if (this.selectedArea) {
          const refreshed = areas.find((a) => a.id === this.selectedArea!.id) ?? null;
          this.selectedArea = refreshed;
          this.highlightSelectedArea();
        }
      },
      error: () => (this.loading = false),
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.fileError = '';
  }

  clear(): void {
    this.name = '';
    this.file = null;
    this.fileError = '';
  }

  onRowSelect(event: any): void {
    const area = event?.data as SurveyArea | undefined;
    if (area) this.selectArea(area);
  }

  openEdit(area: SurveyArea): void {
    this.editingArea = area;
    this.editName = area.name;
    this.editFile = null;
    this.editError = '';
    this.showEditDialog = true;
  }

  closeEdit(): void {
    this.showEditDialog = false;
    this.editingArea = null;
    this.editName = '';
    this.editFile = null;
    this.editError = '';
    this.savingEdit = false;
  }

  onEditFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editFile = input.files?.[0] ?? null;
    this.editError = '';
  }

  async saveEdit(): Promise<void> {
    if (!this.editingArea) return;
    const name = this.editName.trim();
    if (!name) {
      this.editError = 'Name is required';
      return;
    }

    this.savingEdit = true;
    this.editError = '';

    let geom: Record<string, unknown> | undefined;
    try {
      if (this.editFile) {
        const text = await this.editFile.text();
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const type = parsed?.['type'];
        if (!type || (type !== 'FeatureCollection' && type !== 'Feature')) {
          throw new Error('GeoJSON must be a FeatureCollection or Feature.');
        }
        geom = parsed;
      }
    } catch (e: any) {
      this.savingEdit = false;
      this.editError = e?.message || 'Invalid file';
      return;
    }

    const payload: any = { name };
    if (geom) payload.geom = geom;

    this.surveyAreasService.update(this.editingArea.id, payload).subscribe({
      next: (updated) => {
        this.savingEdit = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Survey area updated',
        });
        // Keep selection in sync
        if (this.selectedArea?.id === updated.id) {
          this.selectedArea = updated;
        }
        this.closeEdit();
        this.load();
      },
      error: (err) => {
        this.savingEdit = false;
        this.editError = err.error?.message || 'Failed to update survey area';
      },
    });
  }

  selectArea(area: SurveyArea): void {
    this.selectedArea = area;
    this.highlightSelectedArea(true);
  }

  async upload(): Promise<void> {
    if (!this.file) return;
    this.uploading = true;
    this.fileError = '';

    try {
      const text = await this.file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;

      const type = parsed?.['type'];
      if (!type || (type !== 'FeatureCollection' && type !== 'Feature')) {
        throw new Error('GeoJSON must be a FeatureCollection or Feature.');
      }

      const payload = { name: this.name.trim(), geom: parsed };
      this.surveyAreasService.create(payload).subscribe({
        next: () => {
          this.uploading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Uploaded',
            detail: 'Survey area saved successfully',
          });
          this.clear();
          this.load();
        },
        error: (err) => {
          this.uploading = false;
          this.fileError = err.error?.message || 'Failed to upload survey area';
        },
      });
    } catch (e: any) {
      this.uploading = false;
      this.fileError = e?.message || 'Invalid file';
    }
  }

  remove(area: SurveyArea): void {
    this.surveyAreasService.remove(area.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Survey area removed',
        });
        if (this.selectedArea?.id === area.id) {
          this.selectedArea = null;
          this.highlightSelectedArea();
        }
        this.load();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete survey area',
        });
      },
    });
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    const map = L.map(this.mapContainer.nativeElement, {
      center: [26.8516, 90.5042],
      zoom: 13,
      zoomControl: true,
    });
    this.baseLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; CARTO, OSM', maxZoom: 19 },
    );
    this.baseLayer.addTo(map);
    this.map = map;
  }

  clearMap(): void {
    if (this.areasLayer && this.map) {
      this.map.removeLayer(this.areasLayer);
    }
    this.areasLayer = null;
    if (this.legendControl && this.map) {
      this.legendControl.remove();
    }
    this.legendControl = null;
  }

  private renderAllAreasOnMap(): void {
    if (!this.map) return;
    if (this.areasLayer) this.map.removeLayer(this.areasLayer);
    if (this.legendControl) this.legendControl.remove();

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
        const isSelected = !!id && id === this.selectedArea?.id;
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
        featureLayer.on('click', (e: any) => {
          const area = this.areas.find((a) => a.id === id);
          if (area) this.selectArea(area);
          featureLayer
            .bindPopup(`<div style="font-weight:700">${this.escapeHtml(name)}</div>`, { closeButton: true })
            .openPopup(e.latlng);
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
      // ignore bad geometries
    }

    this.legendControl = this.buildLegendControl();
    this.legendControl.addTo(this.map);
  }

  private highlightSelectedArea(zoomToSelected = false): void {
    if (!this.map || !this.areasLayer) return;
    this.areasLayer.setStyle((feature: any) => {
      const id = feature?.properties?.__id as string | undefined;
      const color = this.colorForId(id ?? '');
      const isSelected = !!id && id === this.selectedArea?.id;
      return {
        color,
        weight: isSelected ? 4 : 2,
        opacity: 0.95,
        fillColor: color,
        fillOpacity: isSelected ? 0.18 : 0.10,
      };
    });

    if (zoomToSelected && this.selectedArea) {
      try {
        const selectedId = this.selectedArea.id;
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

  private buildLegendControl(): L.Control {
    const Legend = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'survey-legend') as HTMLDivElement;
        div.innerHTML = `
          <div class="survey-legend__title">Survey areas</div>
          <div class="survey-legend__items">
            ${this.areas
              .map((a) => {
                const color = this.colorForId(a.id);
                const active = a.id === this.selectedArea?.id ? ' survey-legend__item--active' : '';
                return `<div class="survey-legend__item${active}" data-id="${a.id}">
                  <span class="survey-legend__swatch" style="background:${color}"></span>
                  <span class="survey-legend__name">${this.escapeHtml(a.name)}</span>
                </div>`;
              })
              .join('')}
          </div>
        `;
        L.DomEvent.disableClickPropagation(div);
        div.addEventListener('click', (e) => {
          const el = (e.target as HTMLElement)?.closest?.('[data-id]') as HTMLElement | null;
          const id = el?.getAttribute('data-id');
          if (!id) return;
          const area = this.areas.find((a) => a.id === id);
          if (area) this.selectArea(area);
        });
        return div;
      },
    });

    return new Legend({ position: 'topright' }) as L.Control;
  }

  private colorForId(id: string): string {
    const palette = [
      '#00563E',
      '#2D5016',
      '#4A7C59',
      '#2F6F8F',
      '#6B7B8E',
      '#7C3AED',
      '#C2410C',
      '#B91C1C',
      '#0F766E',
      '#1D4ED8',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }

  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}

