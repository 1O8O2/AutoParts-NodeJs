const express = require('express');
const router = express.Router();

const controller = require('../../controller/ProductController')

router.get('/productdetail', controller.showProduct);
router.post('/add', controller.addProduct);
router.get('/search', controller.showFilter);


module.exports = router;