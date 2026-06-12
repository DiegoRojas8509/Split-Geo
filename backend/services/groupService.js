const { v4: uuidv4 } = require('uuid');
const Group = require('../models/Group');

async function getAll(req, res, next) {
  try {
    const groups = await Group.find({
      $or: [{ owner: req.userId }, { members: req.userId }],
    }).populate('owner', 'name email').populate('members', 'name email');
    res.json(groups);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const group = await Group.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      const err = new Error('name is required');
      err.status = 400;
      return next(err);
    }
    const group = await Group.create({
      name,
      description,
      owner: req.userId,
      members: [req.userId],
      inviteToken: uuidv4(),
    });
    res.status(201).json(group);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, description } = req.body;
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { name, description },
      { new: true, runValidators: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found or not authorized' });
    res.json(group);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const group = await Group.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!group) return res.status(404).json({ error: 'Group not found or not authorized' });
    res.json({ message: 'Group deleted' });
  } catch (err) { next(err); }
}

async function join(req, res, next) {
  try {
    const { token } = req.params;
    const group = await Group.findOne({ inviteToken: token });
    if (!group) return res.status(404).json({ error: 'Invalid invite link' });
    if (!group.members.includes(req.userId)) {
      group.members.push(req.userId);
      await group.save();
    }
    res.json(group);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove, join };
