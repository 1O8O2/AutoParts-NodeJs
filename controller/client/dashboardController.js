// Sequelize database setup
const { Sequelize } = require('sequelize');
const sequelize = require('../../configs/database');
const Product  = require('../../models/Product');
const ProductGroup = require('../../models/ProductGroup');
const OrderDetail = require('../../models/OrderDetail');

// [GET] /
module.exports.index = async (req, res) => {
  try {
    // Fetch all products
    const proLstFav = await Product.findAll({ 
      limit: 12,
      order: [["stock", "DESC"]],
      include : [{
        model: ProductGroup,
        attributes: ['groupName'],
        where: { deleted: false }
      }],
      where: { 
        status: "Active",
        deleted: "false" 
      }
    });
    
    const proMostOrder = await Product.findAll({
      attributes: [
        'productId',
        'productName',
        'imageUrls',
        'salePrice',
        'description',
        [
          Sequelize.literal(`
            (SELECT SUM(amount)
             FROM OrderDetail
             WHERE OrderDetail.productId = Product.productId)
          `),
          'totalOrdered'
        ]
      ],
      where: {
        deleted: false,
        status: 'Active'
      },
      group: ['Product.productId', 'Product.productName', 'Product.imageUrls', 'Product.salePrice', 'Product.description'],
      order: [[Sequelize.literal('totalOrdered'), 'DESC']],
      limit: 4
    });

    // Process image URLs (split and take first image)
    const newProLst = proLstFav.map(product => {
      const img = product.imageUrls || '';
      product.imageUrls = img.split(',')[0]; // Take first image
      return product;
    });

    const newProMostOrder = proMostOrder.map(product => {
      const img = product.imageUrls || '';
      product.imageUrls = img.split(',')[0];
      return product;
    })

    res.render('client/pages/dashboard/index', {
      products: newProLst,
      productOrderMost: newProMostOrder
    });
  } catch (error) {
    req.flash('error', res.locals.messages.LOADING_ERROR);
    res.render('dashboard', { message: 'Đã xảy ra lỗi khi tải trang' });
  }
};

