const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Customer = require('../../models/Customer');
const {Cart, ProductsInCart} = require('../../models/Cart');

// [GET] /product/productDetail
module.exports.showProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.render('client/pages/product/productDetail', { message: 'Sản phẩm không tồn tại' });
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
            message: req.query.message || null
        });
    } catch (error) {
        res.render('client/pages/product/productDetail', { message: 'Đã xảy ra lỗi khi tải sản phẩm' });
    }
};

module.exports.addProduct = async (req, res) => {
    try {
        const { productId, quantity } = req.body; // From form data (POST)

        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login'); // Or handle differently
        }

        const cus = await Customer.findByPk(res.locals.user.email);
        if (!cus) {
            return res.redirect('/AutoParts/account/login');
        }

        const cart = await Cart.findByPk(cus.cartId);
        if (!cart) {
            return res.render('client/pages/product/productDetail', { message: 'Giỏ hàng không tồn tại' });
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.render('client/pages/product/productDetail', { message: 'Sản phẩm không tồn tại' });
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
        res.locals.cart = cart;

        // Redirect to product detail page
        res.redirect(`/AutoParts`);
    } catch (error) {
        console.error('Error in addProduct:', error);
        res.redirect(`/AutoParts?message=Thêm vào giỏ thất bại`);
    }
};

module.exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.query; 
        const referer = req.headers.referer || '/AutoParts'; 

        if (!res.locals.user) {
            return res.redirect('/AutoParts/account/login'); // Or handle differently
        }

        const cus = await Customer.findByPk(res.locals.user.email);
        if (!cus) {
            return res.redirect('/AutoParts/account/login');
        }
        
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

        res.render('client/pages/product/filterProduct', {
            keyword: key,
            products: filteredLst,
            brands,
            categories
        });
    } catch (error) {
        console.error('Error in showFilter:', error);
        res.render('client/pages/product/filterProduct', { message: 'Đã xảy ra lỗi khi tìm kiếm' });
    }
};