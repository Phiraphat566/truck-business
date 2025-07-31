import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-time-in-out',
  templateUrl: './time-in-out.component.html',
  styleUrls: ['./time-in-out.component.css'],
  imports: [RouterModule] // Import RouterModule for routing
})
export class TimeInOutComponent {
  selectedYear: number = 2025;
  months: string[] = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  addNewYear() {
    this.selectedYear++;
  }

  openMonthDetail(year: number, month: string) {
    // Implement navigation or popup logic here
    console.log('Open detail for', year, month);
  }

  addTimeInOut(year: number, month: string) {
    // Implement add logic here
    console.log('Add time in/out for', year, month);
  }
}
