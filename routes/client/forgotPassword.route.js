const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/forgotPasswordController');

router.get('/', controller.showForgotPassword);
router.post('/', controller.forgotPassword);
router.get('/enter-otp', controller.showEnterOtp);
router.post('/otpVerify', controller.otpVerify);
router.get('/enter-password', controller.showEnterPassword);
router.post('/updatePassword', controller.updatePassword);

module.exports = router;