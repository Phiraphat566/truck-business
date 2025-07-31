import express from 'express';
import {
  getAllTravelCosts,
  getTravelCostById,
  createTravelCost,
  updateTravelCost,
  deleteTravelCost
} from '../controllers/travelCostController.js';

const router = express.Router();

router.get('/', getAllTravelCosts);
router.get('/:id', getTravelCostById);
router.post('/', createTravelCost);
router.put('/:id', updateTravelCost);
router.delete('/:id', deleteTravelCost);

export default router;
