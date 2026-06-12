const router = require('express').Router();
const auth = require('../middleware/auth');
const tripService = require('../services/tripService');

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management
 */

/**
 * @swagger
 * /api/trips/group/{groupId}:
 *   get:
 *     summary: Get all trips for a group
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of trips
 */
router.get('/group/:groupId', auth, (req, res, next) => tripService.getByGroup(req, res, next));

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a single trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip object
 */
router.get('/:id', auth, (req, res, next) => tripService.getOne(req, res, next));

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, groupId]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Trip created
 */
router.post('/', auth, (req, res, next) => tripService.create(req, res, next));

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update a trip
 *     tags: [Trips]
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
 *         description: Updated trip
 */
router.put('/:id', auth, (req, res, next) => tripService.update(req, res, next));

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted
 */
router.delete('/:id', auth, (req, res, next) => tripService.remove(req, res, next));

module.exports = router;
