const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/discountController')

router.get('/', controller.index);
router.get('/add', controller.add);
router.post('/add', controller.addPost);
router.get('/edit/:discountId', controller.edit);
router.patch('/edit/:discountId', controller.editPatch);
router.delete('/delete/:discountId', controller.deleteItem);
router.patch('/change-status/:newStatus/:discountId', controller.changeStatus);
router.get('/detail/:discountId', controller.detail);

module.exports = router;