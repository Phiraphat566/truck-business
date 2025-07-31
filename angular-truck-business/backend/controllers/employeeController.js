import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

//  ดึงพนักงานทั้งหมด
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

//  ดึงพนักงานตาม id (แบบ summary)
export const getEmployeeSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id }, //  ใช้ String
      include: {
        attendances: {
          select: {
            date: true,
            checkIn: true,
            checkOut: true,
          },
          orderBy: { date: 'desc' },
        },
        jobAssignments: {
          include: {
            trips: {
              select: {
                distanceKM: true,
                fuelUsedLiters: true,
                fuelCost: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let totalTrips = 0;
    let totalDistance = 0;
    let totalFuelCost = 0;

    employee.jobAssignments.forEach(job => {
      totalTrips += job.trips.length;
      job.trips.forEach(trip => {
        totalDistance += trip.distanceKM;
        totalFuelCost += trip.fuelCost;
      });
    });

    res.json({
      id: employee.id,
      name: employee.name,
      position: employee.position,
      phone: employee.phone,
      totalTrips,
      totalDistance,
      totalFuelCost,
      attendances: employee.attendances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  เพิ่มพนักงานใหม่ (ต้องมี id ส่งมา เช่น EMP005)
export const createEmployee = async (req, res) => {
  const { name, position, phone } = req.body;

  if (!name || !position || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. ดึง employee id ทั้งหมดที่ขึ้นต้นด้วย EMP
    const employees = await prisma.employee.findMany({
      select: { id: true }
    });

    // 2. ดึงเลขจาก EMPxxx แล้วหาเลขที่มากที่สุด
    const maxNumber = employees.reduce((max, emp) => {
      const match = emp.id.match(/^EMP(\d{3})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    // 3. สร้างรหัสใหม่ เช่น EMP006
    const newId = `EMP${String(maxNumber + 1).padStart(3, '0')}`;

    // 4. สร้างพนักงานใหม่
    const newEmployee = await prisma.employee.create({
      data: {
        id: newId,
        name,
        position,
        phone
      }
    });

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};




// ลบพนักงาน
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.employee.delete({
      where: { id } //  ใช้ String
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

//  แก้ไขพนักงาน
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, position, phone } = req.body;

  try {
    const updated = await prisma.employee.update({
      where: { id }, // id เป็น string แล้ว
      data: { name, position, phone }
    });

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.error(error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};




