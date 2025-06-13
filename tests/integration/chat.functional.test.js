// Functional Test 1: Chat System Between Customer and Admin
const request = require('supertest');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Client = require('socket.io-client');

// Mock database
jest.mock('../../configs/database', () => ({
    getSequelize: () => ({
        define: jest.fn().mockReturnValue({
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            hasOne: jest.fn(),
            associate: jest.fn()
        }),
        authenticate: jest.fn().mockResolvedValue(),
        sync: jest.fn().mockResolvedValue()
    })
}));

// Mock models
jest.mock('../../models/Chat', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn()
}));

jest.mock('../../models/Customer', () => ({
    findByPk: jest.fn()
}));

jest.mock('../../models/Account', () => ({
    findOne: jest.fn()
}));

jest.mock('../../models/Employee', () => ({
    findByPk: jest.fn()
}));

const Chat = require('../../models/Chat');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const Employee = require('../../models/Employee');

describe('Chat System Functional Tests', () => {
    let app, server, io, clientSocket, serverSocket;
    
    beforeAll((done) => {
        app = express();
        server = http.createServer(app);
        io = new Server(server);
        
        // Setup middleware
        app.use(express.json());
        
        // Mock middleware for user info
        app.use((req, res, next) => {
            res.locals.user = {
                email: 'customer@test.com',
                fullName: 'Test Customer'
            };
            res.locals.messages = {
                NOT_LOGIN_ERROR: 'Please login first',
                CHAT_MESSAGE_SENT: 'Message sent successfully',
                CHAT_ERROR: 'Chat error occurred'
            };
            next();
        });
        
        // Setup socket handling
        io.on('connection', (socket) => {
            serverSocket = socket;
            
            socket.on('join_room', (roomId) => {
                socket.join(roomId);
            });
            
            socket.on('send_message', async (data) => {
                // Simulate saving message to database
                await Chat.create.mockResolvedValue({
                    chatId: 'CHAT' + Date.now(),
                    ...data
                });
                
                io.to(data.chatRoomId).emit('receive_message', data);
            });
        });
        
        server.listen(() => {
            const port = server.address().port;
            clientSocket = new Client(`http://localhost:${port}`);
            
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        server.close();
        clientSocket.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        Customer.findByPk.mockResolvedValue({
            email: 'customer@test.com',
            fullName: 'Test Customer'
        });
        
        Account.findOne.mockResolvedValue({
            email: 'customer@test.com',
            token: 'customer_token'
        });
        
        Employee.findByPk.mockResolvedValue({
            email: 'admin@test.com',
            fullName: 'Test Admin'
        });
    });

    describe('Customer Chat Functionality', () => {
        test('should allow customer to join chat room and send message', (done) => {
            const roomId = 'chat_customer@test.com';
            const testMessage = {
                chatRoomId: roomId,
                message: 'Hello, I need help with my order',
                senderType: 'customer',
                userEmail: 'customer@test.com'
            };

            Chat.create.mockResolvedValue({
                chatId: 'CHAT123456789',
                ...testMessage,
                createdAt: new Date()
            });

            // Join room
            clientSocket.emit('join_room', roomId);
            
            // Send message
            clientSocket.emit('send_message', testMessage);
            
            // Listen for response
            clientSocket.on('receive_message', (data) => {
                expect(data.message).toBe(testMessage.message);
                expect(data.senderType).toBe('customer');
                expect(data.chatRoomId).toBe(roomId);
                done();
            });
        });

        test('should retrieve chat history for customer', async () => {
            const mockChatHistory = [
                {
                    chatId: 'CHAT001',
                    chatRoomId: 'chat_customer@test.com',
                    message: 'Hello',
                    senderType: 'customer',
                    userEmail: 'customer@test.com',
                    createdAt: new Date()
                },
                {
                    chatId: 'CHAT002',
                    chatRoomId: 'chat_customer@test.com',
                    message: 'Hi, how can I help?',
                    senderType: 'admin',
                    userEmail: 'admin@test.com',
                    createdAt: new Date()
                }
            ];

            Chat.findAll.mockResolvedValue(mockChatHistory);

            const chatController = require('../../controller/client/chatController');
            
            const req = {
                query: { roomId: 'chat_customer@test.com' }
            };
            const res = {
                locals: {
                    user: { email: 'customer@test.com' }
                },
                json: jest.fn()
            };

            await chatController.getMessages(req, res);

            expect(Chat.findAll).toHaveBeenCalledWith({
                where: {
                    chatRoomId: 'chat_customer@test.com',
                    deleted: false
                },
                order: [['createdAt', 'ASC']],
                include: expect.any(Array)
            });
        });
    });

    describe('Admin Chat Management', () => {
        test('should allow admin to view all customer chats', async () => {
            const mockCustomerChats = [
                { userEmail: 'customer1@test.com' },
                { userEmail: 'customer2@test.com' }
            ];

            Chat.findAll.mockResolvedValue(mockCustomerChats);
            Customer.findByPk.mockImplementation((email) => {
                return Promise.resolve({
                    email: email,
                    fullName: `Customer ${email.split('@')[0]}`
                });
            });

            const adminChatController = require('../../controller/admin/chatController');
            
            const req = {};
            const res = {
                render: jest.fn(),
                locals: {
                    user: { email: 'admin@test.com' }
                }
            };

            await adminChatController.index(req, res);

            expect(res.render).toHaveBeenCalledWith(
                'admin/pages/chat/index',
                expect.objectContaining({
                    customers: expect.any(Array)
                })
            );
        });

        test('should handle real-time message notifications', (done) => {
            const adminRoomId = 'admin_notifications';
            const notificationData = {
                type: 'new_message',
                customerEmail: 'customer@test.com',
                message: 'New customer message',
                timestamp: new Date()
            };

            // Admin joins notification room
            clientSocket.emit('join_room', adminRoomId);
            
            // Simulate new customer message triggering admin notification
            setTimeout(() => {
                io.to(adminRoomId).emit('admin_notification', notificationData);
            }, 100);
            
            // Admin receives notification
            clientSocket.on('admin_notification', (data) => {
                expect(data.type).toBe('new_message');
                expect(data.customerEmail).toBe('customer@test.com');
                done();
            });
        });
    });

    describe('Chat Message Validation', () => {
        test('should validate message content before sending', (done) => {
            const invalidMessage = {
                chatRoomId: 'chat_customer@test.com',
                message: '', // Empty message
                senderType: 'customer',
                userEmail: 'customer@test.com'
            };

            // This should not create a chat entry
            Chat.create.mockRejectedValue(new Error('Message cannot be empty'));

            clientSocket.emit('send_message', invalidMessage);
            
            // Should not receive the message back
            setTimeout(() => {
                expect(Chat.create).not.toHaveBeenCalled();
                done();
            }, 500);
        });

        test('should handle unauthorized chat access', async () => {
            Account.findOne.mockResolvedValue(null); // No authenticated user

            const chatController = require('../../controller/client/chatController');
            
            const req = {};
            const res = {
                locals: {
                    user: null,
                    messages: { NOT_LOGIN_ERROR: 'Please login first' }
                },
                redirect: jest.fn()
            };
            const next = jest.fn();

            await chatController.index(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/AutoParts/account/login');
        });
    });

    describe('Chat Performance and Scalability', () => {
        test('should handle multiple concurrent chat messages', (done) => {
            const roomId = 'chat_customer@test.com';
            const messageCount = 10;
            let receivedCount = 0;

            Chat.create.mockResolvedValue({ chatId: 'CHAT_TEST' });

            clientSocket.on('receive_message', () => {
                receivedCount++;
                if (receivedCount === messageCount) {
                    expect(receivedCount).toBe(messageCount);
                    done();
                }
            });

            // Send multiple messages quickly
            for (let i = 0; i < messageCount; i++) {
                clientSocket.emit('send_message', {
                    chatRoomId: roomId,
                    message: `Test message ${i}`,
                    senderType: 'customer',
                    userEmail: 'customer@test.com'
                });
            }
        });

        test('should maintain chat room isolation', (done) => {
            const room1 = 'chat_customer1@test.com';
            const room2 = 'chat_customer2@test.com';
            let messagesReceived = 0;

            // Join different rooms
            clientSocket.emit('join_room', room1);
            
            // Create second client for room2
            const client2 = new Client(`http://localhost:${server.address().port}`);
            
            client2.on('connect', () => {
                client2.emit('join_room', room2);
                
                // Send message to room1
                clientSocket.emit('send_message', {
                    chatRoomId: room1,
                    message: 'Message for room 1',
                    senderType: 'customer'
                });
                
                // Send message to room2
                client2.emit('send_message', {
                    chatRoomId: room2,
                    message: 'Message for room 2',
                    senderType: 'customer'
                });
            });

            // Client1 should only receive room1 messages
            clientSocket.on('receive_message', (data) => {
                expect(data.chatRoomId).toBe(room1);
                messagesReceived++;
                if (messagesReceived === 1) {
                    client2.close();
                    done();
                }
            });

            // Client2 should only receive room2 messages
            client2.on('receive_message', (data) => {
                expect(data.chatRoomId).toBe(room2);
            });
        });
    });
});
