/**
 * Inventory logging service.
 * Every stock movement (in / out / adjustment) is recorded here.
 */
const crypto = require('crypto')
const db     = require('../config/db')

/**
 * Log a stock movement.
 * @param {object} opts
 * @param {string}  opts.productId
 * @param {'stock_in'|'stock_out'|'adjustment'} opts.type
 * @param {number}  opts.qtyChange   positive = in, negative = out
 * @param {number}  opts.qtyBefore
 * @param {number}  opts.qtyAfter
 * @param {string}  [opts.reason]    human-readable reason
 * @param {string}  [opts.reference] checkout id, restock ref, etc.
 * @param {string}  [opts.createdBy] user id
 */
async function logMovement({ productId, type, qtyChange, qtyBefore, qtyAfter, reason, reference, createdBy }) {
  try {
    const id = crypto.randomBytes(16).toString('hex')
    await db.query(
      `INSERT INTO inventory_logs
         (id, product_id, type, qty_change, qty_before, qty_after, reason, reference, created_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, productId, type, qtyChange, qtyBefore, qtyAfter, reason || null, reference || null, createdBy || null]
    )
  } catch (err) {
    // Non-fatal — log but never crash the parent operation
    console.error('[inventory_log] Failed to write log:', err.message)
  }
}

/**
 * Deduct stock and log the movement.
 * Throws if insufficient stock.
 */
async function deductStock(productId, qty, reference, createdBy) {
  const p = await db.query('SELECT id, name, stock_quantity FROM products WHERE id = ? AND is_active = 1', [productId])
  if (!p.rows.length) throw new Error(`Product not found: ${productId}`)
  const product = p.rows[0]
  if (product.stock_quantity < qty) {
    throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${qty}`)
  }
  const qtyBefore = product.stock_quantity
  const qtyAfter  = Math.max(0, qtyBefore - qty)
  await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [qtyAfter, productId])
  await logMovement({
    productId,
    type:      'stock_out',
    qtyChange: -qty,
    qtyBefore,
    qtyAfter,
    reason:    'Stock out — checkout',
    reference,
    createdBy,
  })
  return product
}

/**
 * Add stock and log the movement.
 */
async function addStock(productId, qty, reason, reference, createdBy) {
  const p = await db.query('SELECT id, name, stock_quantity FROM products WHERE id = ?', [productId])
  if (!p.rows.length) throw new Error(`Product not found: ${productId}`)
  const qtyBefore = p.rows[0].stock_quantity
  const qtyAfter  = qtyBefore + qty
  await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [qtyAfter, productId])
  await logMovement({
    productId,
    type:      'stock_in',
    qtyChange: qty,
    qtyBefore,
    qtyAfter,
    reason:    reason || 'Stock in — restock',
    reference,
    createdBy,
  })
  return { product: p.rows[0], qtyBefore, qtyAfter }
}

/**
 * Manual adjustment (admin correction).
 */
async function adjustStock(productId, newQty, reason, createdBy) {
  const p = await db.query('SELECT id, name, stock_quantity FROM products WHERE id = ?', [productId])
  if (!p.rows.length) throw new Error(`Product not found: ${productId}`)
  const qtyBefore = p.rows[0].stock_quantity
  const qtyChange = newQty - qtyBefore
  await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, productId])
  await logMovement({
    productId,
    type:      'adjustment',
    qtyChange,
    qtyBefore,
    qtyAfter:  newQty,
    reason:    reason || 'Manual stock adjustment',
    createdBy,
  })
  return { qtyBefore, qtyAfter: newQty }
}

module.exports = { logMovement, deductStock, addStock, adjustStock }
