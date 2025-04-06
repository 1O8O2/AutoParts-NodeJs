const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/blogController')

router.get('/', controller.index);
router.get('/add', controller.add);
router.post('/add', controller.addPost);
router.get('/edit/:blogId', controller.edit);
router.patch('/edit/:blogId', controller.editPatch);
router.delete('/delete/:blogId', controller.deleteItem);
router.patch('/change-status/:newStatus/:blogId', controller.changeStatus);
router.get('/detail/:blogId', controller.detail);

module.exports = router;