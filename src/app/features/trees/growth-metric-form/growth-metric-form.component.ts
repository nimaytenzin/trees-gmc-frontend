import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TreeService } from '../services/tree.service';
import { Tree } from '../../../core/models/tree.model';

@Component({
  selector: 'app-growth-metric-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    Textarea,
    ButtonModule,
    CardModule,
    CalendarModule,
    AutoCompleteModule,
    FileUploadModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-forest">Add Growth Metrics</h1>
        <p class="text-stone-500 mt-1">Record new growth measurements for an existing tree</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Tree Selection -->
        <p-card header="Select Tree" styleClass="mb-4">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">Search Tree *</label>
            <p-autoComplete
              formControlName="selectedTree"
              [suggestions]="filteredTrees"
              (completeMethod)="searchTrees($event)"
              field="displayLabel"
              [dropdown]="true"
              placeholder="Type tree ID or name..."
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>
          @if (form.value.selectedTree?.treeId) {
            <div class="mt-3 p-3 bg-sage/10 rounded-lg">
              <p class="text-sm"><strong>Tree ID:</strong> {{ form.value.selectedTree.treeId }}</p>
              <p class="text-sm">
                <strong>Species:</strong>
                {{ form.value.selectedTree.commonName ?? form.value.selectedTree.species?.commonName ?? '—' }}
                ({{ form.value.selectedTree.scientificName ?? form.value.selectedTree.species?.scientificName ?? '—' }})
              </p>
            </div>
          }
        </p-card>

        <!-- Measurements -->
        <p-card header="Growth Measurements" styleClass="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Height (m) *</label>
              <p-inputNumber
                formControlName="heightM"
                [minFractionDigits]="3"
                [maxFractionDigits]="3"
                [min]="0.1"
                [max]="80"
                mode="decimal"
                suffix=" m"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">DBH (m) *</label>
              <p-inputNumber
                formControlName="dbhM"
                [minFractionDigits]="4"
                [maxFractionDigits]="4"
                [min]="0.01"
                [max]="3"
                mode="decimal"
                suffix=" m"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Canopy Spread (m) *</label>
              <p-inputNumber
                formControlName="canopySpreadM"
                [minFractionDigits]="3"
                [maxFractionDigits]="3"
                [min]="0.5"
                [max]="40"
                mode="decimal"
                suffix=" m"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Health Condition *</label>
              <p-dropdown formControlName="healthCondition" [options]="conditions" placeholder="Select condition" styleClass="w-full" />
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
              <textarea pInputTextarea formControlName="remarks" [rows]="3" class="w-full" placeholder="Observations..."></textarea>
            </div>
          </div>
        </p-card>

        <!-- Photo Upload -->
        <p-card header="Photos" styleClass="mb-4">
          <p-fileUpload
            #fileUpload
            [multiple]="true"
            accept="image/*"
            [maxFileSize]="5000000"
            [auto]="false"
            chooseLabel="Choose Photos"
            [showUploadButton]="false"
            (onSelect)="onFilesSelected($event)"
            (onRemove)="onFileRemoved($event)"
          >
            <ng-template pTemplate="empty">
              <div class="flex flex-col items-center justify-center py-8 text-stone-400">
                <i class="pi pi-image text-4xl mb-2"></i>
                <p>Drag and drop photos here or click to browse</p>
                <p class="text-sm mt-1">Max 5MB per photo, images only</p>
              </div>
            </ng-template>
          </p-fileUpload>
        </p-card>

        <div class="flex justify-end gap-3">
          <p-button label="Reset" severity="secondary" [outlined]="true" (onClick)="resetForm()" />
          <p-button
            type="submit"
            label="Save Growth Metric"
            icon="pi pi-check"
            [loading]="loading"
            [disabled]="form.invalid || !form.value.selectedTree?.id || loading"
            severity="success"
          />
        </div>
      </form>
    </div>
  `,
})
export class GrowthMetricFormComponent implements OnInit {
  conditions = [
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Dead', value: 'Dead' },
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

  assessmentTypes = [
    { label: 'Initial', value: 'Initial' },
    { label: 'Periodic', value: 'Periodic' },
  ];

  trees: (Tree & { displayLabel: string })[] = [];
  filteredTrees: (Tree & { displayLabel: string })[] = [];
  selectedFiles: File[] = [];
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private treeService: TreeService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      selectedTree: [null as any],
      heightM: [null as number | null, Validators.required],
      dbhM: [null as number | null, Validators.required],
      canopySpreadM: [null as number | null, Validators.required],
      assessmentType: ['' as string],
      existingForm: ['' as string],
      healthCondition: ['', Validators.required],
      amenityValue: ['' as string],
      transplantSurvival: ['' as string],
      remarks: [''],
      recordedAt: [new Date()],
    });
  }

  ngOnInit(): void {
    this.treeService.getAll({ limit: 1000 }).subscribe((res) => {
      this.trees = res.items.map((t) => ({
        ...t,
        displayLabel: `${t.treeId} - ${t.commonName ?? t.species?.commonName ?? 'Unknown species'}`,
      }));
    });
  }

  searchTrees(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredTrees = this.trees.filter(
      (t) =>
        t.treeId.toLowerCase().includes(query) ||
        (t.commonName ?? t.species?.commonName ?? '').toLowerCase().includes(query) ||
        (t.scientificName ?? t.species?.scientificName ?? '').toLowerCase().includes(query),
    );
  }

  onFilesSelected(event: any): void {
    this.selectedFiles = event.currentFiles || [];
  }

  onFileRemoved(event: any): void {
    this.selectedFiles = this.selectedFiles.filter(
      (f) => f.name !== event.file.name,
    );
  }

  resetForm(): void {
    this.form.reset({ recordedAt: new Date() });
    this.selectedFiles = [];
  }

  onSubmit(): void {
    if (this.loading) return;
    const tree = this.form.value.selectedTree;
    if (!tree?.id || this.form.invalid) return;
    this.loading = true;

    const metricData = {
      heightM: this.form.value.heightM,
      dbhM: this.form.value.dbhM,
      canopySpreadM: this.form.value.canopySpreadM,
      assessmentType: this.form.value.assessmentType || undefined,
      existingForm: this.form.value.existingForm || undefined,
      healthCondition: this.form.value.healthCondition || undefined,
      amenityValue: this.form.value.amenityValue || undefined,
      transplantSurvival: this.form.value.transplantSurvival || undefined,
      remarks: this.form.value.remarks,
      recordedAt: this.form.value.recordedAt?.toISOString(),
    };

    this.treeService.addGrowthMetric(tree.id, metricData).subscribe({
      next: (metric) => {
        if (this.selectedFiles.length > 0) {
          this.treeService
            .uploadPhotos(metric.id, this.selectedFiles)
            .subscribe({
              next: () => this.onSuccess(tree.treeId),
              error: () => {
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Partial Success',
                  detail: 'Metric saved but photo upload failed',
                });
                this.loading = false;
              },
            });
        } else {
          this.onSuccess(tree.treeId);
        }
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to save growth metric',
        });
      },
    });
  }

  private onSuccess(treeId: string): void {
    this.loading = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Growth Metric Saved',
      detail: `New metric recorded for ${treeId}`,
    });
    this.resetForm();
  }
}
