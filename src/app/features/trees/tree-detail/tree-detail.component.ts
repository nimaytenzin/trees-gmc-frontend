import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TreeService } from '../services/tree.service';
import { Tree } from '../../../core/models/tree.model';
import { ConditionBadgeComponent } from '../../../shared/components/condition-badge/condition-badge.component';

@Component({
  selector: 'app-tree-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TagModule,
    TableModule,
    GalleriaModule,
    ButtonModule,
    BaseChartDirective,
    ConditionBadgeComponent,
  ],
  template: `
    @if (tree) {
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div class="flex items-center gap-3">
              <button pButton icon="pi pi-arrow-left" [outlined]="true" severity="secondary" [routerLink]="['/app/dashboard']" class="p-button-sm"></button>
              <div>
                <h1 class="text-2xl font-bold text-forest">{{ tree.commonName }}</h1>
                <p class="text-stone-500 italic">{{ tree.scientificName }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-forest/10 text-forest rounded-full text-sm font-medium">
              {{ tree.treeId }}
            </span>
            @if (tree.growthMetrics?.length) {
              <app-condition-badge
                [condition]="tree.growthMetrics?.[0]?.healthCondition ?? tree.growthMetrics?.[0]?.condition ?? ''"
              />
            }
          </div>
        </div>

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <p-card styleClass="text-center">
            <p class="text-sm text-stone-500">Location</p>
            <p class="text-lg font-semibold text-forest">
              {{ tree.xCoordinate | number:'1.4-4' }}, {{ tree.yCoordinate | number:'1.4-4' }}
            </p>
          </p-card>
          @if (tree.growthMetrics?.length) {
            @let latest = tree.growthMetrics![0];
            <p-card styleClass="text-center">
              <p class="text-sm text-stone-500">Height</p>
              <p class="text-2xl font-bold text-forest">{{ latest.heightM }} m</p>
            </p-card>
            <p-card styleClass="text-center">
              <p class="text-sm text-stone-500">DBH</p>
              <p class="text-2xl font-bold text-forest">{{ latest.dbhCm }} cm</p>
            </p-card>
            <p-card styleClass="text-center">
              <p class="text-sm text-stone-500">Canopy</p>
              <p class="text-2xl font-bold text-forest">{{ latest.canopySpreadM }} m</p>
            </p-card>
          }
        </div>

        <!-- Growth Charts -->
        @if (heightChartData.datasets[0].data.length > 1) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <p-card header="Height Trend">
              <canvas baseChart [datasets]="heightChartData.datasets" [labels]="heightChartData.labels" [options]="chartOptions" type="line"></canvas>
            </p-card>
            <p-card header="DBH Trend">
              <canvas baseChart [datasets]="dbhChartData.datasets" [labels]="dbhChartData.labels" [options]="chartOptions" type="line"></canvas>
            </p-card>
          </div>
        }

        <!-- Growth History Table -->
        <p-card header="Growth History" styleClass="mb-6">
          <p-table [value]="tree.growthMetrics || []" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>Height (m)</th>
                <th>DBH (cm)</th>
                <th>Canopy (m)</th>
                <th>Condition</th>
                <th>Remarks</th>
                <th>Photos</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-metric>
              <tr>
                <td>{{ metric.recordedAt | date:'mediumDate' }}</td>
                <td>{{ metric.heightM }}</td>
                <td>{{ metric.dbhCm }}</td>
                <td>{{ metric.canopySpreadM }}</td>
                <td>
                  <app-condition-badge [condition]="metric.healthCondition ?? metric.condition ?? ''" />
                </td>
                <td>{{ metric.remarks || '-' }}</td>
                <td>
                  @if (metric.photos?.length) {
                    <span class="text-forest cursor-pointer" (click)="showGallery(metric.photos)">
                      <i class="pi pi-images"></i> {{ metric.photos.length }}
                    </span>
                  } @else {
                    -
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- Gallery -->
        @if (galleryVisible && galleryImages.length) {
          <p-galleria
            [value]="galleryImages"
            [(visible)]="galleryVisible"
            [fullScreen]="true"
            [numVisible]="5"
            [circular]="true"
          >
            <ng-template pTemplate="item" let-item>
              <img [src]="item.url" class="max-h-[80vh] object-contain" />
            </ng-template>
            <ng-template pTemplate="thumbnail" let-item>
              <img [src]="item.url" class="w-16 h-16 object-cover rounded" />
            </ng-template>
          </p-galleria>
        }
      </div>
    }
  `,
})
export class TreeDetailComponent implements OnInit {
  tree: Tree | null = null;
  galleryVisible = false;
  galleryImages: any[] = [];

  heightChartData: any = { labels: [], datasets: [{ data: [], label: 'Height (m)', borderColor: '#2D5016', tension: 0.3 }] };
  dbhChartData: any = { labels: [], datasets: [{ data: [], label: 'DBH (cm)', borderColor: '#6B4226', tension: 0.3 }] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: false } },
  };

  constructor(
    private route: ActivatedRoute,
    private treeService: TreeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.treeService.getOne(id).subscribe((tree) => {
      this.tree = tree;
      this.buildCharts(tree);
    });
  }

  private buildCharts(tree: Tree): void {
    const metrics = [...(tree.growthMetrics || [])].reverse();
    const labels = metrics.map((m) => new Date(m.recordedAt).toLocaleDateString());

    this.heightChartData = {
      labels,
      datasets: [{
        data: metrics.map((m) => m.heightM),
        label: 'Height (m)',
        borderColor: '#2D5016',
        backgroundColor: 'rgba(45, 80, 22, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };

    this.dbhChartData = {
      labels,
      datasets: [{
        data: metrics.map((m) => m.dbhCm),
        label: 'DBH (cm)',
        borderColor: '#6B4226',
        backgroundColor: 'rgba(107, 66, 38, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };
  }

  showGallery(photos: any[]): void {
    this.galleryImages = photos;
    this.galleryVisible = true;
  }
}
