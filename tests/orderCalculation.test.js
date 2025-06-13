// Test order calculation logic based on the admin order form
describe('Order Calculation Logic', () => {
    // Mock product data
    const createMockProduct = (productId, productName, salePrice, quantity = 1) => ({
        productId,
        productName,
        salePrice,
        quantity
    });

    // Simulate the calculation logic from adminjs/order/order.js
    class OrderCalculator {
        constructor() {
            this.selectedProducts = [];
            this.baseTotal = 0;
        }

        addProduct(product) {
            const existingIndex = this.selectedProducts.findIndex(p => p.productId === product.productId);
            
            if (existingIndex !== -1) {
                this.selectedProducts[existingIndex].quantity += product.quantity;
            } else {
                this.selectedProducts.push({ ...product });
            }
            
            this.updateBaseTotal();
        }

        removeProduct(productId) {
            this.selectedProducts = this.selectedProducts.filter(p => p.productId !== productId);
            this.updateBaseTotal();
        }

        updateQuantity(productId, newQuantity) {
            const product = this.selectedProducts.find(p => p.productId === productId);
            if (product) {
                product.quantity = parseInt(newQuantity) || 1;
                this.updateBaseTotal();
            }
        }

        updateBaseTotal() {
            this.baseTotal = this.selectedProducts.reduce((sum, product) => {
                return sum + (product.salePrice * product.quantity);
            }, 0);
        }

        calculateTotal(discountAmount = 0, shippingCost = 0) {
            let total = this.baseTotal;
            
            // Apply discount percentage
            if (discountAmount > 0) {
                total *= (100 - discountAmount) / 100;
            }
            
            // Add shipping cost after discount
            total += shippingCost;
            
            return total;
        }

        validateDiscount(discount, orderTotal) {
            if (!discount) return false;
            
            const currentDate = new Date();
            const applyStart = new Date(discount.applyStartDate);
            const applyEnd = new Date(discount.applyEndDate);
            
            return (
                orderTotal >= discount.minimumAmount &&
                discount.status === 'Active' &&
                currentDate >= applyStart &&
                currentDate <= applyEnd &&
                discount.usageLimit > 0
            );
        }

        getOrderSummary() {
            return {
                products: [...this.selectedProducts],
                baseTotal: this.baseTotal,
                productCount: this.selectedProducts.length,
                totalQuantity: this.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
            };
        }
    }

    describe('Product Management', () => {
        test('should add product to order', () => {
            const calculator = new OrderCalculator();
            const product = createMockProduct('P001', 'Engine Oil', 50000, 2);
            
            calculator.addProduct(product);
            
            expect(calculator.selectedProducts).toHaveLength(1);
            expect(calculator.selectedProducts[0]).toEqual(product);
            expect(calculator.baseTotal).toBe(100000); // 50000 * 2
        });

        test('should increase quantity when adding same product', () => {
            const calculator = new OrderCalculator();
            const product1 = createMockProduct('P001', 'Engine Oil', 50000, 2);
            const product2 = createMockProduct('P001', 'Engine Oil', 50000, 1);
            
            calculator.addProduct(product1);
            calculator.addProduct(product2);
            
            expect(calculator.selectedProducts).toHaveLength(1);
            expect(calculator.selectedProducts[0].quantity).toBe(3);
            expect(calculator.baseTotal).toBe(150000); // 50000 * 3
        });

        test('should remove product from order', () => {
            const calculator = new OrderCalculator();
            const product1 = createMockProduct('P001', 'Engine Oil', 50000, 2);
            const product2 = createMockProduct('P002', 'Brake Pad', 30000, 1);
            
            calculator.addProduct(product1);
            calculator.addProduct(product2);
            calculator.removeProduct('P001');
            
            expect(calculator.selectedProducts).toHaveLength(1);
            expect(calculator.selectedProducts[0].productId).toBe('P002');
            expect(calculator.baseTotal).toBe(30000);
        });

        test('should update product quantity', () => {
            const calculator = new OrderCalculator();
            const product = createMockProduct('P001', 'Engine Oil', 50000, 2);
            
            calculator.addProduct(product);
            calculator.updateQuantity('P001', 5);
            
            expect(calculator.selectedProducts[0].quantity).toBe(5);
            expect(calculator.baseTotal).toBe(250000); // 50000 * 5
        });

        test('should handle invalid quantity update', () => {
            const calculator = new OrderCalculator();
            const product = createMockProduct('P001', 'Engine Oil', 50000, 2);
            
            calculator.addProduct(product);
            calculator.updateQuantity('P001', 'invalid');
            
            expect(calculator.selectedProducts[0].quantity).toBe(1); // fallback to 1
            expect(calculator.baseTotal).toBe(50000);
        });
    });

    describe('Price Calculations', () => {
        test('should calculate total without discount and shipping', () => {
            const calculator = new OrderCalculator();
            calculator.addProduct(createMockProduct('P001', 'Engine Oil', 50000, 2));
            calculator.addProduct(createMockProduct('P002', 'Brake Pad', 30000, 1));
            
            const total = calculator.calculateTotal();
            
            expect(total).toBe(130000); // (50000*2) + (30000*1)
        });

        test('should apply discount correctly', () => {
            const calculator = new OrderCalculator();
            calculator.addProduct(createMockProduct('P001', 'Engine Oil', 100000, 1));
            
            const totalWith10Percent = calculator.calculateTotal(10); // 10% discount
            const totalWith20Percent = calculator.calculateTotal(20); // 20% discount
            
            expect(totalWith10Percent).toBe(90000); // 100000 * 0.9
            expect(totalWith20Percent).toBe(80000); // 100000 * 0.8
        });

        test('should add shipping cost after discount', () => {
            const calculator = new OrderCalculator();
            calculator.addProduct(createMockProduct('P001', 'Engine Oil', 100000, 1));
            
            const total = calculator.calculateTotal(10, 20000); // 10% discount + 20000 shipping
            
            expect(total).toBe(110000); // (100000 * 0.9) + 20000
        });

        test('should handle zero values', () => {
            const calculator = new OrderCalculator();
            
            const total = calculator.calculateTotal(0, 0);
            
            expect(total).toBe(0);
        });
    });

    describe('Discount Validation', () => {
        const createMockDiscount = (minimumAmount, status, startDate, endDate, usageLimit) => ({
            minimumAmount,
            status,
            applyStartDate: startDate,
            applyEndDate: endDate,
            usageLimit
        });

        test('should validate active discount with sufficient order total', () => {
            const calculator = new OrderCalculator();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const discount = createMockDiscount(50000, 'Active', yesterday, tomorrow, 5);
            
            const isValid = calculator.validateDiscount(discount, 100000);
            
            expect(isValid).toBe(true);
        });

        test('should reject discount if order total is below minimum', () => {
            const calculator = new OrderCalculator();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const discount = createMockDiscount(100000, 'Active', yesterday, tomorrow, 5);
            
            const isValid = calculator.validateDiscount(discount, 50000);
            
            expect(isValid).toBe(false);
        });

        test('should reject inactive discount', () => {
            const calculator = new OrderCalculator();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const discount = createMockDiscount(50000, 'Inactive', yesterday, tomorrow, 5);
            
            const isValid = calculator.validateDiscount(discount, 100000);
            
            expect(isValid).toBe(false);
        });

        test('should reject expired discount', () => {
            const calculator = new OrderCalculator();
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const discount = createMockDiscount(50000, 'Active', lastWeek, yesterday, 5);
            
            const isValid = calculator.validateDiscount(discount, 100000);
            
            expect(isValid).toBe(false);
        });

        test('should reject discount with no usage limit', () => {
            const calculator = new OrderCalculator();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const discount = createMockDiscount(50000, 'Active', yesterday, tomorrow, 0);
            
            const isValid = calculator.validateDiscount(discount, 100000);
            
            expect(isValid).toBe(false);
        });
    });

    describe('Order Summary', () => {
        test('should provide accurate order summary', () => {
            const calculator = new OrderCalculator();
            calculator.addProduct(createMockProduct('P001', 'Engine Oil', 50000, 2));
            calculator.addProduct(createMockProduct('P002', 'Brake Pad', 30000, 3));
            
            const summary = calculator.getOrderSummary();
            
            expect(summary.products).toHaveLength(2);
            expect(summary.baseTotal).toBe(190000); // (50000*2) + (30000*3)
            expect(summary.productCount).toBe(2);
            expect(summary.totalQuantity).toBe(5); // 2 + 3
        });

        test('should handle empty order', () => {
            const calculator = new OrderCalculator();
            
            const summary = calculator.getOrderSummary();
            
            expect(summary.products).toHaveLength(0);
            expect(summary.baseTotal).toBe(0);
            expect(summary.productCount).toBe(0);
            expect(summary.totalQuantity).toBe(0);
        });
    });
});
