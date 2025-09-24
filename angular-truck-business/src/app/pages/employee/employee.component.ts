import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom, interval, Subscription } from 'rxjs';

// ===== types จาก API =====
type ApiEmployee = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email?: string;
  profileImagePath?: string | null;
};

type DayStatus = 'NOT_CHECKED_IN' | 'WORKING' | 'OFF_DUTY' | 'ON_LEAVE' | 'ABSENT';

type ApiDayStatus = {
  employee_id: string;
  status: DayStatus;
  // arrival_detail?: 'ON_TIME' | 'LATE' | null; // เผื่อใช้ในอนาคต
};

interface Employee {
  id?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  position?: string;
  salary?: number;
  imageUrl?: string;
  status?: DayStatus;
}

@Component({
  standalone: true,
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
  imports: [RouterModule, FormsModule, CommonModule, HttpClientModule],
})
export class EmployeeComponent implements OnInit, OnDestroy {
  private pollSub?: Subscription;

  showDeleteConfirm = false;
  deleteIndex: number | null = null;
  showToast = false;
  toastMessage = '';
  isLoading = false;

  isDark = localStorage.getItem('theme') === 'dark';
  searchTerm = '';

  showPopup = false;
  editingMode = false;
  form: Partial<Employee> = {};
  showDetailPopup = false;
  selectedEmployee: Employee | null = null;

  currentIndex = 0;
  employees: Employee[] = [];

