
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

  
@Component({
  standalone: true,
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
  imports: [RouterModule, FormsModule, CommonModule] // Import RouterModule for routing
})
export class EmployeeComponent {
  showDeleteConfirm = false;
  deleteIndex: number | null = null;
  showToast = false;
  confirmDelete(index: number) {
    this.deleteIndex = index;
    this.showDeleteConfirm = true;
  }

  deleteEmployee(index: number) {
    this.employees.splice(index, 1);
    this.showDeleteConfirm = false;
    this.deleteIndex = null;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 1800);
    if (this.currentIndex >= this.employees.length) {
      this.currentIndex = Math.max(0, this.employees.length - 1);
    }
  }
  // ...existing code...

  openEditPopupFor(index: number) {
    this.currentIndex = index;
    this.editingMode = true;
    this.form = { ...this.employees[index] };
    this.showPopup = true;
  }


  // TODO: Replace this with API fetch later

  employees = [
    {
      id: 'ED001',
      firstName: 'กิตติเดช',
      lastName: 'ใจกล้า',
      company: 'บริษัท สิบล้อ จำกัด',
      email: 'kittidet@smarttruck.co.th',
      phone: '081-239-8745',
      position: 'คนขับรถสิบล้อ',
      salary: 21000,
      imageUrl: 'assets/employee1.jpg'
    },
    {
      id: 'ED002',
      firstName: 'ไกรทอง',
      lastName: 'พยองเดช',
      position: 'คนขับสิบล้อ',
      imageUrl: 'assets/tinky.png'
    },
    {
      id: 'ED003',
      firstName: 'ม่วง',
      lastName: 'เมี๊ยว',
      position: 'คนขับสิบล้อ',
      imageUrl: 'assets/lala.png'
    },
    {
      id: 'ED004',
      firstName: 'เฉ',
      lastName: 'โป',
      position: 'คนขับสิบล้อ',
      imageUrl: 'assets/po.png'
    },
    {
      id: 'ED005',
      firstName: 'โชคชัย',
      lastName: 'มีวัว',
      position: 'คนขับสิบล้อ',
      imageUrl: 'assets/dipsy.png'
    },
    {
      id: 'ED006',
      firstName: 'เอริก',
      lastName: 'สนามจันทร์',
      position: 'คนขับสิบล้อ',
      imageUrl: 'assets/jerry.png'
    },
    {
      id: 'ED007',
      firstName: 'วัชรากร',
      lastName: 'เด่นฟ้า',
      company: 'บริษัท สิบล้อ จำกัด',
      email: 'watch@smart.co.th',
      phone: '089-764-5532',
      position: 'คนขับรถสิบล้อ',
      salary: 21000,
      imageUrl: 'assets/employee2.jpg'
    }
  ];

  currentIndex = 0;
  get currentEmployee() {
    return this.employees[this.currentIndex];
  }


  showPopup = false;
  editingMode = false;
  form: any = {};
  showDetailPopup: boolean = false;
  selectedEmployee: any = null;

  nextEmployee() {
    if (this.currentIndex < this.employees.length - 1) {
      this.currentIndex++;
    }
  }

  openEditPopup() {
    this.editingMode = true;
    this.form = { ...this.employees[this.currentIndex] };
    this.showPopup = true;
  }

  openAddPopup() {
    this.editingMode = false;
    this.form = {};
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  submitForm() {
    if (this.editingMode) {
      this.employees[this.currentIndex] = { ...this.form };
    } else {
      this.employees.push({ ...this.form });
      this.currentIndex = this.employees.length - 1;
    }
    this.closePopup();
  }

  showDetail(emp: any) {
    this.selectedEmployee = emp;
    this.showDetailPopup = true;
  }

  closeDetailPopup() {
    this.showDetailPopup = false;
  }
}