// ...existing imports and decorator...
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
  imports: [CommonModule, FormsModule, NgChartsModule]
})
export class BillingComponent implements OnInit {
  chartMonthIndex: number = 11; // default to latest month (ธันวาคม)
  selectedYear: number = 2025;
  years: number[] = [2021, 2022, 2023, 2024, 2025];
  isLoading: boolean = false;

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
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: '500'
          }
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `รายรับ: ${context.parsed.y.toLocaleString('th-TH')} บาท`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            weight: '500'
          },
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280',
          callback: function(value) {
            return (value as number).toLocaleString('th-TH') + ' ฿';
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
        backgroundColor: (context) => {
          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.6)');
          return gradient;
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutCubic'
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
    
    // Create gradient colors for the chart
    const gradientColors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(99, 102, 241, 0.8)',   // Indigo  
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(251, 113, 133, 0.8)',  // Rose
      'rgba(249, 115, 22, 0.8)',   // Orange
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(16, 185, 129, 0.8)',   // Emerald
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(14, 165, 233, 0.8)',   // Sky
      'rgba(139, 92, 246, 0.8)'    // Violet
    ];

    this.chartData = {
      labels: [currentMonth],
      datasets: [
        {
          data: [mockIncome[this.chartMonthIndex]],
          label: `รายรับเดือน${currentMonth}`,
          backgroundColor: gradientColors[this.chartMonthIndex],
          borderColor: gradientColors[this.chartMonthIndex].replace('0.8', '1'),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: gradientColors[this.chartMonthIndex].replace('0.8', '0.9'),
          hoverBorderWidth: 3
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
    // Add visual feedback
    this.isLoading = true;
    
    setTimeout(() => {
      if (!this.bills[year]) this.bills[year] = {};
      if (!this.bills[year][month]) this.bills[year][month] = [];
      const newId = Date.now();
      this.bills[year][month].push({
        id: newId,
        date: new Date().toLocaleDateString('th-TH'),
        imageUrl: 'assets/sample-bill.png' // Replace with upload logic
      });
      
      this.isLoading = false;
      
      // Show success feedback (you can implement toast notification here)
      console.log(`เพิ่มข้อมูลสำหรับ ${month} ${year} เรียบร้อยแล้ว`);
    }, 500); // Simulate API call delay
  }

  editBill(year: number, month: string, billId: number) {
    // Implement edit logic or popup here
    console.log('Edit bill', billId, 'in', month, year);
  }
}
