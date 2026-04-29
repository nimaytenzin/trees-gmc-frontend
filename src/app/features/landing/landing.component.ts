import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { APP_NAME } from '../../core/constants/app.constants';
import { AuthService } from '../../core/services/auth.service';
import { TreeService } from '../trees/services/tree.service';
import { Tree } from '../../core/models/tree.model';
import { GrowthMetric } from '../../core/models/growth-metric.model';
import maplibregl from 'maplibre-gl';
import { sarpangTmToWgs84 } from '../../core/utils/crs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { Species } from '../../core/models/species.model';
import { environment } from '../../../environments';
import { AccordionModule } from 'primeng/accordion';
import { GalleriaModule } from 'primeng/galleria';

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

const CHART_PRIMARY = '#00563E';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    TagModule,
    DropdownModule,
    AccordionModule,
    GalleriaModule,
  ],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  readonly appName = APP_NAME;
  assessmentsActiveIndex: number | number[] = 0;

  get displayCommonName(): string {
    const t = this.selectedTree;
    return t?.commonName ?? t?.species?.commonName ?? t?.treeId ?? '—';
  }
  get displayScientificName(): string {
    const t = this.selectedTree;
    return t?.scientificName ?? t?.species?.scientificName ?? '—';
  }
  get displayCondition(): string | undefined {
    return this.latestMetric?.healthCondition ?? this.latestMetric?.condition ?? undefined;
  }
  get sparklineData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.heightM);
  }
  get sparklineDbhData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.dbhM);
  }
  get sparklineCanopyData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.canopySpreadM);
  }
  readonly chartPrimary = CHART_PRIMARY;

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

  totalTrees = 0;
  speciesCount = 0;
  avgHeight = '';
  searchQuery = '';
  searchResults: Tree[] = [];
  mapTrees: Tree[] = [];
  selectedTree: Tree | null = null;
  selectedTreePhoto: string | null = null;
  latestMetric: GrowthMetric | null = null;
  metricsGalleryVisible = false;
  metricsGalleryImages: any[] = [];
  isFavorited = false;
  isLoggedIn = false;
  currentLayer: 'positron' | 'satellite' = 'positron';

  selectedSpeciesId: string | null = null;
  speciesOptions: { label: string; value: string }[] = [];
  numericOpOptions: { label: string; value: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' }[] = [
    { label: '=', value: 'eq' },
    { label: '>', value: 'gt' },
    { label: '≥', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '≤', value: 'lte' },
  ];
  heightOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  heightValue: number | null = null;
  dbhOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  dbhValue: number | null = null;
  canopyOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' = 'eq';
  canopyValue: number | null = null;
  private mapFilterTimeout: ReturnType<typeof setTimeout> | null = null;

  private map: maplibregl.Map | null = null;
  private selectedTreeId: string | null = null;
  private lastGeoJSON: any = { type: 'FeatureCollection', features: [] };

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly treeService: TreeService,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();

    this.treeService.getPublicSpecies().subscribe({
      next: (species: Species[]) => {
        this.speciesOptions = species
          .map((s) => ({ label: `${s.commonName} (${s.scientificName})`, value: s.id }))
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {},
    });

    this.treeService.getPublicStatistics().subscribe({
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
      this.map.addSource('trees', { type: 'geojson', data: this.lastGeoJSON });
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
    if (src) src.setData(geojson);

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
    this.selectedTreePhoto = null;
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
    this.isFavorited = false;
    this.treeService.getPublicTree(id).subscribe({
      next: (full) => {
        this.selectedTree = full;
        this.latestMetric = full.growthMetrics?.[0] ?? null;
        this.selectedTreePhoto = this.latestMetric?.photos?.[0]?.url ?? null;
      },
      error: () => {
        this.selectedTree = {
          id,
          treeId: basicProps['treeId'],
          commonName: basicProps['commonName'],
          scientificName: basicProps['scientificName'],
        } as any;
        this.latestMetric = null;
        this.selectedTreePhoto = null;
      },
    });
  }

  selectTree(tree: Tree): void {
    this.selectTreeById(tree.id, {
      treeId: tree.treeId,
      commonName: tree.commonName ?? (tree as any).species?.commonName ?? '',
      scientificName: tree.scientificName ?? (tree as any).species?.scientificName ?? '',
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

    const hasFilters =
      !!this.selectedSpeciesId ||
      this.heightValue != null ||
      this.dbhValue != null ||
      this.canopyValue != null;

    if (hasFilters) {
      this.treeService
        .getPublicTrees({
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
            this.mapTrees = res.items;
            this.renderTrees(res.items);
          },
          error: () => {
            this.mapTrees = [];
            this.renderTrees([]);
          },
        });
    } else {
      this.treeService.getPublicTreesForMap().subscribe({
        next: (items) => {
          this.mapTrees = items;
          this.renderTrees(items);
        },
        error: () => {
          this.mapTrees = [];
          this.renderTrees([]);
        },
      });
    }
  }

  openMetricsGallery(photos?: any[] | null): void {
    const raw = photos ?? [];
    this.metricsGalleryImages = raw.map((p) => ({ ...p, url: this.apiUrl(p.url) }));
    this.metricsGalleryVisible = this.metricsGalleryImages.length > 0;
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    this.treeService.getPublicTrees({ search: this.searchQuery, limit: 10 }).subscribe({
      next: (res) => { this.searchResults = res.items; },
      error: () => { this.searchResults = []; },
    });
  }

  navigateToMap(): void {
    this.router.navigate(this.isLoggedIn ? ['/app/map'] : ['/login']);
  }
  navigateToRegistry(): void {
    this.router.navigate(this.isLoggedIn ? ['/app/dashboard'] : ['/login']);
  }
  scrollToMap(): void {
    document.querySelector('#mapArea')?.scrollIntoView({ behavior: 'smooth' });
  }
  scrollToSidebar(): void {
    document.querySelector('aside')?.scrollIntoView({ behavior: 'smooth' });
  }
  toggleFavorite(): void {
    this.isFavorited = !this.isFavorited;
  }
  shareTree(): void {
    if (this.selectedTree && navigator.share) {
      navigator.share({
        title: `${this.displayCommonName} - ${this.appName}`,
        text: `Check out ${this.displayCommonName} (${this.displayScientificName}) on ${this.appName}`,
        url: window.location.href,
      });
    }
  }
  reportConcern(): void {
    this.router.navigate(this.isLoggedIn ? ['/app/trees/growth-metric'] : ['/login']);
  }

  getConditionBadgeClass(condition: string): string {
    switch (condition) {
      case 'Good': return 'bg-primary text-background-dark';
      case 'Fair': return 'bg-amber-400 text-amber-900';
      case 'Poor': return 'bg-red-500 text-white';
      case 'Dead': return 'bg-slate-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  }
  getConditionPanelClass(condition: string): string {
    switch (condition) {
      case 'Good': return 'bg-primary/10 border border-primary/20';
      case 'Fair': return 'bg-amber-50 border border-amber-200';
      case 'Poor': return 'bg-red-50 border border-red-200';
      case 'Dead': return 'bg-slate-100 border border-slate-300';
      default: return 'bg-slate-50 border border-slate-200';
    }
  }
  getConditionDotClass(condition: string): string {
    switch (condition) {
      case 'Good': return 'bg-primary';
      case 'Fair': return 'bg-amber-400';
      case 'Poor': return 'bg-red-500';
      case 'Dead': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  }
  getConditionIconClass(condition: string): string {
    switch (condition) {
      case 'Good': return 'text-primary';
      case 'Fair': return 'text-amber-500';
      case 'Poor': return 'text-red-500';
      case 'Dead': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  }
  getConditionLabel(condition: string): string {
    if (!condition) return '—';
    switch (condition) {
      case 'Good': return 'Excellent (Thriving)';
      case 'Fair': return 'Fair (Needs Attention)';
      case 'Poor': return 'Poor (Critical)';
      case 'Dead': return 'Dead';
      default: return condition;
    }
  }
}
