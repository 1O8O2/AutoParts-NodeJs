const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/roleController');

const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/', validateAuth.checkPermission('NHOM_QUYEN_XEM'), controller.index);
router.get('/add', validateAuth.checkPermission('NHOM_QUYEN_THEM'), controller.add);
router.post('/add', validateAuth.checkPermission('NHOM_QUYEN_THEM'), controller.addPost);
router.get('/edit/:roleGroupId', validateAuth.checkPermission('NHOM_QUYEN_SUA'), controller.edit);
router.patch('/edit/:roleGroupId', validateAuth.checkPermission('NHOM_QUYEN_SUA'), controller.editPatch);
router.delete('/delete/:roleGroupId', validateAuth.checkPermission('NHOM_QUYEN_XOA'), controller.deleteItem);
router.patch('/change-status/:newStatus/:roleGroupId', validateAuth.checkPermission('NHOM_QUYEN_SUA'), controller.changeStatus);
router.get('/permissions', validateAuth.checkPermission('PHAN_QUYEN'), controller.permissions);
router.patch('/permissions/update', validateAuth.checkPermission('PHAN_QUYEN'), controller.updatePermissions);

module.exports = router;