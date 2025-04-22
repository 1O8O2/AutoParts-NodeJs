const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const Import = require('./Import');

const ImportDetail = sequelize.define('ImportDetail', {
    importId: {
        type: DataTypes.STRING(50), // VARCHAR(50)
        allowNull: true,            // NULL (though typically NOT NULL in practice)
    },
    productId: {
        type: DataTypes.STRING(50), // VARCHAR(50)
        allowNull: true,            // NULL (though typically NOT NULL in practice)
    },
    price: {
        type: DataTypes.DECIMAL(18, 2), // DECIMAL(18,2)
        allowNull: true                 // NULL
    },
    amount: {
        type: DataTypes.INTEGER,    // INT
        allowNull: true             // NULL
    }
}, {
    tableName: 'ImportDetail',  // Exact table name
    timestamps: false           // No automatic timestamps
});


module.exports = ImportDetail;