const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const ProductGroup = sequelize.define('ProductGroup', {
    productGroupId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    groupName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentGroupId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'ProductGroup',
    timestamps: false
});

// // Self-referencing relationship for parentGroupId
// ProductGroup.belongsTo(ProductGroup, { as: 'parentGroup', foreignKey: 'parentGroupId', targetKey: 'productGroupId' });
// ProductGroup.hasMany(ProductGroup, { as: 'childGroups', foreignKey: 'parentGroupId', sourceKey: 'productGroupId' });

module.exports = ProductGroup;