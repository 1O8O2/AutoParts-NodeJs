const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/discountController');

const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_XEM'), controller.index);
router.get('/add', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_THEM'), controller.add);
router.post('/add', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_THEM'), controller.addPost);
router.get('/edit/:discountId', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_SUA'), controller.edit);
router.patch('/edit/:discountId', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_SUA'), controller.editPatch);
router.delete('/delete/:discountId', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_XOA'), controller.deleteItem);
router.patch('/change-status/:newStatus/:discountId', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_SUA'), controller.changeStatus);
router.get('/detail/:discountId', validateAuth.checkPermission('QUAN_LY_KHUYEN_MAI_XEM'), controller.detail);

module.exports = router;