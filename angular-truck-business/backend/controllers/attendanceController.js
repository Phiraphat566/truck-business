// backend/controllers/attendanceController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/** YYYY-MM-DD (ตามเวลาเครื่องเซิร์ฟเวอร์) */
function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
/** เก็บ/คิวรี DATE ให้เป็น UTC 00:00 */
function normalizeDate(ymdStr) {
  return new Date(`${ymdStr}T00:00:00.000Z`);
}
/** ช่วงวัน UTC [start, end) */
function dayRangeUTC(ymdStr) {
  const start = normalizeDate(ymdStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** [start,end) ของทั้งเดือน แบบ UTC-safe */
function monthRangeUTC(year, month /* 1..12 */) {
  const start = normalizeDate(`${year}-${String(month).padStart(2, '0')}-01`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1); // ทำเป็น [start, end)
  return { start, end };
}

/** ดึง HH:mm จาก Date (ตามเวลาเครื่อง) */
function hhmm(d) {
  return d.toTimeString().slice(0, 5);
}

/** อัปเดต EmployeeDayStatus จาก attendance */
async function upsertDayStatusFromAttendance(employeeId, workDate, hasCheckOut) {
  const wd = normalizeDate(ymd(workDate));
  await prisma.employeeDayStatus.upsert({
    where: { employee_id_work_date: { employee_id: employeeId, work_date: wd } },
    create: { employee_id: employeeId, work_date: wd, status: hasCheckOut ? 'OFF_DUTY' : 'WORKING' },
    update: { status: hasCheckOut ? 'OFF_DUTY' : 'WORKING' },
  });
}

/** gen id เดิม */
async function genAttendanceId() {
  const rows = await prisma.attendance.findMany({ select: { id: true } });
  const max = rows.reduce((m, r) => {
    const mch = /^ATT(\d+)$/.exec(r.id || '');
    return Math.max(m, mch ? parseInt(mch[1], 10) : 0);
  }, 0);
  return `ATT${String(max + 1).padStart(3, '0')}`;
}

/* ------------------------- BASIC CRUD ------------------------- */

// GET /api/attendance
export const getAllAttendance = async (_req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: [{ employee_id: 'asc' }, { work_date: 'desc' }],
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// GET /api/attendance/:id
export const getAttendanceById = async (req, res) => {
  const { id } = req.params;
  try {
    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Attendance not found' });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// POST /api/attendance (manual)
// body: { employeeId, workDate(YYYY-MM-DD), checkIn, checkOut?, status('ON_TIME'|'LATE') }
export const createAttendance = async (req, res) => {
  try {
    const { employeeId, workDate, checkIn, checkOut, status } = req.body;
    if (!employeeId || !workDate || !checkIn || !status) {
      return res.status(400).json({ error: 'employeeId, workDate, checkIn, status are required' });
    }

    const id = await genAttendanceId();
    const work_date = normalizeDate(workDate);
    const check_in = new Date(checkIn);
    const check_out = checkOut ? new Date(checkOut) : null;

    // บังคับ 1 คน / 1 วัน
    const exists = await prisma.attendance.findFirst({
      where: { employee_id: employeeId, work_date },
    });
    if (exists) return res.status(409).json({ error: 'This employee already has attendance for this date' });

    const created = await prisma.attendance.create({
      data: { id, employee_id: employeeId, work_date, check_in, check_out, status },
    });

    await upsertDayStatusFromAttendance(employeeId, work_date, !!check_out);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};

// PUT /api/attendance/:id (manual)
// body: { employeeId?, workDate?, checkIn?, checkOut?, status? }
export const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { employeeId, workDate, checkIn, checkOut, status } = req.body;

  try {
    const before = await prisma.attendance.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'Attendance record not found' });

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        ...(employeeId ? { employee_id: employeeId } : {}),
        ...(workDate ? { work_date: normalizeDate(workDate) } : {}),
        ...(checkIn ? { check_in: new Date(checkIn) } : {}),
        ...(checkOut !== undefined ? { check_out: checkOut ? new Date(checkOut) : null } : {}),
        ...(status ? { status } : {}),
      },
    });

    // อัปเดตสถานะรายวัน (วันเก่า/วันใหม่)
    await upsertDayStatusFromAttendance(before.employee_id, before.work_date, !!updated.check_out);
    if (workDate || employeeId) {
      await upsertDayStatusFromAttendance(updated.employee_id, updated.work_date, !!updated.check_out);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// DELETE /api/attendance/:id
export const deleteAttendance = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await prisma.attendance.delete({ where: { id } });

    // ลบแล้วลองคำนวณสถานะใหม่ของวันนั้น (ถ้าไม่มีเรคคอร์ดวันนั้นเลย -> NOT_CHECKED_IN)
    const { start, end } = dayRangeUTC(ymd(deleted.work_date));
    const stillHas = await prisma.attendance.count({
      where: { employee_id: deleted.employee_id, work_date: { gte: start, lt: end } },
    });
    if (!stillHas) {
      const wd = normalizeDate(ymd(deleted.work_date));
      await prisma.employeeDayStatus.upsert({
        where: { employee_id_work_date: { employee_id: deleted.employee_id, work_date: wd } },
        create: { employee_id: deleted.employee_id, work_date: wd, status: 'NOT_CHECKED_IN' },
        update: { status: 'NOT_CHECKED_IN' },
      });
    }

    res.json({ message: `Attendance ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

/* ------------------- SUMMARY / HISTORY ------------------- */

// GET /api/attendance/years
export async function getYears(_req, res) {
  try {
    const att = await prisma.attendance.findMany({ select: { work_date: true } });
    const eds = await prisma.employeeDayStatus.findMany({ select: { work_date: true } });

    const years = new Set();
    att.forEach(r => r.work_date && years.add(new Date(r.work_date).getFullYear()));
    eds.forEach(r => r.work_date && years.add(new Date(r.work_date).getFullYear()));

    if (years.size === 0) years.add(new Date().getFullYear());

    const result = [...years]
      .sort((a, b) => b - a)
      .map(y => ({ year: y, monthsCount: 12 }));

    res.json(result);
  } catch (err) {
    console.error('[getYears]', err);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
}

// GET /api/attendance/summary?year=YYYY&month=M
export async function getMonthSummary(req, res) {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10); // 1..12
    if (!year || !month) return res.status(400).json({ error: 'year and month are required' });

    const { start, end } = monthRangeUTC(year, month);

    // 1) รายชื่อพนักงาน
    const employees = await prisma.employee.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });

    // 2) ข้อมูลเข้างาน (ใช้ work_date)
    const attendance = await prisma.attendance.findMany({
      where: { work_date: { gte: start, lt: end } },
      select: { employee_id: true, work_date: true, check_in: true, check_out: true, status: true }
    });

    // 3) ใบลา
    const leaves = await prisma.leaveRequest.findMany({
      where: { leave_date: { gte: start, lt: end } },
      select: { employee_id: true, leave_date: true, leave_type: true, reason: true }
    });

    // map ช่วย
    const attMap = new Map(); // key: empId|YYYY-MM-DD -> attendance row
    for (const r of attendance) {
      const k = `${r.employee_id}|${ymd(new Date(r.work_date))}`;
      attMap.set(k, r);
    }

    const leaveMap = new Map(); // key: empId|YYYY-MM-DD -> note
    for (const r of leaves) {
      const k = `${r.employee_id}|${ymd(new Date(r.leave_date))}`;
      leaveMap.set(k, r.reason || r.leave_type || 'ลา');
    }

    // สร้างกริดรายวัน + คิดสถิติ
    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    let ontime = 0, late = 0, absent = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(year, month - 1, d));
      const dateStr = ymd(dateObj);
      const rows = [];

      for (const e of employees) {
        const key = `${e.id}|${dateStr}`;
        const rec = attMap.get(key);
        const lv = leaveMap.get(key);

        if (rec) {
          const inHH = hhmm(new Date(rec.check_in));
          const outHH = rec.check_out ? hhmm(new Date(rec.check_out)) : '-';
          const st = rec.status; // ON_TIME | LATE
          st === 'ON_TIME' ? ontime++ : late++;
          rows.push({
            employee_id: e.id,
            employee_name: e.name,
            check_in: inHH,
            check_out: outHH,
            status: st,
            note: ''
          });
        } else if (lv) {
          absent++;
          rows.push({
            employee_id: e.id,
            employee_name: e.name,
            status: 'ABSENT',
            note: lv
          });
        } else {
          absent++;
          rows.push({
            employee_id: e.id,
            employee_name: e.name,
            status: 'ABSENT',
            note: ''
          });
        }
      }

      days.push({ date: dateStr, rows });
    }

    const total = ontime + late + absent || 1;
    const pct = n => Math.round((n * 100) / total);

    res.json({
      headStats: {
        people: employees.length,
        ontimePct: pct(ontime),
        latePct: pct(late),
        absentPct: pct(absent)
      },
      days
    });
  } catch (err) {
    console.error('[getMonthSummary]', err);
    res.status(500).json({ error: 'Failed to build monthly summary' });
  }
}

// GET /api/attendance/employee-history?empId=EMP001&year=2025&month=1
export async function getEmployeeHistory(req, res) {
  try {
    const empId = String(req.query.empId || '');
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!empId || !year || !month) {
      return res.status(400).json({ error: 'empId, year and month are required' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
      select: { id: true, name: true }
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const { start, end } = monthRangeUTC(year, month);

    const att = await prisma.attendance.findMany({
      where: { employee_id: empId, work_date: { gte: start, lt: end } },
      select: { work_date: true, check_in: true, status: true }
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: { employee_id: empId, leave_date: { gte: start, lt: end } },
      select: { leave_date: true, leave_type: true, reason: true }
    });

    const byDay = new Map();
    for (const r of att) {
      const day = new Date(r.work_date).getUTCDate();
      byDay.set(day, { status: r.status, timeIn: hhmm(new Date(r.check_in)) });
    }

    const leaveDays = new Map();
    for (const l of leaves) {
      const day = new Date(l.leave_date).getUTCDate();
      leaveDays.set(day, { status: 'ON_LEAVE', note: l.reason || l.leave_type });
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (byDay.has(d)) {
        result.push({ day: d, ...byDay.get(d) });
      } else if (leaveDays.has(d)) {
        result.push({ day: d, ...leaveDays.get(d) });
      } else {
        result.push({ day: d, status: 'ABSENT' });
      }
    }

    res.json({ employee, days: result });
  } catch (err) {
    console.error('[getEmployeeHistory]', err);
    res.status(500).json({ error: 'Failed to fetch employee history' });
  }
}
