const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/orderController');

router.post('/create', controller.createOrder);
router.get('/detail', controller.showDetail);
router.get('/cancel', controller.cancel);
router.get('/', controller.showCart);



module.exports = router;