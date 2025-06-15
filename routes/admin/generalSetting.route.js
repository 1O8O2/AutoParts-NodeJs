const express = require('express');
const router = express.Router();
const controller = require('../../controller/admin/generalSettingController');
const validateAuth = require('../../middlewares/admin/validate.middleware');

const multer = require('multer');
const path = require('path');

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

router.get('/', validateAuth.checkPermission('CAI_DAT_CHUNG_XEM'), controller.index);
router.post('/update', validateAuth.checkPermission('CAI_DAT_CHUNG_SUA'), upload.single('logoFile'), controller.update);

module.exports = router;