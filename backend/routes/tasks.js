const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Task = require('../models/Task');

// @route   GET /api/tasks
// @desc    Get all tasks for user (with search & filter)
// @access  Private
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['todo', 'in-progress', 'done']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  async (req, res) => {
    const { status, priority, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    try {
      const total = await Task.countDocuments(filter);
      const tasks = await Task.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit));

      res.json({
        success: true,
        tasks,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
          limit: Number(limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch tasks.' });
    }
  }
);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    try {
      const task = await Task.create({
        ...req.body,
        user: req.user._id,
      });
      res.status(201).json({ success: true, task });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create task.' });
    }
  }
);

// @route   GET /api/tasks/:id
// @desc    Get a single task
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch task.' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }
      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update task.' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete task.' });
  }
});

// @route   GET /api/tasks/stats/summary
// @desc    Get task stats for dashboard
// @access  Private
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const summary = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
    stats.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });

    const priority = { low: 0, medium: 0, high: 0 };
    priorityStats.forEach(({ _id, count }) => { priority[_id] = count; });

    res.json({ success: true, summary, priority });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
