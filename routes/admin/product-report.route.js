const express = require('express');
const router = express.Router();
const productReportController = require('../../controller/admin/product-report.controller');
router.get('/', productReportController.index);
router.get('/export',  productReportController.exportReport);

module.exports = router; 