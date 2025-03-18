const express = require('express');
const router = express.Router();

const controller = require('../../controller/AccountController');
const {loginAuth} = require('../../middlewares/loginAuth.middleware');


router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);
router.post('/register', controller.register);
router.get('/register', controller.showRegister);
router.get('/profile', controller.showProfile);
router.post('/edit', controller.accountEdit);
router.post('/changePass', controller.changePassword);
router.get('/logout', controller.LogOut);


module.exports = router;