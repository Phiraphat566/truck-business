
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
  toastMessage = '';
  searchTerm: string = '';
  selectedFilter: string = 'ทั้งหมด';
  isLoading: boolean = false;
  confirmDelete(index: number) {
    this.deleteIndex = index;
    this.showDeleteConfirm = true;
  }

  deleteEmployee(index: number) {
    this.isLoading = true;
    
    // Simulate API call with loading
    setTimeout(() => {
      this.employees.splice(index, 1);
      this.showDeleteConfirm = false;
      this.deleteIndex = null;
      this.isLoading = false;
      this.toastMessage = 'ลบข้อมูลพนักงานเรียบร้อยแล้ว';
      this.showToast = true;
      
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
      
      if (this.currentIndex >= this.employees.length) {
        this.currentIndex = Math.max(0, this.employees.length - 1);
      }
    }, 500);
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
      position: 'คนขับรถสิบล้อ',
      imageUrl: 'assets/tinky.png'
    },
    {
      id: 'ED003',
      firstName: 'ม่วง',
      lastName: 'เมี๊ยว',
      position: 'คนขับรถสิบล้อ',
      imageUrl: 'assets/lala.png'
    },
    {
      id: 'ED004',
      firstName: 'เฉ',
      lastName: 'โป',
      position: 'คนขับรถสิบล้อ',
      imageUrl: 'assets/po.png'
    },
    {
      id: 'ED005',
      firstName: 'โชคชัย',
      lastName: 'มีวัว',
      position: 'คนขับรถสิบล้อ',
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
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      if (this.editingMode) {
        this.employees[this.currentIndex] = { ...this.form };
        this.toastMessage = 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว';
      } else {
        this.employees.push({ ...this.form });
        this.currentIndex = this.employees.length - 1;
        this.toastMessage = 'เพิ่มพนักงานใหม่เรียบร้อยแล้ว';
      }
      
      this.isLoading = false;
      this.closePopup();
      
      // Show success feedback
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    }, 800);
  }

  // Filter employees based on search term and filter
  get filteredEmployees() {
    let filtered = this.employees;
    
    // Apply position filter
    if (this.selectedFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(emp => 
        emp.position?.toLowerCase().includes(this.selectedFilter.toLowerCase())
      );
    }
    
    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.id?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }

  // Export to Excel functionality
  exportToExcel() {
    // This would typically integrate with a library like xlsx
    console.log('Exporting employee data to Excel...');
    // Implementation would go here
  }

  showDetail(emp: any) {
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

  closeDetailPopup() {
    this.showDetailPopup = false;
  }
}