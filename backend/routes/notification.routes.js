const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { authenticate } = require('../middleware/auth')

router.get('/', authenticate, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    )
    res.json({ success:true, data:r.rows })
  } catch (err) { res.status(500).json({ success:false, message:err.message }) }
})

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id])
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

router.patch('/read-all/all', authenticate, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id])
    res.json({ success:true })
  } catch (err) { res.status(400).json({ success:false, message:err.message }) }
})

module.exports = router
