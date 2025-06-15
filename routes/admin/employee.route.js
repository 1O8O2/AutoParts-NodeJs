const express = require('express');
const router = express.Router();
const employeeController = require('../../controller/admin/employeeController');
const validateAuth = require('../../middlewares/admin/validate.middleware');


router.get('/', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_XEM'), employeeController.index);
router.get('/detail', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_XEM'), employeeController.detail);
router.get('/add', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_THEM'), employeeController.add);
router.post('/add', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_THEM'), employeeController.addPost);
router.get('/edit', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_SUA'), employeeController.edit);
router.post('/edit', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_SUA'), employeeController.editPatch);
router.post('/changeStatus', validateAuth.checkPermission('DANH_SACH_NHAN_VIEN_SUA'), employeeController.changeStatus);

module.exports = router; 