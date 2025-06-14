const OrderDetail = require('../../models/OrderDetail');
const Customer = require('../../models/Customer');
const { Cart, ProductsInCart } = require('../../models/Cart');
const Product = require('../../models/Product');
const Discount = require('../../models/Discount');
const Order = require('../../models/Order');
const Account = require('../../models/Account');
const messages = require('../../configs/messages.json'); // Adjust the path as needed
const { mailSend } = require('../../helpers/mail');
const sequelize = require("../../configs/database").getSequelize(); 

// POST /order/create - Create a new order
module.exports.createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        let acc, cus, cart;
        const phoneRegex = /^0\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!phoneRegex.test(req.body.phoneNumber)) {
            req.flash('error',  res.locals.messages.INVALID_PHONE_WARNING);
            return res.redirect('back');
        }


        if (!emailRegex.test(req.body.email)) {
            req.flash('error',  res.locals.messages.INVALID_EMAIL_WARNING);
            return res.redirect('back');
        }
      
        
        if(req.cookies.tokenUser!=null)
        {
            console.log('Token user exists:', req.cookies.tokenUser);
            acc = await Account.findOne({
                where: { token: req.cookies.tokenUser }
            });

            cus = await Customer.findByPk(acc.email);

            cart = await Cart.findByPk(cus.cartId);
        }
        else if(req.cookies.tokenUser==null && await Account.findOne({where: { email: req.body.email }}) !=null)
        {
            console.log('Token user does not exist, but account found by email:', req.body.email);
            acc = await Account.findOne({where: { email: req.body.email }})
            cus = await Customer.findByPk(acc.email);
            cart = await Cart.findByPk(req.cookies.cartId);
            if (!cus) {
                req.flash('error', res.locals.messages.CUSTOMER_NOT_FOUND);
                return res.redirect('/AutoParts/account/login');
            }
            if (!cart) {
                req.flash('error', res.locals.messages.CART_NOT_FOUND);
                return res.render('client/pages/order/order', { message: 'Cart not found' });
            }
        }
        else
        {
            console.log('No token user, creating new account and customer');
            acc = {
                email: req.body.email,
                password: "1111",
                token: null,
                permission: 'RG002', 
                status: 'Guest',
                deleted: false
            };

            cus ={
                email: req.body.email,
                cartId: null,
                fullName: req.body.customerName,
                phone : req.body.phoneNumber,
                address : req.body.shipAddress,
                status: 'Guest'            };            cart = await Cart.findByPk(req.cookies.cartId);
        }

        let query='/AutoParts/order?';        // Get all products from cart (virtual field populated by afterFind hook)
        const productsInCart = cart.products || [];
        const selectedProducts = productsInCart.filter(item => req.body[item.product.productId]);
        const updatedSelectedProducts = selectedProducts.map(item => ({ productId: item.product.productId, amount: req.body[item.product.productId] }));

        for(const item of updatedSelectedProducts)
        {   
            const product = await Product.findByPk(item.productId);
            if(item.amount > product.stock)
            {
                req.flash('error',  res.locals.messages.PRODUCT_OUT_OF_STOCK);
                return res.redirect('back');
            }
            query+=item.productId+'='+item.amount+'&';
        }        query=query.slice(0,-1);
        console.log(query);        const totalCost = parseFloat((req.body.totalCost).replace(/\./g, ''))
        const discountId = req.body.discountId || null;
        const shipAddress = req.body.shipAddress;
        let shippingType = req.body.shippingType;
        console.log('Shipping type:', shippingType , 'Total cost:', totalCost, 'Discount ID:', discountId, 'Ship address:', shipAddress);

        switch (shippingType)
        {
            case '20000':
                shippingType = 'Normal';
                break;
            case '50000':
                shippingType = 'Express';
                break;
            case '15000':
                shippingType = 'Economy';
                break;
        }


        if (!shippingType) {
            req.flash('error',  res.locals.messages.BLANK_SHIPPING_TYPE);
            console.log(query)
            return res.redirect(query);
        }

        const discount = await Discount.findByPk(discountId);
        if(discount && discount.usageLimit<=0)
        {
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
        }         if(req.cookies.tokenUser==null && await Account.findOne({where: { email: req.body.email }}) == null)
        {
            acc = await Account.create(acc);
            cus = await Customer.create(cus);
        }
        console.log('Account:', acc, 'Customer:', cus);

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
        const updatedProductsInCart = productsInCart.filter(item => !req.body[item.product.productId]);

        for (const item of updatedSelectedProducts) {
            const product = await Product.findByPk(item.productId);

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

        const from = 'no-reply@autopart.com'
        const to = acc.email;
        const subject = 'Đặt đơn hàng thành công';
        const html = `
            Chào bạn,<br><br>
            Cảm ơn bạn đã đặt hàng tại AutoPart! Đơn hàng của bạn đã được đặt thành công với các thông tin sau:<br><br>
            <strong>Tên khách hàng:</strong> ${cus.fullName}<br>
            <strong>Số điện thoại:</strong> ${cus.phone}<br>
            <strong>Mã đơn hàng:</strong> ${newOrder.orderId}<br>
            <strong>Tổng tiền:</strong> ${newOrder.totalCost.toLocaleString('vi-VN')} ₫<br>
            <strong>Địa chỉ giao hàng:</strong> ${newOrder.shipAddress}<br>
            <strong>Loại vận chuyển:</strong> ${newOrder.shippingType}<br><br>
            Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất và thông báo khi hàng được giao. Bạn có thể theo dõi trạng thái đơn hàng trong phần "Tài khoản" trên website của chúng tôi.<br><br>
            Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.<br><br>
            Trân trọng,<br>
            Đội ngũ AutoPart        `;
        
        await mailSend(from, to, subject, html);
        await t.commit();        
        return res.render('client/pages/order/success'); // Render success page
    } catch (error) {
        await t.rollback();
        req.flash('error', res.locals.messages.ORDER_CREATE_ERROR);
        return res.redirect('back');
    }
};

