import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `<canvas #canvas class="sparkline-canvas"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 40px; /* sensible default; parent can override */
        position: relative;
      }
      .sparkline-canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
      }
    `,
  ],
})
export class SparklineComponent implements AfterViewInit, OnChanges {
  @Input() data: number[] = [];
  @Input() color = '#2D5016';
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    // Defer initial render so the browser has computed layout
    queueMicrotask(() => this.renderChart());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['data']) return;
    // If the view isn't ready yet, ngAfterViewInit will handle the first render
    if (!this.canvas?.nativeElement) return;
    this.renderChart();
  }

  private renderChart(): void {
    if (!this.canvas?.nativeElement) return;
    if (this.chart) this.chart.destroy();

    const config = {
      type: 'line' as const,
      data: {
        labels: this.data.map(() => ''),
        datasets: [
          {
            data: this.data,
            borderColor: this.color,
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false } },
        },
      },
    };
    this.chart = new Chart(this.canvas.nativeElement, config) as Chart;
  }
}
