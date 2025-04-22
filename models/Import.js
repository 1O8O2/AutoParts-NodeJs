const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const ImportDetail = require('./ImportDetail');

const Import = sequelize.define('Import', {
    importId: {
        type: DataTypes.STRING(50), // VARCHAR(50)
        primaryKey: true,
        allowNull: false            // NOT NULL
    },
    employeeEmail: {
        type: DataTypes.STRING, // VARCHAR(10)
        allowNull: false,           // NOT NULL
    },
    importDate: {
        type: DataTypes.DATEONLY,   // DATE (no time)
        allowNull: false,            // NOT NULL
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function
    },
    importCost: {
        type: DataTypes.DECIMAL(18, 2), // DECIMAL(18,2)
        allowNull: true                 // NULL
    }
}, {
    tableName: 'Import',        // Exact table name
    timestamps: false,          // No automatic timestamps
    hooks: {
        afterFind: async (imports, options) => {
            const importsArray = Array.isArray(imports) ? imports : [imports];
            for (const imp of importsArray) {
                if (imp && imp.importId) {
                    const details = await ImportDetail.findAll({
                        where: { importId: imp.importId },
                        transaction: options?.transaction // Support transactions if provided
                    });
                    imp.details = details; // Assign ImportDetail records to virtual field
                }
            }
        }
    }
} );

// Custom function to generate importId
Import.generateImportId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `IMP${year}${month}${day}${hours}${minutes}${seconds}`;
};


module.exports = Import;