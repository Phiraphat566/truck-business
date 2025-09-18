import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

type AttendanceDay = {
  date: string;     // 'YYYY-MM-DD'
  working: number;  // ต้องทำงาน
  present: number;  // มาแล้ว (ตรงเวลา+สาย)
  onTime: number;   // ตรงเวลา
  late: number;     // สาย
  leave: number;    // ลา
  absent: number;   // ขาด
};

@Component({
  standalone: true,
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css'],
  imports: [RouterModule, NgIf, NgFor, HttpClientModule, NgChartsModule]
})
export class GeneralComponent implements OnInit {
  constructor(private http: HttpClient) {}

  // ------- KPIs (ของเดิมคงไว้) -------
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

  // ====== กราฟการเข้างานพนักงาน (แทนที่ traffic chart เดิม) ======
  private end = new Date();
  private start = new Date(new Date().setDate(this.end.getDate() - 13)); // 14 วันล่าสุด

  attendanceData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { label: 'ตรงเวลา', data: [], stack: 'a', backgroundColor: '#10b981' },
      { label: 'สาย',     data: [], stack: 'a', backgroundColor: '#f59e0b' },
      { label: 'ลา',      data: [], stack: 'b', backgroundColor: '#94a3b8' },
      { label: 'ขาด',     data: [], stack: 'b', backgroundColor: '#ef4444' },
    ],
  };

  attendanceOpt: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { color: 'rgba(148,163,184,.15)' } },
      y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(148,163,184,.15)' } },
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
          footer: (items) => {
            const i = items[0].dataIndex ?? 0;
            // แนบ working ลงใน data เพื่อใช้แจ้ง "ต้องทำงาน"
            // @ts-ignore
            const w = (items[0].chart.data as any)._working?.[i] ?? 0;
            return `ต้องทำงาน: ${w} คน`;
          },
        },
      },
    },
  };

  // ====== โดนัทความคืบหน้ารายได้ (ย่อ/ขยายให้พอดีกรอบ) ======
  incomeProgressValue = 75;
  circularChartData: ChartData<'doughnut'> = {
    labels: ['บรรลุแล้ว', 'คงเหลือ'],
    datasets: [{ data: [75, 25], backgroundColor: ['#34d399', '#e5e7eb'], borderWidth: 0 }],
  };

  circularOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    radius: '96%',   // ใหญ่เต็มกรอบมากขึ้น
    cutout: '58%',   // วงไม่หนาเกิน
    layout: { padding: 0 },
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5e1' } },
    },
  };

  ngOnInit(): void {
    this.loadAttendance();
  }

  private iso(d: Date) { return d.toISOString().slice(0, 10); }

  private loadAttendance() {
    const params = new HttpParams()
      .set('start', this.iso(this.start))
      .set('end', this.iso(this.end));

    this.http
      .get<{ days: AttendanceDay[]; totalEmployees: number }>('/api/dashboard/attendance', { params })
      .subscribe({
        next: (res) => {
          const days = res.days ?? [];
          const labels = days.map(d =>
            new Date(d.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
          );

          this.attendanceData = {
            labels,
            datasets: [
              { label: 'ตรงเวลา', data: days.map(d => d.onTime), stack: 'a', backgroundColor: '#10b981' },
              { label: 'สาย',     data: days.map(d => d.late),   stack: 'a', backgroundColor: '#f59e0b' },
              { label: 'ลา',      data: days.map(d => d.leave),  stack: 'b', backgroundColor: '#94a3b8' },
              { label: 'ขาด',     data: days.map(d => d.absent), stack: 'b', backgroundColor: '#ef4444' },
            ],
          } as any;

          // เก็บ "ต้องทำงาน" ไว้ใช้ใน tooltip
          (this.attendanceData as any)._working = days.map(d => d.working);
        },
        // ถ้า API ยังไม่พร้อม -> ทำข้อมูลตัวอย่างให้
        error: () => {
          const mock: AttendanceDay[] = Array.from({ length: 12 }).map((_, i) => {
            const d = new Date(this.start); d.setDate(this.start.getDate() + i);
            const working = 12;
            const onTime = Math.max(0, 9 - (i % 3));
            const late = (i % 3);
            const leave = (i % 4 === 0) ? 1 : 0;
            const absent = Math.max(0, working - (onTime + late + leave));
            return { date: d.toISOString().slice(0,10), working, present: onTime+late, onTime, late, leave, absent };
          });
          const labels = mock.map(d => new Date(d.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }));
          this.attendanceData = {
            labels,
            datasets: [
              { label: 'ตรงเวลา', data: mock.map(d => d.onTime), stack: 'a', backgroundColor: '#10b981' },
              { label: 'สาย',     data: mock.map(d => d.late),   stack: 'a', backgroundColor: '#f59e0b' },
              { label: 'ลา',      data: mock.map(d => d.leave),  stack: 'b', backgroundColor: '#94a3b8' },
              { label: 'ขาด',     data: mock.map(d => d.absent), stack: 'b', backgroundColor: '#ef4444' },
            ],
          } as any;
          (this.attendanceData as any)._working = mock.map(d => d.working);
        },
      });
  }
}