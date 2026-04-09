-- ============================================
-- CREATE DEFAULT ADMIN USER
-- ============================================

-- Tạo tài khoản admin mặc định
INSERT INTO users (full_name, email, phone, hashed_password, role, consent_given)
VALUES (
  'Administrator',
  'admin@smartbooking.vn',
  '0123456789',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lKJYgHhO', -- password: admin123
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Tạo tài khoản staff mẫu
INSERT INTO users (full_name, email, phone, hashed_password, role, consent_given)
VALUES (
  'Nguyễn Văn Staff',
  'staff@smartbooking.vn',
  '0987654321',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lKJYgHhO', -- password: admin123
  'staff',
  true
) ON CONFLICT (email) DO NOTHING;

-- Tạo tài khoản customer mẫu
INSERT INTO users (full_name, email, phone, hashed_password, role, consent_given)
VALUES (
  'Trần Thị Customer',
  'customer@smartbooking.vn',
  '0912345678',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lKJYgHhO', -- password: admin123
  'customer',
  true
) ON CONFLICT (email) DO NOTHING;