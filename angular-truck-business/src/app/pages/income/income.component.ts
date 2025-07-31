import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgFor, NgClass, CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartType,
  ChartData,
  ChartDataset,
} from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.css'],
  imports: [RouterModule, NgIf, NgFor, NgClass, CommonModule, NgChartsModule],
})
export class IncomeComponent {
  summary = {
    thisYear: 65000,
    lastMonth: 1200000,
    thisMonth: 1425000,
    avgDaily: 48500,
  };

  // ✅ ใช้ ChartData แทน ChartDataset[]
  chartLineData: ChartData<'line'> = {
    labels: ['1 ก.ค.', '5 ก.ค.', '11 ก.ค.', '18 ก.ค.', '21 ก.ค.', '24 ก.ค.', '31 ก.ค.'],
    datasets: [
      {
        data: [20000, 45000, 35000, 42000, 67000, 30000, 52000],
        label: 'รายได้ (บาท)',
        tension: 0.3,
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
      },
    ],
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  chartType: 'line' = 'line'; // ✅ แก้ให้ type เป็น literal

  // Pie Chart Data
  pieChartData: ChartData<'pie'> = {
    labels: ['ขนส่งสินค้า', 'บริการพิเศษ', 'อื่นๆ'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          '#3b82f6', // Blue
          '#10b981', // Green
          '#f59e0b', // Amber
        ],
        borderColor: [
          '#1d4ed8',
          '#059669',
          '#d97706',
        ],
        borderWidth: 2,
      },
    ],
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    },
  };

  pieChartType: 'pie' = 'pie';

  incomeList = [
    {
      date: '31 ก.ค. 2025',
      title: 'งานบดดิน 5 ไร่',
      category: 'ขนส่ง',
      amount: 80000,
    },
    {
      date: '30 ก.ค. 2025',
      title: 'ขนดินโครงการบ้านจัดสรร',
      category: 'ขนส่ง',
      amount: 65000,
    },
    {
      date: '29 ก.ค. 2025',
      title: 'ถมลานจอดรถ 3 ไร่',
      category: 'บริการ',
      amount: 72000,
    },
    {
      date: '28 ก.ค. 2025',
      title: 'ขนดินอาไถ่งาน A',
      category: 'อื่นๆ',
      amount: 60000,
    },
  ];

  popupVisible = false;
  selectedIncome: any = null;

  openPopup(income: any) {
    this.selectedIncome = income;
    this.popupVisible = true;
  }

  closePopup() {
    this.popupVisible = false;
    this.selectedIncome = null;
  }
}
