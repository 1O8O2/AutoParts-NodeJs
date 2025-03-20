const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/dashboardController')

router.get('/', controller.index);

module.exports = router;