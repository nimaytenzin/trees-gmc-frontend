import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TreeService } from '../../trees/services/tree.service';
import { TreeStatistics } from '../../../core/models/tree.model';
import { TreeTableComponent } from '../tree-table/tree-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TreeTableComponent],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-forest">Dashboard</h1>
        <p class="text-stone-500 mt-1">Overview of tree inventory</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <p-card styleClass="border-l-4 border-forest">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
              <i class="pi pi-sitemap text-2xl text-forest"></i>
            </div>
            <div>
              <p class="text-sm text-stone-500">Total Trees</p>
              <p class="text-2xl font-bold text-forest">{{ stats?.total || 0 }}</p>
            </div>
          </div>
        </p-card>

        <p-card styleClass="border-l-4 border-green-500">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <i class="pi pi-heart text-2xl text-green-500"></i>
            </div>
            <div>
              <p class="text-sm text-stone-500">Good Condition</p>
              <p class="text-2xl font-bold text-green-600">{{ getConditionCount('Good') }}</p>
            </div>
          </div>
        </p-card>

        <p-card styleClass="border-l-4 border-amber-500">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <i class="pi pi-exclamation-triangle text-2xl text-amber-500"></i>
            </div>
            <div>
              <p class="text-sm text-stone-500">Fair / Poor</p>
              <p class="text-2xl font-bold text-amber-600">
                {{ getConditionCount('Fair') + getConditionCount('Poor') }}
              </p>
            </div>
          </div>
        </p-card>

        <p-card styleClass="border-l-4 border-bark">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
              <i class="pi pi-chart-bar text-2xl text-bark"></i>
            </div>
            <div>
              <p class="text-sm text-stone-500">Avg Height</p>
              <p class="text-2xl font-bold text-bark">
                {{ (stats?.avgMetrics?.avgHeight ?? 0) | number:'1.1-1' }} m
              </p>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-3 mb-6">
        <a routerLink="/app/trees/register" class="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors flex items-center gap-2 text-sm">
          <i class="pi pi-plus"></i> Register Tree
        </a>
        <a routerLink="/app/map" class="px-4 py-2 bg-white border border-stone-200 text-forest rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm">
          <i class="pi pi-map"></i> Map View
        </a>
      </div>

      <!-- Data Table -->
      <app-tree-table />
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  stats: TreeStatistics | null = null;

  constructor(private treeService: TreeService) {}

  ngOnInit(): void {
    this.treeService.getStatistics().subscribe((s) => (this.stats = s));
  }

  getConditionCount(condition: string): number {
    const stat = this.stats?.conditionStats?.find(
      (c) => c.condition === condition,
    );
    return stat ? parseInt(stat.count, 10) : 0;
  }
}
