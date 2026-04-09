const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { register, login, getCurrentUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticate, getCurrentUser);

module.exports = router;
