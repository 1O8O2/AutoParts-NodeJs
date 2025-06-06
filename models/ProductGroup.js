const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();

const ProductGroup = sequelize.define('ProductGroup', {
  productGroupId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  groupName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  parentGroupId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: 'ProductGroup',
      key: 'productGroupId'
    }
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
  }
}, {
  tableName: 'ProductGroup',
  timestamps: true
});

// Self-referencing relationship for parent-child product groups
ProductGroup.belongsTo(ProductGroup, { 
  as: 'parentGroup',
  foreignKey: 'parentGroupId'
});
ProductGroup.hasMany(ProductGroup, {
  as: 'childGroups',
  foreignKey: 'parentGroupId'
});

module.exports = ProductGroup;