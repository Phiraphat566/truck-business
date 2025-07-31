import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 🔍 Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const records = await prisma.attendance.findMany();
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// 🔍 Get one attendance record by id
export const getAttendanceById = async (req, res) => {
  const { id } = req.params;
  try {
    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Attendance not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};




// Create new attendance record (auto-generate ID)
export const createAttendance = async (req, res) => {
  const { employeeId, checkIn, checkOut, date } = req.body;

  if (!employeeId || !checkIn || !checkOut || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    
    const allIds = await prisma.attendance.findMany({
      select: { id: true }
    });

    const maxNumber = allIds.reduce((max, record) => {
      const match = record.id.match(/^ATT(\d+)$/);
      const num = match ? parseInt(match[1]) : 0;
      return Math.max(max, num);
    }, 0);

    const newId = `ATT${String(maxNumber + 1).padStart(3, '0')}`;

    const created = await prisma.attendance.create({
      data: {
        id: newId,
        employeeId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        date: new Date(date)
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};



// Update attendance record
export const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { employeeId, checkIn, checkOut, date } = req.body; 

  try {
    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        employeeId, 
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        date: new Date(date)
      }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};


// ❌ Delete attendance record
export const deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.attendance.delete({ where: { id } });
    res.json({ message: `Attendance ${id} deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};
