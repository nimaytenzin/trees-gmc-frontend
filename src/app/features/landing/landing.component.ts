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
import * as L from 'leaflet';
import 'leaflet.markercluster';
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

/** Primary theme colour for charts (no grids). */
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
  /** Display common name: from tree or species. */
  get displayCommonName(): string {
    const t = this.selectedTree;
    return t?.commonName ?? t?.species?.commonName ?? t?.treeId ?? '—';
  }
  /** Display scientific name: from tree or species. */
  get displayScientificName(): string {
    const t = this.selectedTree;
    return t?.scientificName ?? t?.species?.scientificName ?? '—';
  }
  /** Condition for Health section: from latest growth metric. */
  get displayCondition(): string | undefined {
    return this.latestMetric?.healthCondition ?? this.latestMetric?.condition ?? undefined;
  }
  /** Height trend for sparkline (oldest to newest), primary colour. */
  get sparklineData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.heightM);
  }

  /** DBH trend for sparkline (oldest to newest). */
  get sparklineDbhData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.dbhM);
  }

  /** Canopy trend for sparkline (oldest to newest). */
  get sparklineCanopyData(): number[] {
    if (!this.selectedTree?.growthMetrics?.length) return [];
    return [...this.selectedTree.growthMetrics].reverse().map((m) => m.canopySpreadM);
  }
  readonly chartPrimary = CHART_PRIMARY;

  /** Resolves asset icon path so it works from any route (dev and prod). */
  iconPath(filename: string): string {
    const base = typeof document !== 'undefined' && document.querySelector('base')?.href?.replace(/\/$/, '') || '';
    return `${base}/assets/icons/${filename}`;
  }

  /** Builds full API URL (for images like /uploads/...) */
  apiUrl(path: string): string {
    if (!path) return '';
    // If already absolute, return as-is
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const cleaned = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleaned}`;
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

  // --- Map filters (public) ---
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
  private mapFilterTimeout: any;

  private map: L.Map | null = null;
  private positronLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;
  private markersLayer: L.LayerGroup | null = null;
  private markersByTreeId = new Map<string, L.Marker>();
  private selectedTreeMapId: string | null = null;

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
          .map((s) => ({
            label: `${s.commonName} (${s.scientificName})`,
            value: s.id,
          }))
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
    this.loadMapTrees();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
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

    // Close sidebar when clicking on the map (not on a marker)
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
      const marker = L.marker([+tree.yCoordinate, +tree.xCoordinate], {
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
        trees.map((t) => [t.yCoordinate, t.xCoordinate] as L.LatLngTuple),
      );
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
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
    clearTimeout(this.mapFilterTimeout);
    this.mapFilterTimeout = setTimeout(() => this.loadMapTrees(), 300);
  }

  loadMapTrees(): void {
    this.closeSidebar();
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
          this.addMarkers(res.items);
        },
        error: () => {},
      });
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

  toggleLayer(): void {
    this.setLayer(this.currentLayer === 'positron' ? 'satellite' : 'positron');
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
    this.selectedTreePhoto = null;
    this.latestMetric = null;
    this.metricsGalleryVisible = false;
    this.metricsGalleryImages = [];
    this.setSelectedMarker(null);
  }

  selectTree(tree: Tree): void {
    // Fetch full tree (includes growthMetrics + photos)
    this.isFavorited = false;
    this.setSelectedMarker(tree.id);
    this.treeService.getPublicTree(tree.id).subscribe({
      next: (full) => {
        this.selectedTree = full;
        this.latestMetric =
          full.growthMetrics && full.growthMetrics.length > 0 ? full.growthMetrics[0] : null;

        this.selectedTreePhoto = null;
        if (this.latestMetric?.photos && this.latestMetric.photos.length > 0) {
          this.selectedTreePhoto = this.latestMetric.photos[0].url;
        }
      },
      error: () => {
        // Fallback to partial tree so UI still shows something
        this.selectedTree = tree;
        this.latestMetric =
          tree.growthMetrics && tree.growthMetrics.length > 0 ? tree.growthMetrics[0] : null;
        this.selectedTreePhoto = null;
      },
    });
  }

  openMetricsGallery(photos?: any[] | null): void {
    this.metricsGalleryImages = photos ?? [];
    this.metricsGalleryVisible = this.metricsGalleryImages.length > 0;
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    this.treeService.getPublicTrees({ search: this.searchQuery, limit: 10 }).subscribe({
      next: (res) => {
        this.searchResults = res.items;
      },
      error: () => {
        this.searchResults = [];
      },
    });
  }

  navigateToMap(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/app/map']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  navigateToRegistry(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/app/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
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
    if (this.isLoggedIn) {
      this.router.navigate(['/app/trees/growth-metric']);
    } else {
      this.router.navigate(['/login']);
    }
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
