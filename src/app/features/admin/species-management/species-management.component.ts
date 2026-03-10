import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToastModule } from 'primeng/toast';
import { Textarea } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { Species } from '../../../core/models/species.model';
import { TreeService } from '../../trees/services/tree.service';

@Component({
  selector: 'app-species-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    Textarea,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './species-management.component.html',
  styleUrl: './species-management.component.scss',
})
export class SpeciesManagementComponent implements OnInit {
  species: Species[] = [];
  loading = false;
  search = '';

  showDialog = false;
  saving = false;
  dialogMode: 'create' | 'edit' = 'create';
  active: Species | null = null;

  form: {
    speciesId: string;
    commonName: string;
    scientificName: string;
    family: string;
    description: string;
  } = {
    speciesId: '',
    commonName: '',
    scientificName: '',
    family: '',
    description: '',
  };

  constructor(
    private readonly treeService: TreeService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.treeService.getSpecies().subscribe({
      next: (list) => {
        this.species = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load species',
        });
      },
    });
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.active = null;
    this.form = {
      speciesId: '',
      commonName: '',
      scientificName: '',
      family: '',
      description: '',
    };
    this.showDialog = true;
  }

  openEdit(s: Species): void {
    this.dialogMode = 'edit';
    this.active = s;
    this.form = {
      speciesId: s.speciesId,
      commonName: s.commonName,
      scientificName: s.scientificName,
      family: s.family ?? '',
      description: s.description ?? '',
    };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.saving = false;
    this.active = null;
  }

  get filtered(): Species[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.species;
    return this.species.filter((s) => {
      return (
        s.speciesId.toLowerCase().includes(q) ||
        s.commonName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        (s.family ?? '').toLowerCase().includes(q)
      );
    });
  }

  save(): void {
    const payload = {
      speciesId: this.form.speciesId.trim(),
      commonName: this.form.commonName.trim(),
      scientificName: this.form.scientificName.trim(),
      family: this.form.family.trim() || undefined,
      description: this.form.description.trim() || undefined,
    };

    if (!payload.speciesId || !payload.commonName || !payload.scientificName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Species ID, common name, and scientific name are required',
      });
      return;
    }

    this.saving = true;
    if (this.dialogMode === 'create') {
      this.treeService.createSpecies(payload).subscribe({
        next: () => {
          this.saving = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Species added' });
          this.closeDialog();
          this.load();
        },
        error: (err) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to create species',
          });
        },
      });
      return;
    }

    if (!this.active) return;
    this.treeService.updateSpecies(this.active.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Species updated' });
        this.closeDialog();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update species',
        });
      },
    });
  }

  remove(s: Species): void {
    this.treeService.deleteSpecies(s.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Species removed' });
        this.load();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to delete species',
        });
      },
    });
  }
}

