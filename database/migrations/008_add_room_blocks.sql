-- ============================================
-- MIGRATION: Thêm cột blocks cho Block Editor
-- ============================================

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_note TEXT;