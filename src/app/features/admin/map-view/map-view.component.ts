import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { TreeService } from '../../trees/services/tree.service';
import { Tree } from '../../../core/models/tree.model';
import { SparklineComponent } from '../../../shared/components/sparkline/sparkline.component';
import { ConditionBadgeComponent } from '../../../shared/components/condition-badge/condition-badge.component';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    OverlayPanelModule,
    SparklineComponent,
    ConditionBadgeComponent,
  ],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-forest">Map View</h1>
          <p class="text-stone-500 mt-1">{{ trees.length }} trees mapped</p>
        </div>
        <div class="flex gap-2">
          <p-button
            [label]="currentLayer === 'osm' ? 'Satellite' : 'Street'"
            icon="pi pi-map"
            severity="secondary"
            [outlined]="true"
            (onClick)="toggleLayer()"
          />
          <a routerLink="/app/dashboard">
            <p-button label="Dashboard" icon="pi pi-th-large" severity="secondary" [outlined]="true" />
          </a>
        </div>
      </div>

      <div class="flex-1 rounded-xl overflow-hidden border border-stone-200 relative" style="min-height: 500px">
        <div #mapContainer class="w-full h-full"></div>
      </div>

      <!-- Tree Popup Overlay Panel -->
      <p-overlayPanel #treePanel [style]="{ width: '320px' }" styleClass="shadow-xl">
        @if (selectedTree) {
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-forest text-lg">{{ selectedTree.commonName ?? selectedTree.species?.commonName ?? selectedTree.treeId }}</h3>
                <p class="text-xs italic text-stone-400">{{ selectedTree.scientificName ?? selectedTree.species?.scientificName ?? '—' }}</p>
              </div>
              <span class="px-2 py-1 bg-forest/10 text-forest rounded text-xs font-medium">
                {{ selectedTree.treeId }}
              </span>
            </div>

            @if (selectedTree.growthMetrics?.length) {
              @let latest = selectedTree.growthMetrics![0];
              <div class="flex items-center gap-2">
                <app-condition-badge [condition]="latest.healthCondition ?? latest.condition ?? ''" />
                <span class="text-xs text-stone-400">
                  Last: {{ latest.recordedAt | date:'shortDate' }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-stone-50 rounded-lg p-2">
                  <p class="text-xs text-stone-400">Height</p>
                  <p class="font-bold text-forest">{{ latest.heightM }}m</p>
                </div>
                <div class="bg-stone-50 rounded-lg p-2">
                  <p class="text-xs text-stone-400">DBH</p>
                  <p class="font-bold text-forest">{{ latest.dbhCm }}cm</p>
                </div>
                <div class="bg-stone-50 rounded-lg p-2">
                  <p class="text-xs text-stone-400">Canopy</p>
                  <p class="font-bold text-forest">{{ latest.canopySpreadM }}m</p>
                </div>
              </div>

              @if (sparklineData.length > 1) {
                <div>
                  <p class="text-xs text-stone-400 mb-1">Height Trend</p>
                  <app-sparkline [data]="sparklineData" color="#2D5016" />
                </div>
              }
            }

            <a
              [routerLink]="['/app/trees', selectedTree.id]"
              class="block text-center py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90 transition-colors"
            >
              View Details
            </a>
          </div>
        }
      </p-overlayPanel>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: calc(100vh - 130px);
      }
    `,
  ],
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('treePanel') treePanel!: OverlayPanel;

  private map!: L.Map;
  private osmLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;
  currentLayer = 'osm';

  trees: Tree[] = [];
  selectedTree: Tree | null = null;
  sparklineData: number[] = [];

  constructor(private treeService: TreeService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadTrees();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [26.8516, 90.5042], // Gelephu coordinates
      zoom: 14,
      zoomControl: true,
    });

    this.osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 },
    );

    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '&copy; Esri', maxZoom: 19 },
    );

    this.osmLayer.addTo(this.map);
  }

  private loadTrees(): void {
    this.treeService.getAllForMap().subscribe((trees) => {
      this.trees = trees;
      this.addMarkers(trees);
    });
  }

  private addMarkers(trees: Tree[]): void {
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 50) size = 'large';
        else if (count > 10) size = 'medium';
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(40, 40),
        });
      },
    });

    const leafIcon = L.divIcon({
      className: 'custom-tree-marker',
      html: '<div class="tree-marker-pin"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    trees.forEach((tree) => {
      const marker = L.marker([tree.yCoordinate, tree.xCoordinate], {
        icon: leafIcon,
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        this.selectedTree = tree;
        this.sparklineData = [...(tree.growthMetrics || [])]
          .reverse()
          .map((m) => m.heightM);

        // Position overlay panel near the click
        const fakeEvent = {
          currentTarget: this.mapContainer.nativeElement,
          target: this.mapContainer.nativeElement,
          clientX: e.originalEvent.clientX,
          clientY: e.originalEvent.clientY,
        };
        this.treePanel.toggle(fakeEvent);
      });

      clusterGroup.addLayer(marker);
    });

    this.map.addLayer(clusterGroup);

    if (trees.length > 0) {
      const bounds = L.latLngBounds(
        trees.map((t) => [t.yCoordinate, t.xCoordinate] as L.LatLngTuple),
      );
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  toggleLayer(): void {
    if (this.currentLayer === 'osm') {
      this.map.removeLayer(this.osmLayer);
      this.satelliteLayer.addTo(this.map);
      this.currentLayer = 'satellite';
    } else {
      this.map.removeLayer(this.satelliteLayer);
      this.osmLayer.addTo(this.map);
      this.currentLayer = 'osm';
    }
  }
}
