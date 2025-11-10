const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we need SSL (for cloud databases like Aiven)
const isCloudDatabase = process.env.DB_HOST && (
    process.env.DB_HOST.includes('aivencloud.com') ||
    process.env.DB_HOST.includes('amazonaws.com') ||
    process.env.DB_HOST.includes('azure.com') ||
    process.env.DB_SSL === 'true'
);

const dialectOptions = {};

if (isCloudDatabase || process.env.DB_SSL === 'true') {
    dialectOptions.ssl = {
        require: true,
        rejectUnauthorized: false // Set to true in production with proper CA certificate
    };
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'crm_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = { sequelize };

