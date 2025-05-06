// filepath: c:\Users\hung\Documents\GitHub\AutoParts-NodeJs\controller\client\chatController.js
const Chat = require("../../models/Chat");
const Employee = require("../../models/Employee");
const Account = require("../../models/Account");
const { Op } = require("sequelize");
const systemConfig = require("../../configs/system");

// [GET] /AutoParts/chat
module.exports.index = async (req, res) => {
    try {
        if (!res.locals.user) {
            req.flash('error', res.locals.messages.NOT_LOGIN_ERROR);
            return res.redirect('/AutoParts/account/login');
        }

        // Get chat messages for this customer
        const messages = await Chat.findAll({
            where: {
                chatRoomId: `chat_${res.locals.user.email}`,
                deleted: false
            },
            order: [['createdAt', 'ASC']],
            include: [{
                model: Account,
                required: false
            }]
        });

        // Mark admin's/employee's messages as read when customer views them
        const unreadMessages = messages.filter(message => 
            message.senderType !== 'customer' && 
            message.status === 'Unread'
        );
        
        if (unreadMessages.length > 0) {
            for (const message of unreadMessages) {
                await Chat.update(
                    { status: 'Read' },
                    { where: { messageId: message.messageId } }
                );
            }
        }

        // Pass socket.io data for the client
        const chatRoomId = `chat_${res.locals.user.email}`;

        res.render('client/pages/chat/index', {
            pageTitle: "Hỗ trợ trực tuyến",
            messages: messages,
            chatRoomId: chatRoomId,
            userEmail: res.locals.user.email
        });
    } catch (err) {
        console.error(err);
        req.flash('error', res.locals.messages.SERVER_ERROR);
        return res.redirect('back');
    }
};

// [POST] /AutoParts/chat/send
module.exports.sendMessage = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập' });
        }

        const { message } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Thiếu nội dung tin nhắn' });
        }

        // Create chat message
        const chatMessage = await Chat.create({
            userEmail: res.locals.user.email,
            chatRoomId: `chat_${res.locals.user.email}`,
            content: message,
            senderType: 'customer',
            status: 'Unread',
            deleted: false
        });

        // Get the io instance
        const io = req.app.get('socketio');
        
        // Emit the message to the chat room
        io.to(`chat_${res.locals.user.email}`).emit('receive_message', {
            messageId: chatMessage.messageId,
            userEmail: chatMessage.userEmail,
            chatRoomId: chatMessage.chatRoomId,
            content: chatMessage.content,
            senderType: chatMessage.senderType,
            createdAt: chatMessage.createdAt,
            status: chatMessage.status
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// [GET] /AutoParts/chat/messages
module.exports.getMessages = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập' });
        }
        
        // Get latest messages
        const messages = await Chat.findAll({
            where: {
                chatRoomId: `chat_${res.locals.user.email}`,
                deleted: false
            },
            order: [['createdAt', 'ASC']]
        });

        // Mark admin's/employee's messages as read when customer fetches them via AJAX
        const unreadMessages = messages.filter(message => 
            message.senderType !== 'customer' && 
            message.status === 'Unread'
        );
        
        if (unreadMessages.length > 0) {
            for (const message of unreadMessages) {
                await Chat.update(
                    { status: 'Read' },
                    { where: { messageId: message.messageId } }
                );
            }
        }

        return res.status(200).json({
            success: true,
            messages: messages,
            customerEmail: res.locals.user.email
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};