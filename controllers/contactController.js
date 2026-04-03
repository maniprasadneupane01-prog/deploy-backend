const { create, readAll, findById, updateById, deleteById } = require('../utils/fileDB');
const { generateId } = require('../utils/idGenerator');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.getAll = (req, res, next) => {
  try {
    const data = readAll('contacts');
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const record = findById('contacts', req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Contact ${req.params.id} not found.` });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    const errors = {};

    if (!name || name.trim().length < 2)
      errors.name = 'Name is required (min 2 characters).';
    if (!email || !EMAIL_RE.test(email))
      errors.email = 'A valid email address is required.';
    if (!message || message.trim().length < 10)
      errors.message = 'Message must be at least 10 characters.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please correct the following errors:',
        details: errors
      });
    }

    const record = {
      id:        generateId('CTC'),
      createdAt: new Date().toISOString(),
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      message: message.trim(),
    };

    const saved = create('contacts', record);
    res.status(201).json({ success: true, message: 'Thank you for your message.', data: saved });
  } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
  try {
    const updated = updateById('contacts', req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Contact ${req.params.id} not found.` });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    const deleted = deleteById('contacts', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Contact ${req.params.id} not found.` });
    res.json({ success: true, message: `Contact ${req.params.id} permanently deleted.` });
  } catch (err) { next(err); }
};
