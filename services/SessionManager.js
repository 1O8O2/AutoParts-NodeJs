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
    constructor() {
        if (!SessionManagerSingleton.instance) {
            SessionManagerSingleton.instance = new SessionManager();
        }
    }

    getInstance() {
        return SessionManagerSingleton.instance;
    }
}

module.exports = new SessionManagerSingleton().getInstance();