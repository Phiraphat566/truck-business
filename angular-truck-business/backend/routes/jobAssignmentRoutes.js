import express from 'express';
import {
  getAllJobAssignments,
  getJobAssignmentById,
  createJobAssignment,
  updateJobAssignment,
  deleteJobAssignment
} from '../controllers/jobAssignmentController.js';

const router = express.Router();

router.get('/', getAllJobAssignments);         
router.get('/:id', getJobAssignmentById);     
router.post('/', createJobAssignment);        
router.put('/:id', updateJobAssignment);      
router.delete('/:id', deleteJobAssignment);   

export default router;
