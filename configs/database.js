const { Sequelize } = require('sequelize');
require('dotenv').config();

class Database {
    constructor() {
        // Get database credentials from environment variables
        const dbName = process.env.DB_NAME || 'AutoPartsDB';
        const dbUser = process.env.DB_USER_NAME || 'sa';
        const dbPassword = process.env.DB_PASS || 'yourpassword';
        const dbHost = process.env.HOST || 'localhost';
        const dbDialect = process.env.DIALECT || 'mssql';

        // Initialize Sequelize with database configuration
        this.sequelize = new Sequelize(dbName, dbUser, dbPassword, {
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
    }

    // Method to get the Sequelize instance
    getSequelize() {
        return this.sequelize;
    }

    // Method to test the connection
    async testConnection() {
        try {
            await this.sequelize.authenticate();
            console.log('Database connection established successfully.');
            return true;
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            return false;
        }
    }
}

// Create a singleton instance
class DatabaseSingleton {
    constructor() {
        if (!DatabaseSingleton.instance) {
            DatabaseSingleton.instance = new Database();
        }
    }

    getInstance() {
        return DatabaseSingleton.instance;
    }
}

// Export the Sequelize instance (for backward compatibility)
const dbInstance = new DatabaseSingleton().getInstance().getSequelize();
module.exports = dbInstance;

// Export the Database singleton class if needed elsewhere
module.exports.DatabaseSingleton = DatabaseSingleton;