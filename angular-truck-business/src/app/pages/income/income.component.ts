import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
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
  imports: [RouterModule, NgIf, NgFor, NgChartsModule],
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

  incomeList = [
    {
      date: '31 ก.ค. 2025',
      title: 'งานบดดิน 5 ไร่',
      category: 'งานถมที่',
      amount: 80000,
    },
    {
      date: '30 ก.ค. 2025',
      title: 'ขนดินโครงการบ้านจัดสรร',
      category: 'ขนส่งดิน',
      amount: 65000,
    },
    {
      date: '29 ก.ค. 2025',
      title: 'ถมลานจอดรถ 3 ไร่',
      category: 'งานถมที่',
      amount: 72000,
    },
    {
      date: '28 ก.ค. 2025',
      title: 'ขนดินอาไถ่งาน A',
      category: 'ขนส่งดิน',
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
