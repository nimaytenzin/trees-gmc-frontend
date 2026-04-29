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
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { SurveyArea } from '../../../core/models/survey-area.model';
import maplibregl from 'maplibre-gl';

const POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

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

  private map: maplibregl.Map | null = null;

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
    private readonly ngZone: NgZone,
  ) {
    this.load();
  }

  ngAfterViewInit(): void {
    this.initMap();
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

        if (!this.selectedArea && areas.length > 0) {
          this.selectedArea = areas[0];
        } else if (this.selectedArea) {
          this.selectedArea = areas.find((a) => a.id === this.selectedArea!.id) ?? null;
        }

        this.renderAllAreasOnMap();
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
    if (!name) { this.editError = 'Name is required'; return; }

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
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Survey area updated' });
        if (this.selectedArea?.id === updated.id) this.selectedArea = updated;
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
    this.renderAllAreasOnMap();
    this.zoomToArea(area);
  }

  clearMap(): void {
    this.renderAllAreasOnMap();
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
          this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Survey area saved successfully' });
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
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Survey area removed' });
        if (this.selectedArea?.id === area.id) this.selectedArea = null;
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete survey area' });
      },
    });
  }

  colorForId(id: string): string {
    const palette = [
      '#00563E', '#2D5016', '#4A7C59', '#2F6F8F', '#6B7B8E',
      '#7C3AED', '#C2410C', '#B91C1C', '#0F766E', '#1D4ED8',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
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
      this.renderAllAreasOnMap();
    });
  }

  private addAreaLayers(): void {
    if (!this.map) return;

    if (!this.map.getSource('areas')) {
      this.map.addSource('areas', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
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

    this.map.on('click', 'areas-fill', (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.['__id'] as string | undefined;
      const name = feature.properties?.['__name'] as string | undefined;
      const area = id ? this.areas.find((a) => a.id === id) : undefined;
      if (area) this.ngZone.run(() => this.selectArea(area));
      if (name) {
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-weight:700">${this.escapeHtml(name)}</div>`)
          .addTo(this.map!);
      }
    });

    this.map.on('mouseenter', 'areas-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'areas-fill', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });
  }

  private renderAllAreasOnMap(): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    const features = this.areas.map((a) => {
      const g: any = a.geom;
      const color = this.colorForId(a.id);
      const isSelected = a.id === this.selectedArea?.id;
      let geometry: any = null;
      if (g?.type === 'FeatureCollection') geometry = g.features?.[0]?.geometry ?? null;
      else if (g?.type === 'Feature') geometry = g.geometry;
      else geometry = g;
      return { type: 'Feature', geometry, properties: { __id: a.id, __name: a.name, __color: color, __selected: isSelected } };
    });

    const src = this.map.getSource('areas') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData({ type: 'FeatureCollection', features } as any);

    if (!this.selectedArea && features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      let hasCoords = false;
      for (const f of features) {
        if (f.geometry) { this.extendBounds(bounds, f.geometry); hasCoords = true; }
      }
      if (hasCoords) try { this.map.fitBounds(bounds, { padding: 24, duration: 500 }); } catch {}
    }
  }

  private zoomToArea(area: SurveyArea): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
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

  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
}
