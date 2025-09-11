// backend/routes/employeeDayStatusRoutes.js
import express from 'express';
import { listByDate, getOne, upsert } from '../controllers/employeeDayStatusController.js';

const router = express.Router();

router.get('/', listByDate);                 // ?date=YYYY-MM-DD
router.get('/:employeeId', getOne);          // ?date=YYYY-MM-DD
router.post('/upsert', upsert);              // body: employeeId, date, status, ...

export default router;
