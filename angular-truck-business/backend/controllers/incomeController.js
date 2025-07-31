import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';

const prisma = new PrismaClient();

// Storage สำหรับอัปโหลดรูปภาพใบสัญญา
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/contracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `income_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({ storage });

// ดึงรายได้ทั้งหมด
export const getAllIncomes = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      orderBy: { income_date: 'desc' }
    });
    res.json(incomes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
};

// ดึงรายได้ตาม ID
export const getIncomeById = async (req, res) => {
  const { id } = req.params;
  try {
    const income = await prisma.income.findUnique({
      where: { id: Number(id) },
    });

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
};

// สร้างรายได้ใหม่
export const createIncome = async (req, res) => {
  const { income_date, description, category, amount } = req.body;
  const contract_image_path = req.file ? `uploads/contracts/${req.file.filename}` : null;

  try {
    const newIncome = await prisma.income.create({
      data: {
        income_date: new Date(income_date),
        description,
        category,
        amount: parseFloat(amount),
        contract_image_path,
      },
    });

    res.status(201).json(newIncome);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create income' });
  }
};

// อัปเดตรายได้
export const updateIncome = async (req, res) => {
  const { id } = req.params;
  const { income_date, description, category, amount } = req.body;
  const contract_image_path = req.file ? `uploads/contracts/${req.file.filename}` : undefined;

  try {
    const updatedIncome = await prisma.income.update({
      where: { id: Number(id) },
      data: {
        income_date: income_date ? new Date(income_date) : undefined,
        description,
        category,
        amount: amount ? parseFloat(amount) : undefined,
        ...(contract_image_path && { contract_image_path }),
      },
    });

    res.json(updatedIncome);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update income' });
  }
};

// ลบรายได้
export const deleteIncome = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.income.delete({ where: { id: Number(id) } });
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
};

// ดึงรายได้ตามปี
export const getIncomesByYear = async (req, res) => {
  const { year } = req.params;

  try {
    const incomes = await prisma.income.findMany({
      where: {
        income_date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${Number(year) + 1}-01-01`),
        },
      },
      orderBy: { income_date: 'desc' },
    });

    res.json(incomes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch incomes by year' });
  }
};
    