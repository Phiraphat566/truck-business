import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { interval, Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';


//  type สำหรับ API 
type ApiEmployee = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email?: string;
  profileImagePath?: string | null;
};

type ApiDayStatus = {
  employee_id: string;
  status: DayStatus; // 'NOT_CHECKED_IN' | 'WORKING' | 'OFF_DUTY' | 'ON_LEAVE'
};

type DayStatus = 'NOT_CHECKED_IN' | 'WORKING' | 'OFF_DUTY' | 'ON_LEAVE';


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

  ngOnInit() {
    this.applyTheme();
    this.loadEmployees();
    this.pollSub = interval(10_000).subscribe(() => this.refreshDayStatuses());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }


  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement; // <html>
    root.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  searchTerm = '';

  showPopup = false;
  editingMode = false;
  form: Partial<Employee> = {};
  showDetailPopup = false;
  selectedEmployee: Employee | null = null;

  currentIndex = 0;

  // 1) ลบ mock ออก และเริ่มเป็นอาร์เรย์ว่าง
  employees: Employee[] = [];

  // 2) ป้องกันตอนยังไม่มีรายการ
  get currentEmployee(): Employee | null {
    return this.employees[this.currentIndex] ?? null;
  }

  // การ์ดสรุป
  get totalEmployees(): number { return this.employees.length; }
  
  get workingCount(): number {
  return this.employees.filter(e => e.status === 'WORKING').length;
}
  get leaveCount(): number { return this.employees.filter(e => e.status === 'ON_LEAVE').length; }

  // รายการที่แสดง
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
  // ถ้ามีรูปเดิม ให้แสดงพรีวิวจาก URL เดิม
  this.imagePreview = this.form.imageUrl ?? null;
  this.showPopup = true;
 }

  nextEmployee() {
    if (this.currentIndex < this.employees.length - 1) this.currentIndex++;
  }

  // 3) กันเปิด edit ตอนยังไม่มีรายการ
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

 async submitForm() {
  this.isLoading = true;
  try {
    if (this.editingMode) {
      // UPDATE
      const id = this.form.id!;
      await firstValueFrom(
        this.http.put<ApiEmployee>(`${this.apiBase}/employees/${id}`, this.toApi(this.form))
      );

      if (this.selectedFile) {
        await this.uploadPhoto(id, this.selectedFile);
      }

      await this.loadEmployees();
      this.toastMessage = 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว';
    } else {
      // CREATE
      const created = await firstValueFrom(
        this.http.post<ApiEmployee>(`${this.apiBase}/employees`, this.toApi(this.form))
      );

      if (this.selectedFile) {
        await this.uploadPhoto(created.id, this.selectedFile);
      }

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


// helper อัปโหลดรูป (field name = "image" ตรงกับ backend)
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

  // ขนาดไฟล์สูงสุด 5MB
 maxImageSize = 5 * 1024 * 1024;
 selectedFile: File | null = null;
 imagePreview: string | null = null;

 // ชี้ฐาน URL ของ API ของคุณ (ปรับตามจริง)
 private apiBase = '/api';

 constructor(private http: HttpClient) {}

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

  // พรีวิว
  const reader = new FileReader();
  reader.onload = () => { this.imagePreview = reader.result as string; };
  reader.readAsDataURL(file);
 }

 clearSelectedFile() {
  this.selectedFile = null;
  this.imagePreview = null;

  
}

// ===== helper แปลง API -> UI =====
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
    // status: e.status as any // (ถ้า backend มีค่า status)
  };
}

// ===== helper แปลง UI -> API =====
private toApi(form: Partial<Employee>): Partial<ApiEmployee> {
  return {
    name: [form.firstName, form.lastName].filter(Boolean).join(' ').trim(),
    position: form.position ?? '',
    phone: form.phone ?? '',
    email: form.email ?? ''
  };
}


async loadEmployees() {
  try {
    // 1) ดึงรายชื่อพนักงาน
    const apiList = await firstValueFrom(
      this.http.get<ApiEmployee[]>(`${this.apiBase}/employees`)
    );

    // 2) ดึงสถานะของวันนี้ทั้งหมด แล้วทำเป็น map { employee_id: status }
    const date = this.formatYMD();
    const statusList = await firstValueFrom(
      this.http.get<ApiDayStatus[]>(
        `${this.apiBase}/employee-day-status`,
        { params: { date } }
      )
    );
    const statusMap: Record<string, DayStatus> = {};
    for (const r of statusList) statusMap[r.employee_id] = r.status;

    // 3) รวมเข้ากับ UI model (ถ้าไม่มีสถานะ ให้ default เป็น NOT_CHECKED_IN หรือ OFF_DUTY ก็ได้)
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

async refreshDayStatuses() {
  try {
    if (!this.employees.length) return; // ยังไม่มีรายชื่อ ไม่ต้องโหลดสถานะ

    const date = this.formatYMD();
    const statusList = await firstValueFrom(
      this.http.get<ApiDayStatus[]>(
        `${this.apiBase}/employee-day-status`,
        { params: { date } }
      )
    );

    const statusMap: Record<string, DayStatus> = {};
    for (const r of statusList) statusMap[r.employee_id] = r.status;

    // อัปเดตเฉพาะ status ของแต่ละคน
    this.employees = this.employees.map(e => ({
      ...e,
      status: statusMap[e.id!] ?? 'NOT_CHECKED_IN'
    }));
  } catch (err) {
    console.error('[refreshDayStatuses]', err);
    // ปกติไม่ต้องโชว์ toast ทุก 10 วินาที เดี๋ยวรก UI
  }
}



statusDotClass(s?: DayStatus) {
  switch (s) {
    case 'WORKING':        return 'bg-emerald-400';
    case 'ON_LEAVE':       return 'bg-amber-400';
    case 'OFF_DUTY':       return 'bg-rose-400';
    case 'NOT_CHECKED_IN': return 'bg-gray-400';
    default:               return 'bg-gray-400';
  }
}

statusLabel(s?: DayStatus) {
  switch (s) {
    case 'WORKING':        return 'กำลังทำงาน';
    case 'ON_LEAVE':       return 'ลาพัก';
    case 'OFF_DUTY':       return 'นอกเวลางาน';
    case 'NOT_CHECKED_IN': return 'ยังไม่เช็คอิน';
    default:               return 'ไม่ทราบสถานะ';
  }
}



}
