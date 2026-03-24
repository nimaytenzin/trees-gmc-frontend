import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TreeService } from '../../trees/services/tree.service';
import { SurveyAreasService } from '../../../core/services/survey-areas.service';
import { Tree } from '../../../core/models/tree.model';
import { Species } from '../../../core/models/species.model';
import { SurveyArea } from '../../../core/models/survey-area.model';

@Component({
  selector: 'app-tree-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    TabViewModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    FileUploadModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <p-dialog
      [header]="tree ? 'Edit Tree — ' + tree.treeId : ''"
      [(visible)]="visible"
      (onHide)="onHide()"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(780px, 96vw)' }"
    >
      <p-tabView>
        <!-- ── Tab 1: Edit Tree Details ── -->
        <p-tabPanel header="Tree Details">
          <form [formGroup]="treeForm" (ngSubmit)="saveTree()" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Survey Area</label>
              <p-dropdown
                formControlName="surveyAreaId"
                [options]="surveyAreaOptions"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                placeholder="None"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Species *</label>
              <p-dropdown
                formControlName="speciesId"
                [options]="speciesOptions"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                filterBy="label"
                placeholder="Select species"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Year of Plantation</label>
              <p-inputNumber
                formControlName="yearOfPlantation"
                [useGrouping]="false"
                [min]="1900"
                [max]="2099"
                placeholder="e.g. 2020"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">X Coordinate (Easting) *</label>
              <p-inputNumber
                formControlName="xCoordinate"
                [minFractionDigits]="6"
                [maxFractionDigits]="6"
                mode="decimal"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Y Coordinate (Northing) *</label>
              <p-inputNumber
                formControlName="yCoordinate"
                [minFractionDigits]="6"
                [maxFractionDigits]="6"
                mode="decimal"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Elevation (Z, m)</label>
              <p-inputNumber
                formControlName="zCoordinate"
                [minFractionDigits]="1"
                [maxFractionDigits]="3"
                [min]="0"
                [max]="3000"
                mode="decimal"
                suffix=" m"
                class="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div class="md:col-span-2 flex justify-end gap-2 pt-2">
              <p-button label="Cancel" severity="secondary" [outlined]="true" type="button" (onClick)="onHide()" />
              <p-button
                label="Save Changes"
                icon="pi pi-check"
                type="submit"
                [loading]="savingTree"
                [disabled]="treeForm.invalid || savingTree"
              />
            </div>
          </form>
        </p-tabPanel>

        <!-- ── Tab 2: Add Growth Metric ── -->
        <p-tabPanel header="Add Growth Metric">
          <form [formGroup]="metricForm" (ngSubmit)="saveMetric()" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
              <p-dropdown
                formControlName="healthCondition"
                [options]="conditions"
                placeholder="Select condition"
                styleClass="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Assessment Type</label>
              <p-dropdown
                formControlName="assessmentType"
                [options]="assessmentTypes"
                placeholder="Auto"
                [showClear]="true"
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
            <div>
              <label class="block text-sm font-medium text-stone-600 mb-1">Recorded At</label>
              <p-calendar
                formControlName="recordedAt"
                [showTime]="true"
                dateFormat="yy-mm-dd"
                styleClass="w-full"
                inputStyleClass="w-full"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-1">Remarks</label>
              <textarea
                class="w-full border border-stone-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                formControlName="remarks"
                rows="3"
                placeholder="Observations..."
              ></textarea>
            </div>

            <!-- Photo Upload within metric tab -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-stone-600 mb-2">Photos</label>
              <p-fileUpload
                #metricFileUpload
                [multiple]="true"
                accept="image/*"
                [maxFileSize]="5000000"
                [auto]="false"
                chooseLabel="Choose Photos"
                [showUploadButton]="false"
                (onSelect)="onMetricFilesSelected($event)"
                (onRemove)="onMetricFileRemoved($event)"
              >
                <ng-template pTemplate="empty">
                  <div class="flex flex-col items-center justify-center py-6 text-stone-400">
                    <i class="pi pi-image text-3xl mb-2"></i>
                    <p class="text-sm">Drag and drop photos or click to browse</p>
                  </div>
                </ng-template>
              </p-fileUpload>
            </div>

            <div class="md:col-span-2 flex justify-end gap-2 pt-2">
              <p-button label="Cancel" severity="secondary" [outlined]="true" type="button" (onClick)="onHide()" />
              <p-button
                label="Save Metric"
                icon="pi pi-check"
                type="submit"
                severity="success"
                [loading]="savingMetric"
                [disabled]="metricForm.invalid || savingMetric"
              />
            </div>
          </form>
        </p-tabPanel>
      </p-tabView>
    </p-dialog>
  `,
})
export class TreeEditDialogComponent implements OnChanges {
  @Input() tree: Tree | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() treeSaved = new EventEmitter<void>();

  treeForm: FormGroup;
  metricForm: FormGroup;
  savingTree = false;
  savingMetric = false;
  metricFiles: File[] = [];

  speciesOptions: { label: string; value: string }[] = [];
  surveyAreaOptions: { label: string; value: string }[] = [];

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

  constructor(
    private fb: FormBuilder,
    private treeService: TreeService,
    private surveyAreasService: SurveyAreasService,
    private messageService: MessageService,
  ) {
    this.treeForm = this.fb.group({
      speciesId: ['', Validators.required],
      surveyAreaId: [null as string | null],
      xCoordinate: [null as number | null, Validators.required],
      yCoordinate: [null as number | null, Validators.required],
      zCoordinate: [null as number | null],
      yearOfPlantation: [null as number | null],
    });

    this.metricForm = this.fb.group({
      heightM: [null as number | null, Validators.required],
      dbhM: [null as number | null, Validators.required],
      canopySpreadM: [null as number | null, Validators.required],
      healthCondition: ['', Validators.required],
      assessmentType: [''],
      existingForm: [''],
      amenityValue: [''],
      transplantSurvival: [''],
      remarks: [''],
      recordedAt: [new Date()],
    });

    this.treeService.getSpecies().subscribe({
      next: (species: Species[]) => {
        this.speciesOptions = species.map((s) => ({
          label: `${s.commonName} (${s.scientificName})`,
          value: s.id,
        }));
      },
      error: () => {},
    });

    this.surveyAreasService.getAll().subscribe({
      next: (areas: SurveyArea[]) => {
        this.surveyAreaOptions = areas.map((a) => ({ label: a.name, value: a.id }));
      },
      error: () => {},
    });
  }

  ngOnChanges(): void {
    if (this.tree && this.visible) {
      this.treeForm.patchValue({
        speciesId: this.tree.speciesId,
        surveyAreaId: this.tree.surveyAreaId ?? null,
        xCoordinate: this.tree.xCoordinate,
        yCoordinate: this.tree.yCoordinate,
        zCoordinate: this.tree.zCoordinate ?? null,
        yearOfPlantation: this.tree.yearOfPlantation ?? null,
      });
      this.metricForm.reset({ recordedAt: new Date() });
      this.metricFiles = [];
    }
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  saveTree(): void {
    if (this.treeForm.invalid || !this.tree) return;
    this.savingTree = true;
    const payload = { ...this.treeForm.value };
    if (!payload.surveyAreaId) payload.surveyAreaId = null;

    this.treeService.update(this.tree.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Tree details updated' });
        this.savingTree = false;
        this.treeSaved.emit();
        this.onHide();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update tree' });
        this.savingTree = false;
      },
    });
  }

  saveMetric(): void {
    if (this.metricForm.invalid || !this.tree) return;
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

    this.treeService.addGrowthMetric(this.tree.id, payload).subscribe({
      next: (metric) => {
        if (this.metricFiles.length > 0) {
          this.treeService.uploadPhotos(metric.id, this.metricFiles).subscribe({
            next: () => this.onMetricSuccess(),
            error: () => {
              this.messageService.add({ severity: 'warn', summary: 'Partial', detail: 'Metric saved but photos failed' });
              this.savingMetric = false;
              this.treeSaved.emit();
            },
          });
        } else {
          this.onMetricSuccess();
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save metric' });
        this.savingMetric = false;
      },
    });
  }

  private onMetricSuccess(): void {
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Growth metric added' });
    this.savingMetric = false;
    this.metricForm.reset({ recordedAt: new Date() });
    this.metricFiles = [];
    this.treeSaved.emit();
    this.onHide();
  }

  onMetricFilesSelected(event: any): void {
    this.metricFiles = event.currentFiles || [];
  }

  onMetricFileRemoved(event: any): void {
    this.metricFiles = this.metricFiles.filter((f) => f.name !== event.file.name);
  }
}
