// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import jobAssignmentRoutes from './routes/jobAssignmentRoutes.js';
import employeeMonthlySummaryRoutes from './routes/employeeMonthlySummaryRoutes.js';
import travelCostRoutes from './routes/travelCostRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import employeeDayStatusRoutes from './routes/employeeDayStatusRoutes.js';
import workYearRoutes from './routes/workYearRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import invoiceYearRoutes from './routes/invoiceYearRoutes.js';
import incomeYearRoutes from './routes/incomeYearRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());

// __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// routes
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/job-assignments', jobAssignmentRoutes);
app.use('/api/employee-monthly-summaries', employeeMonthlySummaryRoutes);
app.use('/api/travel-costs', travelCostRoutes);
app.use('/api/trips', tripRoutes);

// --- Income (แก้เป็นพหูพจน์ + คงของเดิมไว้เพื่อความเข้ากันได้) ---
app.use('/api/incomes', incomeRoutes);  // ใช้ตัวนี้เป็นหลัก (ตรงกับ frontend)
app.use('/api/income', incomeRoutes);   // เผื่อโค้ดเดิมที่เรียกเอกพจน์

app.use('/api/employee-day-status', employeeDayStatusRoutes);
app.use('/api/work-years', workYearRoutes);
app.use('/api/leaves', leaveRequestRoutes);

app.use('/api/finance', financeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-years', invoiceYearRoutes);
app.use('/api/income-years', incomeYearRoutes);

// health
app.get('/health', (_req, res) => res.send('ok'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
