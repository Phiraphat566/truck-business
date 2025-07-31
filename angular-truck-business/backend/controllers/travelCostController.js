import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const getAllTravelCosts = async (req, res) => {
  const costs = await prisma.travelCost.findMany();
  res.json(costs);
};

export const getTravelCostById = async (req, res) => {
  const { id } = req.params;
  const cost = await prisma.travelCost.findUnique({ where: { id: Number(id) } });
  res.json(cost);
};

export const createTravelCost = async (req, res) => {
  const { minDistance, maxDistance, rateBaht } = req.body;

  if (
    minDistance === undefined ||
    maxDistance === undefined ||
    rateBaht === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const created = await prisma.travelCost.create({
      data: {
        minDistance: Number(minDistance),
        maxDistance: Number(maxDistance),
        rateBaht: Number(rateBaht),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create travel cost' });
  }
};


export const updateTravelCost = async (req, res) => {
  const { id } = req.params;
  const { minDistance, maxDistance, rateBaht } = req.body;

  try {
    const updated = await prisma.travelCost.update({
      where: { id: Number(id) },
      data: {
        minDistance: Number(minDistance),
        maxDistance: Number(maxDistance),
        rateBaht: Number(rateBaht),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Travel cost not found' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update travel cost' });
  }
};


export const deleteTravelCost = async (req, res) => {
  const { id } = req.params;
  await prisma.travelCost.delete({ where: { id: Number(id) } });
  res.json({ message: 'Deleted successfully' });
};
