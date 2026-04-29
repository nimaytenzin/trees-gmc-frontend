import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TreeService } from '../services/tree.service';
import { environment } from '../../../../environments';
import { Tree } from '../../../core/models/tree.model';
import { GrowthMetric } from '../../../core/models/growth-metric.model';
import { ConditionBadgeComponent } from '../../../shared/components/condition-badge/condition-badge.component';
import { TreeEditDialogComponent } from '../../admin/tree-edit-dialog/tree-edit-dialog.component';

@Component({
  selector: 'app-tree-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    TagModule,
    TableModule,
    GalleriaModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    BaseChartDirective,
    ConditionBadgeComponent,
    TreeEditDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    @if (tree) {
      <!-- Edit Tree Dialog -->
      <app-tree-edit-dialog
        [(visible)]="editTreeVisible"
        [tree]="tree"
        (treeSaved)="onTreeSaved($event)"
      />

      <!-- Edit Metric Dialog -->
      <p-dialog
        header="Edit Growth Metric"
        [(visible)]="editMetricVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: 'min(760px, 96vw)' }"
      >
        @if (metricForm) {
          <form [formGroup]="metricForm" (ngSubmit)="saveMetric()" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Height (m) *</label>
              <p-inputNumber formControlName="heightM" [minFractionDigits]="3" [maxFractionDigits]="3" [min]="0.1" [max]="80" mode="decimal" suffix=" m" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">DBH (m) *</label>
              <p-inputNumber formControlName="dbhM" [minFractionDigits]="4" [maxFractionDigits]="4" [min]="0.01" [max]="3" mode="decimal" suffix=" m" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Canopy Spread (m) *</label>
              <p-inputNumber formControlName="canopySpreadM" [minFractionDigits]="3" [maxFractionDigits]="3" [min]="0.5" [max]="40" mode="decimal" suffix=" m" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Health Condition *</label>
              <p-dropdown formControlName="healthCondition" [options]="conditions" placeholder="Select" styleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Assessment Type</label>
              <p-dropdown formControlName="assessmentType" [options]="assessmentTypes" placeholder="Auto" [showClear]="true" styleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Existing Form</label>
              <p-dropdown formControlName="existingForm" [options]="conditions" placeholder="Optional" [showClear]="true" styleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Amenity Value</label>
              <p-dropdown formControlName="amenityValue" [options]="amenityValues" placeholder="Optional" [showClear]="true" styleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Transplant Survival</label>
              <p-dropdown formControlName="transplantSurvival" [options]="transplantSurvivalOptions" placeholder="Optional" [showClear]="true" styleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Recorded At</label>
              <p-calendar formControlName="recordedAt" [showTime]="true" dateFormat="yy-mm-dd" styleClass="w-full" inputStyleClass="w-full" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Remarks</label>
              <textarea class="w-full border border-stone-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" formControlName="remarks" rows="3" placeholder="Observations..."></textarea>
            </div>
            <div class="md:col-span-2 flex justify-end gap-2 pt-2">
              <p-button label="Cancel" severity="secondary" [outlined]="true" type="button" (onClick)="editMetricVisible = false" />
              <p-button label="Save Changes" icon="pi pi-check" type="submit" [loading]="savingMetric" [disabled]="metricForm.invalid || savingMetric" />
            </div>
          </form>
        }
      </p-dialog>

      <!-- Photo Lightbox -->
      @if (galleryVisible && galleryImages.length) {
        <p-galleria
          [value]="galleryImages"
          [(visible)]="galleryVisible"
          [fullScreen]="true"
          [numVisible]="5"
          [circular]="true"
          [showThumbnails]="true"
        >
          <ng-template pTemplate="item" let-item>
            <img [src]="photoUrl(item.url)" class="max-h-[80vh] max-w-full object-contain rounded" />
          </ng-template>
          <ng-template pTemplate="thumbnail" let-item>
            <img [src]="photoUrl(item.url)" class="w-16 h-16 object-cover rounded" />
          </ng-template>
        </p-galleria>
      }

      <div class="max-w-6xl mx-auto space-y-6">

        <!-- ── Header ── -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button pButton icon="pi pi-arrow-left" [outlined]="true" severity="secondary" [routerLink]="['/app/dashboard']" class="shrink-0"></button>
            <div>
              <h1 class="text-2xl font-bold text-forest leading-tight">{{ tree.commonName }}</h1>
              <p class="text-stone-500 italic text-sm">{{ tree.scientificName }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 bg-forest/10 text-forest rounded-full text-sm font-semibold">{{ tree.treeId }}</span>
            @if (tree.growthMetrics?.length) {
              <app-condition-badge [condition]="tree.growthMetrics![0].healthCondition ?? tree.growthMetrics![0].condition ?? ''" />
            }
            <p-button label="Edit Tree" icon="pi pi-pencil" severity="info" [outlined]="true" size="small" (onClick)="editTreeVisible = true" />
          </div>
        </div>

        <!-- ── Info Cards ── -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-xl border border-stone-200 p-4">
            <p class="text-xs text-stone-400 uppercase tracking-wide mb-1">Survey Area</p>
            <p class="font-semibold text-stone-700 text-sm">{{ tree.surveyArea?.name ?? '—' }}</p>
          </div>
          <div class="bg-white rounded-xl border border-stone-200 p-4">
            <p class="text-xs text-stone-400 uppercase tracking-wide mb-1">Year Planted</p>
            <p class="font-semibold text-stone-700 text-sm">{{ tree.yearOfPlantation ?? '—' }}</p>
          </div>
          <div class="bg-white rounded-xl border border-stone-200 p-4 md:col-span-2">
            <p class="text-xs text-stone-400 uppercase tracking-wide mb-1">Coordinates (X, Y)</p>
            <p class="font-semibold text-stone-700 text-sm font-mono">
              {{ tree.xCoordinate | number:'1.4-4' }}, {{ tree.yCoordinate | number:'1.4-4' }}
              @if (tree.zCoordinate) { <span class="text-stone-400 font-sans font-normal ml-1">Z: {{ tree.zCoordinate | number:'1.1-1' }} m</span> }
            </p>
          </div>
          @if (tree.growthMetrics?.length) {
            @let latest = tree.growthMetrics![0];
            <div class="bg-forest/5 rounded-xl border border-forest/20 p-4 text-center">
              <p class="text-xs text-forest/60 uppercase tracking-wide mb-1">Height</p>
              <p class="text-2xl font-bold text-forest">{{ latest.heightM }} <span class="text-sm font-normal">m</span></p>
            </div>
            <div class="bg-bark/5 rounded-xl border border-bark/20 p-4 text-center">
              <p class="text-xs text-bark/60 uppercase tracking-wide mb-1">DBH</p>
              <p class="text-2xl font-bold text-bark">{{ latest.dbhM }} <span class="text-sm font-normal">m</span></p>
            </div>
            <div class="bg-sage/10 rounded-xl border border-sage/30 p-4 text-center">
              <p class="text-xs text-stone-500 uppercase tracking-wide mb-1">Canopy</p>
              <p class="text-2xl font-bold text-stone-700">{{ latest.canopySpreadM }} <span class="text-sm font-normal">m</span></p>
            </div>
            <div class="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p class="text-xs text-stone-400 uppercase tracking-wide mb-1">Metrics</p>
              <p class="text-2xl font-bold text-stone-700">{{ tree.growthMetrics!.length }}</p>
            </div>
          }
        </div>

        <!-- ── Growth Charts ── -->
        @if (heightChartData.datasets[0].data.length > 1) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <p-card header="Height Trend (m)">
              <canvas baseChart [datasets]="heightChartData.datasets" [labels]="heightChartData.labels" [options]="chartOptions" type="line"></canvas>
            </p-card>
            <p-card header="DBH Trend (m)">
              <canvas baseChart [datasets]="dbhChartData.datasets" [labels]="dbhChartData.labels" [options]="chartOptions" type="line"></canvas>
            </p-card>
          </div>
        }

        <!-- ── Growth History ── -->
        <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 class="font-semibold text-stone-700">Growth History</h2>
            <span class="text-sm text-stone-400">{{ tree.growthMetrics?.length ?? 0 }} records</span>
          </div>

          @if (!tree.growthMetrics?.length) {
            <div class="py-12 text-center text-stone-400">
              <i class="pi pi-chart-line text-3xl mb-2 block"></i>
              No growth records yet
            </div>
          } @else {
            <div class="divide-y divide-stone-100">
              @for (metric of tree.growthMetrics!; track metric.id) {
                <div class="p-5">
                  <!-- Metric header row -->
                  <div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div class="flex flex-wrap items-center gap-3">
                      <span class="text-sm font-medium text-stone-500">{{ metric.recordedAt | date:'mediumDate' }}</span>
                      <app-condition-badge [condition]="metric.healthCondition ?? metric.condition ?? ''" />
                      @if (metric.assessmentType) {
                        <span class="text-xs px-2 py-0.5 rounded"
                          [ngClass]="metric.assessmentType === 'Initial' ? 'bg-forest/10 text-forest' : 'bg-stone-100 text-stone-600'">
                          {{ metric.assessmentType }}
                        </span>
                      }
                    </div>
                    <div class="flex gap-1 shrink-0">
                      <button pButton icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit metric" (click)="openEditMetric(metric)"></button>
                      <button pButton icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete metric" (click)="confirmDeleteMetric($event, metric)"></button>
                    </div>
                  </div>

                  <!-- Measurements -->
                  <div class="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                    <div class="bg-stone-50 rounded-lg p-2 text-center">
                      <p class="text-xs text-stone-400">Height</p>
                      <p class="font-semibold text-stone-700">{{ metric.heightM }} m</p>
                    </div>
                    <div class="bg-stone-50 rounded-lg p-2 text-center">
                      <p class="text-xs text-stone-400">DBH</p>
                      <p class="font-semibold text-stone-700">{{ metric.dbhM }} m</p>
                    </div>
                    <div class="bg-stone-50 rounded-lg p-2 text-center">
                      <p class="text-xs text-stone-400">Canopy</p>
                      <p class="font-semibold text-stone-700">{{ metric.canopySpreadM }} m</p>
                    </div>
                    @if (metric.amenityValue) {
                      <div class="bg-stone-50 rounded-lg p-2 text-center">
                        <p class="text-xs text-stone-400">Amenity</p>
                        <p class="font-semibold text-stone-700">{{ metric.amenityValue }}</p>
                      </div>
                    }
                    @if (metric.existingForm) {
                      <div class="bg-stone-50 rounded-lg p-2 text-center">
                        <p class="text-xs text-stone-400">Form</p>
                        <p class="font-semibold text-stone-700">{{ metric.existingForm }}</p>
                      </div>
                    }
                    @if (metric.transplantSurvival) {
                      <div class="bg-stone-50 rounded-lg p-2 text-center">
                        <p class="text-xs text-stone-400">Transplant</p>
                        <p class="font-semibold text-stone-700">{{ metric.transplantSurvival }}</p>
                      </div>
                    }
                  </div>

                  @if (metric.remarks) {
                    <p class="mt-2 text-sm text-stone-500 italic">{{ metric.remarks }}</p>
                  }

                  <!-- Photos inline grid -->
                  @if (metric.photos?.length) {
                    <div class="mt-3">
                      <p class="text-xs text-stone-400 mb-2"><i class="pi pi-images mr-1"></i>{{ metric.photos!.length }} photo{{ metric.photos!.length > 1 ? 's' : '' }}</p>
                      <div class="flex flex-wrap gap-2">
                        @for (photo of metric.photos!; track photo.id; let i = $index) {
                          <img
                            [src]="photoUrl(photo.url)"
                            [alt]="'Photo ' + (i + 1)"
                            class="w-20 h-20 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-150 shadow-sm"
                            (click)="openGallery(metric.photos!, i)"
                          />
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      </div>
    } @else {
      <div class="flex items-center justify-center h-64 text-stone-400">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>
    }
  `,
})
export class TreeDetailComponent implements OnInit {
  tree: Tree | null = null;
  editTreeVisible = false;
  editMetricVisible = false;
  savingMetric = false;
  editingMetric: GrowthMetric | null = null;
  metricForm: FormGroup | null = null;
  galleryVisible = false;
  galleryImages: any[] = [];
  galleryIndex = 0;

  conditions = [
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Dead', value: 'Dead' },
  ];
  assessmentTypes = [
    { label: 'Initial', value: 'Initial' },
    { label: 'Periodic', value: 'Periodic' },
  ];
  amenityValues = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];
  transplantSurvivalOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ];

  heightChartData: any = { labels: [], datasets: [{ data: [], label: 'Height (m)', borderColor: '#2D5016', tension: 0.3 }] };
  dbhChartData: any = { labels: [], datasets: [{ data: [], label: 'DBH (m)', borderColor: '#6B4226', tension: 0.3 }] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: false } },
  };

  constructor(
    private route: ActivatedRoute,
    private treeService: TreeService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadTree();
  }

  reload(): void {
    this.loadTree();
  }

  onTreeSaved(partial: Partial<Tree>): void {
    if (this.tree) {
      this.tree = { ...this.tree, ...partial };
    }
    this.loadTree();
  }

  private loadTree(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.treeService.getOne(id).subscribe((tree) => {
      this.tree = tree;
      this.buildCharts(tree);
    });
  }

  photoUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.uploadsBaseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  openGallery(photos: any[], startIndex: number): void {
    this.galleryImages = photos;
    this.galleryIndex = startIndex;
    this.galleryVisible = true;
  }

  openEditMetric(metric: GrowthMetric): void {
    this.editingMetric = metric;
    this.metricForm = this.fb.group({
      heightM: [metric.heightM, Validators.required],
      dbhM: [metric.dbhM, Validators.required],
      canopySpreadM: [metric.canopySpreadM, Validators.required],
      healthCondition: [metric.healthCondition ?? metric.condition ?? '', Validators.required],
      assessmentType: [metric.assessmentType ?? ''],
      existingForm: [metric.existingForm ?? ''],
      amenityValue: [metric.amenityValue ?? ''],
      transplantSurvival: [metric.transplantSurvival ?? ''],
      remarks: [metric.remarks ?? ''],
      recordedAt: [metric.recordedAt ? new Date(metric.recordedAt) : new Date()],
    });
    this.editMetricVisible = true;
  }

  saveMetric(): void {
    if (!this.metricForm || this.metricForm.invalid || !this.editingMetric || !this.tree) return;
    this.savingMetric = true;
    const v = this.metricForm.value;
    const payload = {
      heightM: v.heightM,
      dbhM: v.dbhM,
      canopySpreadM: v.canopySpreadM,
      healthCondition: v.healthCondition,
      assessmentType: v.assessmentType || undefined,
      existingForm: v.existingForm || undefined,
      amenityValue: v.amenityValue || undefined,
      transplantSurvival: v.transplantSurvival || undefined,
      remarks: v.remarks || undefined,
      recordedAt: v.recordedAt instanceof Date ? v.recordedAt.toISOString() : v.recordedAt,
    };
    this.treeService.updateGrowthMetric(this.tree.id, this.editingMetric.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Growth metric updated' });
        this.savingMetric = false;
        this.editMetricVisible = false;
        this.loadTree();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update metric' });
        this.savingMetric = false;
      },
    });
  }

  confirmDeleteMetric(event: Event, metric: GrowthMetric): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete this growth metric and all its photos? This cannot be undone.',
      header: 'Delete Metric',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.treeService.deleteGrowthMetric(this.tree!.id, metric.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Growth metric removed' });
            this.loadTree();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete metric' });
          },
        });
      },
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
        data: metrics.map((m) => m.dbhM),
        label: 'DBH (m)',
        borderColor: '#6B4226',
        backgroundColor: 'rgba(107, 66, 38, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };
  }
}
