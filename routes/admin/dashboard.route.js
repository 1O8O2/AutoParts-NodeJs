const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/dashboardController')

router.get('/statistic', controller.statistic);
router.get('/profile', controller.profile);

module.exports = router;