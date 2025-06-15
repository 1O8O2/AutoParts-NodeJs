const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/dashboardController')
const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/', validateAuth.checkPermission('THONG_KE'), controller.statistic);

module.exports = router;