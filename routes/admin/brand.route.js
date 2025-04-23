const express = require('express');
const router = express.Router();
const brandController = require('../../controller/admin/brandController');

// Brand routes
router.get('/', brandController.index);
router.get('/add', brandController.add);
router.post('/add', brandController.addPost);
router.get('/edit', brandController.edit);
router.post('/edit', brandController.editPatch);
router.get('/delete', brandController.delete);
router.post('/changeStatus', brandController.changeStatus);

module.exports = router; 