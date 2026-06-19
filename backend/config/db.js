const Database = require('better-sqlite3')
const path     = require('path')

const dbPath = path.join(__dirname, '../automedic.db')
const db     = new Database(dbPath)

// Enable WAL for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Promise-like wrapper so routes work the same way
module.exports = {
  query: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql)

      const upper = sql.trim().toUpperCase()
      if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
        const rows = stmt.all(...params)
        return Promise.resolve({ rows })
      } else {
        const info = stmt.run(...params)
        return Promise.resolve({ rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid })
      }
    } catch (err) {
      return Promise.reject(err)
    }
  },
  db, // expose raw db for transactions
}
