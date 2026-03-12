import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { AccordionModule } from 'primeng/accordion';
import { GalleriaModule } from 'primeng/galleria';
import * as L from 'leaflet';
import { sarpangTmToWgs84 } from '../../../core/utils/crs';
import { TreeService } from '../../trees/services/tree.service';
import { Tree } from '../../../core/models/tree.model';
import { Species } from '../../../core/models/species.model';
import { environment } from '../../../../environments';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DropdownModule,
    AccordionModule,
    GalleriaModule,
  ],
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  trees: Tree[] = [];
  selectedTree: Tree | null = null;
  latestMetric: { healthCondition?: string; condition?: string } | null = null;
  assessmentsActiveIndex: number | number[] = 0;
  metricsGalleryVisible = false;
  metricsGalleryImages: { id?: string; url: string }[] = [];

  totalTrees = 0;
  speciesCount = 0;
  avgHeight = '';
  speciesOptions: { label: string; value: string }[] = [];
  numericOpOptions: { label: string; value: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' }[] = [
    { label: '=', value: 'eq' },
    { label: '>', value: 'gt' },
    { label: '≥', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '≤', value: 'lte' },
  ];
  selectedSpeciesId: string | null = null;
  heightOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  heightValue: number | null = null;
  dbhOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  dbhValue: number | null = null;
  canopyOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  canopyValue: number | null = null;
  private mapFilterTimeout: ReturnType<typeof setTimeout> | null = null;

  currentLayer: 'positron' | 'satellite' = 'positron';
  private map: L.Map | null = null;
  private positronLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;
  private markersLayer: L.LayerGroup | null = null;
  private markersByTreeId = new Map<string, L.Marker>();
  private selectedTreeMapId: string | null = null;

  get displayCommonName(): string {
    const t = this.selectedTree;
    return t?.commonName ?? t?.species?.commonName ?? t?.treeId ?? '—';
  }
  get displayScientificName(): string {
    const t = this.selectedTree;
    return t?.scientificName ?? t?.species?.scientificName ?? '—';
  }

  constructor(
    private readonly treeService: TreeService,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.treeService.getSpecies().subscribe({
      next: (species: Species[]) => {
        this.speciesOptions = species
          .map((s) => ({
            label: `${s.commonName} (${s.scientificName})`,
            value: s.id,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {},
    });
    this.treeService.getStatistics().subscribe({
      next: (stats) => {
        this.totalTrees = stats.total;
        this.speciesCount = stats.speciesCount ?? 0;
        if (stats.avgMetrics?.avgHeight) {
          this.avgHeight = parseFloat(stats.avgMetrics.avgHeight).toFixed(1);
        }
      },
      error: () => {
        this.totalTrees = 0;
        this.speciesCount = 0;
      },
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadMapTrees();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  iconPath(filename: string): string {
    const base =
      (typeof document !== 'undefined' && document.querySelector('base')?.href?.replace(/\/$/, '')) ||
      '';
    return `${base}/assets/icons/${filename}`;
  }

  apiUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleaned}`;
  }

  openMetricsGallery(photos?: { id?: string; url: string }[] | null): void {
    const raw = photos ?? [];
    this.metricsGalleryImages = raw.map((p) => ({
      ...p,
      url: this.apiUrl(p.url),
    }));
    this.metricsGalleryVisible = this.metricsGalleryImages.length > 0;
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    const map = L.map(this.mapContainer.nativeElement, {
      center: [26.8516, 90.5042],
      zoom: 13,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    this.positronLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; CARTO, OSM', maxZoom: 19 },
    );
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 },
    );
    this.positronLayer.addTo(map);
    this.map = map;

    map.on('click', () => {
      this.ngZone.run(() => this.closeSidebar());
    });
  }

  private addMarkers(trees: Tree[]): void {
    if (!this.map) return;
    if (this.markersLayer) {
      this.map.removeLayer(this.markersLayer);
    }
    this.markersLayer = L.layerGroup();
    this.markersByTreeId.clear();
    trees.forEach((tree) => {
      const { lat, lng } = sarpangTmToWgs84(Number(tree.xCoordinate), Number(tree.yCoordinate));
      const marker = L.marker([lat, lng], {
        icon: this.buildTreeIcon(this.selectedTreeMapId === tree.id),
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.ngZone.run(() => this.selectTree(tree));
      });
      this.markersLayer!.addLayer(marker);
      this.markersByTreeId.set(tree.id, marker);
    });
    this.map.addLayer(this.markersLayer);
    if (trees.length > 0) {
      const bounds = L.latLngBounds(
        trees.map((t) => {
          const { lat, lng } = sarpangTmToWgs84(Number(t.xCoordinate), Number(t.yCoordinate));
          return [lat, lng] as L.LatLngTuple;
        }),
      );
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  private buildTreeIcon(isSelected: boolean): L.DivIcon {
    return L.divIcon({
      className: `custom-tree-marker${isSelected ? ' is-selected' : ''}`,
      html: '<div class="tree-marker-pin"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }

  private setSelectedMarker(treeId: string | null): void {
    if (this.selectedTreeMapId && this.selectedTreeMapId !== treeId) {
      const prev = this.markersByTreeId.get(this.selectedTreeMapId);
      if (prev) prev.setIcon(this.buildTreeIcon(false));
    }
    this.selectedTreeMapId = treeId;
    if (treeId) {
      const next = this.markersByTreeId.get(treeId);
      if (next) next.setIcon(this.buildTreeIcon(true));
    }
  }

  setLayer(layer: 'positron' | 'satellite'): void {
    if (!this.map) return;
    this.currentLayer = layer;
    if (layer === 'positron') {
      this.map.removeLayer(this.satelliteLayer);
      this.positronLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.positronLayer);
      this.satelliteLayer.addTo(this.map);
    }
  }

  closeSidebar(): void {
    this.selectedTree = null;
    this.latestMetric = null;
    this.metricsGalleryVisible = false;
    this.metricsGalleryImages = [];
    this.setSelectedMarker(null);
  }

  selectTree(tree: Tree): void {
    this.setSelectedMarker(tree.id);
    this.treeService.getOne(tree.id).subscribe({
      next: (full) => {
        this.selectedTree = full;
        this.latestMetric =
          full.growthMetrics && full.growthMetrics.length > 0 ? full.growthMetrics[0] : null;
      },
      error: () => {
        this.selectedTree = tree;
        this.latestMetric =
          tree.growthMetrics && tree.growthMetrics.length > 0 ? tree.growthMetrics[0] : null;
      },
    });
  }

  clearMapFilters(): void {
    this.selectedSpeciesId = null;
    this.heightOp = 'eq';
    this.heightValue = null;
    this.dbhOp = 'eq';
    this.dbhValue = null;
    this.canopyOp = 'eq';
    this.canopyValue = null;
    this.loadMapTrees();
  }

  onMapFilterInput(): void {
    if (this.mapFilterTimeout != null) clearTimeout(this.mapFilterTimeout);
    this.mapFilterTimeout = setTimeout(() => this.loadMapTrees(), 300);
  }

  loadMapTrees(): void {
    this.closeSidebar();
    this.treeService
      .getAll({
        speciesId: this.selectedSpeciesId || undefined,
        heightOp: this.heightOp || undefined,
        heightValue: this.heightValue ?? undefined,
        dbhOp: this.dbhOp || undefined,
        dbhValue: this.dbhValue ?? undefined,
        canopyOp: this.canopyOp || undefined,
        canopyValue: this.canopyValue ?? undefined,
        page: 1,
        limit: 10000,
      })
      .subscribe({
        next: (res) => {
          this.trees = res.items;
          this.addMarkers(res.items);
        },
        error: () => {
          this.trees = [];
          this.addMarkers([]);
        },
      });
  }
}
