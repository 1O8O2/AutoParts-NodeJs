const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Product = require('./Product');

const Cart = sequelize.define('Cart', {
    cartId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    createDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function
    },
    products: {
        type: DataTypes.VIRTUAL,
        defaultValue: []
    }
}, {
    tableName: 'Cart',
    timestamps: false,
    hooks: {
        afterCreate: async (cart, options) => {
            if (cart.products.length > 0) {
                const productsData = cart.products.map(({ product, amount }) => ({
                    cartId: cart.cartId,
                    productId: product.productId,
                    amount
                }));
                await ProductsInCart.bulkCreate(productsData, { transaction: options.transaction });
            }
        },
        beforeUpdate: async (cart, options) => {
            if (cart.changed('products')) {
                await ProductsInCart.destroy({
                    where: { cartId: cart.cartId },
                    transaction: options.transaction
                });
                if (cart.products.length > 0) {
                    const productsData = cart.products.map(({ product, amount }) => ({
                        cartId: cart.cartId,
                        productId: product.productId,
                        amount
                    }));
                    await ProductsInCart.bulkCreate(productsData, { transaction: options.transaction });
                }
            }
        },
        afterFind: async (carts, options) => {
            const cartsArray = Array.isArray(carts) ? carts : [carts];
            for (const cart of cartsArray) {
                if (cart && cart.cartId) {
                    const productsInCart = await ProductsInCart.findAll({
                        where: { cartId: cart.cartId },
                        transaction: options?.transaction
                    });
                    const productIds = productsInCart.map(item => item.productId);
                    const productInstances = await Product.findAll({
                        where: { productId: productIds },
                        transaction: options?.transaction
                    });
                    cart.products = productsInCart.map(item => {
                        const product = productInstances.find(p => p.productId === item.productId);
                        return { product, amount: item.amount };
                    });
                }
            }
        }
    }
});

const ProductsInCart = sequelize.define('ProductsInCart', {
    cartId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
        references: {
            model: Cart,
            key: 'cartId'
        }
    },
    productId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
        references: {
            model: Product,
            key: 'productId'
        }
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'ProductsInCart',
    timestamps: false
});

// Correct relationships
Cart.hasMany(ProductsInCart, { foreignKey: 'cartId' });
ProductsInCart.belongsTo(Cart, { foreignKey: 'cartId' });
Product.hasMany(ProductsInCart, { foreignKey: 'productId' });
ProductsInCart.belongsTo(Product, { foreignKey: 'productId' });

module.exports = { Cart, ProductsInCart };