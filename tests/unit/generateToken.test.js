/**
 * Unit Test: Hàm Tạo Chuỗi/Số Ngẫu nhiên
 * Mục đích: Kiểm thử các hàm tiện ích dùng để tạo token và chuỗi/số ngẫu nhiên.
 * 
 * Chức năng chính được kiểm thử:
 * - generateRandomString(): Tạo chuỗi ngẫu nhiên với độ dài tùy chỉnh
 * - generateRandomNumber(): Tạo chuỗi số ngẫu nhiên
 */

const { generateRandomString, generateRandomNumber } = require('../../helpers/generateToken');

describe('Unit Test: Hàm Tạo Chuỗi/Số Ngẫu nhiên', () => {
    describe('Kiểm thử generateRandomString()', () => {
        test('[TC-TOKEN-001] Kiểm tra độ dài chuỗi sinh ra có đúng với yêu cầu', () => {
            const length = 10;
            const result = generateRandomString(length);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBe(length);
        });

        test('[TC-TOKEN-002] Đảm bảo mỗi lần gọi hàm tạo ra kết quả khác nhau (tính ngẫu nhiên)', () => {
            const length = 8;
            const result1 = generateRandomString(length);
            const result2 = generateRandomString(length);
            
            expect(result1).not.toBe(result2);
        });

        test('[TC-TOKEN-003] Xác thực ký tự hợp lệ (chỉ chứa ký tự chữ và số - alphanumeric)', () => {
            const result = generateRandomString(50);
            const validPattern = /^[A-Za-z0-9]+$/;
            
            expect(validPattern.test(result)).toBe(true);
        });

        test('[TC-TOKEN-004] Kiểm thử với trường hợp đặc biệt - độ dài chuỗi bằng 1', () => {
            const result = generateRandomString(1);
            
            expect(result.length).toBe(1);
            expect(typeof result).toBe('string');
        });

        test('[TC-TOKEN-005] Đánh giá hiệu suất khi tạo chuỗi với độ dài lớn', () => {
            const length = 1000;
            const startTime = performance.now();
            const result = generateRandomString(length);
            const endTime = performance.now();
            
            expect(result.length).toBe(length);
            expect(endTime - startTime).toBeLessThan(100); // Phải hoàn thành trong 100ms
        });
    });

    describe('Kiểm thử generateRandomNumber()', () => {
        test('[TC-TOKEN-006] Kiểm tra độ dài chuỗi số sinh ra có đúng với yêu cầu', () => {
            const length = 6;
            const result = generateRandomNumber(length);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBe(length);
        });

        test('should only contain numeric characters', () => {
            const result = generateRandomNumber(10);
            const numericPattern = /^[0-9]+$/;
            
            expect(numericPattern.test(result)).toBe(true);
        });

        test('should generate different numbers on multiple calls', () => {
            const length = 6;
            const result1 = generateRandomNumber(length);
            const result2 = generateRandomNumber(length);
            
            // While there's a small chance they could be the same, it's very unlikely
            expect(result1).not.toBe(result2);
        });

        test('should handle edge case with length 1', () => {
            const result = generateRandomNumber(1);
            
            expect(result.length).toBe(1);
            expect(/^[0-9]$/.test(result)).toBe(true);
        });

        test('should be usable as OTP (6 digits)', () => {
            const otp = generateRandomNumber(6);
            
            expect(otp.length).toBe(6);
            expect(/^\d{6}$/.test(otp)).toBe(true);
        });
    });
});
