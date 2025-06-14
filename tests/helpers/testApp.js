const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');

/**
 * Tạo Express app đơn giản cho testing
 */
function createTestApp() {
    const app = express();
    
    // Cấu hình view engine
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, '../../views'));
    
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Cookie và session
    app.use(cookieParser(process.env.COOKIE_SECRET || 'test-secret'));
    app.use(session({
        secret: process.env.COOKIE_SECRET || 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
    }));
    app.use(flash());
      // Mock middleware cho messages
    app.use((req, res, next) => {
        res.locals.messages = {
            ACCOUNT_CREATE_ERROR: 'Lỗi tạo tài khoản',
            LOADING_ERROR: 'Lỗi tải dữ liệu',
            PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
            ADD_TO_CART_SUCCESS: 'Thêm vào giỏ hàng thành công',
            INVALID_PRODUCT_NUMBER: 'Số lượng sản phẩm không hợp lệ'
        };
        next();
    });    // Mock render method for controllers that render views
    app.use((req, res, next) => {
        const originalRender = res.render;
        const originalRedirect = res.redirect;
        
        res.render = function(view, data) {
            res.status(200).json({ 
                view: view, 
                data: data,
                success: true 
            });
        };
        
        // Fix deprecated 'back' redirects for testing
        res.redirect = function(location) {
            if (location === 'back') {
                const referer = req.get('Referrer') || '/';
                return originalRedirect.call(this, referer);
            }
            return originalRedirect.call(this, location);
        };
        
        next();
    });
    
    return app;
}

module.exports = { createTestApp };
