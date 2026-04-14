-- ============================================
-- Thêm column admin_note vào table rooms
-- ============================================
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Thêm column updated_at vào rooms nếu chưa có
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Cập nhật updated_at trigger cho rooms table nếu chưa có
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rooms_updated_at'
  ) THEN
    CREATE TRIGGER trg_rooms_updated_at
      BEFORE UPDATE ON rooms
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
