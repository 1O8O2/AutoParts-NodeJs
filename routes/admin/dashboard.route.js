const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/dashboardController')

router.get('/statistic', controller.statistic);

module.exports = router;