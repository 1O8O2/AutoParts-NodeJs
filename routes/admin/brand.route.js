const express = require('express');
const router = express.Router();
const brandController = require('../../controller/admin/brandController');
const validateAuth = require('../../middlewares/admin/validate.middleware');


// Brand routes
router.get('/', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_XEM'), brandController.index);
router.get('/add', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_THEM'), brandController.add);
router.post('/add', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_THEM'), brandController.addPost);
router.get('/edit', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_SUA'), brandController.edit);
router.post('/edit', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_SUA'), brandController.editPatch);
router.get('/delete', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_XOA'), brandController.delete);
router.post('/changeStatus', validateAuth.checkPermission('QUAN_LY_NHAN_HANG_SUA'), brandController.changeStatus);

module.exports = router; 