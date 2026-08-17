const fs = require('node:fs');
const { Pool } = require('pg');
const { env } = require('../config/env');

const poolConfig = {
  connectionString: env.databaseUrl,
};

if (env.databaseSslCaFile) {
  poolConfig.ssl = {
    ca: fs.readFileSync(env.databaseSslCaFile, 'utf8'),
    rejectUnauthorized: true,
    ...(env.databaseSslServername ? { servername: env.databaseSslServername } : {}),
  };
}

const pool = new Pool(poolConfig);

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
