const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/accountController');

router.get('/login', controller.showLogIn);
router.post('/login', controller.logIn);
router.get('/register', controller.showRegister);
router.post('/register', controller.register);
router.get('/profile', controller.showProfile);
router.post('/edit', controller.accountEdit);
router.post('/changePass', controller.changePassword);
router.get('/logout', controller.logOut);

module.exports = router;