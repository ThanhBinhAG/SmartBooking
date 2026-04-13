require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

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
// KHỞI ĐỘNG SERVER
// ===========================
app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}\n`);
});