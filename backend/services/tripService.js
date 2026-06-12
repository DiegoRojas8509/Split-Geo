const Trip = require('../models/Trip');
const Group = require('../models/Group');

async function getByGroup(req, res, next) {
  try {
    const trips = await Trip.find({ group: req.params.groupId })
      .populate('createdBy', 'name email');
    res.json(trips);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('group', 'name');
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, description, groupId } = req.body;
    if (!name || !groupId) {
      const err = new Error('name and groupId are required');
      err.status = 400;
      return next(err);
    }
    const group = await Group.findOne({
      _id: groupId,
      $or: [{ owner: req.userId }, { members: req.userId }],
    });
    if (!group) {
      const err = new Error('Group not found or not a member');
      err.status = 403;
      return next(err);
    }
    const trip = await Trip.create({ name, description, group: groupId, createdBy: req.userId });
    res.status(201).json(trip);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, description } = req.body;
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, description },
      { new: true, runValidators: true }
    );
    if (!trip) return res.status(404).json({ error: 'Trip not found or not authorized' });
    res.json(trip);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!trip) return res.status(404).json({ error: 'Trip not found or not authorized' });
    res.json({ message: 'Trip deleted' });
  } catch (err) { next(err); }
}

module.exports = { getByGroup, getOne, create, update, remove };
