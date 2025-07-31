// routes/employeeRoutes.js
import express from 'express';
import {
  getAllEmployees,
  getEmployeeSummary,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController.js';

const router = express.Router();


router.get('/', getAllEmployees); 
router.get('/:id/summary', getEmployeeSummary);
router.post('/', createEmployee);          
router.delete('/:id', deleteEmployee);
router.put('/:id', updateEmployee);

export default router;
