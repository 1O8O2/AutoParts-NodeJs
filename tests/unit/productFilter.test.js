/**
 * Unit Test: Logic Lọc Sản phẩm
 * Mục đích: Kiểm thử logic lọc sản phẩm dựa trên các tiêu chí khác nhau.
 * 
 * Chức năng chính được kiểm thử:
 * - Lọc sản phẩm theo thương hiệu
 * - Lọc sản phẩm theo danh mục
 * - Lọc sản phẩm kết hợp nhiều tiêu chí (ví dụ: cả thương hiệu và danh mục)
 * - Đảm bảo hiển thị tất cả sản phẩm khi không có tiêu chí lọc nào được áp dụng
 */

// Test the product filtering logic based on the client-side filter function
describe('Unit Test: Logic Lọc Sản phẩm', () => {
    // Mock product data structure
    const createMockProduct = (brand, category, name = 'Test Product') => ({
        brand,
        category,
        name,
        getAttribute: function(attr) {
            if (attr === 'data-brand') return this.brand;
            if (attr === 'data-category') return this.category;
            return null;
        }
    });

    const mockProducts = [
        createMockProduct('Toyota', 'Engine', 'Toyota Engine Part'),
        createMockProduct('Honda', 'Brake', 'Honda Brake Pad'),
        createMockProduct('Toyota', 'Brake', 'Toyota Brake Disc'),
        createMockProduct('Ford', 'Engine', 'Ford Engine Component'),
        createMockProduct('Honda', 'Engine', 'Honda Engine Oil'),
        createMockProduct('BMW', 'Transmission', 'BMW Gearbox'),
    ];

    // Simulate the filtering logic from filterproduct.js
    function filterProducts(products, selectedBrand = '', selectedCategory = '') {
        if (!Array.isArray(products)) {
            throw new Error('Danh sách sản phẩm không hợp lệ');
        }
        
        return products.filter(product => {
            const productBrand = product.getAttribute('data-brand');
            const productCategory = product.getAttribute('data-category');
            
            const brandMatch = !selectedBrand || productBrand === selectedBrand;
            const categoryMatch = !selectedCategory || productCategory === selectedCategory;
            
            return brandMatch && categoryMatch;
        });
    }

    describe('Chức năng lọc theo thương hiệu', () => {
        test('[TC-FILTER-001] Hiển thị chính xác tất cả sản phẩm khi không có bộ lọc', () => {
            const result = filterProducts(mockProducts);
            
            expect(result).toHaveLength(6);
            expect(result).toEqual(mockProducts);
        });

        test('[TC-FILTER-002] Lọc sản phẩm theo thương hiệu Toyota', () => {
            const result = filterProducts(mockProducts, 'Toyota');
            
            expect(result).toHaveLength(2);
            expect(result.every(p => p.brand === 'Toyota')).toBe(true);
        });

        test('should filter products by Honda brand', () => {
            const result = filterProducts(mockProducts, 'Honda');
            
            expect(result).toHaveLength(2);
            expect(result.every(p => p.brand === 'Honda')).toBe(true);
        });

        test('should return empty array for non-existent brand', () => {
            const result = filterProducts(mockProducts, 'Mazda');
            
            expect(result).toHaveLength(0);
        });
    });

    describe('Category filtering', () => {
        test('should filter products by Engine category', () => {
            const result = filterProducts(mockProducts, '', 'Engine');
            
            expect(result).toHaveLength(3);
            expect(result.every(p => p.category === 'Engine')).toBe(true);
        });

        test('should filter products by Brake category', () => {
            const result = filterProducts(mockProducts, '', 'Brake');
            
            expect(result).toHaveLength(2);
            expect(result.every(p => p.category === 'Brake')).toBe(true);
        });

        test('should return empty array for non-existent category', () => {
            const result = filterProducts(mockProducts, '', 'Suspension');
            
            expect(result).toHaveLength(0);
        });
    });

    describe('Combined filtering', () => {
        test('should filter by both brand and category', () => {
            const result = filterProducts(mockProducts, 'Toyota', 'Brake');
            
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe('Toyota');
            expect(result[0].category).toBe('Brake');
        });

        test('should return empty array when combination does not match', () => {
            const result = filterProducts(mockProducts, 'BMW', 'Brake');
            
            expect(result).toHaveLength(0);
        });

        test('should filter Honda Engine products', () => {
            const result = filterProducts(mockProducts, 'Honda', 'Engine');
            
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe('Honda');
            expect(result[0].category).toBe('Engine');
            expect(result[0].name).toBe('Honda Engine Oil');
        });
    });

    describe('Edge cases', () => {
        test('should handle empty product array', () => {
            const result = filterProducts([], 'Toyota', 'Engine');
            
            expect(result).toHaveLength(0);
            expect(Array.isArray(result)).toBe(true);
        });

        test('should handle null/undefined brand filter', () => {
            const result1 = filterProducts(mockProducts, null, 'Engine');
            const result2 = filterProducts(mockProducts, undefined, 'Engine');
            
            expect(result1).toHaveLength(3);
            expect(result2).toHaveLength(3);
        });

        test('should handle empty string filters (show all)', () => {
            const result = filterProducts(mockProducts, '', '');
            
            expect(result).toHaveLength(6);
            expect(result).toEqual(mockProducts);
        });

        test('should be case-sensitive for brand and category matching', () => {
            const result1 = filterProducts(mockProducts, 'toyota', 'Engine'); // lowercase
            const result2 = filterProducts(mockProducts, 'Toyota', 'engine'); // lowercase
            
            expect(result1).toHaveLength(0);
            expect(result2).toHaveLength(0);
        });
    });

    describe('Performance and data integrity', () => {
        test('should not modify original products array', () => {
            const originalLength = mockProducts.length;
            const originalFirstProduct = { ...mockProducts[0] };
            
            filterProducts(mockProducts, 'Toyota');
            
            expect(mockProducts).toHaveLength(originalLength);
            expect(mockProducts[0]).toEqual(originalFirstProduct);
        });

        test('should return new array instance', () => {
            const result = filterProducts(mockProducts);
            
            expect(result).not.toBe(mockProducts);
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
