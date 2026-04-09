const express = require('express');
const router = express.Router();
const equipmentCtrl = require('../controllers/equipmentController');

router.get('/', equipmentCtrl.getAllEquipment);
router.get('/:id', equipmentCtrl.getEquipmentById);
router.post('/', equipmentCtrl.createEquipment);
router.put('/:id', equipmentCtrl.updateEquipment);
router.delete('/:id', equipmentCtrl.deleteEquipment);

module.exports = router;
