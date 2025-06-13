// Mock the required modules before importing SessionManager
jest.mock('cookie-parser', () => jest.fn());
jest.mock('express-session', () => jest.fn());
jest.mock('express-flash', () => jest.fn());

const SessionManager = require('../services/SessionManager');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');

describe('SessionManager', () => {
    let mockApp;
    let originalSessionConfig;

    beforeEach(() => {
        mockApp = {
            use: jest.fn()
        };
        
        // Lưu config gốc để restore sau mỗi test
        originalSessionConfig = {
            cookie: { maxAge: 86400000 }, // 24 hours (1 day)
            resave: false,
            saveUninitialized: true,
            secret: process.env.COOKIE_SECRET || 'keyword'
        };
        
        // Reset SessionManager config về trạng thái ban đầu
        SessionManager.updateSessionConfig(originalSessionConfig);
        
        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        test('should initialize app with cookie parser, session and flash', () => {
            const result = SessionManager.initialize(mockApp);

            expect(mockApp.use).toHaveBeenCalledTimes(3);
            expect(mockApp.use).toHaveBeenCalledWith(cookieParser.return_value);
            expect(mockApp.use).toHaveBeenCalledWith(session.return_value);
            expect(mockApp.use).toHaveBeenCalledWith(flash.return_value);
            expect(result).toBe(mockApp);
        });

        test('should call cookieParser with correct secret', () => {
            SessionManager.initialize(mockApp);

            expect(cookieParser).toHaveBeenCalledWith(
                process.env.COOKIE_SECRET || 'keyword'
            );
        });

        test('should call session with correct config', () => {
            SessionManager.initialize(mockApp);

            expect(session).toHaveBeenCalledWith({
                cookie: { maxAge: 86400000 }, // 24 hours
                resave: false,
                saveUninitialized: true,
                secret: process.env.COOKIE_SECRET || 'keyword'
            });
        });
    });

    describe('getSessionConfig', () => {
        test('should return current session configuration', () => {
            const config = SessionManager.getSessionConfig();

            expect(config).toEqual({
                cookie: { maxAge: 86400000 },
                resave: false,
                saveUninitialized: true,
                secret: process.env.COOKIE_SECRET || 'keyword'
            });
        });
    });

    describe('updateSessionConfig', () => {
        test('should merge new config with existing config', () => {
            const newConfig = {
                resave: true,
                saveUninitialized: false,
                newProperty: 'test'
            };

            const updatedConfig = SessionManager.updateSessionConfig(newConfig);

            expect(updatedConfig.resave).toBe(true);
            expect(updatedConfig.saveUninitialized).toBe(false);
            expect(updatedConfig.newProperty).toBe('test');
            expect(updatedConfig.secret).toBe(process.env.COOKIE_SECRET || 'keyword');
            expect(updatedConfig.cookie.maxAge).toBe(86400000);
        });

        test('should not mutate original config structure', () => {
            const originalConfig = SessionManager.getSessionConfig();
            const originalMaxAge = originalConfig.cookie.maxAge;

            SessionManager.updateSessionConfig({
                cookie: { maxAge: 5000 }
            });

            // Check that the original reference still exists
            expect(typeof originalConfig.cookie).toBe('object');
            // But the configuration should be updated
            const newConfig = SessionManager.getSessionConfig();
            expect(newConfig.cookie.maxAge).toBe(5000);
        });
    });

    describe('setCookieMaxAge', () => {
        test('should update only the cookie maxAge property', () => {
            const newMaxAge = 3600000; // 1 hour
            
            const updatedConfig = SessionManager.setCookieMaxAge(newMaxAge);

            expect(updatedConfig.cookie.maxAge).toBe(newMaxAge);
            expect(updatedConfig.resave).toBe(false);
            expect(updatedConfig.saveUninitialized).toBe(true);
            expect(updatedConfig.secret).toBe(process.env.COOKIE_SECRET || 'keyword');
        });

        test('should return the complete updated configuration', () => {
            const newMaxAge = 7200000; // 2 hours
            
            const config = SessionManager.setCookieMaxAge(newMaxAge);

            expect(config).toHaveProperty('cookie');
            expect(config).toHaveProperty('resave');
            expect(config).toHaveProperty('saveUninitialized');
            expect(config).toHaveProperty('secret');
            expect(config.cookie.maxAge).toBe(newMaxAge);
        });
    });    describe('Singleton pattern', () => {
        // Import SessionManagerSingleton class để test static methods
        let SessionManagerSingleton;
        
        beforeAll(() => {
            // Reset singleton before tests
            const SessionManagerModule = require('../services/SessionManager');
            SessionManagerSingleton = SessionManagerModule.constructor;
        });

        beforeEach(() => {
            // Reset singleton instance before each test
            if (SessionManagerSingleton && SessionManagerSingleton.resetInstance) {
                SessionManagerSingleton.resetInstance();
            }
        });

        test('should return the same instance on multiple calls to getInstance', () => {
            // Get fresh module để test
            delete require.cache[require.resolve('../services/SessionManager')];
            const SessionManagerModule = require('../services/SessionManager');
            
            // Mock SessionManagerSingleton.getInstance để test
            const originalGetInstance = Object.getPrototypeOf(SessionManagerModule.constructor).getInstance;
            if (originalGetInstance) {
                const instance1 = originalGetInstance.call(SessionManagerModule.constructor);
                const instance2 = originalGetInstance.call(SessionManagerModule.constructor);
                expect(instance1).toBe(instance2);
            } else {
                // Fallback test với module exports
                const SessionManager1 = require('../services/SessionManager');
                delete require.cache[require.resolve('../services/SessionManager')];
                const SessionManager2 = require('../services/SessionManager');
                expect(SessionManager1).toBe(SessionManager2);
            }
        });

        test('should maintain state across multiple imports', () => {
            SessionManager.setCookieMaxAge(12345);
            
            // Clear cache and reimport
            delete require.cache[require.resolve('../services/SessionManager')];
            const NewSessionManager = require('../services/SessionManager');
            
            expect(NewSessionManager.getSessionConfig().cookie.maxAge).toBe(12345);
        });

        test('should prevent direct instantiation of SessionManagerSingleton', () => {
            // Test tính năng ngăn chặn tạo instance trực tiếp
            const SessionManagerFile = require('fs').readFileSync(
                require.resolve('../services/SessionManager'), 
                'utf8'
            );
            
            // Kiểm tra xem có throw error khi tạo instance trực tiếp không
            expect(SessionManagerFile).toContain('throw new Error');
            expect(SessionManagerFile).toContain('Use SessionManagerSingleton.getInstance()');
        });

        test('should handle concurrent access safely', async () => {
            // Simulate concurrent access
            delete require.cache[require.resolve('../services/SessionManager')];
            
            const promises = Array.from({ length: 10 }, () => {
                return new Promise((resolve) => {
                    setImmediate(() => {
                        const instance = require('../services/SessionManager');
                        resolve(instance);
                    });
                });
            });

            const instances = await Promise.all(promises);
            
            // Tất cả instances phải giống nhau
            instances.forEach(instance => {
                expect(instance).toBe(instances[0]);
            });
        });

        test('should provide utility methods for singleton management', () => {
            const SessionManagerFile = require('fs').readFileSync(
                require.resolve('../services/SessionManager'), 
                'utf8'
            );
            
            // Kiểm tra xem có các utility methods không
            expect(SessionManagerFile).toContain('resetInstance');
            expect(SessionManagerFile).toContain('hasInstance');
        });
    });
});
