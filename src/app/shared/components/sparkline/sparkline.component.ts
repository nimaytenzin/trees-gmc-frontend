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
  template: `<canvas #canvas height="40"></canvas>`,
})
export class SparklineComponent implements AfterViewInit, OnChanges {
  @Input() data: number[] = [];
  @Input() color = '#2D5016';
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.canvas) {
      this.renderChart();
    }
  }

  private renderChart(): void {
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
          x: { display: false },
          y: { display: false },
        },
      },
    };
    this.chart = new Chart(this.canvas.nativeElement, config) as Chart;
  }
}
