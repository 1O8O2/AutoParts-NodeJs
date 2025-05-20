// Models
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');

const {mailSend} = require('../../helpers/mail');
const OTPManager = require('../../helpers/otpManager');

// [GET] forgot-password
module.exports.showForgotPassword = async (req, res) => {
  res.render('client/pages/forgot-password/forgot-password', { message: req.session.message });
};

// [POST] forgot-password
module.exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    req.session.message = 'Email là bắt buộc';
    return res.render('client/pages/forgot-password/forgot-password', { message: req.session.message });
  }

  try {
    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      req.session.message = 'Email không đúng';
      return res.render('client/pages/forgot-password/forgot-password', { message: req.session.message });
    }

    // Generate OTP
    const otp = OTPManager.generateOTP();
    
    // Send OTP via email
    const from = 'no-reply@autopart.com';
    const to = email;
    const subject = 'Khôi phục mật khẩu';
    const html = `
        Chào bạn,<br><br>
        Mã OTP để khôi phục mật khẩu của bạn là: <strong>${otp}</strong><br>
        Vui lòng sử dụng mã này để đặt lại mật khẩu. Mã OTP có hiệu lực trong 5 phút.<br><br>
        Trân trọng,<br>
        Đội ngũ AutoPart
    `;
    
    await mailSend(from, to, subject, html);
    
    // Store OTP in cookie
    OTPManager.setOTPCookie(res, otp, email);

    req.session.message = null; // Clear message on success
    return res.redirect('forgot-password/enter-otp');
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.render('client/pages/forgot-password/forgot-password', { message: 'Đã có lỗi xảy ra, vui lòng thử lại!' });
  }
};

// [POST] resend-otp
module.exports.resendOtp = async (req, res) => {
  const email = req.cookies.otp_email;

  if (!email) {
    req.session.message = 'Email không tồn tại trong phiên làm việc';
    return res.redirect('/AutoParts/forgot-password');
  }

  try {
    const otp = OTPManager.generateOTP();
    const from = 'no-reply@autopart.com';
    const to = email;
    const subject = 'Khôi phục mật khẩu';
    const html = `
        Chào bạn,<br><br>
        Mã OTP để khôi phục mật khẩu của bạn là: <strong>${otp}</strong><br>
        Vui lòng sử dụng mã này để đặt lại mật khẩu. Mã OTP có hiệu lực trong 5 phút.<br><br>
        Trân trọng,<br>
        Đội ngũ AutoPart
    `;
    
    await mailSend(from, to, subject, html);
    
    // Store new OTP in cookie
    OTPManager.setOTPCookie(res, otp, email);
    
    req.session.message = null;
    return res.redirect('/AutoParts/forgot-password/enter-otp');
  } catch (error) {
    console.error('Resend OTP error:', error);
    req.session.message = 'Đã có lỗi xảy ra, vui lòng thử lại!';
    return res.redirect('/AutoParts/forgot-password/enter-otp');
  }
};

// [GET] enter-otp
module.exports.showEnterOtp = async (req, res) => {
  res.render('client/pages/forgot-password/enter-otp', { message: req.session.message });
};

// [POST] otpVerify
module.exports.otpVerify = async (req, res) => {
  const { otp } = req.body;
  
  if (!otp) {
    req.session.message = 'Mã OTP là bắt buộc';
    return res.redirect('/AutoParts/forgot-password/enter-otp');
  }

  const verification = OTPManager.verifyOTP(req, otp);
  
  if (!verification.isValid) {
    req.session.message = verification.message;
    return res.redirect('/AutoParts/forgot-password/enter-otp');
  }

  // Clear OTP cookies after successful verification
  // OTPManager.clearOTPCookies(res);
  
  req.session.message = null;
  return res.redirect('/AutoParts/forgot-password/enter-password');
};

// [GET] enter-password
module.exports.showEnterPassword = async (req, res) => {
  res.render('client/pages/forgot-password/enter-password', { message: req.session.message });
};

// [POST] forgot-password/updatePassword
module.exports.updatePassword = async (req, res) => {
  
    const { password, confirmPassword } = req.body;
    const email = req.cookies.otp_email;

    // Validate input
    if (!password || !confirmPassword) {
        req.session.message = 'Mật khẩu và xác nhận mật khẩu là bắt buộc';
        return res.redirect('/AutoParts/forgot-password/enter-password');
    }

    if (password.length < 6) {
        req.session.message = 'Mật khẩu phải có ít nhất 6 ký tự';
        return res.redirect('/AutoParts/forgot-password/enter-password');
    }

    if (password !== confirmPassword) {
        req.session.message = 'Mật khẩu xác nhận không khớp';
        return res.redirect('/AutoParts/forgot-password/enter-password');
    }

    try {
        // Find the account
        const account = await Account.findOne({ where: { email } });

        if (!account) {
            req.session.message = 'Tài khoản không tồn tại';
            return res.redirect('/AutoParts/forgot-password/enter-password');
        }

        // Update password
        const md5 = require('md5');
        await Account.update(
            { password: md5(password) },
            { where: { email } }
        );

        // Clear any remaining OTP cookies
        OTPManager.clearOTPCookies(res);

        req.flash('success', 'Thay đổi mật khẩu thành công!');
        return res.redirect('/AutoParts/account/login');
    } catch (error) {
        console.error('Update password error:', error);
        req.session.message = 'Đã có lỗi xảy ra, vui lòng thử lại!';
        return res.redirect('/AutoParts/forgot-password/enter-password');
    }
};


