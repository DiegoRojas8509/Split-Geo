const router = require('express').Router();
const auth = require('../middleware/auth');
const groupService = require('../services/groupService');

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups for the authenticated user
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/', auth, (req, res, next) => groupService.getAll(req, res, next));

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get a single group by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group object
 *       404:
 *         description: Group not found
 */
router.get('/:id', auth, (req, res, next) => groupService.getOne(req, res, next));

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 */
router.post('/', auth, (req, res, next) => groupService.create(req, res, next));

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update a group (owner only)
 *     tags: [Groups]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated group
 */
router.put('/:id', auth, (req, res, next) => groupService.update(req, res, next));

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete a group (owner only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted
 */
router.delete('/:id', auth, (req, res, next) => groupService.remove(req, res, next));

/**
 * @swagger
 * /api/groups/join/{token}:
 *   post:
 *     summary: Join a group via invite token
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined group
 *       404:
 *         description: Invalid invite link
 */
router.post('/join/:token', auth, (req, res, next) => groupService.join(req, res, next));

module.exports = router;
