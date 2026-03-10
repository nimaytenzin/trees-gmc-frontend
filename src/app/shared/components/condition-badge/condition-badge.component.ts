import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-condition-badge',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <p-tag [value]="condition" [severity]="getSeverity()" [rounded]="true" />
  `,
})
export class ConditionBadgeComponent {
  @Input() condition: string = '';

  getSeverity(): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (this.condition) {
      case 'Good':
        return 'success';
      case 'Fair':
        return 'warn';
      case 'Poor':
        return 'danger';
      case 'Dead':
        return 'secondary';
      default:
        return 'secondary';
    }
  }
}
