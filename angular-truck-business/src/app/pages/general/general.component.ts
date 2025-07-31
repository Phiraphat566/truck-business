import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartData,
  ChartType,
} from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css'],
  imports: [RouterModule, NgIf, NgFor, NgChartsModule]
})
export class GeneralComponent {
  stats = {
    newAccounts: { value: 234, percent: 58 },
    totalExpenses: { percent: 71 },
    companyValue: { value: 1.45, unit: 'M', score: 72 },
    newEmployees: { hires: 34, score: 81 },
    income: { value: 5456, percent: 14 },
    expenses: { value: 4764, percent: 8 },
    spendings: { value: 1.5, unit: 'M', percent: 15 },
    totals: { value: 31564, percent: 76 },
    incomeTarget: 71,
    expensesTarget: 54,
    spendingsTarget: 32,
    totalsTarget: 89,
  };

  // กราฟผสม bar + line
  trafficChart: ChartData<'bar' | 'line'> = {
    labels: [
      '01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan',
      '07 Jan', '08 Jan', '09 Jan', '10 Jan', '11 Jan', '12 Jan'
    ],
    datasets: [
      {
        type: 'bar',
        label: 'Website Blog',
        data: [450, 380, 400, 700, 250, 390, 240, 360, 750, 420, 300, 210],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        type: 'line',
        label: 'Social Media',
        data: [20, 25, 15, 28, 35, 18, 22, 30, 26, 19, 20, 16],
        borderColor: '#10b981',
        backgroundColor: '#10b98133',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      }
    ]
  };

  // ใช้ 'bar' เป็น type หลักของกราฟผสม
  trafficType: 'bar' | 'line' = 'bar';

  trafficOptions: ChartConfiguration<'bar' | 'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#6b7280' },
      },
      x: {
        ticks: { color: '#6b7280' },
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#374151' }
      }
    }
  };

  // วงกลม progress รายได้
  incomeProgressValue = 75;

  circularChartData: ChartData<'doughnut'> = {
    labels: ['Complete', 'Remaining'],
    datasets: [
      {
        data: [75, 25],
        backgroundColor: ['#34d399', '#e5e7eb']
      }
    ]
  };
}
