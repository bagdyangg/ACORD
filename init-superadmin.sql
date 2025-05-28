-- Create default superadmin user
-- Run this after first deployment to create initial superadmin

INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at) 
VALUES (
  'superadmin-001',
  'admin@company.com',
  'Super',
  'Administrator', 
  'superadmin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  updated_at = NOW();

-- You can also create additional admin users
-- INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at) 
-- VALUES (
--   'admin-001',
--   'manager@company.com',
--   'Manager',
--   'Name',
--   'admin',
--   NOW(),
--   NOW()
-- );