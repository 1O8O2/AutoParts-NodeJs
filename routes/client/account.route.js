const express = require('express');
const router = express.Router();

const controller = require('../../controller/AccountController');
const {loginAuth} = require('../../middlewares/loginAuth.middleware');


router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);
router.post('/register', controller.register);
router.get('/register', controller.showRegister);
router.get('/profile',loginAuth, controller.showProfile);
router.post('/edit', loginAuth,controller.accountEdit);
router.post('/changePass',loginAuth, controller.changePassword);


module.exports = router;