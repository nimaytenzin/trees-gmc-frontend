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
import maplibregl from 'maplibre-gl';
import { sarpangTmToWgs84 } from '../../../core/utils/crs';
import { TreeService } from '../../trees/services/tree.service';
import { Tree } from '../../../core/models/tree.model';
import { Species } from '../../../core/models/species.model';
import { environment } from '../../../../environments';

const POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'satellite-bg', type: 'raster', source: 'satellite' }],
};

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
  latestMetric: any = null;
  assessmentsActiveIndex: number | number[] = 0;
  metricsGalleryVisible = false;
  metricsGalleryImages: { id?: string; url: string }[] = [];
  loadingMap = false;

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
  private map: maplibregl.Map | null = null;
  private selectedTreeId: string | null = null;
  private lastGeoJSON: any = { type: 'FeatureCollection', features: [] };

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
          .map((s) => ({ label: `${s.commonName} (${s.scientificName})`, value: s.id }))
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
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  iconPath(filename: string): string {
    const base =
      (typeof document !== 'undefined' && document.querySelector('base')?.href?.replace(/\/$/, '')) || '';
    return `${base}/assets/icons/${filename}`;
  }

  apiUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : '/' + path}`;
  }

  openMetricsGallery(photos?: { id?: string; url: string }[] | null): void {
    const raw = photos ?? [];
    this.metricsGalleryImages = raw.map((p) => ({ ...p, url: this.apiUrl(p.url) }));
    this.metricsGalleryVisible = this.metricsGalleryImages.length > 0;
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
      this.addTreeLayers();
      this.loadMapTrees();
    });

    // Single click handler: tree dot → open sidebar; map bg → close sidebar
    this.map.on('click', (e) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['trees-dots'] });
      if (features.length > 0) {
        const props = features[0].properties as any;
        this.ngZone.run(() => this.selectTreeById(props['id'], props));
      } else {
        this.ngZone.run(() => this.closeSidebar());
      }
    });

    this.map.on('mouseenter', 'trees-dots', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'trees-dots', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });
  }

  private addTreeLayers(): void {
    if (!this.map) return;

    if (!this.map.getSource('trees')) {
      this.map.addSource('trees', {
        type: 'geojson',
        data: this.lastGeoJSON,
      });
    }

    if (!this.map.getLayer('trees-dots')) {
      this.map.addLayer({
        id: 'trees-dots',
        type: 'circle',
        source: 'trees',
        paint: {
          'circle-radius': 5,
          'circle-color': '#2D5016',
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // Separate layer for the selected tree — larger ring in blue
    if (!this.map.getLayer('trees-selected')) {
      this.map.addLayer({
        id: 'trees-selected',
        type: 'circle',
        source: 'trees',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 9,
          'circle-color': '#2D5016',
          'circle-opacity': 0.95,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#1e40af',
        },
      });
    }

    // Restore data and selection state after a style switch
    if (this.lastGeoJSON.features.length > 0) {
      (this.map.getSource('trees') as maplibregl.GeoJSONSource).setData(this.lastGeoJSON);
    }
    if (this.selectedTreeId) {
      this.map.setFilter('trees-selected', ['==', ['get', 'id'], this.selectedTreeId]);
    }
  }

  private buildGeoJSON(trees: Tree[]): any {
    const features: any[] = [];
    for (const tree of trees) {
      const { lat, lng } = sarpangTmToWgs84(
        Number(tree.xCoordinate),
        Number(tree.yCoordinate),
      );
      // Skip records whose coordinates don't produce valid WGS84 values
      if (
        !isFinite(lat) || !isFinite(lng) ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180
      ) {
        continue;
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          id: tree.id,
          treeId: tree.treeId,
          commonName: tree.commonName ?? (tree as any).species?.commonName ?? '',
          scientificName: tree.scientificName ?? (tree as any).species?.scientificName ?? '',
        },
      });
    }
    return { type: 'FeatureCollection', features };
  }

  private renderTrees(trees: Tree[]): void {
    const geojson = this.buildGeoJSON(trees);
    this.lastGeoJSON = geojson;

    if (!this.map || !this.map.isStyleLoaded()) return;

    const src = this.map.getSource('trees') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(geojson);
    }

    if (geojson.features.length > 0) {
      const coords: [number, number][] = geojson.features.map(
        (f: any) => f.geometry.coordinates as [number, number],
      );
      const bounds = coords.reduce(
        (b: maplibregl.LngLatBounds, c: [number, number]) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
    }
  }

  setLayer(layer: 'positron' | 'satellite'): void {
    if (!this.map) return;
    this.currentLayer = layer;
    this.map.setStyle(layer === 'positron' ? POSITRON_STYLE : SATELLITE_STYLE);
    this.map.once('styledata', () => this.addTreeLayers());
  }

  closeSidebar(): void {
    this.selectedTree = null;
    this.latestMetric = null;
    this.metricsGalleryVisible = false;
    this.metricsGalleryImages = [];
    this.selectedTreeId = null;
    if (this.map?.getLayer('trees-selected')) {
      this.map.setFilter('trees-selected', ['==', ['get', 'id'], '']);
    }
  }

  private selectTreeById(id: string, basicProps: any): void {
    this.selectedTreeId = id;
    if (this.map?.getLayer('trees-selected')) {
      this.map.setFilter('trees-selected', ['==', ['get', 'id'], id]);
    }
    this.treeService.getOne(id).subscribe({
      next: (full) => {
        this.selectedTree = full;
        this.latestMetric = full.growthMetrics?.[0] ?? null;
      },
      error: () => {
        this.selectedTree = {
          id,
          treeId: basicProps['treeId'],
          commonName: basicProps['commonName'],
          scientificName: basicProps['scientificName'],
        } as any;
        this.latestMetric = null;
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
    this.loadingMap = true;

    const hasFilters =
      !!this.selectedSpeciesId ||
      this.heightValue != null ||
      this.dbhValue != null ||
      this.canopyValue != null;

    const onSuccess = (items: Tree[]) => {
      this.trees = items;
      this.renderTrees(items);
      this.loadingMap = false;
    };
    const onError = () => {
      this.trees = [];
      this.renderTrees([]);
      this.loadingMap = false;
    };

    if (hasFilters) {
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
        .subscribe({ next: (res) => onSuccess(res.items), error: onError });
    } else {
      this.treeService.getAllForMap().subscribe({ next: onSuccess, error: onError });
    }
  }
}
