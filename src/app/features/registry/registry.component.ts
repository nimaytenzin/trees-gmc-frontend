import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TreeService } from '../trees/services/tree.service';
import { Tree } from '../../core/models/tree.model';

@Component({
  selector: 'app-registry',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './registry.component.html',
  styleUrl: './registry.component.scss',
})
export class RegistryComponent implements OnInit {
  trees: Tree[] = [];
  totalRecords = 0;
  pageSize = 20;
  loading = false;
  searchQuery = '';
  private searchTimeout: any;

  constructor(private readonly treeService: TreeService) {}

  ngOnInit(): void {
    this.loadTrees(1);
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadTrees(1), 250);
  }

  onLazyLoad(event: any): void {
    const page = (event.first || 0) / this.pageSize + 1;
    this.loadTrees(page);
  }

  loadTrees(page = 1): void {
    this.loading = true;
    this.treeService
      .getPublicTrees({
        search: this.searchQuery || undefined,
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
}

