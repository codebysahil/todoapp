const sql = require('mssql');

// ← this line was missing!
const isLocal = process.env.NODE_ENV === 'development';

const config = isLocal
  ? {
      // ─────────────────────────────────────────
      // LOCAL — SQL Authentication
      // ─────────────────────────────────────────
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: 1433,
      options: {
        trustServerCertificate: true,
        encrypt: false
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    }
  : {
      // ─────────────────────────────────────────
      // AZURE — SQL Authentication
      // ─────────────────────────────────────────
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: 1433,
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`✅ Connected to ${isLocal ? 'Local' : 'Azure'} SQL Database`);
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = { sql, poolPromise };