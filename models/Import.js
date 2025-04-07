const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const Employee = require('./Employee');
const ImportDetail = require('./ImportDetail');

const Import = sequelize.define('Import', {
    importId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    employeePhone: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'Employee',
            key: 'phone'
        }
    },
    importDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    importCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'Import',
    timestamps: false
});

// Define associations
Import.belongsTo(Employee, {
    foreignKey: 'employeePhone',
    targetKey: 'phone',
    as: 'Employee'
});

Import.hasMany(ImportDetail, {
    foreignKey: 'importId',
    sourceKey: 'importId',
    as: 'importDetails'
});

module.exports = Import; 