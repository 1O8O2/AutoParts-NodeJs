const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/accountController');

const validateAuth = require('../../middlewares/admin/validate.middleware');    

router.get('/', validateAuth.checkPermission('DANH_SACH_TAI_KHOAN_XEM'), controller.index);
router.patch('/change-status/:newStatus/:accEmail', validateAuth.checkPermission('DANH_SACH_TAI_KHOAN_SUA'), controller.changeStatus);
router.get('/edit/:accEmail', validateAuth.checkPermission('DANH_SACH_TAI_KHOAN_SUA'), controller.edit);
router.patch('/edit/:accEmail', validateAuth.checkPermission('DANH_SACH_TAI_KHOAN_SUA'), controller.editPatch);

module.exports = router;