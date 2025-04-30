const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/orderController')

router.get('/add', controller.add);
router.post('/add', controller.addPost);
router.get('/:status', controller.index);
router.get('/edit/:orderId', controller.edit);
router.patch('/edit/:orderId', controller.editPatch);
router.get('/detail/:orderId', controller.detail);
router.patch('/changeStatus', controller.changeStatus);

module.exports = router;