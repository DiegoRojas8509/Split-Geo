const Expense = require('../models/Expense');
const Location = require('../models/Location');

async function getByGroup(req, res, next) {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email');
    res.json(expenses);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email')
      .populate('group', 'name');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { title, amount, groupId, splitAmong, paidBy } = req.body;
    if (!title || amount == null || !groupId) {
      const err = new Error('title, amount and groupId are required');
      err.status = 400;
      return next(err);
    }
    const expense = await Expense.create({
      title,
      amount,
      group: groupId,
      paidBy: paidBy || req.userId,
      splitAmong: splitAmong || [],
    });
    res.status(201).json(expense);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { title, amount, splitAmong, paidBy } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, splitAmong, paidBy },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, paidBy: req.userId });
    if (!expense) return res.status(404).json({ error: 'Expense not found or not authorized' });
    await Location.deleteMany({ linkedExpense: expense._id });
    res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
}

async function settleShare(req, res, next) {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    const share = expense.splitAmong.find((s) => s.user.toString() === req.userId);
    if (!share) return res.status(404).json({ error: 'You are not in this expense split' });
    share.settled = true;
    await expense.save();
    res.json(expense);
  } catch (err) { next(err); }
}

module.exports = { getByGroup, getOne, create, update, remove, settleShare };
