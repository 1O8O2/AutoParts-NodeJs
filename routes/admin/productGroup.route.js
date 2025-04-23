const express = require('express');
const router = express.Router();
const productGroupController = require('../../controller/admin/productGroupController');

// Product Group routes
router.get('/', productGroupController.index);
router.get('/add', productGroupController.add);
router.post('/add', productGroupController.addPost);
router.get('/delete', productGroupController.delete);
router.post('/changeStatus', productGroupController.changeStatus);

module.exports = router; 