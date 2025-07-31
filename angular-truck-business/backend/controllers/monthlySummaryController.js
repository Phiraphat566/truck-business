import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllMonthlySummaries = async (req, res) => {
  const summaries = await prisma.monthlySummary.findMany();
  res.json(summaries);
};

export const getMonthlySummaryById = async (req, res) => {
  const { id } = req.params;
  const summary = await prisma.monthlySummary.findUnique({ where: { id: Number(id) } });
  res.json(summary);
};

export const createMonthlySummary = async (req, res) => {
  const { employeeId, month, totalTrips, totalFuelCost, totalEarnings } = req.body;

  if (!employeeId || !month) {
    return res.status(400).json({ error: 'Missing required fields: employeeId or month' });
  }

  try {
    const created = await prisma.monthlySummary.create({
      data: {
        employeeId,
        month, // ถ้าเป็น DateTime ต้องใช้ new Date(month)
        totalTrips: Number(totalTrips) || 0,
        totalFuelCost: Number(totalFuelCost) || 0,
        totalEarnings: Number(totalEarnings) || 0,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create monthly summary' });
  }
};


export const updateMonthlySummary = async (req, res) => {
  const { id } = req.params;
  const { totalTrips, totalFuelCost, totalEarnings } = req.body;

  try {
    const updated = await prisma.monthlySummary.update({
      where: { id: Number(id) },
      data: {
        totalTrips: Number(totalTrips),
        totalFuelCost: Number(totalFuelCost),
        totalEarnings: Number(totalEarnings),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Monthly summary not found' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update monthly summary' });
  }
};


export const deleteMonthlySummary = async (req, res) => {
  const { id } = req.params;
  await prisma.monthlySummary.delete({ where: { id: Number(id) } });
  res.json({ message: 'Deleted successfully' });
};
