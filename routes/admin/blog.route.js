const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/blogController');

const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/', validateAuth.checkPermission('QUAN_LY_BAI_VIET_XEM'), controller.index);
router.get('/add', validateAuth.checkPermission('QUAN_LY_BAI_VIET_THEM'), controller.add);
router.post('/add', validateAuth.checkPermission('QUAN_LY_BAI_VIET_THEM'), controller.addPost);
router.get('/edit/:blogId', validateAuth.checkPermission('QUAN_LY_BAI_VIET_SUA'), controller.edit);
router.patch('/edit/:blogId', validateAuth.checkPermission('QUAN_LY_BAI_VIET_SUA'), controller.editPatch);
router.delete('/delete/:blogId', validateAuth.checkPermission('QUAN_LY_BAI_VIET_XOA'), controller.deleteItem);
router.patch('/change-status/:newStatus/:blogId', validateAuth.checkPermission('QUAN_LY_BAI_VIET_SUA'), controller.changeStatus);
router.get('/detail/:blogId', validateAuth.checkPermission('QUAN_LY_BAI_VIET_XEM'), controller.detail);

module.exports = router;