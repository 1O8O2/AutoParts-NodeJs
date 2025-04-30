const { Sequelize } = require('sequelize');
require('dotenv').config();

// Get database credentials from environment variables
const dbName = process.env.DB_NAME || 'AutoPartsDB';
const dbUser = process.env.DB_USER_NAME || 'sa';
const dbPassword = process.env.DB_PASS || 'yourpassword';
const dbHost = process.env.HOST || 'localhost';
const dbDialect = process.env.DIALECT || 'mssql';

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    options: {
      encrypt: false, // For Azure SQL Server
      trustServerCertificate: true // For local development
    }
  },
  define: {
    timestamps: true,
    freezeTableName: true
  }
});

module.exports = sequelize;