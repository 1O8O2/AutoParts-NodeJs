const express = require('express');
const router = express.Router();
const customerController = require('../../controller/admin/customerController');
const validateAuth = require('../../middlewares/admin/validate.middleware');


// Customer routes
router.get('/', validateAuth.checkPermission('DANH_SACH_KHACH_HANG_XEM'), customerController.index);
router.get('/detail', validateAuth.checkPermission('DANH_SACH_KHACH_HANG_XEM'), customerController.detail);
router.get('/historyOrder', customerController.historyOrder);

module.exports = router; 