const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'mssql',
    host: 'localhost',        
    port: '1433',                
    username: 'sa', 
    password: '10802', 
    database: 'AutoPartsDB', 
    dialectOptions: {
        options: {
            encrypt: true,           // For Azure SQL, set to false if not needed
            trustServerCertificate: true // For local dev
        }
    },
    pool: {
        max: 5,                 // Max connections
        min: 0,                 // Min connections
        acquire: 30000,         // Max time to acquire a connection (ms)
        idle: 10000             // Max idle time (ms)
    }
});

// Test the connection
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to SQL Server');
        await sequelize.sync({ force: false });
        console.log('All models synced successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
})();

module.exports = sequelize;