-- CreateTable
CREATE TABLE `Employee` (
    `employee_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `profile_image_path` VARCHAR(255) NULL,

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `attendance_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `check_in` DATETIME(0) NOT NULL,
    `check_out` DATETIME(0) NOT NULL,

    INDEX `employee_id`(`employee_id`),
    PRIMARY KEY (`attendance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobAssignment` (
    `job_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `job_description` TEXT NOT NULL,
    `assigned_date` DATETIME(0) NOT NULL,
    `status` VARCHAR(100) NOT NULL,

    INDEX `employee_id`(`employee_id`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(191) NOT NULL,
    `work_date` DATE NOT NULL,

    UNIQUE INDEX `employee_id`(`employee_id`, `work_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Truck` (
    `truck_id` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NULL,
    `total_distance` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`truck_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trip` (
    `trip_id` VARCHAR(191) NOT NULL,
    `job_id` VARCHAR(191) NOT NULL,
    `truck_id` VARCHAR(191) NOT NULL,
    `distance_km` INTEGER NOT NULL,
    `fuel_used_liters` INTEGER NOT NULL,
    `fuel_cost` INTEGER NOT NULL,

    INDEX `job_id`(`job_id`),
    INDEX `truck_id`(`truck_id`),
    PRIMARY KEY (`trip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuelLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truck_id` VARCHAR(191) NOT NULL,
    `fuel_date` DATE NOT NULL,
    `round_number` INTEGER NOT NULL,
    `liters` INTEGER NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL,

    INDEX `truck_id`(`truck_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckDistanceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truck_id` VARCHAR(191) NOT NULL,
    `log_date` DATE NOT NULL,
    `round_number` INTEGER NOT NULL,
    `distance_km` INTEGER NOT NULL,

    INDEX `truck_id`(`truck_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TruckExpense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `truck_id` VARCHAR(191) NOT NULL,
    `expense_date` DATE NOT NULL,
    `description` TEXT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,

    INDEX `truck_id`(`truck_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeCall` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(191) NOT NULL,
    `call_date` DATE NOT NULL,
    `message` TEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `employee_id`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(20) NOT NULL,
    `total_trips` INTEGER NOT NULL,
    `total_fuel_cost` DECIMAL(10, 2) NOT NULL,
    `total_earnings` DECIMAL(10, 2) NOT NULL,
    `salary` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `truck_expense` DECIMAL(10, 2) NULL DEFAULT 0.00,

    INDEX `employee_id`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TravelCost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `min_distance` INTEGER NOT NULL,
    `max_distance` INTEGER NULL,
    `rate_baht` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Income` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `note` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `JobAssignment` ADD CONSTRAINT `JobAssignment_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `WorkLog` ADD CONSTRAINT `WorkLog_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `JobAssignment`(`job_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_ibfk_2` FOREIGN KEY (`truck_id`) REFERENCES `Truck`(`truck_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `FuelLog` ADD CONSTRAINT `FuelLog_ibfk_1` FOREIGN KEY (`truck_id`) REFERENCES `Truck`(`truck_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TruckDistanceLog` ADD CONSTRAINT `TruckDistanceLog_ibfk_1` FOREIGN KEY (`truck_id`) REFERENCES `Truck`(`truck_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `TruckExpense` ADD CONSTRAINT `TruckExpense_ibfk_1` FOREIGN KEY (`truck_id`) REFERENCES `Truck`(`truck_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `EmployeeCall` ADD CONSTRAINT `EmployeeCall_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `MonthlySummary` ADD CONSTRAINT `MonthlySummary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE CASCADE ON UPDATE NO ACTION;
