import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Staff } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  isDark = true;

  // เอามาใช้ในเทมเพลต
  user$: Observable<Staff | null> = this.auth.currentUser$;

  // ป้องกันไม่ให้ <img> render ซ้ำหลังโหลดพัง
  avatarFallback = false;

  constructor(public router: Router, public auth: AuthService) {}

  ngOnInit() {
    const saved = localStorage.getItem('theme');
    this.isDark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', this.isDark);

    // รีเฟรชแล้วยังมี token → ดึงโปรไฟล์เข้าหน่วยความจำ
    if (this.auth.isLoggedIn()) {
      this.auth.fetchMe().catch(() => {});
    }

    // ถ้ามี/ไม่มีรูป เปลี่ยนสถานะ fallback ให้ตรง
    this.user$.subscribe(u => {
      this.avatarFallback = !u?.profile_image_path;
    });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  logout() {
    this.auth.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  // เรียกเมื่อรูปโหลดพัง
  useFallback() {
    this.avatarFallback = true;
  }

  // ตัวอักษรแรกของชื่อ/username (พิมพ์ใหญ่)
  initial(u: Staff | null): string {
    const ch = (u?.name?.[0] || u?.username?.[0] || 'U');
    return ch.toUpperCase();
  }
}
