// backend/controllers/employeeDayStatusController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/** YYYY-MM-DD ตามเวลาเครื่องเซิร์ฟเวอร์ */
function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** สร้างช่วงวัน UTC [start, end) สำหรับคิวรีคอลัมน์ DATE */
function dayRangeUTC(ymd) {
  const start = new Date(`${ymd}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** เก็บลง DB เป็น UTC 00:00 (สอดคล้อง @db.Date) */
function normalizeWorkDate(ymd) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

const ALLOWED = ['NOT_CHECKED_IN', 'WORKING', 'OFF_DUTY', 'ON_LEAVE'];

/** GET /api/employee-day-status?date=YYYY-MM-DD
 *  -> [{ employee_id, status }]
 */
export async function listByDate(req, res) {
  try {
    const ymd = req.query.date || todayYmd();
    const { start, end } = dayRangeUTC(ymd);

    const rows = await prisma.employeeDayStatus.findMany({
      where: { work_date: { gte: start, lt: end } },
      select: { employee_id: true, status: true }, // เหลือเท่าที่มีจริง
    });

    return res.json(rows);
  } catch (err) {
    console.error('[listByDate]', err);
    return res.status(500).json({ error: 'Failed to fetch day statuses' });
  }
}

/** GET /api/employee-day-status/:employeeId?date=YYYY-MM-DD
 *  -> { employee_id, work_date, status } | 404
 */
export async function getOne(req, res) {
  try {
    const employeeId = req.params.employeeId;
    const ymd = req.query.date || todayYmd();
    const workDate = normalizeWorkDate(ymd);

    const row = await prisma.employeeDayStatus.findUnique({
      where: {
        employee_id_work_date: {
          employee_id: employeeId,
          work_date: workDate,
        },
      },
      select: { employee_id: true, work_date: true, status: true },
    });

    if (!row) return res.status(404).json({ message: 'Not found' });
    return res.json(row);
  } catch (err) {
    console.error('[getOne]', err);
    return res.status(500).json({ error: 'Failed to fetch day status' });
  }
}

/** POST /api/employee-day-status/upsert
 *  body: { employeeId, date(YYYY-MM-DD), status }
 */
export async function upsert(req, res) {
  try {
    const { employeeId, date, status } = req.body;

    if (!employeeId || !status) {
      return res.status(400).json({ error: 'employeeId and status are required' });
    }
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${ALLOWED.join(', ')}` });
    }

    const ymd = date || todayYmd();
    const workDate = normalizeWorkDate(ymd);

    const row = await prisma.employeeDayStatus.upsert({
      where: {
        employee_id_work_date: {
          employee_id: employeeId,
          work_date: workDate,
        },
      },
      update: { status },              // ไม่ต้องอัปเดต updated_at เอง ถ้าใช้ @updatedAt
      create: { employee_id: employeeId, work_date: workDate, status },
      select: { employee_id: true, work_date: true, status: true, updated_at: true },
    });

    return res.json(row);
  } catch (err) {
    console.error('[upsert]', err);
    return res.status(500).json({ error: 'Upsert day status failed' });
  }
}
