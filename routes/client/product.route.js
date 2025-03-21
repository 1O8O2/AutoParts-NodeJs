const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/productController')

router.get('/productDetail', controller.showProduct);
router.post('/add', controller.addProduct);
router.get('/search', controller.showFilter);


module.exports = router;