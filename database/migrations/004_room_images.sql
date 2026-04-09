-- ============================================
-- BẢNG ROOM_IMAGES (Hình ảnh phòng họp)
-- ============================================
CREATE TABLE IF NOT EXISTS room_images (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    file_path    TEXT NOT NULL,          -- Đường dẫn file trên server
    url          TEXT NOT NULL,          -- URL để frontend truy cập
    alt_text     VARCHAR(200),           -- Mô tả ảnh (SEO + accessibility)
    is_primary   BOOLEAN DEFAULT FALSE,  -- Ảnh thumbnail đại diện
    sort_order   INTEGER DEFAULT 0,      -- Thứ tự hiển thị
    uploaded_by  UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Mỗi phòng chỉ có 1 ảnh primary
CREATE UNIQUE INDEX idx_room_primary_image
    ON room_images (room_id)
    WHERE is_primary = TRUE;

-- Index tìm ảnh theo phòng
CREATE INDEX idx_room_images_room_id ON room_images (room_id, sort_order);

-- ============================================
-- Thêm cột thumbnail vào rooms (lấy từ room_images)
-- Dùng để hiển thị nhanh không cần JOIN
-- ============================================
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

-- Thêm cột admin_note cho rooms
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- ============================================
-- BẢNG ADMIN_LOGS (Lịch sử thao tác của admin)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id    UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,   -- 'add_room', 'delete_image', ...
    target_type VARCHAR(50),             -- 'room', 'booking', 'user'
    target_id   UUID,
    detail      JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);