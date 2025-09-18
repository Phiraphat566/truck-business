// backend/routes/invoiceYearRoutes.js
import { Router } from 'express';
import { listInvoiceYears, createInvoiceYear } from '../controllers/invoiceYearController.js';

const router = Router();
router.get('/', listInvoiceYears);
router.post('/', createInvoiceYear);

export default router;
