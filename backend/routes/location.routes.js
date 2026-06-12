const router = require('express').Router();
const auth = require('../middleware/auth');
const locationService = require('../services/locationService');

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Map location management (points and zones)
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations (optional ?name= filter)
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter locations by name (case-insensitive)
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get('/', auth, (req, res, next) => locationService.getAll(req, res, next));

/**
 * @swagger
 * /api/locations/group/{groupId}:
 *   get:
 *     summary: Get all locations for a group (optional ?name= filter)
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get('/group/:groupId', auth, (req, res, next) => locationService.getByGroup(req, res, next));

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get a single location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location object
 */
router.get('/:id', auth, (req, res, next) => locationService.getOne(req, res, next));

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location (point or zone)
 *     tags: [Locations]
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
 *               type:
 *                 type: string
 *                 enum: [point, zone]
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *               groupId:
 *                 type: string
 *               linkedExpense:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created
 */
router.post('/', auth, (req, res, next) => locationService.create(req, res, next));

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update a location
 *     tags: [Locations]
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
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated location
 */
router.put('/:id', auth, (req, res, next) => locationService.update(req, res, next));

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location deleted
 */
router.delete('/:id', auth, (req, res, next) => locationService.remove(req, res, next));

module.exports = router;
