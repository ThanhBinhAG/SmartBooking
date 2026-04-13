-- ============================================
-- THÊM CỘT IMAGE_DATA CHO ROOM_IMAGES
-- Lưu trữ hình ảnh trực tiếp trong PostgreSQL
-- ============================================
ALTER TABLE room_images
    ADD COLUMN IF NOT EXISTS image_data BYTEA,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Cập nhật url thành endpoint để serve từ DB
UPDATE room_images
SET url = CONCAT('/api/images/', id::text)
WHERE url LIKE '/uploads/%';