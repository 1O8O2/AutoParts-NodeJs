const  Product  = require('../models/Product');
const  Brand  = require('../models/Brand');
const  ProductGroup  = require('../models/ProductGroup');
const Customer = require('../models/Customer')
const {Cart, productsInCart} = require('../models/Cart')


module.exports.showProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        console.log(productId)
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.render('productdetail', { message: 'Sản phẩm không tồn tại' });
        }

        const imgUrls = product.imageUrls ? product.imageUrls.split(',') : [];
        const brand = await Brand.findByPk(product.brandId);
        const group = await ProductGroup.findByPk(product.productGroupId);
        const inStock = product.stock > 0;

        res.render('productdetail', {
            product,
            imgUrls,
            brand,
            group,
            inStock,
            message: req.query.message || null
        });
    } catch (error) {
        console.error('Error in showProduct:', error);
        res.render('productdetail', { message: 'Đã xảy ra lỗi khi tải sản phẩm' });
    }
};

module.exports.addProduct = async (req, res) => {
    try {
        const { productId, quantity } = req.body; // From form data (POST)

        console.log(req.session.user)
        // Check if user is logged in
        const acc = req.session.user;
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }

        const cus = await Customer.findByPk(acc.phone);
        if (!cus) {
            return res.redirect('/AutoParts/account/profile'); // Or handle differently
        }

        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            return res.render('productdetail', { message: 'Giỏ hàng không tồn tại' });
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.render('productdetail', { message: 'Sản phẩm không tồn tại' });
        }

        // Update cart.products (virtual field)
        let productsInCart = cart.products || [];
        const existingItem = productsInCart.find(item => item.product.productId === productId);
        if (existingItem) {
            existingItem.amount += parseInt(quantity, 10) || 1; // Add to existing
        } else {
            productsInCart.push({ product, amount: parseInt(quantity, 10) || 1 });
        }

        // Save updated cart (hooks handle ProductsInCart table)
        cart.products = productsInCart;
        await cart.save();

        // Redirect to product detail page
        res.redirect(`/AutoParts/product/productdetail?productId=${productId}`);
    } catch (error) {
        console.error('Error in addProduct:', error);
        res.redirect(`/AutoParts/product/productdetail?productId=${req.body.productId}&message=Thêm vào giỏ thất bại`);
    }
};

module.exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.query; // From GET params
        const referer = req.headers.referer || '/AutoParts'; // Fallback to dashboard

        const acc = req.session.user;
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }

        const cus = await Customer.findOne({ where: { phone: acc.phone } });
        const cart = await Cart.findByPk(cus.cartId);
        if (cart && cart.products) {
            // Filter out the product to delete
            cart.products = cart.products.filter(item => item.product.productId !== productId);
            await cart.save(); // Hooks update ProductsInCart table
        }

        res.redirect(referer);
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.redirect(req.headers.referer || '/AutoParts');
    }
};

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
        console.log(categories)


        res.render('filterproduct', {
            keyword: key,
            products: filteredLst,
            brands,
            categories
        });
    } catch (error) {
        console.error('Error in showFilter:', error);
        res.render('filterproduct', { message: 'Đã xảy ra lỗi khi tìm kiếm' });
    }
};