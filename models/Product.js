const { DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();
const Brand = require('./Brand');
const ProductGroup = require('./ProductGroup');
const Employee = require('./Employee');

const Product = sequelize.define('Product', {
  productId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  productGroupId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: ProductGroup,
      key: 'productGroupId'
    }
  },
  brandId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: Brand,
      key: 'brandId'
    }
  },
  salePrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  costPrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  imageUrls: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.fn('GETDATE')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.fn('GETDATE')
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: Employee,
      key: 'email'
    }
  },
  updatedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: Employee,
      key: 'email'
    }
  }
}, {
  tableName: 'Product',
  timestamps: true
});

// Define relationships
Product.belongsTo(Brand, { foreignKey: 'brandId', targetKey: 'brandId' });
Product.belongsTo(ProductGroup, { foreignKey: 'productGroupId', targetKey: 'productGroupId' });
Product.belongsTo(Employee, { foreignKey: 'createdBy', targetKey: 'email', as: 'creator' });
Product.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });

module.exports = Product;
