// backend/controllers/leaveRequestController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/* ---------- utils: วันที่ ---------- */
function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function normalizeDate(ymdStr) {
  return new Date(`${ymdStr}T00:00:00.000Z`);
}
function dayRangeUTC(ymdStr) {
  const start = normalizeDate(ymdStr);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/* ---------- helpers: คำนวณสถานะรายวันหลังเปลี่ยนใบลา ---------- */
/** คำนวณสถานะของวันนั้นจากแหล่งข้อมูลอื่น ๆ */
async function recomputeDayStatus(employeeId, workDate) {
  const day = ymd(workDate);
  const { start, end } = dayRangeUTC(day);

  // 1) ถ้ามี leave -> ON_LEAVE
  const leave = await prisma.leaveRequest.findFirst({
    where: { employee_id: employeeId, leave_date: { gte: start, lt: end } },
    select: { leave_id: true }
  });
  if (leave) return 'ON_LEAVE';

  // 2) ถ้ามี attendance
  const att = await prisma.attendance.findFirst({
    where: { employee_id: employeeId, check_in: { gte: start, lt: end } },
    orderBy: { check_in: 'desc' }
  });
  if (att) {
    return att.check_out ? 'OFF_DUTY' : 'WORKING';
  }

  // 3) ไม่พบอะไรเลย
  return 'NOT_CHECKED_IN';
}

/** upsert EmployeeDayStatus ให้เป็นค่าที่คำนวณได้ */
async function reUpsertDayStatus(employeeId, workDate) {
  const status = await recomputeDayStatus(employeeId, workDate);
  const wd = normalizeDate(ymd(workDate));
  await prisma.employeeDayStatus.upsert({
    where: { employee_id_work_date: { employee_id: employeeId, work_date: wd } },
    create: { employee_id: employeeId, work_date: wd, status },
    update: { status }
  });
}

/* ------------------------ LIST / READ ------------------------ */

// GET /api/leaves?employeeId=&year=&month=
export const getLeaves = async (req, res) => {
  try {
    const { employeeId, year, month } = req.query;

    const where = {};
    if (employeeId) where.employee_id = String(employeeId);

    if (year && month) {
      const start = normalizeDate(`${year}-${String(month).padStart(2, '0')}-01`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      where.leave_date = { gte: start, lt: end };
    }

    const data = await prisma.leaveRequest.findMany({
      where,
      orderBy: [{ leave_date: 'desc' }],
      include: { Employee: true, Staff: true }
    });
    res.json(data);
  } catch (err) {
    console.error('[getLeaves]', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

// GET /api/leaves/:id
export const getLeaveById = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { leave_id: id },
      include: { Employee: true, Staff: true }
    });
    if (!leave) return res.status(404).json({ error: 'Leave not found' });
    res.json(leave);
  } catch (err) {
    console.error('[getLeaveById]', err);
    res.status(500).json({ error: 'Failed to fetch leave' });
  }
};

/* ------------------------ CREATE ------------------------ */

// POST /api/leaves
// body: { employee_id, leave_date(YYYY-MM-DD), leave_type, reason?, approved_by }
export const createLeave = async (req, res) => {
  try {
    const { employee_id, leave_date, leave_type, reason, approved_by } = req.body;
    if (!employee_id || !leave_date || !leave_type || !approved_by) {
      return res.status(400).json({ error: 'employee_id, leave_date, leave_type, approved_by are required' });
    }

    const wd = normalizeDate(leave_date);

    const leave = await prisma.leaveRequest.create({
      data: { employee_id, leave_date: wd, leave_type, reason, approved_by }
    });

    // mark รายวันเป็น ON_LEAVE
    await prisma.employeeDayStatus.upsert({
      where: { employee_id_work_date: { employee_id, work_date: wd } },
      create: { employee_id, work_date: wd, status: 'ON_LEAVE' },
      update: { status: 'ON_LEAVE' }
    });

    res.status(201).json(leave);
  } catch (err) {
    // unique(employee_id, leave_date) -> P2002
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Leave for this date already exists' });
    }
    console.error('[createLeave]', err);
    res.status(500).json({ error: 'Failed to create leave' });
  }
};

/* ------------------------ UPDATE ------------------------ */

// PUT /api/leaves/:id
// body: { employee_id?, leave_date?, leave_type?, reason?, approved_by? }
export const updateLeave = async (req, res) => {
  const id = Number(req.params.id);
  try {
    // เก็บค่าก่อนแก้ เพื่อรู้ว่าวันเก่าคือวันไหน
    const before = await prisma.leaveRequest.findUnique({ where: { leave_id: id } });
    if (!before) return res.status(404).json({ error: 'Leave not found' });

    const { employee_id, leave_date, leave_type, reason, approved_by } = req.body;

    const updated = await prisma.leaveRequest.update({
      where: { leave_id: id },
      data: {
        ...(employee_id ? { employee_id } : {}),
        ...(leave_date ? { leave_date: normalizeDate(leave_date) } : {}),
        ...(leave_type ? { leave_type } : {}),
        ...(reason !== undefined ? { reason } : {}),
        ...(approved_by ? { approved_by } : {})
      }
    });

    // อัปเดต EmployeeDayStatus ทั้ง "วันเก่า" และ "วันใหม่" (ถ้าขยับวัน/พนักงาน)
    await reUpsertDayStatus(before.employee_id, before.leave_date);
    await reUpsertDayStatus(updated.employee_id, updated.leave_date);

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Leave for this date already exists' });
    }
    console.error('[updateLeave]', err);
    res.status(500).json({ error: 'Failed to update leave' });
  }
};

/* ------------------------ DELETE ------------------------ */

// DELETE /api/leaves/:id
export const deleteLeave = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const removed = await prisma.leaveRequest.delete({ where: { leave_id: id } });

    // คำนวณสถานะรายวันใหม่ (อาจกลับไป OFF_DUTY / WORKING / NOT_CHECKED_IN)
    await reUpsertDayStatus(removed.employee_id, removed.leave_date);

    res.json({ message: `Leave ${id} deleted` });
  } catch (err) {
    console.error('[deleteLeave]', err);
    res.status(500).json({ error: 'Failed to delete leave' });
  }
};
