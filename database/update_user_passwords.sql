-- Update user passwords with properly hashed versions of 'password123'

USE skynest_hotels;

-- Update admin
UPDATE users 
SET password_hash = '$2b$10$itJihM2vEoJTvz4GHN/DhuLznPj4Dcfk.tmKnckGCXCA9qcxjXL.G'
WHERE username = 'admin';

-- Update receptionist_colombo
UPDATE users 
SET password_hash = '$2b$10$Mqu2EMkh2Zqu0duJmqqbJe6beQtLODvyyymPlId6Zoez2wjSXQg0K'
WHERE username = 'receptionist_colombo';

-- Update receptionist_kandy
UPDATE users 
SET password_hash = '$2b$10$b.9gcazTJvOcWkIbL6A91eSjnnR50g3pImwPJ0zv9yAU25KXJ8xj6'
WHERE username = 'receptionist_kandy';

-- Update receptionist_galle
UPDATE users 
SET password_hash = '$2b$10$4YDHpww9.Zbq9qGQ5LIvk.1AhRoulnQFfN0DDcImftYSvSaaPJvb.'
WHERE username = 'receptionist_galle';

-- Confirm updates
SELECT username, SUBSTRING(password_hash, 1, 10) as hash_prefix FROM users;