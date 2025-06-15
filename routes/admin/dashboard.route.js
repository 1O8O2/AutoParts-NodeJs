const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/dashboardController');
const validateAuth = require('../../middlewares/admin/validate.middleware');


router.get('/statistic', validateAuth.checkPermission('THONG_KE'), controller.statistic);
router.get('/profile', controller.profile);
router.post('/profile/edit/:userEmail', controller.editProfile);
router.post('/profile/changePass/:userEmail', controller.changePass);

module.exports = router;