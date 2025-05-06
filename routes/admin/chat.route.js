// filepath: c:\Users\hung\Documents\GitHub\AutoParts-NodeJs\routes\admin\chat.route.js
const express = require('express');
const router = express.Router();

const controller = require('../../controller/admin/chatController');
const validateAuth = require('../../middlewares/admin/validate.middleware');

router.get('/', validateAuth.checkPermission('CHAT_XEM'), controller.index);
router.get('/check-new-messages', validateAuth.checkPermission('CHAT_XEM'), controller.checkNewMessages);
router.get('/:customerEmail', validateAuth.checkPermission('CHAT_XEM'), controller.chatRoom);
router.post('/send', validateAuth.checkPermission('CHAT_XEM'), controller.sendMessage);
router.get('/messages/:customerEmail', validateAuth.checkPermission('CHAT_XEM'), controller.getMessages);

module.exports = router;