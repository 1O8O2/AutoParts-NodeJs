const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Customer = require('../../models/Customer');
const {Cart, ProductsInCart} = require('../../models/Cart');
const Account = require('../../models/Account');

// [GET] /product/detail
module.exports.showProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        const product = await Product.findByPk(productId);
        if (!product) {
            req.flash('error', res.locals.messages.PRODUCT_NOT_FOUND);
            return res.render('client/pages/product/detail');
        }

        const imgUrls = product.imageUrls ? product.imageUrls.split(',') : [];
        const brand = await Brand.findByPk(product.brandId);
        const group = await ProductGroup.findByPk(product.productGroupId);
        const inStock = product.stock > 0;
        res.render('client/pages/product/productDetail', {
            product,
            imgUrls,
            brand,
            group,
            inStock,
        });
    } catch (error) {
        console.error('Error in showProduct:', error);
        req.flash('error', res.locals.messages.LOADING_ERROR);
        res.render('client/pages/product/productDetail', { message: 'Đã xảy ra lỗi khi tải sản phẩm' });
    }
};


module.exports.addProduct = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

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
            console.log(cus)
        }
        
        if (cus) {
            // return res.render('client/pages/order/order', { message: 'Cart not found' });
            cart = await Cart.findByPk(cus.cartId);
        }
        else
        {
            cart = await Cart.findByPk(req.cookies.cartId);
            console.log(cart.cartId)
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            req.flash('error', res.locals.messages.PRODUCT_NOT_FOUND);
            return res.render('back', { message: 'Sản phẩm không tồn tại' });
        }

        // Find existing product in cart
        const existingProduct = cart.products.find(item => item.product.productId == productId);
        if(existingProduct) {
            if(existingProduct.amount + parseInt(quantity, 10) > product.stock) {
                req.flash('error', res.locals.messages.INVALID_PRODUCT_NUMBER);
                return res.redirect('back');
            }
        }

        if (existingProduct) {
            // Update existing product amount
            cart.products = cart.products.map(item => {
                if (item.product.productId == productId) {
                    return { product: item.product, amount: item.amount + parseInt(quantity, 10) || 1 };
                }
                return item;
            });
            // Mark products as changed to trigger the beforeUpdate hook
            cart.changed('products', true);
            try {
                await cart.save();
                // Refresh cart data
                const updatedCart = await Cart.findByPk(cart.cartId);
                res.locals.cart = updatedCart;
                req.flash('success', res.locals.messages.ADD_TO_CART_SUCCESS);
                return res.redirect('back');
            } catch (err) {
                console.error('Error in addProduct:', err);
                req.flash('error', res.locals.messages.ADD_TO_CART_FAILED);
                return res.redirect('back');
            }
        } else {
            // Add new product to cart
            cart.products = [...cart.products, { product, amount: parseInt(quantity, 10) || 1 }];
            // Mark products as changed to trigger the beforeUpdate hook
            cart.changed('products', true);
            
            try {
                await cart.save();
                // Refresh cart data
                const updatedCart = await Cart.findByPk(cart.cartId);
                res.locals.cart = updatedCart;
                req.flash('success', res.locals.messages.ADD_TO_CART_SUCCESS);
                return res.redirect('back');
            } catch (err) {
                console.error('Error in addProduct:', err);
                req.flash('error', res.locals.messages.ADD_TO_CART_FAILED);
                return res.redirect('back');
            }
        }
    } catch (error) {
        console.error('Error in addProduct:', error);
        req.flash('error', res.locals.messages.ADD_TO_CART_FAILED);
        return res.redirect('back');
    }
};

module.exports.deleteProduct = async (req, res) => {
    try {
        console.log('Delete product from cart');

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
            console.log(cus)
        }
        
        if (cus) {
            // return res.render('client/pages/order/order', { message: 'Cart not found' });
            cart = await Cart.findByPk(cus.cartId);
        }
        else
        {
            cart = await Cart.findByPk(req.cookies.cartId);
            console.log(cart.cartId)
        }

        const { productId } = req.query; 
        const referer = req.headers.referer || '/AutoParts'; 
        console.log('Referer:', referer);
        //console.log(productId)
        //console.log(acc)
        
        //console.log(cart.products)
        if (cart && cart.products) {
            console.log('cart.products before filter:', cart.products);
            cart.products = cart.products.filter(item => item.product.productId !== productId);
            console.log('cart.products after filter:', cart.products);
            await cart.save();
        } else {
            console.log('cart or cart.products is undefined:', { cart, products: cart?.products });
        }
        //console.log(cart.products)
        req.flash('success', res.locals.messages.REMOVE_FROM_CART_SUCCESS);
        res.redirect(referer);
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        req.flash('error', res.locals.messages.REMOVE_FROM_CART_FAILED);
        res.redirect('back');
    }
};

// [GET] /product/search
module.exports.showFilter = async (req, res) => {
    try {
        const key = (req.query.keyword || '').toLowerCase().trim();


        const pLst = await Product.findAll();
        const filteredLst = pLst
            .map(product => {
                const img = product.imageUrls || '';
                product.imageUrls = img.split(',')[0];
                return product;
            })
            .filter(product =>
                product.productId.toLowerCase().includes(key) ||
                product.productName.toLowerCase().includes(key) ||
                (product.description || '').toLowerCase().includes(key)
            );

        const brands = await Brand.findAll();
        const categories = await ProductGroup.findAll();

        let brand = req.query.brand || '';
        let group = req.query.group || '';
        console.log('brand', brand, 'group', group)
        // change name to id in filter
        brand = brands.find(b => b.brandName == brand)?.brandId || brand;
        group = categories.find(c => c.groupName == group)?.productGroupId || group;
        


        res.render('client/pages/product/filterProduct', {
            keyword: key,
            products: filteredLst,
            brands,
            categories,
            brand,
            group
        });
    } catch (error) {
        console.error('Error in showFilter:', error);
        res.render('client/pages/product/filterProduct', { message: 'Đã xảy ra lỗi khi tìm kiếm' });
    }
};

