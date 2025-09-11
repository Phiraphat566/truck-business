// backend/routes/employeeMonthlySummaryRoutes.js
import express from 'express';
import {
  getAllMonthlySummaries,
  getMonthlySummaryById,
  createMonthlySummary,
  updateMonthlySummary,
  deleteMonthlySummary,
  employeeMonthlySummaryByYear
} from '../controllers/employeeMonthlySummaryController.js';

const router = express.Router();

router.get('/', getAllMonthlySummaries);

// วางเส้นนี้ก่อน :id
router.get('/year/:year', employeeMonthlySummaryByYear);

router.get('/:id', getMonthlySummaryById);
router.post('/', createMonthlySummary);
router.put('/:id', updateMonthlySummary);
router.delete('/:id', deleteMonthlySummary);

export default router;
