import express from 'express';
import {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  upload
} from '../controllers/incomeController.js';

const router = express.Router();

router.get('/', getAllIncomes);
router.get('/:id', getIncomeById);
router.post('/', upload.single('contract_image'), createIncome);
router.put('/:id', upload.single('contract_image'), updateIncome);
router.delete('/:id', deleteIncome);

export default router;
