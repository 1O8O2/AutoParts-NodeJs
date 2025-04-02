const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: process.env.DIALECT,
    host: process.env.HOST,        
    port: process.env.DB_PORT,                
    username: process.env.DB_USER_NAME, 
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME, 
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
    },
    logging: false
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