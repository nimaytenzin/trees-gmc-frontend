import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, FileUploadModule],
  template: `
    <p-fileUpload
      [multiple]="true"
      accept="image/*"
      [maxFileSize]="5000000"
      [auto]="false"
      chooseLabel="Choose Photos"
      [showUploadButton]="false"
      (onSelect)="onSelect($event)"
      (onRemove)="onRemove($event)"
    >
      <ng-template pTemplate="empty">
        <div class="flex flex-col items-center justify-center py-6 text-stone-400">
          <i class="pi pi-image text-3xl mb-2"></i>
          <p class="text-sm">Drag and drop photos here</p>
        </div>
      </ng-template>
    </p-fileUpload>
  `,
})
export class PhotoUploadComponent {
  @Output() filesChanged = new EventEmitter<File[]>();
  private files: File[] = [];

  onSelect(event: any): void {
    this.files = event.currentFiles || [];
    this.filesChanged.emit(this.files);
  }

  onRemove(event: any): void {
    this.files = this.files.filter((f) => f.name !== event.file.name);
    this.filesChanged.emit(this.files);
  }
}
