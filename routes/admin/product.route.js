const express = require('express');
const router = express.Router();
const productController = require('../../controller/admin/productController');
const validateAuth = require('../../middlewares/admin/validate.middleware');

const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/img/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Chỉ được upload file ảnh!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// Product routes
router.get('/', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_XEM'), productController.index);
router.get('/add', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_THEM'), productController.add);
router.post('/add', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_THEM'), upload.array('imageFiles'), productController.addPost);
router.get('/edit', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_SUA'), productController.edit);
router.post('/edit', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_SUA'), upload.array('imageFiles'), productController.editPost);
router.delete('/delete/:productId', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_XOA'), productController.delete);
router.get('/detail', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_XEM'), productController.detail);
router.post('/changeStatus', validateAuth.checkPermission('QUAN_LY_SAN_PHAM_SUA'), productController.changeStatus);


// Import routes
router.get('/import', validateAuth.checkPermission('PHIEU_NHAP_XEM'), productController.import);
router.get('/import/add', validateAuth.checkPermission('PHIEU_NHAP_THEM'), productController.importAdd);
router.post('/import/add', validateAuth.checkPermission('PHIEU_NHAP_THEM'), productController.importAddPost);
router.get('/import/detail/:importId', validateAuth.checkPermission('PHIEU_NHAP_XEM'), productController.importDetail);

module.exports = router; 