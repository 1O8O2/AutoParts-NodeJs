const { generateRandomString, generateRandomNumber } = require('../helpers/generateToken');

describe('generateToken helper functions', () => {
    describe('generateRandomString', () => {
        test('should generate string with correct length', () => {
            const length = 10;
            const result = generateRandomString(length);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBe(length);
        });

        test('should generate different strings on multiple calls', () => {
            const length = 8;
            const result1 = generateRandomString(length);
            const result2 = generateRandomString(length);
            
            expect(result1).not.toBe(result2);
        });

        test('should only contain valid characters (alphanumeric)', () => {
            const result = generateRandomString(50);
            const validPattern = /^[A-Za-z0-9]+$/;
            
            expect(validPattern.test(result)).toBe(true);
        });

        test('should handle edge case with length 1', () => {
            const result = generateRandomString(1);
            
            expect(result.length).toBe(1);
            expect(typeof result).toBe('string');
        });

        test('should handle large length values', () => {
            const length = 100;
            const result = generateRandomString(length);
            
            expect(result.length).toBe(length);
        });
    });

    describe('generateRandomNumber', () => {
        test('should generate string with correct length', () => {
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
