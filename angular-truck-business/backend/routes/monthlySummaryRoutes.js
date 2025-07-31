import express from 'express';
import {
  getAllMonthlySummaries,
  getMonthlySummaryById,
  createMonthlySummary,
  updateMonthlySummary,
  deleteMonthlySummary,
  getMonthlySummariesByYear
} from '../controllers/monthlySummaryController.js';

const router = express.Router();

router.get('/', getAllMonthlySummaries);         
router.get('/:id', getMonthlySummaryById);     
router.post('/', createMonthlySummary);      
router.put('/:id', updateMonthlySummary);    
router.delete('/:id', deleteMonthlySummary);   
router.get('/monthly-summaries/year/:year', getMonthlySummariesByYear);


export default router;
