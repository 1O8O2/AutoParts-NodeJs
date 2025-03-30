// Sequelize database setup
const sequelize = require('../../configs/database');
const Product  = require('../../models/Product');

// [GET] /
module.exports.index = async (req, res) => {
  try {
    // Fetch all products
    const proLst = await Product.findAll({ limit: 10 });
    
    // Process image URLs (split and take first image)
    const newProLst = proLst.map(product => {
        const img = product.imageUrls || '';
        product.imageUrls = img.split(',')[0]; // Take first image
        return product;
    });

    res.render('client/pages/dashboard/index', {
      products: newProLst
    });
  } catch (error) {
    res.render('dashboard', { message: 'Đã xảy ra lỗi khi tải trang' });
  }
};

