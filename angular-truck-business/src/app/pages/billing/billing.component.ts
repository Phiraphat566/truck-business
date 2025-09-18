import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

type Invoice = {
  id: number;
  invoiceNo: string;
  customerName: string;
  contractDate: string;
  dueDate: string;
  amount: number | string;
  status: 'PENDING' | 'OVERDUE' | 'PAID' | 'PARTIAL';
  paidAt?: string | null;
  createdAt: string;
  description?: string | null;

  // จาก listInvoices API
  paidAmount?: number;
  remaining?: number;

  
};



@Component({
  standalone: true,
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
  imports: [CommonModule, FormsModule, NgChartsModule, HttpClientModule]
})
export class BillingComponent implements OnInit {
  // ---------- Theme (เหมือน time in/out) ----------
  isDark = localStorage.getItem('theme') === 'dark';
  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }
  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
  }

  // ---------- View ----------
  view: 'dashboard' | 'monthDetail' = 'dashboard';

  basis: 'contractDate' | 'dueDate' | 'paidAt' = 'dueDate';

  // ---------- Year/Month ----------
  chartMonthIndex = new Date().getMonth(); // 0..11
  selectedYear!: number;
  years: number[] = [];

  // ---------- Loading & errors ----------
  isLoading = false;
  loadingInvoices = false;
  apiError: string | null = null;

  // ---------- Data ----------
  months = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];
  monthTotals: number[] = Array(12).fill(0);
  invoicesOfMonth: Invoice[] = [];
  opened: Record<number, boolean> = {};

  // Filter ในหน้า month detail
  filterStatus: 'ALL' | 'PENDING' | 'OVERDUE' | 'PAID' | 'PARTIAL' = 'ALL';

  get filteredInvoices(): Invoice[] {
    if (this.filterStatus === 'ALL') return this.invoicesOfMonth;
    return (this.invoicesOfMonth || []).filter(i => i.status === this.filterStatus);
  }

  // === โหมดแก้ไข ===
  editingMode = false;
  editingId: number | null = null;
  openEdit(inv: Invoice) {
  this.editingId = inv.id;
  this.showCreateModal = true;
  this.createError = null;

  this.newInvoice = {
    invoiceNo: inv.invoiceNo,
    customerName: inv.customerName,
    contractDate: (inv.contractDate || '').slice(0,10),
    dueDate: (inv.dueDate || '').slice(0,10),
    amount: this.toAmountNumber(inv.amount),
    description: inv.description ?? ''
  };
}

confirmDelete(inv: Invoice) {
  if (!confirm(`ลบใบแจ้งหนี้เลขที่ ${inv.invoiceNo} ?`)) return;
  this.http.delete(`/api/invoices/${inv.id}`).subscribe({
    next: () => {
      // รีโหลดข้อมูลให้ทันสมัย
      this.loadChartYear(this.selectedYear);
      this.loadInvoicesForCurrentMonth();
    },
    error: (err) => {
      alert(err?.error?.message || 'ลบไม่สำเร็จ');
    }
  });
}

  // ---------- Create modal ----------
  showCreateModal = false;
  creating = false;
  createError: string | null = null;
  newInvoice: {
    invoiceNo: string;
    customerName: string;
    contractDate: string;
    dueDate: string;
    amount: number | null;
    description?: string | null;
  } = {
    invoiceNo: '',
    customerName: '',
    contractDate: '',
    dueDate: '',
    amount: null,
    description: ''
  };
  invoiceNoHint = '';

  // ---------- Chart ----------
  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'ยอดใบแจ้งหนี้ต่อเดือน' }]
  };

  
