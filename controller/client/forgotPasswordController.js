// Models
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');

const {mailSend} = require('../../helpers/mail');

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const from = 'no-reply@autopart.com'
    const to = email;
    const subject = 'Khôi phục mật khẩu';
    const html = `
        Chào bạn,<br><br>
        Mã OTP để khôi phục mật khẩu của bạn là: <strong>${otp}</strong><br>
        Vui lòng sử dụng mã này để đặt lại mật khẩu. Mã OTP có hiệu lực trong 5 phút.<br><br>
        Trân trọng,<br>
        Đội ngũ AutoPart
      `
    await mailSend(from, to, subject, html);
    //await transporter.sendMail(mailOptions);
    req.session.otp = otp;
    req.session.recoveringMail = email;
    console.log(req.session.otp)

    req.session.message = null; // Clear message on success
    return res.redirect('forgot-password/enter-otp');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.session.message = 'Đã có lỗi xảy ra, vui lòng thử lại!';
    return res.render('client/pages/forgot-password/forgot-password', { message: req.session.message });
  }
};

// [GET] enter-otp
module.exports.showEnterOtp = async (req, res) => {
    // req.session.otp = "766504";
    // console.log(req.session.otp)
  res.render('client/pages/forgot-password/enter-otp', { message: req.session.message });
};

// [POST] otpVerify
module.exports.otpVerify = async (req, res) => {
  const { otp } = req.body;
    
  if (!otp) {
    req.session.message = 'Mã OTP là bắt buộc';
    return res.redirect('forgot-password/enter-otp');
  }

  if (otp === req.session.otp) {
    req.session.message = null; // Clear message on success
    return res.redirect('enter-password');
  } else {
    console.log('OTP verification failed:', otp, req.session.otp);
    req.session.message = 'Mã OTP không đúng';
    return res.redirect('forgot-password/enter-otp');
  }
};

// [GET] enter-password
module.exports.showEnterPassword = async (req, res) => {
    // req.session.recoveringMail = "mail";
    // console.log(req.session.recoveringMail)
  res.render('client/pages/forgot-password/enter-password', { message: req.session.message });
};

// [POST] forgot-password/updatePassword
module.exports.updatePassword = async (req, res) => {
//   const { password, confirmPassword } = req.body;
//   const email = req.session.recoveringMail;

//   if (!password || !confirmPassword) {
//     req.session.message = 'Mật khẩu và xác nhận mật khẩu là bắt buộc';
//     return res.redirect('enter-password');
//   }

//   if (password !== confirmPassword) {
//     req.session.message = 'Mật khẩu xác nhận không khớp';
//     return res.redirect('enter-password');
//   }

  try {
//     const account = await Account.findOne({ where: { email } });

//     if (!account) {
//       req.session.message = 'Tài khoản không tồn tại';
//       return res.redirect('enter-password');
//     }

//     await Account.update(
//       { password },
//       { where: { email } }
//     );

    req.flash('success', 'Thay đổi mật khẩu thành công!');
//     req.session.otp = null; // Clear OTP
//     req.session.recoveringMail = null; // Clear email
    return res.redirect('/AutoParts/account/login');
  } catch (error) {
    console.error('Update password error:', error);
    req.session.message = 'Đã có lỗi xảy ra, vui lòng thử lại!';
    return res.redirect('enter-password');
  }
};