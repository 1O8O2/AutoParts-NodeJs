const OrderDetail = require('../../models/OrderDetail');
const Customer = require('../../models/Customer');
const { Cart, ProductsInCart } = require('../../models/Cart');
const Product = require('../../models/Product');
const Discount = require('../../models/Discount');
const Order = require('../../models/Order');

// POST /order/create - Create a new order
module.exports.createOrder = async (req, res) => {
    try {


        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login');
        }

        const cus = await Customer.findByPk(res.locals.user.email);
        if (!cus) {

            return res.redirect('/AutoParts/account/login');
        }
        
        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            req.flash('error', res.locals.messages.CART_NOT_FOUND_WARNING);
            return res.render('back');
        }

        // Get all products from cart (virtual field populated by afterFind hook)
        const productsInCart = cart.products || [];
        const selectedProducts = productsInCart.filter(item => req.body[item.product.productId]);

        if (selectedProducts.length === 0) {
            return res.render('client/pages/order/order', { message: 'No products selected for order' });
        }

        const totalCost = parseFloat(req.body.totalCost);
        const code = req.body.code || null;
        const shipAddress = req.body.shipAddress;

        // Generate next order ID (assuming a custom method in Order model)
        // If this method doesn't exist, we'll need to implement it or use another way to generate IDs
        let orderId = 'ORD' + Date.now().toString().substring(6);
        if (typeof Order.generateOrderId === 'function') {
            orderId = await Order.generateOrderId();
        }

        // Create new order
        const newOrder = await Order.create({
            orderId: orderId,
            discountId: code,
            userEmail: res.locals.user.email,
            shipAddress: shipAddress,
            totalCost: totalCost,
            status: 'Pending',
            deletedAt: null,
            confirmedBy: null,
            deleted: false
        });

        // Create order details and update cart
        const updatedProductsInCart = productsInCart.filter(item => !selectedProducts.includes(item));
        for (const product of selectedProducts) {
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
        req.flash('error', res.locals.messages.ORDER_CREATE_ERROR);
        return res.redirect('back');
    }
};

// GET /order - Show order details
module.exports.showDetail = async (req, res) => {
    try {
        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login');
        }

        const orderId = req.query.orderId;
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.render('client/pages/order/orderDetail', { message: 'Order not found' });
        }

        res.render('client/pages/order/orderDetail', {
            order,
            products: order.details
        });
    } catch (error) {
        console.error('Error in showDetail:', error);
        return res.redirect('/AutoParts/account/login');
    }
};

// POST /order - Show cart and redirect to payment page
module.exports.showCart = async (req, res) => {
    try {
        if (!res.locals.user) {

            return res.redirect('/AutoParts/account/login');
        }

        const cus = await Customer.findByPk(res.locals.user.email);
        if (!cus) {
            return res.redirect('/AutoParts/account/login');
        }
        
        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            return res.render('client/pages/order/order', { message: 'Cart not found' });
        }

        let productsInCart = cart.products || [];

        // Remove products that are not selected
        const selectedProducts = productsInCart.filter(item => req.query[item.product.productId])||[]
        if (selectedProducts.length === 0) {
            req.flash('error', res.locals.messages.NO_PRODUCT_SELECTED);
            return res.redirect('back');
        }
        res.render('client/pages/order/order', { selectedProducts });
    } catch (error) {
        console.error('Error in showCart:', error);
        return res.render('client/pages/order/order', { message: 'Error processing cart' });
    }
};
