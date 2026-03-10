import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TreeService } from '../services/tree.service';

@Component({
  selector: 'app-tree-register',
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
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-forest">Register New Tree</h1>
        <p class="text-stone-500 mt-1">Record a new tree with its initial growth measurements</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Tree Information -->
        <p-card header="Tree Information" styleClass="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Tree ID *</label>
              <input pInputText formControlName="treeId" class="w-full" placeholder="e.g. GMC-T-0001" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Common Name *</label>
              <input pInputText formControlName="commonName" class="w-full" placeholder="e.g. Bodhi Tree" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Scientific Name *</label>
              <input pInputText formControlName="scientificName" class="w-full" placeholder="e.g. Ficus religiosa" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Longitude (X) *</label>
              <p-inputNumber formControlName="xCoordinate" [minFractionDigits]="6" [maxFractionDigits]="8" mode="decimal" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Latitude (Y) *</label>
              <p-inputNumber formControlName="yCoordinate" [minFractionDigits]="6" [maxFractionDigits]="8" mode="decimal" class="w-full" inputStyleClass="w-full" />
            </div>
          </div>
        </p-card>

        <!-- Initial Growth Metrics -->
        <p-card header="Initial Growth Metrics" styleClass="mb-4" formGroupName="initialMetric">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Height (m) *</label>
              <p-inputNumber formControlName="heightM" [minFractionDigits]="1" [maxFractionDigits]="2" mode="decimal" suffix=" m" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">DBH (cm) *</label>
              <p-inputNumber formControlName="dbhCm" [minFractionDigits]="1" [maxFractionDigits]="2" mode="decimal" suffix=" cm" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Canopy Spread (m) *</label>
              <p-inputNumber formControlName="canopySpreadM" [minFractionDigits]="1" [maxFractionDigits]="2" mode="decimal" suffix=" m" class="w-full" inputStyleClass="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Condition *</label>
              <p-dropdown
                formControlName="condition"
                [options]="conditions"
                placeholder="Select condition"
                styleClass="w-full"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Remarks</label>
              <textarea pInputTextarea formControlName="remarks" [rows]="3" class="w-full" placeholder="Additional observations..."></textarea>
            </div>
          </div>
        </p-card>

        <div class="flex justify-end gap-3">
          <p-button label="Reset" severity="secondary" [outlined]="true" (onClick)="form.reset()" />
          <p-button type="submit" label="Register Tree" icon="pi pi-check" [loading]="loading" [disabled]="form.invalid" severity="success" />
        </div>
      </form>
    </div>
  `,
})
export class TreeRegisterComponent {
  conditions = [
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Poor', value: 'Poor' },
    { label: 'Dead', value: 'Dead' },
  ];

  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private treeService: TreeService,
    private messageService: MessageService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      treeId: ['', Validators.required],
      commonName: ['', Validators.required],
      scientificName: ['', Validators.required],
      xCoordinate: [null as number | null, Validators.required],
      yCoordinate: [null as number | null, Validators.required],
      initialMetric: this.fb.group({
        heightM: [null as number | null, Validators.required],
        dbhCm: [null as number | null, Validators.required],
        canopySpreadM: [null as number | null, Validators.required],
        condition: ['', Validators.required],
        remarks: [''],
      }),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.treeService.create(this.form.value).subscribe({
      next: (tree) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Tree Registered',
          detail: `Tree ${tree.treeId} has been registered successfully`,
        });
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to register tree',
        });
      },
    });
  }
}
