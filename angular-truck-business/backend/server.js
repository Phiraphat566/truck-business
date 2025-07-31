import express from 'express';
import dotenv from 'dotenv';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import jobAssignmentRoutes from './routes/jobAssignmentRoutes.js';
import monthlySummaryRoutes from './routes/monthlySummaryRoutes.js';
import travelCostRoutes from './routes/travelCostRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/job-assignments', jobAssignmentRoutes);
app.use('/api/monthly-summaries', monthlySummaryRoutes);
app.use('/api/travel-costs', travelCostRoutes);
app.use('/api/trips', tripRoutes);
app.use('/uploads', express.static('uploads')); // เพื่อให้สามารถดูไฟล์รูปภาพได้
app.use('/api/income', incomeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


