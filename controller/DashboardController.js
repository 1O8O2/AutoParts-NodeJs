// Sequelize database setup
const sequelize = require('../configs/database');
const Account = require('../models/Account');
const Blog = require('../models/Blog');
const BlogGroup = require('../models/BlogGroup');
const Brand = require('../models/Brand');
const Chat = require('../models/Chat');
const Customer = require('../models/Customer');
const Discount = require('../models/Discount');
const Employee = require('../models/Employee');
const Product = require('../models/Product');
const ProductGroup = require('../models/ProductGroup');

// Route for JSON API (optional)
module.exports.index = async (req, res) => {
    try {
        // Fetch data needed for the dashboard
        const brands = await Brand.findAll();
        const products = await Product.findAll();
        const productGroups = await ProductGroup.findAll();
    
        // Map data to match the Pug template expectations
        const data = {
          keyword: null, // For search form; update with req.query.keyword if needed
          user: null, // Add logic for user session if needed (e.g., req.session.user)
          userName: 'Guest', // Replace with actual user logic
          // productInCart: new Map(), // Initialize as empty Map if no cart data
          groups: productGroups.map(group => ({
            key: group.name || 'Unnamed Group', // Adjust based on your model
            value: [] // Add child items if applicable
          })),
          brands: brands.map(brand => ({
            brandName: brand.name || 'Unnamed Brand' // Adjust based on your model
          })),
          products: products.map(product => ({
            productId: product.id,
            productName: product.name || 'Unnamed Product',
            description: product.description || 'No description',
            salePrice: product.price || 0,
            imageUrls: product.image || 'https://via.placeholder.com/150'
          }))
        };
    
        // Add size method to productInCart for Pug compatibility
        // data.productInCart.size = () => data.productInCart.size;
    
        // Render the dashboard.pug template with the data
        console.log(req.session)
        res.render('dashboard', data);
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
};

