CREATE TABLE IF NOT EXISTS campaign_financing_decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NOT NULL,
  campaignId INT NOT NULL,
  decisionKey VARCHAR(128) NOT NULL,
  decisionType VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  amount DECIMAL(16,2) NULL,
  loanToCostBps INT NULL,
  borrowerEquity DECIMAL(16,2) NULL,
  basis TEXT NOT NULL,
  decidedBy VARCHAR(255) NOT NULL,
  decidedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY campaign_financing_decision_owner_key_unique (ownerId, decisionKey),
  INDEX campaign_financing_decisions_owner_campaign (ownerId, campaignId)
);
