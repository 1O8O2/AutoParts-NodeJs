const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/authController')

router.get('/login', controller.login);
router.post('/login', controller.loginPost);
router.get('/logout', controller.logout);
router.get('/access-denied', controller.accessDenied);

module.exports = router;