const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
require('dotenv').config();

class SessionManager {
    constructor() {
        this.cookieSecret = process.env.COOKIE_SECRET || 'keyword';
        this.sessionConfig = {
            cookie: { maxAge: 86400000 }, // 24 hours (1 day)
            resave: false,
            saveUninitialized: true,
            secret: this.cookieSecret
        };
    }

    initialize(app) {
        app.use(cookieParser(this.cookieSecret));
        app.use(session(this.sessionConfig));
        app.use(flash());
        
        return app;
    }
    
    getSessionConfig() {
        return this.sessionConfig;
    }
    
    updateSessionConfig(newConfig) {
        this.sessionConfig = { ...this.sessionConfig, ...newConfig };
        return this.sessionConfig;
    }

    setCookieMaxAge(maxAge) {
        this.sessionConfig.cookie.maxAge = maxAge;
        return this.sessionConfig;
    }
}

class SessionManagerSingleton {
    static instance = null;
    static isCreating = false;

    constructor() {
        // Ngăn chặn việc tạo instance trực tiếp
        throw new Error('Use SessionManagerSingleton.getInstance() to create instance');
    }

    static getInstance() {
        // Double-checked locking pattern cho thread safety
        if (!SessionManagerSingleton.instance) {
            // Kiểm tra xem có process nào đang tạo instance không
            if (SessionManagerSingleton.isCreating) {
                // Chờ cho đến khi instance được tạo xong
                while (SessionManagerSingleton.isCreating) {
                    // Sử dụng setImmediate để yield control
                    require('util').promisify(setImmediate)();
                }
                return SessionManagerSingleton.instance;
            }

            // Đánh dấu đang trong quá trình tạo instance
            SessionManagerSingleton.isCreating = true;
            
            try {
                // Double check lại một lần nữa sau khi acquire lock
                if (!SessionManagerSingleton.instance) {
                    SessionManagerSingleton.instance = new SessionManager();
                }
            } finally {
                // Đảm bảo flag được reset dù có lỗi hay không
                SessionManagerSingleton.isCreating = false;
            }
        }
        
        return SessionManagerSingleton.instance;
    }

    // Method để reset instance (hữu ích cho testing)
    static resetInstance() {
        SessionManagerSingleton.instance = null;
        SessionManagerSingleton.isCreating = false;
    }

    // Method để kiểm tra xem instance đã được tạo chưa
    static hasInstance() {
        return SessionManagerSingleton.instance !== null;
    }
}

module.exports = SessionManagerSingleton.getInstance();