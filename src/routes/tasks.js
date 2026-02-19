const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// ─────────────────────────────────────────
// GET /api/tasks — Get all tasks
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM tasks ORDER BY created_at DESC');

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /api/tasks/:id — Get single task
// ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (result.recordset.length === 0) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/tasks — Create task
// ─────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(1000), description || null)
      .input('status', sql.NVarChar(50), 'pending')
      .query(`
        INSERT INTO tasks (title, description, status, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@title, @description, @status, GETUTCDATE(), GETUTCDATE())
      `);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PUT /api/tasks/:id — Update task
// ─────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    // Validate status value
    const allowedStatuses = ['pending', 'in-progress', 'completed'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const pool = await poolPromise;

    // Check task exists first
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (existing.recordset.length === 0) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar(255), title || existing.recordset[0].title)
      .input('description', sql.NVarChar(1000), description || existing.recordset[0].description)
      .input('status', sql.NVarChar(50), status || existing.recordset[0].status)
      .query(`
        UPDATE tasks
        SET title = @title,
            description = @description,
            status = @status,
            updated_at = GETUTCDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// DELETE /api/tasks/:id — Delete task
// ─────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await poolPromise;

    // Check task exists first
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (existing.recordset.length === 0) {
      const err = new Error('Task not found');
      err.status = 404;
      return next(err);
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM tasks WHERE id = @id');

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;