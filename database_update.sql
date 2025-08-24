-- Add new columns for second mobile number and remaining amount to cars table
ALTER TABLE cars
  ADD COLUMN newOwnerPhone2 VARCHAR(20) DEFAULT NULL,
  ADD COLUMN remainingAmount DECIMAL(15,2) DEFAULT NULL;
