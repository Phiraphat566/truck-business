// ...existing imports and decorator...
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
  imports: [FormsModule, NgChartsModule]
})
export class BillingComponent implements OnInit {
  chartMonthIndex: number = 11; // default to latest month (ธันวาคม)
  selectedYear: number = 2025;
  years: number[] = [2021, 2022, 2023, 2024, 2025];

  months: string[] = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [
      { data: [], label: 'รายรับต่อเดือน' }
    ]
  };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false }
    },
    scales: {
      x: {},
      y: { beginAtZero: true }
    }
  };

  bills: { [year: number]: { [month: string]: Array<{ id: number, date: string, imageUrl: string }> } } = {};

  ngOnInit(): void {
    this.updateChartData();
  }

  prevMonth() {
    if (this.chartMonthIndex > 0) {
      this.chartMonthIndex--;
      this.updateChartData();
    }
  }

  nextMonth() {
    if (this.chartMonthIndex < this.months.length - 1) {
      this.chartMonthIndex++;
      this.updateChartData();
    }
  }

  updateChartData() {
    const mockIncome = [12000, 15000, 11000, 18000, 17000, 16000, 20000, 21000, 19000, 22000, 23000, 25000];
    const currentMonth = this.months[this.chartMonthIndex];
    this.chartData = {
      labels: [currentMonth],
      datasets: [
        {
          data: [mockIncome[this.chartMonthIndex]],
          label: 'รายรับเดือน ' + currentMonth
        }
      ]
    };
  }

  addNewYear() {
    const nextYear = Math.max(...this.years) + 1;
    this.years.push(nextYear);
    this.selectedYear = nextYear;
    if (this.years.length > 5) {
      this.years.shift(); // remove oldest year
    }
  }

  openMonthDetail(year: number, month: string) {
    // Implement navigation or popup logic here
    // For example, set selectedMonth and show detail popup
    // Or use Angular Router to navigate to /billing/:year/:month
    // Example: this.router.navigate([`/billing/${year}/${month}`]);
    // For now, just log
    console.log('Open detail for', year, month);
  }

  addBill(year: number, month: string) {
    if (!this.bills[year]) this.bills[year] = {};
    if (!this.bills[year][month]) this.bills[year][month] = [];
    const newId = Date.now();
    this.bills[year][month].push({
      id: newId,
      date: new Date().toLocaleDateString('th-TH'),
      imageUrl: 'assets/sample-bill.png' // Replace with upload logic
    });
  }

  editBill(year: number, month: string, billId: number) {
    // Implement edit logic or popup here
    console.log('Edit bill', billId, 'in', month, year);
  }
}
