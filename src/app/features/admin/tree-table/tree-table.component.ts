import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TreeService } from '../../trees/services/tree.service';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { AuthService } from '../../../core/services/auth.service';
import { Tree } from '../../../core/models/tree.model';
import { Species } from '../../../core/models/species.model';
import { SurveyArea } from '../../../core/models/survey-area.model';
import { ConditionBadgeComponent } from '../../../shared/components/condition-badge/condition-badge.component';

@Component({
  selector: 'app-tree-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ConditionBadgeComponent,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <!-- Filters -->
      <div class="p-4 border-b border-stone-100 flex flex-col gap-3">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="flex-1">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input
              pInputText
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search by Tree ID, name..."
              class="w-full"
            />
          </span>
          </div>

          <p-dropdown
            [(ngModel)]="selectedSpeciesId"
            [options]="speciesOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="loadTrees()"
            placeholder="All Species"
            [showClear]="true"
            styleClass="w-full md:w-56"
          />

          <p-dropdown
            [(ngModel)]="selectedCondition"
            [options]="conditionOptions"
            (onChange)="loadTrees()"
            placeholder="All Conditions"
            [showClear]="true"
            styleClass="w-full md:w-48"
          />

          <p-dropdown
            [(ngModel)]="selectedSurveyAreaId"
            [options]="surveyAreaOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="loadTrees()"
            placeholder="All Survey Areas"
            [showClear]="true"
            styleClass="w-full md:w-56"
          />

          <div class="flex gap-2">
            <p-button icon="pi pi-filter-slash" label="Clear" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
            <p-button icon="pi pi-download" label="Export CSV" severity="secondary" [outlined]="true" (onClick)="exportCsv()" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Height -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-stone-600 w-16">Height</span>
            <p-dropdown
              [(ngModel)]="heightOp"
              [options]="numericOpOptions"
              optionLabel="label"
              optionValue="value"
              (onChange)="loadTrees()"
              placeholder="Op"
              [showClear]="true"
              styleClass="w-24"
            />
            <input
              pInputText
              type="number"
              [(ngModel)]="heightValue"
              (input)="onMetricFilterInput()"
              placeholder="m"
              class="w-full"
            />
          </div>

          <!-- DBH -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-stone-600 w-16">DBH</span>
            <p-dropdown
              [(ngModel)]="dbhOp"
              [options]="numericOpOptions"
              optionLabel="label"
              optionValue="value"
              (onChange)="loadTrees()"
              placeholder="Op"
              [showClear]="true"
              styleClass="w-24"
            />
            <input
              pInputText
              type="number"
              [(ngModel)]="dbhValue"
              (input)="onMetricFilterInput()"
              placeholder="cm"
              class="w-full"
            />
          </div>

          <!-- Canopy -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-stone-600 w-16">Canopy</span>
            <p-dropdown
              [(ngModel)]="canopyOp"
              [options]="numericOpOptions"
              optionLabel="label"
              optionValue="value"
              (onChange)="loadTrees()"
              placeholder="Op"
              [showClear]="true"
              styleClass="w-24"
            />
            <input
              pInputText
              type="number"
              [(ngModel)]="canopyValue"
              (input)="onMetricFilterInput()"
              placeholder="m"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Table -->
      <p-table
        [value]="trees"
        [lazy]="true"
        [paginator]="true"
        [rows]="pageSize"
        [totalRecords]="totalRecords"
        [loading]="loading"
        (onLazyLoad)="onLazyLoad($event)"
        [rowHover]="true"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="treeId">Tree ID <p-sortIcon field="treeId" /></th>
            <th>Common Name</th>
            <th>Scientific Name</th>
            <th>Latest Height</th>
            <th>Latest DBH</th>
            <th>Condition</th>
            <th>Assessment</th>
            <th>Recorded</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-tree>
          <tr class="cursor-pointer" [routerLink]="['/app/trees', tree.id]">
            <td>
              <span class="font-medium text-forest">{{ tree.treeId }}</span>
            </td>
            <td>{{ tree.commonName ?? tree.species?.commonName ?? '—' }}</td>
            <td class="italic text-stone-500">{{ tree.scientificName ?? tree.species?.scientificName ?? '—' }}</td>
            <td>{{ tree.growthMetrics?.[0]?.heightM ?? '-' }} m</td>
            <td>{{ tree.growthMetrics?.[0]?.dbhM ?? '-' }} m</td>
            <td>
              @if (tree.growthMetrics?.[0]) {
                <app-condition-badge [condition]="tree.growthMetrics[0].healthCondition ?? tree.growthMetrics[0].condition ?? ''" />
              }
            </td>
            <td>
              @if (tree.growthMetrics?.[0]?.assessmentType) {
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  [ngClass]="tree.growthMetrics[0].assessmentType === 'Initial' ? 'bg-forest/10 text-forest' : 'bg-stone-100 text-stone-600'"
                >
                  {{ tree.growthMetrics[0].assessmentType }}
                </span>
              } @else {
                —
              }
            </td>
            <td>{{ tree.growthMetrics?.[0]?.recordedAt | date:'shortDate' }}</td>
            <td>
              <div class="flex gap-1">
                <button pButton icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" [routerLink]="['/app/trees', tree.id]"></button>
                @if (isAdmin) {
                  <button pButton icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="confirmDelete($event, tree)"></button>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="9" class="text-center py-8 text-stone-400">
              <i class="pi pi-search text-3xl mb-2 block"></i>
              No trees found
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class TreeTableComponent implements OnInit {
  trees: Tree[] = [];
  totalRecords = 0;
  pageSize = 20;
  loading = false;
  searchQuery = '';
  selectedCondition: string | null = null;
  selectedSpeciesId: string | null = null;
  selectedSurveyAreaId: string | null = null;
  speciesOptions: { label: string; value: string }[] = [];
  surveyAreaOptions: { label: string; value: string }[] = [];
  isAdmin = false;
  private searchTimeout: any;
  private metricFilterTimeout: any;

  conditionOptions = [
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Dead', value: 'Dead' },
  ];

  numericOpOptions: { label: string; value: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' }[] = [
    { label: '=', value: 'eq' },
    { label: '>', value: 'gt' },
    { label: '≥', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '≤', value: 'lte' },
  ];

  heightOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | null = null;
  heightValue: number | null = null;
  dbhOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | null = null;
  dbhValue: number | null = null;
  canopyOp: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | null = null;
  canopyValue: number | null = null;

  constructor(
    private treeService: TreeService,
    private surveyAreasService: SurveyAreasService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.isAdmin = this.authService.currentUser?.role === 'ADMIN';
  }

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

    this.surveyAreasService.getAll().subscribe({
      next: (areas: SurveyArea[]) => {
        this.surveyAreaOptions = areas
          .map((a) => ({ label: a.name, value: a.id }))
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {},
    });

    this.loadTrees();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadTrees(), 300);
  }

  onMetricFilterInput(): void {
    clearTimeout(this.metricFilterTimeout);
    this.metricFilterTimeout = setTimeout(() => this.loadTrees(), 300);
  }

  onLazyLoad(event: any): void {
    const page = (event.first || 0) / this.pageSize + 1;
    this.loadTrees(page);
  }

  loadTrees(page = 1): void {
    this.loading = true;
    this.treeService
      .getAll({
        search: this.searchQuery || undefined,
        healthCondition: this.selectedCondition || undefined,
        speciesId: this.selectedSpeciesId || undefined,
        surveyAreaId: this.selectedSurveyAreaId || undefined,
        heightOp: this.heightOp || undefined,
        heightValue: this.heightValue ?? undefined,
        dbhOp: this.dbhOp || undefined,
        dbhValue: this.dbhValue ?? undefined,
        canopyOp: this.canopyOp || undefined,
        canopyValue: this.canopyValue ?? undefined,
        page,
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.trees = res.items;
          this.totalRecords = res.total;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCondition = null;
    this.selectedSpeciesId = null;
    this.selectedSurveyAreaId = null;
    this.heightOp = null;
    this.heightValue = null;
    this.dbhOp = null;
    this.dbhValue = null;
    this.canopyOp = null;
    this.canopyValue = null;
    this.loadTrees(1);
  }

  confirmDelete(event: Event, tree: Tree): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete tree ${tree.treeId}? This will also remove all its growth metrics and photos. This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.treeService.delete(tree.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Tree ${tree.treeId} has been deleted`,
            });
            this.loadTrees();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Failed to delete tree',
            });
          },
        });
      },
    });
  }

  exportCsv(): void {
    this.treeService.getAll({ limit: 10000 }).subscribe((res) => {
      const esc = (v: unknown) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const headers = [
        'TreeID', 'CommonName', 'ScientificName', 'SpeciesFamily',
        'X_Easting', 'Y_Northing', 'Z_Elevation',
        'YearOfPlantation', 'SurveyArea',
        'CreatedAt', 'UpdatedAt',
        'LatestHeight(m)', 'LatestDBH(m)', 'LatestCanopySpread(m)',
        'HealthCondition', 'ExistingForm',
        'AmenityValue', 'TransplantSurvival',
        'AssessmentType', 'Remarks', 'RecordedAt',
      ];

      const rows = res.items.map((t) => {
        const m = t.growthMetrics?.[0];
        return [
          t.treeId,
          t.commonName ?? t.species?.commonName ?? '',
          t.scientificName ?? t.species?.scientificName ?? '',
          t.species?.family ?? '',
          t.xCoordinate,
          t.yCoordinate,
          t.zCoordinate ?? '',
          t.yearOfPlantation ?? '',
          t.surveyArea?.name ?? '',
          t.createdAt,
          t.updatedAt,
          m?.heightM ?? '',
          m?.dbhM ?? '',
          m?.canopySpreadM ?? '',
          m?.healthCondition ?? m?.condition ?? '',
          m?.existingForm ?? '',
          m?.amenityValue ?? '',
          m?.transplantSurvival ?? '',
          m?.assessmentType ?? '',
          m?.remarks ?? '',
          m?.recordedAt ?? '',
        ].map(esc).join(',');
      });

      const csv = headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trees-gmc-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
