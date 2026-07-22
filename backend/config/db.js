const { Pool } = require('pg')

// Use DATABASE_URL from environment (Railway sets this automatically)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// PostgreSQL-compatible query wrapper
module.exports = {
  query: async (sql, params = []) => {
    try {
      const result = await pool.query(sql, params)
      return {
        rows: result.rows,
        rowCount: result.rowCount
      }
    } catch (err) {
      throw err
    }
  },
  pool, // expose pool for transactions
}
