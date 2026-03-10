import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="h-full bg-forest text-white flex flex-col transition-all duration-300"
      [class.w-72]="!collapsed"
      [class.w-20]="collapsed"
    >
      <!-- Logo -->
      <div class="p-4 border-b border-white/10 flex items-center gap-3">
        <div class="w-10 h-10 bg-sage rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          🌳
        </div>
        @if (!collapsed) {
          <div>
            <h1 class="font-bold text-lg leading-tight">Trees-GMC</h1>
            <p class="text-xs text-sage">Gelephu Mindfulness City</p>
          </div>
        }
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-1">
        @if (authService.isAdmin()) {
          <a
            routerLink="/app/dashboard"
            routerLinkActive="bg-white/15"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <i class="pi pi-th-large text-lg"></i>
            @if (!collapsed) { <span>Dashboard</span> }
          </a>
          <a
            routerLink="/app/map"
            routerLinkActive="bg-white/15"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <i class="pi pi-map"></i>
            @if (!collapsed) { <span>Map View</span> }
          </a>
          <a
            routerLink="/app/dashboard/users"
            routerLinkActive="bg-white/15"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <i class="pi pi-users"></i>
            @if (!collapsed) { <span>Enumerator Management</span> }
          </a>
        }
        <a
          routerLink="/app/trees/register"
          routerLinkActive="bg-white/15"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <i class="pi pi-plus-circle text-lg"></i>
          @if (!collapsed) { <span>Register Tree</span> }
        </a>
        <a
          routerLink="/app/trees/growth-metric"
          routerLinkActive="bg-white/15"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <i class="pi pi-chart-line text-lg"></i>
          @if (!collapsed) { <span>Growth Metrics</span> }
        </a>
      </nav>

      <!-- Collapse button -->
      <div class="p-3 border-t border-white/10 hidden lg:block">
        <button
          (click)="toggle.emit()"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <i class="pi" [class.pi-angle-left]="!collapsed" [class.pi-angle-right]="collapsed"></i>
          @if (!collapsed) { <span class="text-sm">Collapse</span> }
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  constructor(public authService: AuthService) {}
}
