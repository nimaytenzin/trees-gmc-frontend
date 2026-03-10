import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.model';
import { BulkUploadResult } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div>
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-forest">Enumerator Management</h1>
          <p class="text-stone-500 mt-1">Bulk upload, change password, and deactivate enumerators</p>
        </div>
      </div>

      <p-card styleClass="mb-4">
        <h2 class="text-lg font-semibold text-forest mb-3">Bulk upload</h2>
        <div class="flex flex-wrap items-center gap-3">
          <p-button
            label="Download CSV template"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            (onClick)="downloadTemplate()"
          />
          <input
            #fileInput
            type="file"
            accept=".csv"
            class="hidden"
            (change)="onFileSelected($event)"
          />
          <p-button
            label="Upload CSV"
            icon="pi pi-upload"
            severity="primary"
            (onClick)="fileInput.click()"
            [loading]="uploading"
          />
        </div>
        @if (uploadResult) {
          <div class="mt-3 p-3 rounded-lg" [class.bg-green-50]="uploadResult.created > 0" [class.bg-amber-50]="uploadResult.errors.length > 0">
            <p class="text-sm font-medium" *ngIf="uploadResult.created > 0">
              Created {{ uploadResult.created }} enumerator(s).
            </p>
            @if (uploadResult.errors.length > 0) {
              <p class="text-sm text-amber-800 mt-1">Errors:</p>
              <ul class="text-xs text-amber-800 list-disc list-inside mt-1">
                @for (err of uploadResult.errors; track err) {
                  <li>{{ err }}</li>
                }
              </ul>
            }
          </div>
        }
      </p-card>

      <p-card>
        <h2 class="text-lg font-semibold text-forest mb-3">Enumerators</h2>
        <p-table [value]="enumerators" [loading]="loading" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Email</th>
              <th>Status</th>
              <th style="width: 12rem"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr>
              <td class="font-medium">{{ user.name }}</td>
              <td>{{ user.designation || '—' }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  [class.bg-green-100]="user.isActive !== false"
                  [class.text-green-800]="user.isActive !== false"
                  [class.bg-stone-200]="user.isActive === false"
                  [class.text-stone-600]="user.isActive === false"
                >
                  {{ user.isActive !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <p-button
                    icon="pi pi-key"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (onClick)="openChangePassword(user)"
                  />
                  @if (user.isActive !== false) {
                    <p-button
                      icon="pi pi-user-minus"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      (onClick)="deactivate(user)"
                    />
                  } @else {
                    <p-button
                      icon="pi pi-user-plus"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      (onClick)="activate(user)"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="5" class="text-center py-6 text-stone-400">No enumerators found.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <p-dialog
      header="Change password"
      [(visible)]="showPasswordDialog"
      [modal]="true"
      [style]="{ width: '22rem' }"
      (onHide)="closePasswordDialog()"
    >
      @if (selectedUser) {
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-sm font-medium text-stone-600 mb-1">New password</label>
            <input
              pInputText
              type="password"
              [(ngModel)]="newPassword"
              class="w-full"
              placeholder="Min 6 characters"
            />
          </div>
          <div class="flex justify-end gap-2 mt-2">
            <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closePasswordDialog()" />
            <p-button label="Update" (onClick)="submitPassword()" [loading]="changingPassword" />
          </div>
        </div>
      }
    </p-dialog>
  `,
})
export class UserManagementComponent implements OnInit {
  enumerators: User[] = [];
  loading = false;
  uploading = false;
  uploadResult: BulkUploadResult | null = null;
  showPasswordDialog = false;
  selectedUser: User | null = null;
  newPassword = '';
  changingPassword = false;

  constructor(
    private usersService: UsersService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadEnumerators();
  }

  loadEnumerators(): void {
    this.loading = true;
    this.usersService.getEnumerators().subscribe({
      next: (list) => {
        this.enumerators = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load enumerators' });
      },
    });
  }

  downloadTemplate(): void {
    this.usersService.downloadEnumeratorsTemplate();
    this.messageService.add({ severity: 'info', summary: 'Download', detail: 'Template download started' });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.uploadResult = null;
    this.usersService.bulkUploadEnumerators(file).subscribe({
      next: (result) => {
        this.uploading = false;
        this.uploadResult = result;
        this.loadEnumerators();
        if (result.created > 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Bulk upload',
            detail: `Created ${result.created} enumerator(s)`,
          });
        }
        if (result.errors.length > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Bulk upload',
            detail: `${result.errors.length} row(s) had errors`,
          });
        }
        input.value = '';
      },
      error: () => {
        this.uploading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Bulk upload failed' });
        input.value = '';
      },
    });
  }

  openChangePassword(user: User): void {
    this.selectedUser = user;
    this.newPassword = '';
    this.showPasswordDialog = true;
  }

  closePasswordDialog(): void {
    this.showPasswordDialog = false;
    this.selectedUser = null;
    this.newPassword = '';
  }

  submitPassword(): void {
    if (!this.selectedUser || !this.newPassword || this.newPassword.length < 6) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Password must be at least 6 characters' });
      return;
    }
    this.changingPassword = true;
    this.usersService.changePassword(this.selectedUser.id, this.newPassword).subscribe({
      next: () => {
        this.changingPassword = false;
        this.closePasswordDialog();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password updated' });
      },
      error: () => {
        this.changingPassword = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update password' });
      },
    });
  }

  deactivate(user: User): void {
    this.usersService.setActive(user.id, false).subscribe({
      next: () => {
        this.loadEnumerators();
        this.messageService.add({ severity: 'success', summary: 'Deactivated', detail: `${user.name} has been deactivated` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to deactivate' }),
    });
  }

  activate(user: User): void {
    this.usersService.setActive(user.id, true).subscribe({
      next: () => {
        this.loadEnumerators();
        this.messageService.add({ severity: 'success', summary: 'Activated', detail: `${user.name} has been activated` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to activate' }),
    });
  }
}
