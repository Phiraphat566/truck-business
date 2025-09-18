import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// ---------- Upload config ----------
const UPLOAD_DIR = 'uploads/contracts';

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR + '/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `income_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// อนุญาตเฉพาะรูป และจำกัด ~5MB
function fileFilter(req, file, cb) {
  const ok = /image\/(png|jpe?g|webp|gif)/i.test(file.mimetype);
  if (!ok) return cb(new Error('Only image files are allowed (png,jpg,jpeg,webp,gif)'));
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ---------- Helpers ----------
const parseAmount = (val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  if (Number.isNaN(num)) return undefined;
  return Number(num.toFixed(2));
};

const parseISODate = (val) => {
  if (!val) return undefined;
  const d = new Date(val);
  if (isNaN(d.getTime())) return undefined;
  return d;
};

const removeFileIfExists = (p) => {
  if (!p) return;
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    console.warn('Remove file failed:', p, e?.message);
  }
};

// ---------- Controllers ----------

// GET /api/income
// query: page=1&pageSize=20&year=2025&month=9&category=...&q=keyword
export const getAllIncomes = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    const { year, month, category, q } = req.query;

    const where = {};
    if (year) {
      const y = Number(year);
      if (month) {
        const m = Number(month); // 1..12
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 1));
        where.income_date = { gte: start, lt: end };
      } else {
        const start = new Date(Date.UTC(y, 0, 1));
        const end = new Date(Date.UTC(y + 1, 0, 1));
        where.income_date = { gte: start, lt: end };
      }
    }
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { description: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.income.findMany({
        where,
        orderBy: [{ income_date: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { invoice: true }, // ดูความสัมพันธ์กับ invoice ถ้ามี
      }),
      prisma.income.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error('getAllIncomes error:', error);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
};

// GET /api/income/:id
export const getIncomeById = async (req, res) => {
  const { id } = req.params;
  try {
    const income = await prisma.income.findUnique({
      where: { id: Number(id) },
      include: { invoice: true },
    });
    if (!income) return res.status(404).json({ error: 'Income not found' });
    res.json(income);
  } catch (error) {
    console.error('getIncomeById error:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
};

// POST /api/income
// multipart/form-data (field ชื่อ 'file')
// body: { income_date, description, category, amount, invoiceId? }
export const createIncome = async (req, res) => {
  const { income_date, description, category, amount, invoiceId } = req.body;
  const contract_image_path = req.file ? `${UPLOAD_DIR}/${req.file.filename}` : null;

  try {
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === undefined) {
      removeFileIfExists(contract_image_path);
      return res.status(400).json({ error: 'amount is required and must be a number' });
    }

    const data = {
      income_date: parseISODate(income_date) ?? new Date(), // ถ้าไม่ส่งมา จะใช้วันนี้
      description: description ?? null,
      category: category ?? null,
      amount: parsedAmount,
      contract_image_path,
    };

    // 1:N -> ไม่ต้องเช็คว่ามี income ของ invoice นี้อยู่แล้ว
    if (invoiceId) {
      const invId = Number(invoiceId);
      if (Number.isNaN(invId)) {
        removeFileIfExists(contract_image_path);
        return res.status(400).json({ error: 'invoiceId must be a number' });
      }
      data.invoice = { connect: { id: invId } }; // ผูกความสัมพันธ์ตรง ๆ
    }

    const newIncome = await prisma.income.create({ data, include: { invoice: true } });
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('createIncome error:', error);
    removeFileIfExists(contract_image_path);
    res.status(500).json({ error: 'Failed to create income' });
  }
};

// PUT /api/income/:id
// รองรับทั้งอัปเดตข้อมูลและเปลี่ยนรูป (ถ้าอัปโหลดใหม่จะลบรูปเก่า)
export const updateIncome = async (req, res) => {
  const { id } = req.params;
  const { income_date, description, category, amount } = req.body;
  const newFilePath = req.file ? `${UPLOAD_DIR}/${req.file.filename}` : null;

  try {
    const current = await prisma.income.findUnique({ where: { id: Number(id) } });
    if (!current) {
      // ถ้าไม่พบ record ให้ลบไฟล์ใหม่ (ถ้ามี) แล้วตอบ 404
      removeFileIfExists(newFilePath);
      return res.status(404).json({ error: 'Income not found' });
    }

    const data = {
      income_date: income_date ? parseISODate(income_date) : undefined,
      description: description ?? undefined,
      category: category ?? undefined,
      amount: parseAmount(amount),
      contract_image_path: newFilePath ?? undefined,
    };

    const updatedIncome = await prisma.income.update({
      where: { id: Number(id) },
      data,
    });

    // ถ้าอัปโหลดไฟล์ใหม่สำเร็จ ให้ลบไฟล์เก่า
    if (newFilePath && current.contract_image_path && current.contract_image_path !== newFilePath) {
      removeFileIfExists(current.contract_image_path);
    }

    res.json(updatedIncome);
  } catch (error) {
    console.error('updateIncome error:', error);
    // ถ้า error และมีไฟล์ใหม่ -> ลบทิ้ง
    removeFileIfExists(newFilePath);
    res.status(500).json({ error: 'Failed to update income' });
  }
};

// DELETE /api/income/:id
// หมายเหตุ: ปกติ “ไม่ควร” ลบไฟล์เอกสาร/สลิปจริง แต่ถ้าต้องการลบไปพร้อม record ก็ทำได้
export const deleteIncome = async (req, res) => {
  const { id } = req.params;
  try {
    const current = await prisma.income.findUnique({ where: { id: Number(id) } });
    if (!current) return res.status(404).json({ error: 'Income not found' });

    await prisma.income.delete({ where: { id: Number(id) } });

    // (เลือกได้) ลบไฟล์แนบออกด้วย
    if (current.contract_image_path) removeFileIfExists(current.contract_image_path);

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('deleteIncome error:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
};

// GET /api/income/year/:year
export const getIncomesByYear = async (req, res) => {
  const { year } = req.params;
  try {
    const y = Number(year);
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y + 1, 0, 1));

    const incomes = await prisma.income.findMany({
      where: { income_date: { gte: start, lt: end } },
      orderBy: { income_date: 'desc' },
      include: { invoice: true },
    });

    res.json(incomes);
  } catch (error) {
    console.error('getIncomesByYear error:', error);
    res.status(500).json({ error: 'Failed to fetch incomes by year' });
  }
};

// GET /api/income/summary/by-month?year=2025
// ส่งออก totals ความยาว 12 ช่อง (index 0 = ม.ค.)
export const getIncomeByMonth = async (req, res) => {
  try {
    const year = Number(req.query.year);
    if (!year) return res.status(400).json({ error: 'year is required' });

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await prisma.income.findMany({
      where: { income_date: { gte: start, lt: end } },
      select: { amount: true, income_date: true },
    });

    const totals = Array(12).fill(0);
    for (const r of rows) {
      const m = new Date(r.income_date).getUTCMonth(); // 0..11
      totals[m] += Number(r.amount);
    }

    res.json({ year, totals });
  } catch (error) {
    console.error('getIncomeByMonth error:', error);
    res.status(500).json({ error: 'Failed to summarize income' });
  }
};
