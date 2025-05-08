const OrderDetail = require('../../models/OrderDetail');
const Customer = require('../../models/Customer');
const { Cart, ProductsInCart } = require('../../models/Cart');
const Product = require('../../models/Product');
const Discount = require('../../models/Discount');
const Order = require('../../models/Order');
const Account = require('../../models/Account');
const messages = require('../../configs/messages.json'); // Adjust the path as needed


// POST /order/create - Create a new order
module.exports.createOrder = async (req, res) => {
    try {
        console.log('Creating order...');
        

        let acc, cus, cart;
        console.log(acc, cus, cart)
        if(req.cookies.tokenUser!=null)
        {
            acc = await Account.findOne({
                where: { token: req.cookies.tokenUser }
            });

            cus = await Customer.findByPk(acc.email);
            //console.log(cus)

            cart = await Cart.findByPk(cus.cartId);
        }
        else if(req.cookies.tokenUser==null && await Account.findOne({where: { email: req.body.email }}) !=null)
        {
            acc = await Account.findOne({where: { email: req.body.email }})
            cus = await Customer.findByPk(acc.email);
            cart = await Cart.findByPk(req.cookies.cartId);
        }
        else
        {
            acc = {
                email: req.body.email,
                password: "",
                token: null,
                permission: 'RG002', 
                status: 'Guest',
                deleted: false
            };

            console.log('Account created:', acc)

            cus ={
                email: req.body.email,
                cartId: null,
                fullName: "",
                phone : null,
                address : null,
                status: 'Guest'
            };
            console.log('Customer created:', cus)

            cart = await Cart.findByPk(req.cookies.cartId);
        }

        //console.log(acc, cus, cart)

        let query='/AutoParts/order?';

        // Get all products from cart (virtual field populated by afterFind hook)
        const productsInCart = cart.products || [];
        //console.log(req.body)
        const selectedProducts = productsInCart.filter(item => req.body[item.product.productId]);
        const updatedSelectedProducts = selectedProducts.map(item => ({ productId: item.product.productId, amount: req.body[item.product.productId] }));
        for(const item of updatedSelectedProducts)
            {
                query+=item.productId+'='+item.amount+'&';
            }
            query=query.slice(0,-1);
            console.log(query)

        
        //console.log('updatedSelectedProducts:', updatedSelectedProducts);

        //console.log('Selected products:', selectedProducts.map(item => ({ productId: item.product.productId, amount: req.body[item.product.productId] })));

        const totalCost = parseFloat(req.body.totalCost) *1000;
        console.log('Total cost:', totalCost);
        const discountId = req.body.discountId || null;
        const shipAddress = req.body.shipAddress;
        const shippingType = req.body.shippingType;

        console.log(discountId, shipAddress, shippingType, totalCost);

        if (!shippingType) {
            console.log('Shipping type not selected');
            console.log(res.locals.messages.BLANK_SHIPPING_TYPE)
            req.flash('error',  res.locals.messages.BLANK_SHIPPING_TYPE);
            return res.redirect(query);
        }

        const discount = await Discount.findByPk(discountId);
        if(discount && discount.usageLimit<=0)
        {
            console.log('Discount usage limit exceeded');
            req.flash('error', res.locals.messages.DISCOUNT_QUANTITY_EXCEEDED);
            return res.redirect(query);
        }


        if (selectedProducts.length === 0) {
            req.flash('error', res.locals.messages.NO_PRODUCT_SELECTED);
            return res.render('client/pages/order/order', { message: 'No products selected for order' });
        }    

        // Generate next order ID (assuming a custom method in Order model)
        // If this method doesn't exist, we'll need to implement it or use another way to generate IDs
        let orderId = 'ORD' + Date.now().toString().substring(6);
        if (typeof Order.generateOrderId === 'function') {
            orderId = await Order.generateOrderId();
        }

        if(req.cookies.tokenUser==null )
        {
            acc = await Account.create(acc);
            console.log('Account created:', acc)
            cus = await Customer.create(cus);
            console.log('Customer created:', cus)
        }

        // Create new order
        const newOrder = await Order.create({
            orderId: orderId,
            discountId: discountId,
            userEmail: acc.email,
            shipAddress: shipAddress,
            shippingType: shippingType,
            totalCost: totalCost,
            status: 'Pending',
            deletedAt: null,
            confirmedBy: null,
            deleted: false
        });
        

        if(discount) 
        {
            await Discount.setUsedDiscount(acc.email, discountId);
            discount.usageLimit -= 1;
            await discount.save();
        }

        // Create order details and update cart
        const updatedProductsInCart = productsInCart.filter(item => ![item.product]);
        for (const item of updatedSelectedProducts) {
            console.log(item)
            console.log(item.productId)
            console.log(item.amount)

            product = await Product.findByPk(item.productId);

            await OrderDetail.create({
                orderId: newOrder.orderId,
                productId: product.productId,
                productName: product.productName,
                amount: item.amount,
                unitPrice: product.salePrice
            });

            
            product.stock -= item.amount;
            await product.save();
        }

        // Update cart by setting new products (hooks will handle ProductsInCart)
        cart.products = updatedProductsInCart;
        await cart.save();
        console.log('Cart updated successfully');

        return res.render('client/pages/order/success'); // Render success page
    } catch (error) {
        req.flash('error', res.locals.messages.ORDER_CREATE_ERROR);
        return res.redirect(query);
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
            req.flash('error', res.locals.messages.ORDER_NOT_FOUND);
            return res.render('client/pages/order/orderDetail', { message: 'Order not found' });
        }

        res.render('client/pages/order/orderDetail', {
            order,
            products: order.details
        });
    } catch (error) {
        console.error('Error in showDetail:', error);
        req.flash('error', res.locals.messages.ORDER_DETAIL_ERROR);
        return res.redirect('/AutoParts/account/login');
    }
};

