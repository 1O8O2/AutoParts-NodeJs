const express = require('express');
const router = express.Router();
const orderReportController = require('../../controller/admin/order-report.controller');

router.get('/', orderReportController.index);
router.get('/export', orderReportController.exportReport);

module.exports = router; 