// tooltip: โชว์ชื่อเดือน + ยอด
chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' },
    title: { display: false },
    tooltip: {
      displayColors: false,
      callbacks: {
        label: (ctx) => `${ctx.label}: ${ctx.parsed.y.toLocaleString('th-TH')} บาท`
      }
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: v => (v as number).toLocaleString('th-TH') + ' ฿' } }
  },
  elements: { bar: { borderRadius: 8, borderSkipped: false } }
};


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.applyTheme();          // << เปิดใช้ธีมจาก localStorage
    this.fetchYearsFromDb();
  }

  // ===== helpers =====
  getRemaining(inv: Partial<Invoice>): number {
  const amt = this.toAmountNumber(inv.amount as any);
  const paid = this.toAmountNumber((inv.paidAmount as any) ?? 0);
  return typeof inv.remaining === 'number' ? inv.remaining : Math.max(amt - paid, 0);
  }
  toAmountNumber(v: number | string | null | undefined): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }
  statusLabel(s: Invoice['status']) {
  if (s === 'PAID') return 'ชำระแล้ว';
  if (s === 'OVERDUE') return 'ค้างชำระ';
  if (s === 'PARTIAL') return 'ชำระบางส่วน';
  return 'รอดำเนินการ';
  }
  statusBadgeClass(s: Invoice['status']) {
  if (s === 'PAID')     return 'bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (s === 'OVERDUE')  return 'bg-yellow-100 text-yellow-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (s === 'PARTIAL')  return 'bg-blue-100 text-blue-700 dark:bg-sky-500/20 dark:text-sky-300';
  return 'bg-gray-100 text-gray-700 dark:bg-slate-700/50 dark:text-slate-200';
  }

  // ===== Load years =====
  private fetchYearsFromDb() {
    this.apiError = null;
    this.http.get<{ years: number[] }>('/api/finance/years/invoice').subscribe({
      next: (res) => {
        const ys = (res?.years ?? []).map(Number).filter(Boolean).sort((a,b)=>a-b);
        this.years = ys;
        if (this.years.length === 0) {
          this.apiError = 'ยังไม่มีใบแจ้งหนี้ในระบบ';
          this.chartData = { labels: [], datasets: [{ data: [], label: 'ยอดใบแจ้งหนี้ต่อเดือน' }] };
          return;
        }
        this.selectedYear = this.years[this.years.length - 1];
        this.loadChartYear(this.selectedYear);
        this.loadInvoicesForCurrentMonth();
      },
      error: () => this.apiError = 'โหลดรายการปีไม่สำเร็จ'
    });
  }

  // ===== Summary by month =====
  private loadChartYear(year: number) {
  this.isLoading = true;
  const params = new HttpParams()
    .set('year', String(year))
    .set('basis', this.basis); // << ใช้ค่าจาก state
  this.http.get<{ year: number; totals: number[] }>('/api/invoices/summary/by-month', { params })
      .subscribe({
        next: (res) => {
          this.monthTotals = Array.isArray(res?.totals) ? res.totals : Array(12).fill(0);
          this.updateChartData();
          this.isLoading = false;
        },
        error: () => {
          this.apiError = 'เชื่อมต่อข้อมูลใบแจ้งหนี้ไม่สำเร็จ (summary)';
          this.monthTotals = Array(12).fill(0);
          this.updateChartData();
          this.isLoading = false;
        }
      });
  }

  // ===== List invoices for current month =====
