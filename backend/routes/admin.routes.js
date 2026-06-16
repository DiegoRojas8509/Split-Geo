const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

router.use(auth, requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Superuser endpoints (admin role required)
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of users
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}, '-passwordHash').lean();
    res.json(users);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/admin/users/{id}/password:
 *   patch:
 *     summary: Reset a user's password
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword is required' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { passwordHash });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/admin/groups:
 *   get:
 *     summary: List all groups
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of groups with owner and members populated
 */
router.get('/groups', async (req, res, next) => {
  try {
    const groups = await Group.find({})
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();
    res.json(groups);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/admin/trips:
 *   get:
 *     summary: List all trips
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of trips
 */
router.get('/trips', async (req, res, next) => {
  try {
    const trips = await Trip.find({})
      .populate('group', 'name')
      .populate('createdBy', 'name email')
      .lean();
    res.json(trips);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/admin/expenses:
 *   get:
 *     summary: List all expenses across all groups
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of expenses
 */
router.get('/expenses', async (req, res, next) => {
  try {
    const expenses = await Expense.find({})
      .populate('group', 'name')
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email')
      .lean();
    res.json(expenses);
  } catch (err) { next(err); }
});

module.exports = router;
