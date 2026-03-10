import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <button
          (click)="menuToggle.emit()"
          class="lg:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <i class="pi pi-bars text-forest"></i>
        </button>
        <div class="size-8 text-primary flex items-center justify-center rounded-full bg-sage/10">
          <span class="material-symbols-outlined text-4xl">eco</span>
        </div>
        <h2 class="text-lg font-semibold text-forest">
          Trees Inventory & Growth Tracker
        </h2>
      </div>
      <div class="flex items-center gap-4">
        @if (authService.currentUser; as user) {
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-sage rounded-full flex items-center justify-center text-white text-sm font-medium">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="hidden md:block">
              <p class="text-sm font-medium text-stone-700">{{ user.name }}</p>
              <p class="text-xs text-stone-500">{{ user.role }}</p>
            </div>
          </div>
        }
        <button
          (click)="authService.logout()"
          class="p-2 rounded-lg hover:bg-red-50 text-stone-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(public authService: AuthService) {}
}
