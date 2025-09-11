-- CreateIndex
CREATE INDEX `idx_eds_work_date` ON `EmployeeDayStatus`(`work_date`);

-- CreateIndex
CREATE INDEX `idx_income_date` ON `Income`(`income_date`);

-- CreateIndex
CREATE INDEX `idx_invoice_contract_status` ON `Invoice`(`contractDate`, `status`);

-- CreateIndex
CREATE INDEX `idx_invoice_due_status` ON `Invoice`(`dueDate`, `status`);

-- CreateIndex
CREATE INDEX `idx_trip_date` ON `Trip`(`trip_date`);

-- CreateIndex
CREATE INDEX `idx_truckexpense_date` ON `TruckExpense`(`expense_date`);
