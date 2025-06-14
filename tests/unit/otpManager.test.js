/**
 * Unit Test: Quản lý Mã OTP
 * Mục đích: Kiểm thử module quản lý Mã xác thực một lần (OTP - One-Time Password).
 * 
 * Chức năng chính được kiểm thử:
 * - Tạo mã OTP với độ dài tùy chỉnh
 * - Xác thực mã OTP do người dùng nhập
 * - Lưu trữ mã OTP trong cookies
 * - Quản lý thời gian hết hạn của OTP
 */

const OTPManager = require('../../helpers/otpManager');

// Mock the generateToken module
jest.mock('../../helpers/generateToken', () => ({
    generateRandomNumber: jest.fn().mockReturnValue('123456')
}));

describe('Unit Test: Quản lý Mã OTP', () => {
    describe('Chức năng tạo mã OTP', () => {
        test('[TC-OTP-001] Tạo OTP với độ dài mặc định (6 chữ số)', () => {
            const otp = OTPManager.generateOTP();
            
            expect(otp).toBe('123456');
            expect(otp.length).toBe(6);
        });

        test('[TC-OTP-002] Tạo OTP với độ dài tùy chỉnh theo yêu cầu', () => {
            const { generateRandomNumber } = require('../../helpers/generateToken');
            generateRandomNumber.mockReturnValue('12345');
            
            const otp = OTPManager.generateOTP(5);
            
            expect(generateRandomNumber).toHaveBeenCalledWith(5);
            expect(otp).toBe('12345');
        });
    });

    describe('Chức năng xác thực mã OTP', () => {
        test('[TC-OTP-003] Xác thực thành công khi OTP nhập vào trùng khớp', () => {
            const mockReq = {
                cookies: {
                    otp: '123456',
                    otp_email: 'test@example.com'
                }
            };

            const result = OTPManager.verifyOTP(mockReq, '123456');

            expect(result.isValid).toBe(true);
            expect(result.email).toBe('test@example.com');
            expect(result.message).toBeUndefined();
        });

        test('[TC-OTP-004] Xác thực thất bại khi OTP nhập vào sai', () => {
            const mockReq = {
                cookies: {
                    otp: '123456',
                    otp_email: 'test@example.com'
                }
            };

            const result = OTPManager.verifyOTP(mockReq, '654321');

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('Invalid OTP');
            expect(result.email).toBeUndefined();
        });

        test('should return invalid result when no stored OTP', () => {
            const mockReq = {
                cookies: {}
            };

            const result = OTPManager.verifyOTP(mockReq, '123456');

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('OTP has expired or is invalid');
            expect(result.email).toBeUndefined();
        });

        test('should return invalid result when no email stored', () => {
            const mockReq = {
                cookies: {
                    otp: '123456'
                    // otp_email missing
                }
            };

            const result = OTPManager.verifyOTP(mockReq, '123456');

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('OTP has expired or is invalid');
        });

        test('should return invalid result when stored OTP is null', () => {
            const mockReq = {
                cookies: {
                    otp: null,
                    otp_email: 'test@example.com'
                }
            };

            const result = OTPManager.verifyOTP(mockReq, '123456');

            expect(result.isValid).toBe(false);
            expect(result.message).toBe('OTP has expired or is invalid');
        });
    });

    describe('clearOTPCookies', () => {
        test('should call clearCookie for both otp and otp_email', () => {
            const mockRes = {
                clearCookie: jest.fn()
            };

            OTPManager.clearOTPCookies(mockRes);

            expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
            expect(mockRes.clearCookie).toHaveBeenCalledWith('otp');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('otp_email');
        });
    });

    describe('setOTPCookie', () => {
        test('should set both OTP and email cookies with correct options', () => {
            const mockRes = {
                cookie: jest.fn()
            };

            OTPManager.setOTPCookie(mockRes, '123456', 'test@example.com', 5);

            expect(mockRes.cookie).toHaveBeenCalledTimes(2);
            
            // Check OTP cookie
            expect(mockRes.cookie).toHaveBeenCalledWith('otp', '123456', {
                maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
                httpOnly: true,
                secure: false, // process.env.NODE_ENV !== 'production'
                sameSite: 'strict'
            });

            // Check email cookie
            expect(mockRes.cookie).toHaveBeenCalledWith('otp_email', 'test@example.com', {
                maxAge: 5 * 60 * 1000,
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            });
        });

        test('should use default expiration time of 5 minutes', () => {
            const mockRes = {
                cookie: jest.fn()
            };

            OTPManager.setOTPCookie(mockRes, '123456', 'test@example.com');

            // Default should be 5 minutes = 300000 milliseconds
            expect(mockRes.cookie).toHaveBeenCalledWith('otp', '123456', expect.objectContaining({
                maxAge: 300000
            }));
        });
    });
});
