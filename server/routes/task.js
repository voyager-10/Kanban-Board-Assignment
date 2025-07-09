const express = require('express');
const Task = require('../models/Task');
// const User = require('../models/User');
const router = express.Router();

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('_id username');
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

router.get('/users', authenticate, async (req, res) => {
  const users = await User.find().select('_id username');
  res.json(users);
});


router.get('/', async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'username');
  res.json(tasks);
});

// Manually assign task to another user
router.put('/:id/assign', authenticate, async (req, res) => {
  const { assignedTo } = req.body;

  if (!assignedTo) return res.status(400).json({ msg: 'User ID required' });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Only current assignee can reassign
    if (String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to reassign this task' });
    }

    const user = await User.findById(assignedTo);
    if (!user) return res.status(404).json({ msg: 'Assignee not found' });

    task.assignedTo = assignedTo;
    task.lastModified = new Date();
    await task.save();

    const populated = await task.populate('assignedTo', 'username');
    req.app.get('io').emit('task-updated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Task reassignment failed' });
  }
});

// Get all tasks

// Conflict checking
router.get('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ msg: 'Task not found' });
  res.json(task);
});



// Create task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();

    req.app.get('io').emit('task-created', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Task creation failed' });
  }
});


// Update task
router.put('/:id', async (req, res) => {
  try {
    const clientTimestamp = new Date(req.body.lastModified);
    const serverTask = await Task.findById(req.params.id);

    if (!serverTask) return res.status(404).json({ msg: 'Task not found' });

    const serverTimestamp = new Date(serverTask.lastModified);

    // Conflict detected
    if (clientTimestamp < serverTimestamp) {
      return res.status(409).json({
        msg: 'Conflict detected',
        serverVersion: serverTask,
      });
    }

    // No conflict — safe to update
    req.body.lastModified = new Date();
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('assignedTo', 'username');

    req.app.get('io').emit('task-updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Update failed' });
  }
});



// // Update task
// router.put('/:id', async (req, res) => {
//   try {
//     req.body.lastModified = new Date(); // Update timestamp
//     const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

//     req.app.get('io').emit('task-updated', updated);
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ msg: 'Update failed' });
//   }
// });


router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    if (String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    req.app.get('io').emit('task-deleted', req.params.id);
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Delete failed' });
  }
});


// Smart assign
router.post('/:id/smart-assign', async (req, res) => {
  try {
    const users = await User.find();

    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Task.countDocuments({
          assignedTo: user._id,
          status: { $in: ['Todo', 'In Progress'] }
        });
        return { user, count };
      })
    );

    const leastBusy = userTaskCounts.reduce((a, b) => (a.count < b.count ? a : b));

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: leastBusy.user._id, lastModified: new Date() },
      { new: true }
    ).populate('assignedTo', 'username');

    req.app.get('io').emit('task-updated', task);

    res.json({ msg: 'Task smart-assigned', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Smart assign failed' });
  }
});


module.exports = router;
