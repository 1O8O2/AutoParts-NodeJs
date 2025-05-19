const generate = require('./generateToken');

class OTPManager {
    static generateOTP(length = 6) {
        return generate.generateRandomNumber(length);
    }

    static setOTPCookie(res, otp, email, expiresInMinutes = 5) {
        // Store OTP in cookie
        res.cookie('otp', otp, { 
            maxAge: expiresInMinutes * 60 * 1000, // Convert minutes to milliseconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
            sameSite: 'strict'
        });

        // Store email in cookie for reference
        res.cookie('otp_email', email, {
            maxAge: expiresInMinutes * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }

    static verifyOTP(req, inputOTP) {
        const storedOTP = req.cookies.otp;
        const email = req.cookies.otp_email;

        if (!storedOTP || !email) {
            return {
                isValid: false,
                message: 'OTP has expired or is invalid'
            };
        }

        if (storedOTP !== inputOTP) {
            return {
                isValid: false,
                message: 'Invalid OTP'
            };
        }

        return {
            isValid: true,
            email: email
        };
    }

    static clearOTPCookies(res) {
        res.clearCookie('otp');
        res.clearCookie('otp_email');
    }
}

module.exports = OTPManager;