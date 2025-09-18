import express from 'express';
import {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome, 
  getIncomesByYear,
  getIncomeByMonth,
  upload
} from '../controllers/incomeController.js';

const router = express.Router();

router.get('/summary/by-month', getIncomeByMonth);

router.get('/year/:year', getIncomesByYear);

router.get('/', getAllIncomes);
router.get('/:id', getIncomeById);

// อัปโหลดไฟล์แนบ: field name = 'file'
router.post('/', upload.single('file'), createIncome);
router.put('/:id', upload.single('file'), updateIncome);
router.delete('/:id', deleteIncome);

export default router;
