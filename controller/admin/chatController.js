const Chat = require("../../models/Chat");
const Customer = require("../../models/Customer");
const Account = require("../../models/Account");
const { Op, literal } = require("sequelize");
const systemConfig = require("../../configs/system");

// [GET] /AutoParts/admin/chat
module.exports.index = async (req, res) => {
    try {
        // Get unique customer emails who have chats
        const uniqueCustomers = await Chat.findAll({
            attributes: [
                [literal('DISTINCT userEmail'), 'userEmail']
            ],
            where: {
                deleted: false,
                senderType: 'customer' // Only get customers who have sent messages
            },
            include: [{
                model: Account,
                attributes: [],  // Don't select Account.email in the main query
                where: {
                    permission: 'RG002' // Customer permission
                }
            }],
            raw: true
        });

        // Get customer details
        const customers = await Promise.all(
            uniqueCustomers.map(async chat => {
                const customer = await Customer.findByPk(chat.userEmail);
                
                // Count unread messages from this customer
                const unreadCount = await Chat.count({
                    where: {
                        chatRoomId: `chat_${chat.userEmail}`,
                        senderType: 'customer',
                        status: 'Unread',
                        deleted: false
                    }
                });
                
                if (customer) {
                    customer.unreadCount = unreadCount;
                }
                
                return customer;
            })
        );

        res.render('admin/pages/chat/index', {
            pageTitle: "Chat với khách hàng",
            customers: customers.filter(customer => customer !== null)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/chat/:customerEmail
module.exports.chatRoom = async (req, res) => {
    try {
        const customerEmail = req.params.customerEmail;
        
        // Find customer details
        const customer = await Customer.findByPk(customerEmail);
        if (!customer) {
            req.flash('error', 'Không tìm thấy khách hàng');
            return res.redirect(`${systemConfig.prefixAdmin}/chat`);
        }

        // Get chat messages for this customer
        const messages = await Chat.findAll({
            where: {
                chatRoomId: `chat_${customerEmail}`,
                deleted: false
            },
            order: [['createdAt', 'ASC']]
        });

        // Mark customer's messages as read when admin views them
        const unreadMessages = messages.filter(message => 
            message.senderType === 'customer' && 
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

        // Pass the chat room ID for socket.io connection
        const chatRoomId = `chat_${customerEmail}`;

        res.render('admin/pages/chat/chatRoom', {
            pageTitle: `Chat với ${customer.fullName}`,
            customer: customer,
            messages: messages,
            adminEmail: res.locals.user.email,
            chatRoomId: chatRoomId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [POST] /AutoParts/admin/chat/send
module.exports.sendMessage = async (req, res) => {
    try {
        const { customerEmail, message } = req.body;
        if (!customerEmail || !message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin tin nhắn' });
        }

        // Create chat message
        const chatMessage = await Chat.create({
            userEmail: res.locals.user.email,
            chatRoomId: `chat_${customerEmail}`,
            content: message,
            senderType: 'employee',
            status: 'Unread', // Set to unread for customer to see
            deleted: false
        });

        // Get the io instance
        const io = req.app.get('socketio');
        
        // Emit the message to the chat room
        io.to(`chat_${customerEmail}`).emit('receive_message', {
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

// [GET] /AutoParts/admin/chat/messages/:customerEmail
module.exports.getMessages = async (req, res) => {
    try {
        const customerEmail = req.params.customerEmail;
        
        // Get latest messages
        const messages = await Chat.findAll({
            where: {
                chatRoomId: `chat_${customerEmail}`,
                deleted: false
            },
            order: [['createdAt', 'ASC']]
        });

        // Mark customer's messages as read when admin fetches them via AJAX
        const unreadMessages = messages.filter(message => 
            message.senderType === 'customer' && 
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
            adminEmail: res.locals.user.email
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// [GET] /AutoParts/admin/chat/check-new-messages
module.exports.checkNewMessages = async (req, res) => {
    try {
        // Find all customer messages where status is "Unread"
        const unreadMessages = await Chat.findAll({
            where: {
                status: 'Unread',
                senderType: 'customer',
                deleted: false
            },
            include: [{
                model: Account,
                attributes: ['email'],
                where: {
                    permission: 'RG002' // Customer permission
                }
            }]
        });

        return res.status(200).json({
            success: true,
            hasNewMessages: unreadMessages.length > 0,
            count: unreadMessages.length
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};