// GET /order - Show order details
module.exports.showDetail = async (req, res) => {
    const tokenUser = req.cookies.tokenUser;
    try {
        if (!tokenUser) {
            req.flash('error', res.locals.messages.NOT_LOGGED_IN);
            return res.redirect('/AutoParts/account/login');
        }
        const acc = await Account.findOne({
            where: { token: tokenUser }
        });
        if (!acc) {
            req.flash('error', res.locals.messages.NOT_LOGGED_IN);
            return res.redirect('/AutoParts/account/login');
        }
        const cus = await Customer.findByPk(acc.email);
        if (!cus) {
            req.flash('error', res.locals.messages.CUSTOMER_NOT_FOUND);
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
            customer: cus,
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
        if(acc)        {
            cus = await Customer.findByPk(acc.email);
        }
          if (cus && cus.cartId) {
            cart = await Cart.findByPk(cus.cartId);
        }
        else if (req.cookies.cartId)
        {
            cart = await Cart.findByPk(req.cookies.cartId);
        }
        else
        {
            cart = null;
        }        let productsInCart = cart ? cart.products || [] : [];

        console.log('Products in cart:', productsInCart);
        // Remove products that are not selected
        const selectedProducts = productsInCart
        .filter(item => req.query[item.product.productId]) // Lọc các sản phẩm có trong query
        .map(item => ({
            product: item.product,
            amount: parseInt(req.query[item.product.productId], 10) || item.amount // Lấy amount từ query hoặc giữ nguyên
        }));
        console.log('Selected products:', selectedProducts);

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


// GET /cancel - Cancel order and restore stock
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
        if(order.discountId)
        {
            const discount = await Discount.findByPk(order.discountId);
            if(discount)
            {
                discount.usageLimit += 1;
                await discount.save();
                await Discount.deleteDiscountUsed(order.discountId, order.userEmail);
            }
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



// GET /edit - Show edit form
module.exports.editForm = async (req, res) => {
    try {
        console.log('Showing order edit form...');

        const acc = await Account.findOne({
            where: { token: req.cookies.tokenUser }
        });

        if (!acc) {
          return res.redirect('/login');
        }
      
        const orderId = req.query.orderId;
        const order = await Order.findOne({where :{orderId : orderId}});
        const cus = await Customer.findByPk(order.userEmail);

        if (!order) {
          return res.status(404).render('error', { message: 'Order not found' });
        }
      
        const products = [];
        for (const detail of order.details) {
            const product = await Product.findOne({where :{productId : detail.productId}});
            if (product.imageUrls) {
                const imgArray = product.imageUrls.split(',');
                product.imageUrl = imgArray[0];
            }
            product.stock += detail.amount; // Restore stock to product
            products.push({product: product, amount: detail.amount});
        }

      
        let discounts = await Discount.getByCustomer(acc.email);
        const discount = await Discount.findOne({where :{discountId : order.discountId}});
        //console.log(discount);
        if (discount) {
          discounts = discounts.concat(discount); // Add order's discount to list
        }
      
        res.render('client/pages/order/orderEdit', {
          discounts,
          products,
          order,
          user: cus,
          messageList : res.locals.messages
        });
        
    } catch (error) {
        req.flash('error', res.locals.messages.ORDER_CANCEL_ERROR);
        console.error('Error in showDetail:', error);
        return res.redirect('/AutoParts/account/login');
    }
};



// POST /edit - edit order
module.exports.edit = async (req, res) => {
    try {
        console.log('Editing order...');

        const acc = await Account.findOne({ where: { token: req.cookies.tokenUser } });
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }

        const totalCost = parseFloat(req.body.totalCost) *1000;
        console.log('Total cost:', totalCost);
        const discountId = req.body.discountId || null;
        // const shipAddress = req.body.shipAddress;
        let shippingType = req.body.shippingType;
        switch (shippingType) {
            case '20000':
            shippingType = 'Normal';
            break;
            case '50000':
            shippingType = 'Express';
            break;
            default:
            shippingType = 'Economy';
        }

        console.log(discountId, shippingType, totalCost);

        if (!shippingType) {
            console.log('Shipping type not selected');
            console.log(res.locals.messages.BLANK_SHIPPING_TYPE)
            req.flash('error',  res.locals.messages.BLANK_SHIPPING_TYPE);
            return res.redirect('back');
        }

        const discount = await Discount.findByPk(discountId);
        if(discount && discount.usageLimit<=0)
        {
            console.log('Discount usage limit exceeded');
            req.flash('error', res.locals.messages.DISCOUNT_QUANTITY_EXCEEDED);
            return res.redirect('back');
        }

        const orderId = req.body.orderId;
        const order = await Order.findByPk(orderId);
        if (!order) {
            req.flash('error', res.locals.messages.ORDER_NOT_FOUND);
            return res.render('client/pages/order/orderDetail', { message: 'Order not found' });
        }

        const orderDiscount = await Discount.findOne({where :{discountId : order.discountId}});


        if (discountId && !order.discountId) 
        {
            // Case 2: No previous discount, apply new discount
            console.log(discount.usageLimit);
            await Discount.setUsedDiscount(acc.email, discountId);
            discount.usageLimit -= 1;
            await discount.save();
            console.log(discount.usageLimit);
        } 
        else if (!discountId && order.discountId) 
        {
            // Case 3: Previous discount, remove discount
            console.log(orderDiscount.usageLimit);
            await Discount.deleteDiscountUsed(order.discountId, acc.email);
            orderDiscount.usageLimit += 1;
            await orderDiscount.save();
            console.log(orderDiscount.usageLimit);
        } 
        else if (discount && orderDiscount && discount.discountId !== orderDiscount.discountId) 
        {
            // Case 4: Change discount
            console.log(discount.usageLimit);
            console.log(orderDiscount.usageLimit);
            await Discount.deleteDiscountUsed(order.discountId, acc.email);
            await Discount.setUsedDiscount(acc.email, discountId);
            discount.usageLimit -= 1;
            orderDiscount.usageLimit += 1;
            await discount.save();
            await orderDiscount.save();
            console.log(discount.usageLimit);
            console.log(orderDiscount.usageLimit);
        }


        //const products = [];


        for (const key of order.details) 
        {
            const quantity = req.body[key.productId];
            if (quantity) {
              const product = await Product.findOne({where :{productId : key.productId}});

              //products.push({product: product, amount: key.amount});
              if (quantity > key.amount) {               
                product.stock -= (quantity - key.amount);
                await product.save();
              }
              else if (quantity < key.amount) {
                product.stock += (key.amount - quantity);
                await product.save();
              }

              key.amount = quantity; // Update the amount in the order detail
              await key.save(); // Save the updated order detail

            } else {
              await OrderDetail.destroy({
                where: { orderId: order.orderId, productId: key.productId }
              });
            }
        }

        // Create new order
        const newOrder = {
            orderId: orderId,
            discountId: discountId,
            userEmail: acc.email,
            shipAddress: order.shipAddress,
            shippingType: shippingType,
            totalCost: totalCost,
            status: 'Pending',
            deletedAt: null,
            confirmedBy: null,
            deleted: false
        }
        await Order.update(newOrder, { where: { orderId: orderId } });

        req.flash('success', res.locals.messages.EDIT_ORDER_SUCCESS);
        return res.redirect('/AutoParts/account/profile');

        
    } catch (error) {
        req.flash('error', res.locals.messages.ORDER_CANCEL_ERROR);
        console.error('Error in showDetail:', error);
        return res.redirect('/AutoParts/account/login');
    }
};


// GET /order/edit/remove-product - Remove product from order
module.exports.removeProduct = async (req, res) => {
    console.log('Removing product from order...');
    const acc = await Account.findOne({ where: { token: req.cookies.tokenUser } });
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }

    const orderDetail = await OrderDetail.findOne({
        where: {
            orderId: req.body.orderId,
            productId: req.body.productId
        }
    });

    const order = await Order.findByPk(orderDetail.orderId);
    console.log(orderDetail);

    const product = await Product.findByPk(orderDetail.productId);
    console.log(product.stock);
    product.stock += orderDetail.amount;
    console.log(product.stock);
    await product.save();

    order.totalCost -= orderDetail.amount * orderDetail.unitPrice;
    await order.save();
    await orderDetail.destroy();

    // await OrderDetail.destroy({
    //     where: {
    //         orderId: req.body.orderId,
    //         productId: req.body.productId
    //     }
    // });

    return res.redirect('back');
};

// GET /order/check - Check order by orderId
module.exports.checkOrder = async (req, res) => {
    try {

        const orderId = req.query.orderId;
        
        if (!orderId) {
            req.flash('error', res.locals.messages.ORDER_ID_REQUIRED);
            return res.status(400).json({ message: res.locals.messages.ORDER_ID_REQUIRED});
        }

        const order = await Order.findByPk(orderId);
        
        if (!order) {
            req.flash('error', res.locals.messages.ORDER_NOT_FOUND);
            return res.status(404).json({ message: res.locals.messages.ORDER_NOT_FOUND });
        }

        cus = await Customer.findByPk(order.userEmail);

        const products = await OrderDetail.findAll({
            where: { orderId: orderId }
        });
        console.log(products)
        return res.json({
            order,
            customer: cus,
            products
        });
    } catch (error) {
        console.error('Error in checkOrder:', error);
        return res.status(500).json({ message: res.locals.messages.ORDER_CHECK_ERROR });
    }
};