const Location = require('../models/Location');

async function getByGroup(req, res, next) {
  try {
    const filter = { group: req.params.groupId };
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    const locations = await Location.find(filter)
      .populate('createdBy', 'name email')
      .populate('linkedExpense', 'title amount');
    res.json(locations);
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const filter = {};
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    const locations = await Location.find(filter)
      .populate('createdBy', 'name email')
      .populate('group', 'name')
      .populate('linkedExpense', 'title amount');
    res.json(locations);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('group', 'name');
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, description, type, lat, lng, coordinates, groupId, linkedExpense } = req.body;
    if (!name || !groupId) {
      const err = new Error('name and groupId are required');
      err.status = 400;
      return next(err);
    }
    const location = await Location.create({
      name,
      description,
      type: type || 'point',
      lat,
      lng,
      coordinates,
      group: groupId,
      linkedExpense,
      createdBy: req.userId,
    });
    res.status(201).json(location);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, description, lat, lng, coordinates } = req.body;
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, description, lat, lng, coordinates },
      { new: true, runValidators: true }
    );
    if (!location) return res.status(404).json({ error: 'Location not found or not authorized' });
    res.json(location);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const location = await Location.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!location) return res.status(404).json({ error: 'Location not found or not authorized' });
    res.json({ message: 'Location deleted' });
  } catch (err) { next(err); }
}

module.exports = { getByGroup, getAll, getOne, create, update, remove };