private loadInvoicesForCurrentMonth() {
  if (!this.selectedYear) return;
  this.loadingInvoices = true;
  const month = this.chartMonthIndex + 1;
  const params = new HttpParams()
    .set('year', String(this.selectedYear))
    .set('month', String(month))
    .set('basis', this.basis); // << ส่งไปด้วย
  this.http.get<Invoice[]>('/api/invoices', { params }).subscribe({
    next: (items) => {
    this.invoicesOfMonth = (items ?? []).map(it => ({
      ...it,
      amount: this.toAmountNumber(it.amount),
      paidAmount: this.toAmountNumber((it as any).paidAmount ?? 0),
      remaining: this.toAmountNumber((it as any).remaining ?? 0),
    }));
    this.opened = {};
    this.loadingInvoices = false;
  },
      error: () => {
        this.apiError = 'เชื่อมต่อข้อมูลใบแจ้งหนี้ไม่สำเร็จ (list)';
        this.invoicesOfMonth = [];
        this.loadingInvoices = false;
      }
    });
  }

  // ===== UI actions (Dashboard) =====
  prevMonth() {
    if (this.chartMonthIndex > 0) {
      this.chartMonthIndex--;
      this.updateChartData();
      this.loadInvoicesForCurrentMonth();
    }
  }
  nextMonth() {
    if (this.chartMonthIndex < 11) {
      this.chartMonthIndex++;
      this.updateChartData();
      this.loadInvoicesForCurrentMonth();
    }
  }
  onChangeYear(year: number) {
    this.selectedYear = Number(year);
    this.loadChartYear(this.selectedYear);
    this.loadInvoicesForCurrentMonth();
  }
  addNewYear() {
    const base = this.years.length ? Math.max(...this.years) : new Date().getFullYear();
    const nextYear = base + 1;
    this.http.post('/api/invoice-years', { year: nextYear }).subscribe({
      next: () => { this.fetchYearsFromDb(); this.selectedYear = nextYear; },
      error: () => { if (!this.years.includes(nextYear)) this.years.push(nextYear); }
    });
  }

  openMonthDetail(year: number, monthName: string) {
    if (this.selectedYear !== year) {
      this.selectedYear = year;
      this.loadChartYear(this.selectedYear);
    }
    const idx = this.months.indexOf(monthName);
    if (idx >= 0) this.chartMonthIndex = idx;
    this.view = 'monthDetail';
    this.filterStatus = 'ALL';
    this.loadInvoicesForCurrentMonth();
  }

  // ===== UI actions (Month Detail) =====
  backToDashboard() { this.view = 'dashboard'; }
  onChangeMonthInDetail(_i: number) { this.loadInvoicesForCurrentMonth(); }
  applyStatusFilter() { /* ใช้ getter filteredInvoices แล้ว */ }
  toggleOpen(id: number) { this.opened[id] = !this.opened[id]; }




  

  // ===== Chart data =====
 // === ทำกราฟทั้งปี (12 เดือน) ===
updateChartData() {
  // เผื่อกรณี totals ไม่ครบ 12
  const data = Array.from({ length: 12 }, (_, i) => this.toAmountNumber(this.monthTotals[i] ?? 0));

  const palette = [
    'rgba(59,130,246,0.8)','rgba(99,102,241,0.8)','rgba(168,85,247,0.8)',
    'rgba(236,72,153,0.8)','rgba(251,113,133,0.8)','rgba(249,115,22,0.8)',
    'rgba(245,158,11,0.8)','rgba(34,197,94,0.8)','rgba(16,185,129,0.8)',
    'rgba(6,182,212,0.8)','rgba(14,165,233,0.8)','rgba(139,92,246,0.8)'
  ];
  this.chartData = {
    labels: this.months,                   // แสดงชื่อเดือนทั้งปี
    datasets: [{
      data,
      label: `ยอดใบแจ้งหนี้ปี ${this.selectedYear ?? ''}`,
      backgroundColor: palette,           // ให้แต่ละแท่งคนละสี
      borderColor: palette.map(c => c.replace('0.8','1')),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: palette.map(c => c.replace('0.8','0.9')),
      hoverBorderWidth: 3
    }]
  };
}

  // ===== Create invoice (modal) =====
  addBill(year: number, monthName: string) {
    const idx = this.months.indexOf(monthName);
    if (idx >= 0) this.chartMonthIndex = idx;

    const yyyy = year;
    const mm = String(this.chartMonthIndex + 1).padStart(2, '0');
    this.invoiceNoHint = `${yyyy}-${mm}-0001`;

    const start = new Date(yyyy, this.chartMonthIndex, 1);
    const end = new Date(yyyy, this.chartMonthIndex + 1, 0);

    this.newInvoice = {
      invoiceNo: '',
      customerName: '',
      contractDate: this.toDateInput(start),
      dueDate: this.toDateInput(end),
      amount: null,
      description: ''
    };
    this.createError = null;
    this.showCreateModal = true;
  }
  closeCreate() {
  this.showCreateModal = false;
  this.creating = false;
  this.createError = null;
  this.editingId = null;   // << เพิ่ม
 }
  submitCreate() {
  if (!this.newInvoice.invoiceNo || !this.newInvoice.customerName ||
      !this.newInvoice.contractDate || !this.newInvoice.dueDate ||
      this.newInvoice.amount == null) {
    this.createError = 'กรุณากรอกข้อมูลที่มี * ให้ครบถ้วน';
    return;
  }
  this.creating = true; this.createError = null;

  const payload = {
    invoiceNo: this.newInvoice.invoiceNo.trim(),
    customerName: this.newInvoice.customerName.trim(),
    contractDate: this.newInvoice.contractDate,
    dueDate: this.newInvoice.dueDate,
    amount: Number(this.newInvoice.amount),
    description: this.newInvoice.description?.trim() || null
  };

  const req$ = this.editingId
    ? this.http.put<Invoice>(`/api/invoices/${this.editingId}`, payload)
    : this.http.post<Invoice>('/api/invoices', payload);

  req$.subscribe({
    next: () => {
      this.creating = false;
      this.showCreateModal = false;
      this.editingId = null; // เคลียร์โหมดแก้ไข
      // รีโหลดให้กราฟ/ลิสต์อัปเดต
      this.loadChartYear(this.selectedYear);
      this.loadInvoicesForCurrentMonth();
    },
    error: (err) => {
      this.creating = false;
      this.createError = err?.error?.message || 'บันทึกไม่สำเร็จ';
    }
  });
}


  private toDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }





  // ====== Pay invoice state ======
