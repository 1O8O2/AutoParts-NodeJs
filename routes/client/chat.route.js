// filepath: c:\Users\hung\Documents\GitHub\AutoParts-NodeJs\routes\client\chat.route.js
const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/chatController');
const userMiddleware = require('../../middlewares/client/user.middleware');

router.get('/', userMiddleware.infoUser, controller.index);
router.post('/send', userMiddleware.infoUser, controller.sendMessage);
router.get('/messages', userMiddleware.infoUser, controller.getMessages);

module.exports = router;