const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { createBooking, getMyBookings, getBookingById } = require('../controllers/bookingController');

// Tất cả booking routes đều cần đăng nhập
router.use(authenticate);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);

module.exports = router;