const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/generalSettingController')

router.get('/', controller.index);
router.post('/update', controller.update);

module.exports = router;