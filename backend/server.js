require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { query } = require('./src/utils/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ file ảnh tĩnh — truy cập qua /uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================
// MIDDLEWARE BẢO MẬT
// ===========================
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===========================
// ROUTES
// ===========================
app.use('/api/auth',      require('./src/routes/auth'));
app.use('/api/rooms',     require('./src/routes/rooms'));
app.use('/api/bookings',  require('./src/routes/bookings'));
app.use('/api/equipment', require('./src/routes/equipment'));
app.use('/api/account', require('./src/routes/account'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/images', require('./src/routes/images'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Booking API đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// 404 API fallback (JSON response)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint API không tồn tại'
  });
});

// Global error handler (JSON)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ, vui lòng thử lại sau'
  });
});

// ===========================
// CHUẨN BỊ DATABASE
// ===========================
const ensureRoomsUpdatedAt = async () => {
  try {
    await query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await query(`CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await query(`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rooms_updated_at'
        ) THEN
          CREATE TRIGGER trg_rooms_updated_at
          BEFORE UPDATE ON rooms
          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        END IF;
      END$$;
    `);
    console.log('✅ Đã đảm bảo schema rooms.updated_at và trigger cập nhật.');
  } catch (err) {
    console.error('❌ Lỗi khi đảm bảo schema rooms.updated_at:', err.message);
  }
};

// ===========================
// KHỞI ĐỘNG SERVER
// ===========================
ensureRoomsUpdatedAt().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}\n`);
  });
});