  // ===== lifecycle =====
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.applyTheme();
    this.loadEmployees();
    this.pollSub = interval(10_000).subscribe(() => this.refreshDayStatuses());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  // ===== theme =====
  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
  }
  private applyTheme() {
    const root = document.documentElement;
    root.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  // ===== summary cards =====
  get totalEmployees(): number { return this.employees.length; }
  get workingCount(): number { return this.employees.filter(e => e.status === 'WORKING').length; }
  get leaveCount(): number { return this.employees.filter(e => e.status === 'ON_LEAVE').length; }

  // ===== list filter =====
  get filteredEmployees(): Employee[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (!term) return this.employees;
    return this.employees.filter(emp =>
      (emp.firstName || '').toLowerCase().includes(term) ||
      (emp.lastName || '').toLowerCase().includes(term) ||
      (emp.id || '').toLowerCase().includes(term) ||
      (emp.position || '').toLowerCase().includes(term) ||
      (emp.email || '').toLowerCase().includes(term)
    );
  }

  // ===== CRUD UI helpers =====
  confirmDelete(index: number) {
    this.deleteIndex = index;
    this.showDeleteConfirm = true;
  }

  async deleteEmployee(index: number) {
    this.isLoading = true;
    try {
      const id = this.employees[index]?.id!;
      await firstValueFrom(this.http.delete(`${this.apiBase}/employees/${id}`));
      this.employees.splice(index, 1);
      this.toastMessage = 'ลบข้อมูลพนักงานเรียบร้อยแล้ว';
    } catch (err) {
      console.error(err);
      this.toastMessage = 'ลบไม่สำเร็จ';
    } finally {
      this.isLoading = false;
      this.showDeleteConfirm = false;
      this.deleteIndex = null;
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
  }

  openEditPopupFor(index: number) {
    this.currentIndex = index;
    this.editingMode = true;
    this.form = { ...this.employees[index] };
    this.selectedFile = null;
    this.imagePreview = this.form.imageUrl ?? null;
    this.showPopup = true;
  }

  openEditPopup() {
    if (!this.employees.length) return;
    this.editingMode = true;
    this.form = { ...this.employees[this.currentIndex] };
    this.showPopup = true;
  }

  openAddPopup() {
    this.editingMode = false;
    this.form = {};
    this.selectedFile = null;
    this.imagePreview = null;
    this.showPopup = true;
  }

  closePopup() { this.showPopup = false; }

  nextEmployee() {
    if (this.currentIndex < this.employees.length - 1) this.currentIndex++;
  }

  async submitForm() {
    this.isLoading = true;
    try {
      if (this.editingMode) {
        const id = this.form.id!;
        await firstValueFrom(
          this.http.put<ApiEmployee>(`${this.apiBase}/employees/${id}`, this.toApi(this.form))
        );
        if (this.selectedFile) await this.uploadPhoto(id, this.selectedFile);
        await this.loadEmployees();
        this.toastMessage = 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว';
      } else {
        const created = await firstValueFrom(
          this.http.post<ApiEmployee>(`${this.apiBase}/employees`, this.toApi(this.form))
        );
        if (this.selectedFile) await this.uploadPhoto(created.id, this.selectedFile);
        await this.loadEmployees();
        this.toastMessage = 'เพิ่มพนักงานใหม่เรียบร้อยแล้ว';
      }
      this.closePopup();
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    } catch (err) {
      console.error(err);
      this.toastMessage = 'อัปโหลดหรือบันทึกไม่สำเร็จ';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    } finally {
      this.isLoading = false;
    }
  }

  // ===== upload image =====
  private async uploadPhoto(empId: string, file: File) {
    const fd = new FormData();
    fd.append('image', file);
    await firstValueFrom(this.http.post(`${this.apiBase}/employees/${empId}/photo`, fd));
  }

  exportToExcel() { console.log('Exporting employee data to Excel...'); }

  showDetail(emp: Employee) {
    this.selectedEmployee = emp;
    this.showDetailPopup = true;
  }

  editSelectedEmployee() {
    const index = this.employees.findIndex(emp => emp === this.selectedEmployee);
    if (index !== -1) {
      this.openEditPopupFor(index);
      this.closeDetailPopup();
    }
  }

  closeDetailPopup() { this.showDetailPopup = false; }

  trackByIndex(i: number) { return i; }

  // ===== file input =====
  maxImageSize = 5 * 1024 * 1024;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private apiBase = '/api';

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastMessage = 'กรุณาเลือกไฟล์รูปภาพเท่านั้น';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 2500);
      return;
    }

    if (file.size > this.maxImageSize) {
      this.toastMessage = 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 2500);
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => { this.imagePreview = reader.result as string; };
    reader.readAsDataURL(file);
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  // ===== map API <-> UI =====
  private toUi(e: ApiEmployee): Employee {
    const [firstName, ...rest] = (e.name || '').trim().split(' ');
    const lastName = rest.join(' ');
    return {
      id: e.id,
      firstName,
      lastName,
      position: e.position,
      phone: e.phone,
      email: e.email ?? '',
      imageUrl: e.profileImagePath ?? undefined,
    };
  }

  private toApi(form: Partial<Employee>): Partial<ApiEmployee> {
    return {
      name: [form.firstName, form.lastName].filter(Boolean).join(' ').trim(),
      position: form.position ?? '',
      phone: form.phone ?? '',
      email: form.email ?? ''
    };
  }

  // ===== data load =====
  async loadEmployees() {
    try {
      const apiList = await firstValueFrom(
        this.http.get<ApiEmployee[]>(`${this.apiBase}/employees`)
      );

      const date = this.formatYMD();
      const statusList = await firstValueFrom(
        this.http.get<ApiDayStatus[]>(
          `${this.apiBase}/employee-day-status`,
          { params: { date } }
        )
      );

      const statusMap: Record<string, DayStatus> = {};
      for (const r of statusList) statusMap[r.employee_id] = r.status;

      this.employees = apiList.map(e => {
        const ui = this.toUi(e);
        ui.status = statusMap[e.id] ?? 'NOT_CHECKED_IN';
        return ui;
      });
    } catch (err) {
      console.error(err);
      this.toastMessage = 'โหลดรายชื่อพนักงานไม่สำเร็จ';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
  }

  private formatYMD(d = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  private formatHM(d = new Date()): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private joinLocalDateTime(dYmd: string, hm: string) {
    const [h, m] = hm.split(':');
    return `${dYmd}T${h.padStart(2,'0')}:${m.padStart(2,'0')}:00`;
  }

  async refreshDayStatuses() {
    try {
      if (!this.employees.length) return;
      const date = this.formatYMD();
      const statusList = await firstValueFrom(
        this.http.get<ApiDayStatus[]>(
          `${this.apiBase}/employee-day-status`,
          { params: { date } }
        )
      );

      const statusMap: Record<string, DayStatus> = {};
      for (const r of statusList) statusMap[r.employee_id] = r.status;

      this.employees = this.employees.map(e => ({
        ...e,
        status: statusMap[e.id!] ?? 'NOT_CHECKED_IN'
      }));
    } catch (err) {
      console.error('[refreshDayStatuses]', err);
    }
  }

  statusDotClass(s?: DayStatus) {
    switch (s) {
      case 'WORKING':        return 'bg-emerald-500 dark:bg-emerald-400';
      case 'ON_LEAVE':       return 'bg-amber-500  dark:bg-amber-400';
      case 'OFF_DUTY':       return 'bg-rose-500   dark:bg-rose-400';
      case 'NOT_CHECKED_IN': return 'bg-sky-400    dark:bg-sky-300';
      case 'ABSENT':         return 'bg-slate-400  dark:bg-slate-500';
      default:               return 'bg-slate-400  dark:bg-slate-500';
    }
  }

  statusLabel(s?: DayStatus) {
    switch (s) {
      case 'WORKING':        return 'กำลังทำงาน';
      case 'ON_LEAVE':       return 'ลาพัก';
      case 'OFF_DUTY':       return 'นอกเวลางาน';
      case 'NOT_CHECKED_IN': return 'ยังไม่เช็คอิน';
      case 'ABSENT':         return 'ขาดงาน';
      default:               return 'ไม่ทราบสถานะ';
    }
  }

  // ===== Modal เข้างาน/ออกงาน/ลา =====
  showAtt = false;
  att: any = {
    mode: 'IN',               // 'IN' | 'OUT' | 'LEAVE' | 'ABSENT'
    employeeId: null,
    date: this.formatYMD(),
    time: this.formatHM(),
    arrival: 'ON_TIME',       // เฉพาะ IN
    // leave only:
    leave_type: 'PERSONAL',
    reason: '',
    approved_by: null
  };

  openAttModal(emp?: Employee) {
    this.att = {
      mode: 'IN',
      employeeId: emp?.id ?? null,
      date: this.formatYMD(),
      time: this.formatHM(),
      arrival: 'ON_TIME',
      leave_type: 'PERSONAL',
      reason: '',
      approved_by: null
    };
    this.showAtt = true;
  }

  closeAttModal() { this.showAtt = false; }

  // ===== submit modal =====
  async submitAtt() {
    this.isLoading = true;
    try {
      if (!this.att.employeeId) {
        this.toastMessage = 'กรุณาเลือกพนักงาน';
        this.showToast = true; setTimeout(()=>this.showToast=false, 2500);
        return;
      }

      if (this.att.mode === 'IN') {
        const payload = {
          employeeId: this.att.employeeId,
          workDate: this.att.date,
          checkIn: this.joinLocalDateTime(this.att.date, this.att.time),
          status: this.att.arrival // 'ON_TIME' | 'LATE'
        };
        await firstValueFrom(this.http.post(`${this.apiBase}/attendance`, payload));
        this.toastMessage = 'บันทึก Check-in เรียบร้อย';
      }

      if (this.att.mode === 'OUT') {
        const payload = {
          employeeId: this.att.employeeId,
          workDate: this.att.date,
          checkOut: this.joinLocalDateTime(this.att.date, this.att.time)
        };
        await firstValueFrom(this.http.post(`${this.apiBase}/attendance/check-out`, payload));
        this.toastMessage = 'บันทึก Check-out เรียบร้อย';
      }

      if (this.att.mode === 'LEAVE') {
        const payload = {
          employee_id: this.att.employeeId,
          leave_date: this.att.date,
          leave_type: this.att.leave_type,
          reason: this.att.reason || null,
          approved_by: Number(this.att.approved_by || 0)
        };
        await firstValueFrom(this.http.post(`${this.apiBase}/leaves`, payload));
        this.toastMessage = 'บันทึกลางานเรียบร้อย';
      }

      if (this.att.mode === 'ABSENT') {
        // ✅ ส่ง source: 'MANUAL' ไปด้วย ตาม API ใหม่
        const payload = {
          employeeId: this.att.employeeId,
          date: this.att.date,
          status: 'ABSENT',
          source: 'MANUAL'
        };
        await firstValueFrom(this.http.post(`${this.apiBase}/employee-day-status/upsert`, payload));
        this.toastMessage = 'บันทึกขาดงานเรียบร้อย';
      }

      await this.refreshDayStatuses();
      this.showToast = true;
      this.closeAttModal();
      setTimeout(() => (this.showToast = false), 3000);
    } catch (err: any) {
      console.error(err);
      if (err?.status === 409) {
        this.toastMessage = 'วันนี้บันทึกซ้ำ: อาจเช็คอินไปแล้ว';
      } else if (err?.status === 404 && this.att.mode === 'OUT') {
        this.toastMessage = 'ยังไม่มี Check-in ของวันนี้';
      } else {
        this.toastMessage = 'บันทึกไม่สำเร็จ';
      }
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    } finally {
      this.isLoading = false;
    }
  }
}
