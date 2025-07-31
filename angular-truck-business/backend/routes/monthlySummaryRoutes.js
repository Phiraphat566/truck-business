import express from 'express';
import {
  getAllMonthlySummaries,
  getMonthlySummaryById,
  createMonthlySummary,
  updateMonthlySummary,
  deleteMonthlySummary
} from '../controllers/monthlySummaryController.js';

const router = express.Router();

router.get('/', getAllMonthlySummaries);         
router.get('/:id', getMonthlySummaryById);     
router.post('/', createMonthlySummary);      
router.put('/:id', updateMonthlySummary);    
router.delete('/:id', deleteMonthlySummary);   

export default router;
