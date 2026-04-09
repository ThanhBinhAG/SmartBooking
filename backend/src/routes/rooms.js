const express = require('express');
const router = express.Router();
const { getAllRooms, getRoomById } = require('../controllers/roomController');

const { getRoomImages } = require('../controllers/imageController');
router.get('/:roomId/images', getRoomImages);

router.get('/', getAllRooms);
router.get('/:id', getRoomById);

module.exports = router;