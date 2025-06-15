const Chat = require("../../models/Chat");
const Customer = require("../../models/Customer");
const Account = require("../../models/Account");
const { Op, literal } = require("sequelize");
const systemConfig = require("../../configs/system");

// [GET] /AutoParts/admin/chat
module.exports.index = async (req, res) => {
    try {
        // Get unique customer emails who have chats
        const uniqueChats = await Chat.findAll({
            attributes: ['userEmail'],
            where: {
                deleted: false,
                senderType: 'customer' // Only get customers who have sent messages
            },
            group: ['userEmail'],
            raw: true
        });
        console.log('Unique customer chats:', uniqueChats);        // Get customer details and verify they are actual customers
        const customers = [];
        for (const chat of uniqueChats) {
            // Check if this userEmail has an account (any permission level)
            const account = await Account.findOne({
                where: {
                    email: chat.userEmail,
                    deleted: false
                }
            });

            if (account) {
                const customer = await Customer.findByPk(chat.userEmail);
                
                if (customer) {
                    // Count unread messages from this customer
                    const unreadCount = await Chat.count({
                        where: {
                            chatRoomId: `chat_${chat.userEmail}`,
                            senderType: 'customer',
                            status: 'Unread',
                            deleted: false
                        }
                    });
                    
                    customer.unreadCount = unreadCount;
                    customer.accountPermission = account.permission; // Add permission info for debugging
                    customers.push(customer);
                }
            }
        }

        res.render('admin/pages/chat/index', {
            pageTitle: "Chat với khách hàng",
            customers: customers
        });
    } catch (err) {
        console.error('Error in admin chat index:', err);
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/chat/:customerEmail
module.exports.chatRoom = async (req, res) => {
    try {
        const customerEmail = req.params.customerEmail;
        console.log('Accessing chat room for customer:', customerEmail);
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
        // We need to check the userEmail against Account table to ensure it's a customer
        const unreadMessages = await Chat.findAll({
            where: {
                status: 'Unread',
                senderType: 'customer',
                deleted: false
            }
        });        // Filter messages from users with valid accounts (any permission)
        const customerMessages = [];
        for (const message of unreadMessages) {
            const account = await Account.findOne({
                where: {
                    email: message.userEmail,
                    deleted: false
                }
            });
            
            // Also check if they have a Customer profile
            const customer = await Customer.findByPk(message.userEmail);
            
            if (account && customer) {
                customerMessages.push(message);
            }
        }

        return res.status(200).json({
            success: true,
            hasNewMessages: customerMessages.length > 0,
            count: customerMessages.length
        });
    } catch (err) {
        console.error('Error in checkNewMessages:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};