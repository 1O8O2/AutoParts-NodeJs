const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/accountController')

router.get('/', controller.index);
router.patch('/change-status/:newStatus/:accPhone', controller.changeStatus);
router.get('/edit/:accPhone', controller.edit);

module.exports = router;