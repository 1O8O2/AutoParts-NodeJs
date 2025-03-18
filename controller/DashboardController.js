// Sequelize database setup
const sequelize = require('../configs/database');
const  Product  = require('../models/Product');
const  Customer  = require('../models/Customer');
const  Account  = require('../models/Account');
const { Cart, ProductsInCart } = require('../models/Cart');
const  Brand = require('../models/Brand');
const  ProductGroup  = require('../models/ProductGroup');
const  BlogGroup  = require('../models/BlogGroup');
// Route for JSON API (optional)
module.exports.index = async (req, res) => {
  try {
    // Fetch all products
    let proLst = await Product.findAll();
    
    // Process image URLs (split and take first image)
    proLst = proLst.map(product => {
        const img = product.imageUrls || '';
        product.imageUrls = img.split(',')[0]; // Take first image
        return product;
    });

    // Limit to first 10 products
    const products = proLst.length > 10 ? proLst.slice(0, 10) : proLst;

    // Check user in session
    const acc = req.session.user;

    // Fetch and separate product groups
    const pgLst = await ProductGroup.findAll();
    const parentGroups = pgLst.filter(pg => !pg.parentGroupId);

    // Build groups map (parent -> child groups)
    const groups = {};
    parentGroups.forEach(pg => {
        const childGroups = pgLst
            .filter(pgr => pgr.parentGroupId && pgr.parentGroupId === pg.productGroupId && pgr.productGroupId !== pg.productGroupId)
            .map(pgr => pgr.groupName);
        groups[pg.groupName] = childGroups;
    });

    // Store in session
    const brands =await Brand.findAll();
    const blogGroups =await BlogGroup.findAll();

    req.app.locals.groups = groups;
    req.app.locals.brands = brands;
    req.app.locals.blogGroups = blogGroups;

    console.log(req.app.locals)

    // If user is logged in, fetch cart
    let cart = { products: ['adsadas'] }; // Default to empty array for consistency
    if (acc) {
      const cus = await Customer.findByPk(acc.phone);
      if (cus) {
        const foundCart = await Cart.findByPk(cus.cartId);
        console.log(foundCart)
        cart = foundCart || { products: ['dsadadasd'] }; // Fallback to empty array if null
      }
    }

    req.session.cart = cart;
    console.log("session:",req.session)


    // Render dashboard with data
    res.render('dashboard', {
        products, // Includes cart.products directly
        userName: acc ? req.session.userName : null,
        //cart:cart
    });
} catch (error) {
    console.error('Error in index:', error);
    res.render('dashboard', { message: 'Đã xảy ra lỗi khi tải trang' });
}
};

