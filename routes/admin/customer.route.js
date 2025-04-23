const express = require('express');
const router = express.Router();
const customerController = require('../../controller/admin/customerController');

// Customer routes
router.get('/', customerController.index);
router.get('/detail', customerController.detail);

module.exports = router; 