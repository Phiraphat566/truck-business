import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type Status = 'ON_TIME' | 'LATE' | 'ABSENT';

type YearRow = { year: number; monthsCount: number };

type DayRow = {
  date: string;
  rows: {
    employee_id: string;
    employee_name: string;
    check_in?: string;   // HH:mm
    check_out?: string;  // HH:mm|'-'
    status: Status;
    note?: string;
  }[];
};

type ApiSummary = {
  headStats: { people: number; ontimePct: number; latePct: number; absentPct: number };
  days: DayRow[];
};

@Component({
  standalone: true,
  selector: 'app-time-in-out',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './time-in-out.component.html',
})
export class TimeInOutComponent implements OnInit {
  // ===== Theme =====
  isDark = localStorage.getItem('theme') === 'dark';
  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }
  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
  }

  // ===== View =====
  view: 'year' | 'month' = 'year';

  // ===== Year list =====
  years: YearRow[] = [];
  loadingYears = false;

  // ===== Month dashboard =====
  year = new Date().getFullYear();
  months = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];
  selectedMonthIndex = 0; // 0..11

  searchText = '';
  filterScope: 'all' | 'ontime' | 'late' | 'absent' = 'all';

  headStats = signal({ people: 0, ontimePct: 0, latePct: 0, absentPct: 0 });
  days: DayRow[] = [];
  loadingMonth = false;

  // Error/Toast (ข้อความสั้น ๆ ถ้าต้องการแสดงใน template)
  errorMsg = signal<string | null>(null);

  // ===== Employee modal =====
  modalOpen = signal(false);
  modalEmp  = signal<{ id: string; name: string } | null>(null);
  weeks: { day: number | null; status?: Status; timeIn?: string }[][] = [];
  loadingHistory = false;

  // ===== Simple month cache (ลด API calls เวลาเลื่อนเดือนกลับไปมา) =====
  private monthCache = new Map<string, ApiSummary>(); // key: `${year}-${monthNumber}`

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.applyTheme();
    this.loadYears();
  }

  // ---------- API bases ----------
  private attendanceApi = '/api/attendance';
  private workYearApi   = '/api/work-years';

  // ---------- WorkYear ----------
  async loadYears() {
    this.loadingYears = true;
    this.errorMsg.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<YearRow[]>(`${this.workYearApi}`)
      );
      this.years = res ?? [];

      // ถ้ามีปีแล้ว เปิดปีล่าสุดอัตโนมัติ (index 0 เพราะ backend sort desc)
      if (this.years.length) {
        this.openYear(this.years[0].year);
      } else {
        // ไม่มีปีให้แสดง -> อยู่หน้า year
        this.view = 'year';
      }
    } catch (e) {
      console.error('[loadYears]', e);
      this.errorMsg.set('โหลดรายการปีไม่สำเร็จ');
    } finally {
      this.loadingYears = false;
    }
  }

  /** ปุ่ม "เพิ่มปี" -> POST /api/work-years แล้วรีโหลด */
  async addYear() {
    this.errorMsg.set(null);
    try {
      const nextYear = (this.years[0]?.year ?? new Date().getFullYear()) + 1;
      await firstValueFrom(
        this.http.post<{ year:number; monthsCount:number }>(`${this.workYearApi}`, { year: nextYear })
      );
      await this.loadYears();
      this.view = 'year';
    } catch (e) {
      console.error('[addYear]', e);
      this.errorMsg.set('เพิ่มปีใหม่ไม่สำเร็จ');
    }
  }

  // ---------- Month summary ----------
  openYear(y: number) {
    // ปิด modal ถ้าเปิดอยู่
    if (this.modalOpen()) this.closeModal();

    this.year = y;
    this.view = 'month';
    this.selectedMonthIndex = 0;

    // เคลียร์ของเดิม + ลองใช้ cache
    this.headStats.set({ people: 0, ontimePct: 0, latePct: 0, absentPct: 0 });
    this.days = [];
    this.loadMonth();
  }

  resetToYear() {
    // ปิด modal ถ้าเปิดอยู่
    if (this.modalOpen()) this.closeModal();

    this.view = 'year';
  }

  /** โหลดข้อมูลเดือน: ใช้ cache ก่อน ถ้าไม่มีหรือ force=true ค่อยยิง API */
  async loadMonth(force = false) {
    this.loadingMonth = true;
    this.errorMsg.set(null);
    try {
      const monthNumber = this.selectedMonthIndex + 1;
      const cacheKey = `${this.year}-${monthNumber}`;

      if (!force && this.monthCache.has(cacheKey)) {
        const cached = this.monthCache.get(cacheKey)!;
        this.headStats.set(cached.headStats);
        this.days = cached.days;
      } else {
        const res = await firstValueFrom(
          this.http.get<ApiSummary>(`${this.attendanceApi}/summary`, {
            params: { year: this.year, month: monthNumber }
          })
        );

        const summary: ApiSummary = {
          headStats: res?.headStats ?? { people: 0, ontimePct: 0, latePct: 0, absentPct: 0 },
          days: res?.days ?? [],
        };

        this.monthCache.set(cacheKey, summary);
        this.headStats.set(summary.headStats);
        this.days = summary.days;
      }
    } catch (e) {
      console.error('[loadMonth]', e);
      this.errorMsg.set('โหลดข้อมูลเดือนนี้ไม่สำเร็จ');
      this.headStats.set({ people: 0, ontimePct: 0, latePct: 0, absentPct: 0 });
      this.days = [];
    } finally {
      this.loadingMonth = false;
    }
  }

  /** ปุ่มรีเฟรชเดือน (ไม่ใช้ cache) */
  async refreshMonth() {
    const monthNumber = this.selectedMonthIndex + 1;
    this.monthCache.delete(`${this.year}-${monthNumber}`);
    await this.loadMonth(true);
  }

  /** ปุ่มเลื่อนเดือนก่อนหน้า */
  async prevMonth() {
    if (this.modalOpen()) this.closeModal();
    if (this.selectedMonthIndex === 0) {
      // ย้อนกลับไป ธ.ค. ปีที่แล้ว (ถ้ามีในรายการปี)
      this.year -= 1;
      this.selectedMonthIndex = 11;
    } else {
      this.selectedMonthIndex -= 1;
    }
    await this.loadMonth();
  }

  /** ปุ่มเลื่อนเดือนถัดไป */
  async nextMonth() {
    if (this.modalOpen()) this.closeModal();
    if (this.selectedMonthIndex === 11) {
      // ไป ม.ค. ปีถัดไป
      this.year += 1;
      this.selectedMonthIndex = 0;
    } else {
      this.selectedMonthIndex += 1;
    }
    await this.loadMonth();
  }

  /** ใช้ตอน select เดือนจาก dropdown */
  async onChangeMonth() {
    if (this.modalOpen()) this.closeModal();
    await this.loadMonth();
  }

  // ---------- Filtering ----------
  filteredDays(): DayRow[] {
    const s = this.searchText.trim().toLowerCase();
    const scope = this.filterScope;
    return this.days
      .map(g => ({
        date: g.date,
        rows: g.rows.filter(r => {
          const nameOk = !s || r.employee_name.toLowerCase().includes(s);
          const scopeOk =
            scope === 'all' ||
            (scope === 'ontime' && r.status === 'ON_TIME') ||
            (scope === 'late'   && r.status === 'LATE') ||
            (scope === 'absent' && r.status === 'ABSENT');
          return nameOk && scopeOk;
        })
      }))
      .filter(g => g.rows.length > 0);
  }

  badgeClass(s: Status) {
    return {
      'ON_TIME': 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30',
      'LATE':    'bg-amber-600/15  text-amber-400  border border-amber-500/30',
      'ABSENT':  'bg-rose-600/15   text-rose-400   border border-rose-500/30',
    }[s];
  }

  // ---------- Employee modal ----------
