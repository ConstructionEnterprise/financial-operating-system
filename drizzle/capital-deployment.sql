CREATE TABLE IF NOT EXISTS capital_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NOT NULL,
  sourceOpportunityId INT NULL,
  internalProjectId INT NULL,
  purpose VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  equipmentName VARCHAR(255) NULL,
  plannedAmount DECIMAL(16,2) NOT NULL,
  committedAmount DECIMAL(16,2) NULL,
  plannedMonth VARCHAR(7) NULL,
  reference VARCHAR(500) NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX capital_allocations_owner (ownerId)
);
CREATE TABLE IF NOT EXISTS capital_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NOT NULL,
  allocationId INT NOT NULL,
  requestKey VARCHAR(64) NOT NULL,
  amount DECIMAL(16,2) NOT NULL,
  paidOn VARCHAR(10) NOT NULL,
  reference VARCHAR(500) NOT NULL,
  voided BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY capital_payment_request_unique (ownerId, requestKey),
  INDEX capital_payments_owner_allocation (ownerId, allocationId)
);
