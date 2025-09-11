/* เผื่อของเดิมยัง NOT NULL */
ALTER TABLE `Attendance`
  MODIFY COLUMN `check_out` DATETIME NULL;

/* ลบทริกเกอร์เก่าก่อน */
DROP TRIGGER IF EXISTS trg_attendance_after_insert;
DROP TRIGGER IF EXISTS trg_attendance_after_update;
DROP TRIGGER IF EXISTS trg_leave_after_insert;
DROP TRIGGER IF EXISTS trg_leave_after_delete;

/* 1) เช็คอิน -> WORKING */
CREATE TRIGGER trg_attendance_after_insert
AFTER INSERT ON `Attendance`
FOR EACH ROW
  INSERT INTO `EmployeeDayStatus` (`employee_id`,`work_date`,`status`,`updated_at`)
  VALUES (NEW.`employee_id`, DATE(NEW.`check_in`), 'WORKING', NOW(0))
  ON DUPLICATE KEY UPDATE
    `status` = 'WORKING',
    `updated_at` = NOW(0);

/* 2) มี check_out -> OFF_DUTY */
CREATE TRIGGER trg_attendance_after_update
AFTER UPDATE ON `Attendance`
FOR EACH ROW
  INSERT INTO `EmployeeDayStatus` (`employee_id`,`work_date`,`status`,`updated_at`)
  SELECT NEW.`employee_id`, DATE(NEW.`check_in`), 'OFF_DUTY', NOW(0)
  FROM DUAL
  WHERE NEW.`check_out` IS NOT NULL
  ON DUPLICATE KEY UPDATE
    `status` = 'OFF_DUTY',
    `updated_at` = NOW(0);

/* 3) บันทึกลางาน -> ON_LEAVE */
CREATE TRIGGER trg_leave_after_insert
AFTER INSERT ON `LeaveRequest`
FOR EACH ROW
  INSERT INTO `EmployeeDayStatus` (`employee_id`,`work_date`,`status`,`updated_at`)
  VALUES (NEW.`employee_id`, NEW.`leave_date`, 'ON_LEAVE', NOW(0))
  ON DUPLICATE KEY UPDATE
    `status` = 'ON_LEAVE',
    `updated_at` = NOW(0);

/* 4) ลบใบลา -> กลับเป็น NOT_CHECKED_IN (ถ้าไม่มีเช็คอิน/ใบลาใบอื่นในวันเดียวกัน) */
CREATE TRIGGER trg_leave_after_delete
AFTER DELETE ON `LeaveRequest`
FOR EACH ROW
  INSERT INTO `EmployeeDayStatus` (`employee_id`,`work_date`,`status`,`updated_at`)
  SELECT OLD.`employee_id`, OLD.`leave_date`, 'NOT_CHECKED_IN', NOW(0)
  FROM DUAL
  WHERE NOT EXISTS (
          SELECT 1 FROM `Attendance` a
           WHERE a.`employee_id` = OLD.`employee_id`
             AND DATE(a.`check_in`) = OLD.`leave_date`
        )
    AND NOT EXISTS (
          SELECT 1 FROM `LeaveRequest` lr
           WHERE lr.`employee_id` = OLD.`employee_id`
             AND lr.`leave_date` = OLD.`leave_date`
        )
  ON DUPLICATE KEY UPDATE
    `status` = 'NOT_CHECKED_IN',
    `updated_at` = NOW(0);