showPayModal = false;
paying = false;
payError: string | null = null;
payTarget: Invoice | null = null;
payForm: {
  paidAt: string;             // 'YYYY-MM-DD'
  incomeAmount: number | null;
  incomeDescription?: string | null;
  incomeCategory?: string | null; // default: 'INVOICE'
} = { paidAt: '', incomeAmount: null, incomeDescription: '', incomeCategory: 'INVOICE' };

// เปิด modal พร้อมค่าเริ่มต้น
openPay(inv: Invoice) {
  this.payTarget = inv;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');

  const remain = this.getRemaining(inv);

  this.payForm = {
    paidAt: `${y}-${m}-${d}`,
    incomeAmount: remain, // <-- ใช้ยอดคงเหลือเป็นค่าเริ่มต้น
    incomeDescription: `ชำระเงินใบแจ้งหนี้ ${inv.invoiceNo}`,
    incomeCategory: 'INVOICE',
  };

  this.payError = null;
  this.showPayModal = true;
}

closePay() {
  this.showPayModal = false;
  this.payTarget = null;
  this.paying = false;
  this.payError = null;
}

// ส่งข้อมูลรับชำระ -> POST /api/invoices/:id/pay
// ส่งข้อมูลรับชำระ -> POST /api/invoices/:id/payments (งวดชำระ)
submitPay() {
  if (!this.payTarget) return;
  if (!this.payForm.paidAt || this.payForm.incomeAmount == null) {
    this.payError = 'กรุณากรอกวันที่และยอดรับให้ครบถ้วน';
    return;
  }
  this.paying = true; this.payError = null;

  const body = {
    amount: Number(this.payForm.incomeAmount),
    paidAt: this.payForm.paidAt,
    description: this.payForm.incomeDescription || `ชำระเงินใบแจ้งหนี้ ${this.payTarget.invoiceNo}`,
  };

  this.http.post(`/api/invoices/${this.payTarget.id}/payments`, body)
    .subscribe({
      next: () => {
        this.closePay();
        // รีโหลดลิสต์ที่หน้าเดิมให้เห็น paidAmount/remaining ใหม่ + สถานะอัปเดต
        this.loadInvoicesForCurrentMonth();
        this.loadChartYear(this.selectedYear); // ถ้ากราฟอิง dueDate/paidAt แล้วอยากให้ update ด้วย
      },
      error: (err) => {
        this.payError = err?.error?.message || 'บันทึกไม่สำเร็จ';
        this.paying = false;
      }
    });
  }
}


