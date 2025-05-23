const express = require('express');
const router = express.Router();
const productController = require('../../controller/admin/productController');
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
router.get('/', productController.index);
router.get('/add', productController.add);
router.post('/add', upload.array('imageFiles'), productController.addPost);
router.get('/edit', productController.edit);
router.post('/edit', upload.array('imageFiles'), productController.editPost);
router.delete('/delete/:productId', productController.delete);
router.get('/detail', productController.detail);
router.post('/changeStatus', productController.changeStatus);


// Import routes
router.get('/import', productController.import);
router.get('/import/add', productController.importAdd);
router.post('/import/add', productController.importAddPost);
router.get('/import/detail/:importId', productController.importDetail);

module.exports = router; 