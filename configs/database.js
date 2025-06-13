const { Sequelize } = require('sequelize');
require('dotenv').config();

class Database {
    constructor() {
        // Validate environment variables first
        this.validateEnvironment();
          // Get database credentials from environment variables
        const dbName = process.env.DB_NAME || 'AutoPartsDB';
        const dbUser = process.env.DB_USER_NAME || 'sa';
        const dbPassword = process.env.DB_PASS || 'yourpassword';
        const dbHost = process.env.HOST || 'localhost';
        const dbPort = process.env.DB_PORT || 1433;
        const dbDialect = process.env.DIALECT || 'mssql';        // Initialize Sequelize with database configuration
        this.sequelize = new Sequelize(dbName, dbUser, dbPassword, {
            host: dbHost,
            port: dbPort,
            dialect: dbDialect,
            logging: false, // Set to console.log to see SQL queries
            dialectOptions: {
                options: {
                    encrypt: false, // For Azure SQL Server
                    trustServerCertificate: true, // For local development
                    requestTimeout: 30000, // 30 seconds
                    connectionTimeout: 30000, // 30 seconds
                }
            },
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                freezeTableName: true
            }
        });
    }    // Method to validate environment variables
    validateEnvironment() {
        const requiredEnvVars = {
            'DB_NAME': process.env.DB_NAME,
            'DB_USER_NAME': process.env.DB_USER_NAME,
            'DB_PASS': process.env.DB_PASS,
            'HOST': process.env.HOST,
            'DB_PORT': process.env.DB_PORT,
            'DIALECT': process.env.DIALECT
        };

        const missingVars = [];
        const warnings = [];

        for (const [key, value] of Object.entries(requiredEnvVars)) {
            if (!value) {
                if (key === 'DB_PASS') {
                    warnings.push(`${key} is not set, using default (not recommended for production)`);
                } else {
                    warnings.push(`${key} is not set, using default value`);
                }
            }
        }

        if (warnings.length > 0) {
            console.warn('Database Configuration Warnings:');
            warnings.forEach(warning => console.warn(`  - ${warning}`));
        }

        // Check for production environment
        if (process.env.NODE_ENV === 'production' && !process.env.DB_PASS) {
            throw new Error('Database password must be set in production environment');
        }
    }    // Method to get current configuration (without sensitive data)
    getConfig() {
        return {
            database: process.env.DB_NAME || 'AutoPartsDB',
            username: process.env.DB_USER_NAME || 'sa',
            host: process.env.HOST || 'localhost',
            port: process.env.DB_PORT || 1433,
            dialect: process.env.DIALECT || 'mssql',
            logging: false,
            environment: process.env.NODE_ENV || 'development'
        };
    }// Method to get the Sequelize instance
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

    // Method to sync database models with proper error handling
    async syncDatabase(options = { force: false, alter: false }) {
        try {
            console.log('Starting database synchronization...');
            
            // Check connection first
            const isConnected = await this.testConnection();
            if (!isConnected) {
                throw new Error('Database connection failed. Cannot sync models.');
            }

            // Sync models with provided options
            await this.sequelize.sync(options);
            
            console.log('Database models synced successfully');
            return true;
        } catch (error) {
            console.error('Database synchronization error:', error);
            
            // More specific error handling
            if (error.name === 'SequelizeConnectionError') {
                console.error('Connection error: Please check your database configuration and ensure the database server is running.');
            } else if (error.name === 'SequelizeValidationError') {
                console.error('Validation error: Please check your model definitions.');
            } else if (error.name === 'SequelizeDatabaseError') {
                console.error('Database error: Please check your SQL syntax and database schema.');
            }
            
            return false;
        }
    }

    // Method to close database connection
    async closeConnection() {
        try {
            await this.sequelize.close();
            console.log('Database connection closed successfully.');
            return true;
        } catch (error) {
            console.error('Error closing database connection:', error);
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

// Create and export the database instance
const dbInstance = new DatabaseSingleton().getInstance();

// Export the methods and properties directly
module.exports = {
    // Main sequelize instance (for backward compatibility)
    sequelize: dbInstance.sequelize,
    
    // Method to get the Sequelize instance
    getSequelize: function() {
        return dbInstance.sequelize;
    },
    
    // Method to test the connection
    testConnection: function() {
        return dbInstance.testConnection();
    },
    
    // Method to sync database
    syncDatabase: function(options) {
        return dbInstance.syncDatabase(options);
    },
    
    // Method to close connection
    closeConnection: function() {
        return dbInstance.closeConnection();
    },
    
    // Method to get configuration
    getConfig: function() {
        return dbInstance.getConfig();
    },
    
    // Export the Database singleton class
    DatabaseSingleton: DatabaseSingleton
};