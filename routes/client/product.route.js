const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/productController')

router.get('/detail', controller.showProduct);
router.post('/add', controller.addProduct);
router.get('/search', controller.showFilter);
router.get('/remove', controller.deleteProduct);


module.exports = router;