import { Component } from '@angular/core';
import { TreeTableComponent } from '../tree-table/tree-table.component';

@Component({
  selector: 'app-admin-tree-registry',
  standalone: true,
  imports: [TreeTableComponent],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-forest">Tree Registry</h1>
        <p class="text-stone-500 mt-1">Browse, filter, and manage all registered trees</p>
      </div>
      <app-tree-table />
    </div>
  `,
})
export class AdminTreeRegistryComponent {}
