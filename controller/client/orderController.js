const OrderDetail = require('../../models/OrderDetail');
const Customer = require('../../models/Customer');
const { Cart, ProductsInCart } = require('../../models/Cart'); // Updated import
const Product = require('../../models/Product');
const Discount = require('../../models/Discount');
const Order = require('../../models/Order')

// POST /order/create - Create a new order
module.exports.createOrder = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login'); // Or handle differently
        }

        const cus = await Customer.findOne({ where: { phone: res.locals.user.phone } });
        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            throw new Error('Cart not found');
        }

        // Get all products from cart (virtual field populated by afterFind hook)
        const productsInCart = cart.products || [];
        const selectedProducts = productsInCart.filter(item => req.body[item.product.productId]);

        if (selectedProducts.length === 0) {
            console.log('----------------------------------------------------------------------------------------Failed')
            return res.render('client/pages/order/order', { message: 'No products selected for order' });
        }

        const totalCost = parseFloat(req.body.totalCost);
        const code = req.body.code || null;
        const shipAddress = req.body.shipAddress;

        // Generate next order ID (assuming a custom method in Order model)
        const orderId = await Order.generateOrderId(); // Implement this in your Order model

        // Create new order
        const newOrder = await Order.create({
            orderId:orderId,
            discountId: code,
            userPhone: res.locals.user.phone,
            shipAddress: shipAddress,
            totalCost: totalCost,
            status: 'Pending',
            deletedAt: null,
            confirmedBy:null,
            deleted: false
        });

        // Create order details and update cart
        const updatedProductsInCart = productsInCart.filter(item => ![item.product]);
        for (const product of selectedProducts) {
            console.log(product.product.productId)
            await OrderDetail.create({
                orderId: newOrder.orderId,
                productId: product.product.productId,
                productName: product.product.productName,
                amount: product.amount,
                unitPrice: product.product.salePrice
            });
        }

        // Update cart by setting new products (hooks will handle ProductsInCart)
        cart.products = updatedProductsInCart;
        await cart.save();

        return res.render('client/pages/order/success'); // Render success page
    } catch (error) {
        console.error('Error in createOrder:', error);
        return res.redirect('/login');
    }
};

// GET /order - Show order details
module.exports.showDetail = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login'); // Or handle differently
        }

        console.log('Testing')

        const orderId = req.query.orderId;
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.render('orderdetail', { message: 'Order not found' });
        }

        
        res.render('client/pages/order/orderDetail', {
            order,
            products: order.details
        });
    } catch (error) {
        console.error('Error in showDetail:', error);
        return res.redirect('/login');
    }
};

// POST /order - Show cart and redirect to payment page
module.exports.showCart = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login'); // Or handle differently
        }

        console.log('---------------------------------------------------------------------------------' + res.locals.user.phone)

        const cus = await Customer.findOne({ where: { phone: res.locals.user.phone } });
        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            return res.render('order', { message: 'Cart not found' });
        }

        let productsInCart = cart.products || [];

        // Remove products that are not selected
        const selectedProducts = productsInCart.filter(item => req.query[item.product.productId]);
        if (selectedProducts.length === 0) {
            return res.render('order', { message: 'No products selected' });
        }

        res.render('client/pages/order/order', {selectedProducts});
    } catch (error) {
        console.error('Error in showCart:', error);
        return res.redirect('client/pages/order/order');
    }
};
