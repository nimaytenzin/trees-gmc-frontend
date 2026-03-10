import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen bg-cream">
      <app-sidebar
        [collapsed]="sidebarCollapsed"
        (toggle)="sidebarCollapsed = !sidebarCollapsed"
        class="hidden lg:block"
      />
      <!-- Mobile sidebar overlay -->
      @if (mobileMenuOpen) {
        <div class="fixed inset-0 z-50 lg:hidden">
          <div class="absolute inset-0 bg-black/50" (click)="mobileMenuOpen = false"></div>
          <div class="relative w-72">
            <app-sidebar [collapsed]="false" (toggle)="mobileMenuOpen = false" />
          </div>
        </div>
      }
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-topbar (menuToggle)="mobileMenuOpen = !mobileMenuOpen" />
        <main class="flex-1 overflow-auto p-4 md:p-6 bg-stone-50">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
}
