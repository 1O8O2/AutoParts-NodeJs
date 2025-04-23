const express = require('express');
const router = express.Router();
const employeeController = require('../../controller/admin/employeeController');
const userMiddleware = require('../../middlewares/admin/user.middleware');

router.get('/', userMiddleware.infoUser, employeeController.index);
router.get('/detail', userMiddleware.infoUser, employeeController.detail);
router.get('/add', userMiddleware.infoUser, employeeController.add);
router.post('/add', userMiddleware.infoUser, employeeController.addPost);
router.get('/edit', userMiddleware.infoUser, employeeController.edit);
router.post('/edit', userMiddleware.infoUser, employeeController.editPatch);
router.post('/changeStatus', userMiddleware.infoUser, employeeController.changeStatus);

module.exports = router; 