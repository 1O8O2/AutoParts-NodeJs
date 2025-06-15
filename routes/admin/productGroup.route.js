const express = require('express');
const router = express.Router();
const productGroupController = require('../../controller/admin/productGroupController');
const validateAuth = require('../../middlewares/admin/validate.middleware');


// Product Group routes
router.get('/', validateAuth.checkPermission('DANH_MUC_SAN_PHAM_XEM'), productGroupController.index);
router.get('/add', validateAuth.checkPermission('DANH_MUC_SAN_PHAM_THEM'), productGroupController.add);
router.post('/add', validateAuth.checkPermission('DANH_MUC_SAN_PHAM_THEM'), productGroupController.addPost);
router.get('/delete', validateAuth.checkPermission('DANH_MUC_SAN_PHAM_XOA'), productGroupController.delete);
router.post('/changeStatus', validateAuth.checkPermission('DANH_MUC_SAN_PHAM_SUA'), productGroupController.changeStatus);

module.exports = router; 