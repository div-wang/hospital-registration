ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(128) NULL AFTER avatar_url,
  ADD COLUMN password_salt VARCHAR(64) NULL AFTER password_hash;

INSERT INTO accounts (hospital_id,balance,frozen_amount)
SELECT id,0,0 FROM hospitals
ON DUPLICATE KEY UPDATE status=1;
