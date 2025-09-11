import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all job assignments
export const getAllJobAssignments = async (req, res) => {
  const jobs = await prisma.jobAssignment.findMany();
  res.json(jobs);
};

export const getJobAssignmentById = async (req, res) => {
  const { id } = req.params;
  const job = await prisma.jobAssignment.findUnique({ where: { id } });
  res.json(job);
};

// Create new JobAssignment record (auto-generate ID)
export const createJobAssignment = async (req, res) => {
  const { employeeId, description, assignedDate, status } = req.body;

  if (!employeeId || !description || !assignedDate || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const allIds = await prisma.jobAssignment.findMany({ select: { id: true } });

    const maxNumber = allIds.reduce((max, record) => {
      const match = record.id.match(/^JOB(\d+)$/);
      const num = match ? parseInt(match[1]) : 0;
      return Math.max(max, num);
    }, 0);

    const newId = `JOB${String(maxNumber + 1).padStart(3, '0')}`;

    const created = await prisma.jobAssignment.create({
      data: {
        id: newId,
        employeeId,
        description,
        assignedDate: new Date(assignedDate),
        status
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create job assignment' });
  }
};




export const updateJobAssignment = async (req, res) => {
  const { id } = req.params;
  const { employeeId, description, assignedDate, status } = req.body;

  try {
    const updated = await prisma.jobAssignment.update({
      where: { id },
      data: {
        employeeId,
        description,
        assignedDate: new Date(assignedDate),
        status,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Job assignment not found' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update job assignment' });
  }
};



export const deleteJobAssignment = async (req, res) => {
  const { id } = req.params;
  await prisma.jobAssignment.delete({ where: { id } });
  res.json({ message: 'Deleted successfully' });
};