async openEmpHistory(empId: string, empName: string) {
  this.modalOpen.set(true);
  this.loadingHistory = true;

  try {
    const res = await firstValueFrom(
      this.http.get<{ employee:{id:string;name:string}, days:{day:number;status:Status;timeIn?:string;note?:string}[] }>(
        `${this.attendanceApi}/employee-history`,
        { params: { empId, year: this.year, month: this.selectedMonthIndex + 1 } }
      )
    );

    this.modalEmp.set(res.employee);
    this.weeks = this.buildCalendarGrid(res.days || []);
  } catch (e) {
    console.error('[openEmpHistory]', e);
    this.weeks = this.buildCalendarGrid([]);
  } finally {
    this.loadingHistory = false;
  }
}


  closeModal() { this.modalOpen.set(false); this.modalEmp.set(null); }

  private buildCalendarGrid(days: {day:number;status:Status;timeIn?:string}[]) {
    // calendar (จันทร์=คอลัมน์แรก)
    const first = new Date(this.year, this.selectedMonthIndex, 1);
    const startWeekday = (first.getDay() + 6) % 7; // จันทร์=0
    const daysInMonth = new Date(this.year, this.selectedMonthIndex + 1, 0).getDate();

    const grid: { day: number | null; status?: Status; timeIn?: string }[][] = [];
    let cursor = 1 - startWeekday;

    for (let w = 0; w < 6; w++) {
      const row: Array<{ day: number | null; status?: Status; timeIn?: string }> = [];
      for (let d = 0; d < 7; d++, cursor++) {
        if (cursor < 1 || cursor > daysInMonth) {
          row.push({ day: null });
        } else {
          const info = days.find(x => x.day === cursor);
          row.push(info ? { day: cursor, status: info.status, timeIn: info.timeIn } : { day: cursor, status: 'ABSENT' });
        }
      }
      grid.push(row);
    }
    return grid;
  }

  pillClass(s?: Status) {
    const map: Record<Status, string> = {
      'ON_TIME': 'bg-emerald-500/15 border border-emerald-400/30',
      'LATE':    'bg-amber-500/15  border border-amber-400/30',
      'ABSENT':  'bg-rose-500/15   border border-rose-400/30',
    };
    return s ? map[s] : '';
  }

  statusText(s?: Status, t?: string) {
    if (s === 'ON_TIME') return `${t ?? '-'} · ตรงเวลา`;
    if (s === 'LATE')    return `${t ?? '-'} · สาย`;
    if (s === 'ABSENT')  return 'ขาด';
    return '-';
  }
}
