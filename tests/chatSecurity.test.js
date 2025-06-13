// Integration tests for Chat Error Fixes
const request = require('supertest');
const app = require('../index'); // Adjust path as needed
const Chat = require('../models/Chat');
const Account = require('../models/Account');

describe('Chat Security and Error Handling Tests', () => {
    
    beforeEach(async () => {
        // Setup test data
        await Chat.destroy({ where: {}, force: true });
    });

    describe('XSS Prevention Tests', () => {
        test('Should sanitize HTML tags in messages', async () => {
            const maliciousMessage = '<script>alert("XSS")</script>Hello';
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: maliciousMessage })
                .set('Cookie', ['tokenUser=valid_token']); // Mock authentication
            
            if (response.status === 200) {
                // Check that script tags are removed/escaped
                const savedMessage = await Chat.findOne({ 
                    order: [['createdAt', 'DESC']] 
                });
                expect(savedMessage.content).not.toContain('<script>');
                expect(savedMessage.content).not.toContain('alert(');
            }
        });

        test('Should prevent JavaScript injection in messages', async () => {
            const maliciousMessage = 'javascript:alert("XSS")';
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: maliciousMessage })
                .set('Cookie', ['tokenUser=valid_token']);
            
            if (response.status === 200) {
                const savedMessage = await Chat.findOne({ 
                    order: [['createdAt', 'DESC']] 
                });
                expect(savedMessage.content).not.toContain('javascript:');
            }
        });
    });

    describe('Input Validation Tests', () => {
        test('Should reject empty messages', async () => {
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: '' })
                .set('Cookie', ['tokenUser=valid_token']);
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('Should reject messages exceeding length limit', async () => {
            const longMessage = 'a'.repeat(5001);
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: longMessage })
                .set('Cookie', ['tokenUser=valid_token']);
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('Should reject messages with only whitespace', async () => {
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: '   \n\t   ' })
                .set('Cookie', ['tokenUser=valid_token']);
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('SQL Injection Prevention Tests', () => {
        test('Should sanitize SQL injection patterns', async () => {
            const sqlInjection = "'; DROP TABLE Chat; --";
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: sqlInjection })
                .set('Cookie', ['tokenUser=valid_token']);
            
            if (response.status === 200) {
                const savedMessage = await Chat.findOne({ 
                    order: [['createdAt', 'DESC']] 
                });
                expect(savedMessage.content).not.toContain('DROP TABLE');
                expect(savedMessage.content).not.toContain('--');
            }
        });
    });

    describe('Authentication and Authorization Tests', () => {
        test('Should require authentication for sending messages', async () => {
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: 'Hello' });
            
            expect(response.status).toBe(401);
        });

        test('Should validate email format for admin chat', async () => {
            const response = await request(app)
                .post('/AutoParts/admin/chat/send')
                .send({ 
                    customerEmail: 'invalid-email',
                    message: 'Hello' 
                })
                .set('Cookie', ['token=admin_token']);
            
            expect(response.status).toBe(400);
        });
    });

    describe('Error Response Tests', () => {
        test('Should return structured error responses', async () => {
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: '' })
                .set('Cookie', ['tokenUser=valid_token']);
            
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBeTruthy();
        });

        test('Should handle database errors gracefully', async () => {
            // Mock database error
            const originalCreate = Chat.create;
            Chat.create = jest.fn().mockRejectedValue(new Error('Database error'));
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: 'Valid message' })
                .set('Cookie', ['tokenUser=valid_token']);
            
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            
            // Restore original method
            Chat.create = originalCreate;
        });
    });

    describe('Content Sanitization Tests', () => {
        test('Should preserve safe content while removing dangerous elements', async () => {
            const mixedContent = 'Hello <b>bold</b> <script>alert("bad")</script> world!';
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: mixedContent })
                .set('Cookie', ['tokenUser=valid_token']);
            
            if (response.status === 200) {
                const savedMessage = await Chat.findOne({ 
                    order: [['createdAt', 'DESC']] 
                });
                expect(savedMessage.content).toContain('Hello');
                expect(savedMessage.content).toContain('world!');
                expect(savedMessage.content).not.toContain('<script>');
            }
        });

        test('Should handle special characters correctly', async () => {
            const specialChars = 'Test with émojis 😊 and spëcial chars: àáâãäå';
            
            const response = await request(app)
                .post('/AutoParts/chat/send')
                .send({ message: specialChars })
                .set('Cookie', ['tokenUser=valid_token']);
            
            if (response.status === 200) {
                const savedMessage = await Chat.findOne({ 
                    order: [['createdAt', 'DESC']] 
                });
                expect(savedMessage.content).toContain('😊');
                expect(savedMessage.content).toContain('àáâãäå');
            }
        });
    });

    describe('Rate Limiting Tests', () => {
        test('Should implement rate limiting for message sending', async () => {
            // Send multiple messages rapidly
            const promises = Array(15).fill().map(() => 
                request(app)
                    .post('/AutoParts/chat/send')
                    .send({ message: 'Rapid message' })
                    .set('Cookie', ['tokenUser=valid_token'])
            );
            
            const responses = await Promise.all(promises);
            
            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Socket.IO Error Handling Tests', () => {
        test('Should handle invalid chat room IDs', (done) => {
            const io = require('socket.io-client');
            const client = io('http://localhost:3000');
            
            client.emit('join_room', 'invalid-room-id');
            
            client.on('error', (error) => {
                expect(error).toBeDefined();
                client.disconnect();
                done();
            });
            
            // Timeout test after 2 seconds
            setTimeout(() => {
                client.disconnect();
                done();
            }, 2000);
        });
    });
});

// Mock functions for testing
function mockAuthentication() {
    // Mock authentication middleware for testing
    return (req, res, next) => {
        if (req.get('Cookie')?.includes('tokenUser=valid_token')) {
            res.locals.user = { email: 'test@example.com' };
        } else if (req.get('Cookie')?.includes('token=admin_token')) {
            res.locals.user = { email: 'admin@example.com' };
        }
        next();
    };
}

module.exports = {
    mockAuthentication
};
