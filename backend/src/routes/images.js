const express = require('express');
const router = express.Router();
const { getRoomImages, uploadRoomImages, setPrimaryImage, reorderImages, deleteRoomImage, serveImage } = require('../controllers/imageController');
const { upload } = require('../middlewares/uploadMiddleware');
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');

// GET /api/rooms/:roomId/images - Lấy danh sách ảnh của phòng
router.get('/rooms/:roomId', authenticate, getRoomImages);

// GET /api/images/:imageId - Serve hình ảnh từ DB
router.get('/:imageId', serveImage);

// POST /api/rooms/:roomId/images - Upload ảnh cho phòng (admin only)
router.post('/rooms/:roomId', authenticate, requireAdmin, upload.array('images', 10), uploadRoomImages);

// PUT /api/rooms/:roomId/images/:imageId/primary - Đặt ảnh chính
router.put('/rooms/:roomId/images/:imageId/primary', authenticate, requireAdmin, setPrimaryImage);

// PUT /api/rooms/:roomId/images/reorder - Sắp xếp thứ tự ảnh
router.put('/rooms/:roomId/images/reorder', authenticate, requireAdmin, reorderImages);

// DELETE /api/rooms/:roomId/images/:imageId - Xóa ảnh
router.delete('/rooms/:roomId/images/:imageId', authenticate, requireAdmin, deleteRoomImage);

module.exports = router;