// POST /order - Show cart and redirect to payment page
module.exports.showCart = async (req, res) => {
    try {
        console.log('Showing cart...');
        let acc, cus, cart;
        if(req.cookies.tokenUser!=null)
        {
            acc = await Account.findOne({
                where: { token: req.cookies.tokenUser }
            });
        }
         
        if(acc)
        {
            cus = await Customer.findByPk(acc.email);
            //console.log(cus)
        }
        
        if (cus) {
            // return res.render('client/pages/order/order', { message: 'Cart not found' });
            cart = await Cart.findByPk(cus.cartId);
        }
        else
        {
            cart = await Cart.findByPk(req.cookies.cartId);
            //console.log(cart)
        }

        let productsInCart = cart.products || [];

        // Remove products that are not selected
        const selectedProducts = productsInCart.filter(item => req.query[item.product.productId]);
        //console.log('Selected products:', selectedProducts.map(item => item.product.productId));
        if (selectedProducts.length === 0) {
            req.flash('error', res.locals.messages.NO_PRODUCT_SELECTED);
            return res.redirect('back');
        }
        //console.log('Selected products:', selectedProducts);
        let discounts = [];
        if (acc) {
            const discountData = await Discount.getByCustomer(acc.email);
            discounts = Array.isArray(discountData) ? discountData : []; // Ensure discounts is an array
            //console.log(discounts)
        }
        //console.log(discounts)
        //console.log(messages)

        res.render('client/pages/order/order', { selectedProducts, discounts, user : cus, messageList : messages});
    } catch (error) {
        console.error('Error in showCart:', error);
        req.flash('error', res.locals.messages.CART_ERROR);
        return res.render('client/pages/order/order', { message: 'Error processing cart' });
    }
};


// GET /order - Show order details
module.exports.cancel = async (req, res) => {
    try {
        

        const orderId = req.query.orderId;
        const order = await Order.findByPk(orderId);
        console.log(order.details)
        for (const item of order.details) {
            const product = await Product.findByPk(item.productId);
            product.stock += item.amount;
            await product.save();
        }
        
        order.status = 'Cancelled';
        order.deleted = true;
        order.deletedAt = new Date(Date.now()).toISOString();
        await order.save();
        req.flash('success', res.locals.messages.ORDER_CANCEL_SUCCESS);
        return res.redirect('/AutoParts/account/profile');
        
    } catch (error) {
        req.flash('error', res.locals.messages.ORDER_CANCEL_ERROR);
        console.error('Error in showDetail:', error);
        return res.redirect('/AutoParts/account/login');
    }
};