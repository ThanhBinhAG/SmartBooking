-- ============================================
-- BẢNG USERS (Người dùng)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    phone       VARCHAR(20),
    hashed_password TEXT NOT NULL,
    role        VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    is_active   BOOLEAN DEFAULT TRUE,
    consent_given BOOLEAN DEFAULT FALSE,       -- Tuân thủ Nghị định 13/2023
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG ROOMS (Phòng họp)
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    capacity    INTEGER NOT NULL CHECK (capacity > 0),
    price_per_hour DECIMAL(12,2) NOT NULL,
    location    VARCHAR(200),
    floor       INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    -- Metadata cho 3D viewer (đường dẫn file GLB/GLTF)
    model_3d_url TEXT,
    thumbnail_url TEXT,
    amenities   JSONB DEFAULT '[]',   -- ["wifi", "projector", "whiteboard"]
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG EQUIPMENT (Trang thiết bị)
-- ============================================
CREATE TABLE IF NOT EXISTS equipment (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    unit        VARCHAR(30) DEFAULT 'cái',
    image_url   TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ============================================
-- BẢNG BOOKINGS (Đặt chỗ) — QUAN TRỌNG NHẤT
-- Dùng tstzrange để quản lý thời gian đặt
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    -- time_range lưu [thời gian bắt đầu, thời gian kết thúc)
    time_range  TSTZRANGE NOT NULL,
    status      VARCHAR(30) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed')),
    total_price DECIMAL(12,2),
    payment_method VARCHAR(30),   -- 'momo', 'vnpay', 'cash'
    payment_ref VARCHAR(200),     -- Mã tham chiếu từ cổng thanh toán
    qr_code_data TEXT,            -- Dữ liệu QR check-in
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RÀNG BUỘC EXCLUSION — Ngăn trùng lịch
-- Đây là "vũ khí bí mật" của PostgreSQL!
-- Nếu ai đó cố đặt phòng trùng giờ → DB tự từ chối
-- ============================================
ALTER TABLE bookings
ADD CONSTRAINT no_booking_overlap
EXCLUDE USING gist (
    room_id WITH =,
    time_range WITH &&
)
WHERE (status NOT IN ('cancelled'));

-- Index để truy vấn nhanh
CREATE INDEX idx_bookings_room_time ON bookings USING gist (room_id, time_range);
CREATE INDEX idx_bookings_user     ON bookings (user_id);
CREATE INDEX idx_bookings_status   ON bookings (status);

-- ============================================
-- BẢNG BOOKING_DETAILS (Chi tiết thiết bị)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_details (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id),
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price  DECIMAL(10,2)
);

-- ============================================
-- BẢNG REVIEWS (Đánh giá)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id  UUID UNIQUE REFERENCES bookings(id),
    user_id     UUID REFERENCES users(id),
    room_id     UUID REFERENCES rooms(id),
    rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HÀM TỰ CẬP NHẬT updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();