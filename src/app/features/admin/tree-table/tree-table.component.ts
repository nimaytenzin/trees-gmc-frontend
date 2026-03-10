import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TreeService } from '../../trees/services/tree.service';
import { Tree, PaginatedTrees } from '../../../core/models/tree.model';
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
    ConditionBadgeComponent,
  ],
  template: `
    <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <!-- Filters -->
      <div class="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-3">
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
          [(ngModel)]="selectedCondition"
          [options]="conditionOptions"
          (onChange)="loadTrees()"
          placeholder="All Conditions"
          [showClear]="true"
          styleClass="w-full md:w-48"
        />
        <p-button icon="pi pi-download" label="Export CSV" severity="secondary" [outlined]="true" (onClick)="exportCsv()" />
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
            <th>Recorded</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-tree>
          <tr class="cursor-pointer" [routerLink]="['/app/trees', tree.id]">
            <td>
              <span class="font-medium text-forest">{{ tree.treeId }}</span>
            </td>
            <td>{{ tree.commonName }}</td>
            <td class="italic text-stone-500">{{ tree.scientificName }}</td>
            <td>{{ tree.growthMetrics?.[0]?.heightM || '-' }} m</td>
            <td>{{ tree.growthMetrics?.[0]?.dbhCm || '-' }} cm</td>
            <td>
              @if (tree.growthMetrics?.[0]) {
                <app-condition-badge [condition]="tree.growthMetrics[0].condition" />
              }
            </td>
            <td>{{ tree.growthMetrics?.[0]?.recordedAt | date:'shortDate' }}</td>
            <td>
              <button pButton icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" [routerLink]="['/app/trees', tree.id]"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="8" class="text-center py-8 text-stone-400">
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
  private searchTimeout: any;

  conditionOptions = [
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Dead', value: 'Dead' },
  ];

  constructor(private treeService: TreeService) {}

  ngOnInit(): void {
    this.loadTrees();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadTrees(), 300);
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

  exportCsv(): void {
    this.treeService.getAll({ limit: 10000 }).subscribe((res) => {
      const rows = res.items.map((t) => {
        const m = t.growthMetrics?.[0];
        return [
          t.treeId,
          t.commonName,
          t.scientificName,
          t.xCoordinate,
          t.yCoordinate,
          m?.heightM || '',
          m?.dbhCm || '',
          m?.canopySpreadM || '',
          m?.condition || '',
          m?.recordedAt || '',
        ].join(',');
      });
      const csv =
        'TreeID,CommonName,ScientificName,Longitude,Latitude,Height(m),DBH(cm),Canopy(m),Condition,RecordedAt\n' +
        rows.join('\n');
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
