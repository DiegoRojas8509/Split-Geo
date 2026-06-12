const router = require('express').Router();
const auth = require('../middleware/auth');
const expenseService = require('../services/expenseService');

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management
 */

/**
 * @swagger
 * /api/expenses/group/{groupId}:
 *   get:
 *     summary: Get all expenses for a group
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get('/group/:groupId', auth, (req, res, next) => expenseService.getByGroup(req, res, next));

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get a single expense
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense object
 */
router.get('/:id', auth, (req, res, next) => expenseService.getOne(req, res, next));

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, amount, groupId]
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               groupId:
 *                 type: string
 *               splitAmong:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: string
 *                     share:
 *                       type: number
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post('/', auth, (req, res, next) => expenseService.create(req, res, next));

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense (paidBy only)
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *               splitAmong:
 *                 type: array
 *     responses:
 *       200:
 *         description: Updated expense
 */
router.put('/:id', auth, (req, res, next) => expenseService.update(req, res, next));

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete an expense (paidBy only)
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/:id', auth, (req, res, next) => expenseService.remove(req, res, next));

/**
 * @swagger
 * /api/expenses/{id}/settle:
 *   patch:
 *     summary: Mark your share as settled
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share settled
 */
router.patch('/:id/settle', auth, (req, res, next) => expenseService.settleShare(req, res, next));

module.exports = router;
