const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { validateAppointment } = require('../middleware/validate');
const duplicateCheck = require('../middleware/duplicateCheck');
const controller = require('../controllers/appointmentController');

router.get('/slots', controller.getSlots);
router.post('/', rateLimit, validateAppointment, duplicateCheck, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
