const express = require('express');
const router = express.Router();
const customerController = require('../../controller/admin/customerController');

// Customer routes
router.get('/', customerController.index);
router.get('/detail', customerController.detail);
router.get('/historyOrder', customerController.historyOrder);

module.exports = router; 