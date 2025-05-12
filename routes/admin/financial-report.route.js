const express = require('express');
const router = express.Router();
const financialReportController = require('../../controller/admin/financial-report.controller');

router.get('/', financialReportController.index);
router.get('/export', financialReportController.exportReport);

module.exports = router; 