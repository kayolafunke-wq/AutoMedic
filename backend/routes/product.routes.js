const express = require('express')
const router  = require('express').Router()
const crypto  = require('crypto')
const db      = require('../config/db')
const { authenticate, authorize } = require('../middleware/auth')
const { createProductRules } = require('../middleware/validate')
const inventorySvc = require('../services/inventory.service')

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all active products
 *     description: Retrieve list of active products, optionally filtered by category
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *         example: lubricants
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const sql = category
      ? 'SELECT * FROM products WHERE is_active=1 AND category=? ORDER BY name'
      : 'SELECT * FROM products WHERE is_active=1 ORDER BY name'
    const r = await db.query(sql, category ? [category] : [])
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product (Admin only)
 *     description: Add a new product to the inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engine Oil 5W-30
 *               description:
 *                 type: string
 *                 example: High-quality synthetic motor oil
 *               category:
 *                 type: string
 *                 example: lubricants
 *               cost_price:
 *                 type: number
 *                 example: 8000
 *               price:
 *                 type: number
 *                 example: 12000
 *               stock_quantity:
 *                 type: integer
 *                 example: 25
 *               image_url:
 *                 type: string
 *                 example: /uploads/products/oil.jpg
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authenticate, authorize('admin'), createProductRules, async (req, res) => {
  try {
    const { name, description, category, cost_price, price, stock_quantity, image_url } = req.body
    const id  = crypto.randomBytes(16).toString('hex')
    const qty = stock_quantity ? Number(stock_quantity) : 0
    await db.query(
      'INSERT INTO products (id,name,description,category,cost_price,price,stock_quantity,image_url) VALUES (?,?,?,?,?,?,?,?)',
      [id, name, description||null, category||null, cost_price!=null?Number(cost_price):null, price||null, qty, image_url||null]
    )
    // Log initial stock-in if starting with stock
    if (qty > 0) {
      await inventorySvc.logMovement({
        productId: id, type: 'stock_in',
        qtyChange: qty, qtyBefore: 0, qtyAfter: qty,
        reason: 'Initial stock on product creation', createdBy: req.user.id,
      })
    }
    const r = await db.query('SELECT * FROM products WHERE id = ?', [id])
    res.status(201).json({ success:true, data:r.rows[0] })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, cost_price, price, stock_quantity, image_url, is_active } = req.body
    const r = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (!r.rows.length) return res.status(404).json({ success:false, message:'Not found' })
    const p = r.rows[0]

    // If stock_quantity is being changed manually, log as adjustment
    const newQty = stock_quantity !== undefined ? Number(stock_quantity) : p.stock_quantity
    if (stock_quantity !== undefined && newQty !== p.stock_quantity) {
      await inventorySvc.logMovement({
        productId: req.params.id, type: 'adjustment',
        qtyChange: newQty - p.stock_quantity, qtyBefore: p.stock_quantity, qtyAfter: newQty,
        reason: 'Manual stock adjustment via admin', createdBy: req.user.id,
      })
    }

    const finalImageUrl = image_url !== undefined ? image_url : p.image_url

    await db.query(
      'UPDATE products SET name=?,description=?,category=?,cost_price=?,price=?,stock_quantity=?,image_url=?,is_active=? WHERE id=?',
      [
        name||p.name,
        description!==undefined?description:p.description,
        category||p.category,
        cost_price!=null?Number(cost_price):p.cost_price,
        price||p.price,
        newQty,
        finalImageUrl,
        is_active!==undefined?(is_active?1:0):p.is_active,
        req.params.id
      ]
    )
    
    const updated = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    res.json({ success:true, data:updated.rows[0] })
  } catch (err) {
    res.status(400).json({ success:false, message:err.message })
  }
})

module.exports = router
