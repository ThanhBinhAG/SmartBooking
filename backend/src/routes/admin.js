const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const adminCtrl = require('../controllers/adminController');
const imgCtrl   = require('../controllers/imageController');
const equipmentCtrl = require('../controllers/equipmentController');

// Tất cả route admin yêu cầu đăng nhập + quyền admin
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/stats', adminCtrl.getDashboardStats);

// Quản lý phòng
router.get('/rooms',           adminCtrl.getAllRoomsAdmin);
router.post('/rooms',          adminCtrl.createRoom);
router.put('/rooms/:id',       adminCtrl.updateRoom);
router.delete('/rooms/:id',    adminCtrl.deleteRoom);

// Quản lý ảnh phòng
router.get('/rooms/:roomId/images',                         imgCtrl.getRoomImages);
router.post('/rooms/:roomId/images', upload.array('images', 10), imgCtrl.uploadRoomImages);
router.patch('/rooms/:roomId/images/:imageId/set-primary',  imgCtrl.setPrimaryImage);
router.patch('/rooms/:roomId/images/reorder',              imgCtrl.reorderImages);
router.delete('/images/:imageId',                           imgCtrl.deleteRoomImage);

// Quản lý bookings
router.get('/bookings',                 adminCtrl.getAllBookings);
router.patch('/bookings/:id/status',    adminCtrl.updateBookingStatus);

// Quản lý users
router.get('/users', adminCtrl.getAllUsers);
router.put('/users/:id/role', adminCtrl.updateUserRole);

// Quản lý thiết bị
router.get('/equipment', equipmentCtrl.getAllEquipment);
router.post('/equipment', equipmentCtrl.createEquipment);
router.put('/equipment/:id', equipmentCtrl.updateEquipment);
router.delete('/equipment/:id', equipmentCtrl.deleteEquipment);

module.exports = router;