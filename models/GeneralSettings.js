const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const GeneralSettings = sequelize.define('GeneralSettings', {
    websiteName: {
        type: DataTypes.STRING(255), // NVARCHAR(255)
        primaryKey: true,            // Primary key
        allowNull: false             // NOT NULL
    },
    logo: {
        type: DataTypes.STRING(255), // NVARCHAR(255)
        allowNull: true              // NULL
    },
    phone: {
        type: DataTypes.STRING(15),  // NVARCHAR(15)
        allowNull: true              // NULL
    },
    email: {
        type: DataTypes.STRING(255), // NVARCHAR(255)
        allowNull: true              // NULL
    },
    address: {
        type: DataTypes.STRING(255), // NVARCHAR(255)
        allowNull: true              // NULL
    },
    copyright: {
        type: DataTypes.STRING(255), // NVARCHAR(255)
        allowNull: true              // NULL
    },
    updatedAt: {
        type: DataTypes.DATE,        // DATETIME
        allowNull: true,             // NULL
        defaultValue: DataTypes.NOW  // DEFAULT GETDATE()
    },
 
}, {
    tableName: 'GeneralSettings',    // Exact table name
    timestamps: false                // Disable Sequelize's automatic timestamp management
});

module.exports = GeneralSettings;