const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/orderController');

const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/add', validateAuth.checkPermission('QUAN_LY_DON_HANG_THEM'), controller.add);
router.post('/add', validateAuth.checkPermission('QUAN_LY_DON_HANG_THEM'), controller.addPost);
router.get('/:status', validateAuth.checkPermission('QUAN_LY_DON_HANG_XEM'), controller.index);
router.get('/edit/:orderId', validateAuth.checkPermission('QUAN_LY_DON_HANG_SUA'), controller.edit);
router.patch('/edit/:orderId', validateAuth.checkPermission('QUAN_LY_DON_HANG_SUA'), controller.editPatch);
router.get('/detail/:orderId', validateAuth.checkPermission('QUAN_LY_DON_HANG_XEM'), controller.detail);
router.patch('/changeStatus', validateAuth.checkPermission('QUAN_LY_DON_HANG_SUA'), controller.changeStatus);

module.exports = router;