import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TreeService } from '../services/tree.service';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { SurveyArea } from '../../../core/models/survey-area.model';
import { AuthService } from '../../../core/services/auth.service';
import { Species } from '../../../core/models/species.model';
import { PhotoUploadComponent } from '../../../shared/components/photo-upload/photo-upload.component';

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
    DialogModule,
    ToastModule,
    PhotoUploadComponent,
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
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">
                Survey Area @if (isEnumerator) { <span class="text-red-600">*</span> }
              </label>
              <p-dropdown
                formControlName="surveyAreaId"
                [options]="surveyAreas"
                optionLabel="name"
                optionValue="id"
                [showClear]="!isEnumerator"
                placeholder="Select survey area"
                styleClass="w-full"
              />
              @if (isEnumerator) {
                <p class="text-xs text-stone-500 mt-1">
                  Enumerators must assign each tree to a survey area.
                </p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Tree ID *</label>
              <input pInputText formControlName="treeId" class="w-full" placeholder="e.g. GMC-T-0001" />
            </div>
            <div class="md:col-span-1">
              <label class="block text-sm font-medium text-stone-600 mb-1">Species *</label>
              <div class="flex gap-2 items-start">
                <p-dropdown
                  class="flex-1"
                  formControlName="speciesId"
                  [options]="speciesOptions"
                  optionLabel="display"
                  optionValue="id"
                  [filter]="true"
                  filterBy="display"
                  placeholder="Select species"
                  styleClass="w-full"
                />
                <p-button
                  type="button"
                  icon="pi pi-plus"
                  label="Add"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="openAddSpecies()"
                />
              </div>
              <p class="text-xs text-stone-500 mt-1">
                Can't find it? Add a new species and it will appear in the list.
              </p>
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
              <label class="block text-sm font-medium text-stone-600 mb-1">Health Condition *</label>
              <p-dropdown
                formControlName="healthCondition"
                [options]="conditions"
                placeholder="Select condition"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Existing Form</label>
              <p-dropdown
                formControlName="existingForm"
                [options]="conditions"
                placeholder="Optional"
                [showClear]="true"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Amenity Value</label>
              <p-dropdown
                formControlName="amenityValue"
                [options]="amenityValues"
                placeholder="Optional"
                [showClear]="true"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Transplant Survival</label>
              <p-dropdown
                formControlName="transplantSurvival"
                [options]="transplantSurvivalOptions"
                placeholder="Optional"
                [showClear]="true"
                styleClass="w-full"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Remarks</label>
              <textarea pInputTextarea formControlName="remarks" [rows]="3" class="w-full" placeholder="Additional observations..."></textarea>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-stone-600 mb-2">Photos</label>
            <app-photo-upload (filesChanged)="initialMetricPhotos = $event" />
            <p class="text-xs text-stone-500 mt-2">
              Optional. Up to 10 photos, max 5MB each.
            </p>
          </div>
        </p-card>

        <div class="flex justify-end gap-3">
          <p-button label="Reset" severity="secondary" [outlined]="true" (onClick)="form.reset()" />
          <p-button type="submit" label="Register Tree" icon="pi pi-check" [loading]="loading" [disabled]="form.invalid" severity="success" />
        </div>
      </form>
    </div>

    <p-dialog
      header="Add species"
      [(visible)]="showAddSpeciesDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(720px, 95vw)' }"
    >
      <form [formGroup]="addSpeciesForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-stone-600 mb-1">Species ID *</label>
          <input pInputText formControlName="speciesId" class="w-full" placeholder="e.g. SPEC-011" />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-600 mb-1">Common name *</label>
          <input pInputText formControlName="commonName" class="w-full" placeholder="e.g. Bodhi Tree" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-stone-600 mb-1">Scientific name *</label>
          <input pInputText formControlName="scientificName" class="w-full" placeholder="e.g. Ficus religiosa" />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-600 mb-1">Family</label>
          <input pInputText formControlName="family" class="w-full" placeholder="e.g. Moraceae" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-stone-600 mb-1">Description</label>
          <textarea pInputTextarea formControlName="description" [rows]="3" class="w-full" placeholder="Optional notes..."></textarea>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            type="button"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            [disabled]="savingSpecies"
            (onClick)="closeAddSpecies()"
          />
          <p-button
            type="button"
            label="Save species"
            icon="pi pi-check"
            [loading]="savingSpecies"
            [disabled]="addSpeciesForm.invalid"
            (onClick)="saveSpecies()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class TreeRegisterComponent {
  surveyAreas: SurveyArea[] = [];
  speciesOptions: Array<Species & { display: string }> = [];
  isEnumerator = false;
  initialMetricPhotos: File[] = [];

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

  form: FormGroup;
  addSpeciesForm: FormGroup;
  loading = false;
  showAddSpeciesDialog = false;
  savingSpecies = false;

  constructor(
    private fb: FormBuilder,
    private treeService: TreeService,
    private surveyAreasService: SurveyAreasService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
  ) {
    this.isEnumerator = this.authService.currentUser?.role === 'ENUMERATOR';

    this.form = this.fb.group({
      treeId: ['', Validators.required],
      speciesId: ['', Validators.required],
      surveyAreaId: [null as string | null, this.isEnumerator ? Validators.required : []],
      xCoordinate: [null as number | null, Validators.required],
      yCoordinate: [null as number | null, Validators.required],
      initialMetric: this.fb.group({
        heightM: [null as number | null, Validators.required],
        dbhCm: [null as number | null, Validators.required],
        canopySpreadM: [null as number | null, Validators.required],
        healthCondition: ['', Validators.required],
        existingForm: [''],
        amenityValue: [''],
        transplantSurvival: [''],
        remarks: [''],
      }),
    });

    this.addSpeciesForm = this.fb.group({
      speciesId: ['', Validators.required],
      scientificName: ['', Validators.required],
      commonName: ['', Validators.required],
      family: [''],
      description: [''],
    });

    this.surveyAreasService.getAll().subscribe({
      next: (areas) => (this.surveyAreas = areas),
      error: () => (this.surveyAreas = []),
    });

    this.loadSpecies();
  }

  private loadSpecies(): void {
    this.treeService.getSpecies().subscribe({
      next: (species) => {
        this.speciesOptions = (species ?? []).map((s) => ({
          ...s,
          display: `${s.commonName} (${s.scientificName})`,
        }));
      },
      error: () => (this.speciesOptions = []),
    });
  }

  openAddSpecies(): void {
    this.addSpeciesForm.reset();
    this.showAddSpeciesDialog = true;
    this.savingSpecies = false;
  }

  closeAddSpecies(): void {
    this.showAddSpeciesDialog = false;
    this.savingSpecies = false;
  }

  saveSpecies(): void {
    if (this.addSpeciesForm.invalid) return;
    this.savingSpecies = true;
    const payload = this.addSpeciesForm.value;

    this.treeService
      .createSpecies(payload)
      .pipe(finalize(() => (this.savingSpecies = false)))
      .subscribe({
        next: (created) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Species added',
            detail: `${created.commonName} saved`,
          });
          this.closeAddSpecies();
          this.loadSpecies();
          this.form.patchValue({ speciesId: created.id });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to create species',
          });
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const raw = this.form.getRawValue();
    const { initialMetric, ...treePayload } = raw as any;
    if (!treePayload?.surveyAreaId) delete treePayload.surveyAreaId;
    const metricPayload = {
      heightM: initialMetric?.heightM,
      dbhCm: initialMetric?.dbhCm,
      canopySpreadM: initialMetric?.canopySpreadM,
      healthCondition: initialMetric?.healthCondition,
      existingForm: initialMetric?.existingForm || undefined,
      amenityValue: initialMetric?.amenityValue || undefined,
      transplantSurvival: initialMetric?.transplantSurvival || undefined,
      remarks: initialMetric?.remarks,
    };

    this.treeService
      .create(treePayload)
      .pipe(
        switchMap((tree) =>
          this.treeService.addGrowthMetric(tree.id, metricPayload).pipe(
            switchMap((metric) => {
              if (!this.initialMetricPhotos?.length) return of(tree);
              return this.treeService.uploadPhotos(metric.id, this.initialMetricPhotos).pipe(
                map(() => tree),
                catchError((err) => {
                  this.messageService.add({
                    severity: 'warn',
                    summary: 'Tree + metric saved, photos not saved',
                    detail: err.error?.message || 'Failed to upload photos',
                  });
                  return of(tree);
                }),
              );
            }),
            catchError((err) => {
              this.messageService.add({
                severity: 'warn',
                summary: 'Tree saved, metric not saved',
                detail: err.error?.message || 'Failed to save initial growth metrics',
              });
              return of(tree);
            }),
          ),
        ),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (tree) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Tree Registered',
            detail: `Tree ${tree.treeId} has been registered successfully`,
          });
          this.form.reset();
          this.initialMetricPhotos = [];
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Failed to register tree',
          });
        },
      });
  }
}
