-- This is an empty migration.
/* 0) เผื่อของเดิมยัง NOT NULL ให้แก้เป็น NULL ได้ */
ALTER TABLE Attendance
  MODIFY COLUMN check_out DATETIME NULL;

/* 1) ตารางสถานะรายวัน (ถ้ายังไม่มี) */
CREATE TABLE IF NOT EXISTS EmployeeDayStatus (
  employee_id VARCHAR(191) NOT NULL,
  work_date   DATE NOT NULL,
  status      ENUM('NOT_CHECKED_IN','WORKING','OFF_DUTY','ON_LEAVE') NOT NULL,
  source      ENUM('SYSTEM','ATTENDANCE','LEAVE','MANUAL') NOT NULL DEFAULT 'SYSTEM',
  set_by      INT NULL,
  note        VARCHAR(255) NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id, work_date),
  CONSTRAINT fk_eds_emp   FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_eds_staff FOREIGN KEY (set_by)      REFERENCES Staff(staff_id)      ON DELETE SET NULL
);

/* 2) ตารางคำขอลางาน (วันเดียว) (ถ้ายังไม่มี) */
CREATE TABLE IF NOT EXISTS LeaveRequest (
  leave_id     INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  VARCHAR(191) NOT NULL,
  leave_date   DATE NOT NULL,
  leave_type   ENUM('SICK','PERSONAL','VACATION','OTHER') NOT NULL,
  reason       TEXT,
  approved_by  INT NOT NULL,
  approved_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_emp_date (employee_id, leave_date),
  CONSTRAINT fk_lr_emp   FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_lr_staff FOREIGN KEY (approved_by) REFERENCES Staff(staff_id)      ON DELETE RESTRICT,
  INDEX idx_leave_emp (employee_id, leave_date)
);



/* 4) Trigger: เช็คอิน -> WORKING */
DROP TRIGGER IF EXISTS trg_attendance_after_insert;
CREATE TRIGGER trg_attendance_after_insert
AFTER INSERT ON Attendance
FOR EACH ROW
  INSERT INTO EmployeeDayStatus (employee_id, work_date, status, source, set_by, note)
  VALUES (NEW.employee_id, DATE(NEW.check_in), 'WORKING', 'ATTENDANCE', NULL, NULL)
  ON DUPLICATE KEY UPDATE
    status = 'WORKING',
    source = 'ATTENDANCE',
    set_by = NULL,
    note   = NULL,
    updated_at = CURRENT_TIMESTAMP;

/* 5) Trigger: เช็คเอาต์ -> OFF_DUTY */
DROP TRIGGER IF EXISTS trg_attendance_after_update;
CREATE TRIGGER trg_attendance_after_update
AFTER UPDATE ON Attendance
FOR EACH ROW
  INSERT INTO EmployeeDayStatus (employee_id, work_date, status, source, set_by, note)
  SELECT NEW.employee_id, DATE(NEW.check_in), 'OFF_DUTY', 'ATTENDANCE', NULL, NULL
  FROM DUAL
  WHERE NEW.check_out IS NOT NULL
  ON DUPLICATE KEY UPDATE
    status = 'OFF_DUTY',
    source = 'ATTENDANCE',
    set_by = NULL,
    note   = NULL,
    updated_at = CURRENT_TIMESTAMP;

/* 6) Trigger: บันทึกลางาน -> ON_LEAVE */
DROP TRIGGER IF EXISTS trg_leave_after_insert;
CREATE TRIGGER trg_leave_after_insert
AFTER INSERT ON LeaveRequest
FOR EACH ROW
  INSERT INTO EmployeeDayStatus (employee_id, work_date, status, source, set_by, note)
  VALUES (NEW.employee_id, NEW.leave_date, 'ON_LEAVE', 'LEAVE', NEW.approved_by, NEW.leave_type)
  ON DUPLICATE KEY UPDATE
    status = 'ON_LEAVE',
    source = 'LEAVE',
    set_by = NEW.approved_by,
    note   = NEW.leave_type,
    updated_at = CURRENT_TIMESTAMP;

/* 7) Trigger: ลบใบลา -> คืนเป็น NOT_CHECKED_IN (ถ้าไม่ได้เข้างานและไม่มีใบลาซ้ำวันนั้น) */
DROP TRIGGER IF EXISTS trg_leave_after_delete;
CREATE TRIGGER trg_leave_after_delete
AFTER DELETE ON LeaveRequest
FOR EACH ROW
  INSERT INTO EmployeeDayStatus (employee_id, work_date, status, source, set_by, note)
  SELECT OLD.employee_id, OLD.leave_date, 'NOT_CHECKED_IN', 'MANUAL', NULL, NULL
  FROM DUAL
  WHERE NOT EXISTS (
          SELECT 1 FROM Attendance a
          WHERE a.employee_id = OLD.employee_id
            AND DATE(a.check_in) = OLD.leave_date
        )
    AND NOT EXISTS (
          SELECT 1 FROM LeaveRequest lr
          WHERE lr.employee_id = OLD.employee_id
            AND lr.leave_date = OLD.leave_date
        )
  ON DUPLICATE KEY UPDATE
    status = 'NOT_CHECKED_IN',
    source = 'MANUAL',
    set_by = NULL,
    note   = NULL,
    updated_at = CURRENT_TIMESTAMP;
