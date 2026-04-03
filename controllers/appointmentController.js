const { create, readAll, findById, updateById, deleteById } = require('../utils/fileDB');
const { generateId }   = require('../utils/idGenerator');
const { getSlotStatus } = require('../utils/slotManager');
const { VALID_STATUSES } = require('../middleware/validate');

exports.create = async (req, res, next) => {
  try {
    const record = {
      id:        generateId('BDC'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status:    'pending',
      patient: {
        name:   req.body.patient.name.trim(),
        email:  req.body.patient.email.toLowerCase().trim(),
        phone:  req.body.patient.phone.trim(),
        age:    req.body.patient.age    || null,
        gender: req.body.patient.gender || null,
      },
      appointment: {
        service:   req.body.appointment.service,
        branch:    req.body.appointment.branch,
        date:      req.body.appointment.date,
        timeSlot:  req.body.appointment.timeSlot,
        notes:     req.body.appointment.notes?.trim() || null,
      }
    };
    const saved = create('appointments', record);
    res.status(201).json({ success: true, data: saved });
  } catch (err) { next(err); }
};

exports.getAll = (req, res, next) => {
  try {
    const data = readAll('appointments');
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const record = findById('appointments', req.params.id);
    if (!record) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Appointment ${req.params.id} not found.` });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
  try {
    const { status, patient, appointment } = req.body;
    const updates = {};
    if (status) {
      if (!VALID_STATUSES.includes(status))
        return res.status(400).json({ success: false, error: 'INVALID_STATUS', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
      updates.status = status;
    }
    if (patient)     updates.patient     = patient;
    if (appointment) updates.appointment = appointment;

    const updated = updateById('appointments', req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Appointment ${req.params.id} not found.` });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    const deleted = deleteById('appointments', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Appointment ${req.params.id} not found.` });
    res.json({ success: true, message: `Appointment ${req.params.id} permanently deleted.` });
  } catch (err) { next(err); }
};

exports.getSlots = (req, res, next) => {
  try {
    const { date, branch } = req.query;
    if (!date || !branch)
      return res.status(400).json({ success: false, error: 'MISSING_PARAMS', message: 'Both date and branch query params are required.' });
    const result = getSlotStatus(date, branch);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};
