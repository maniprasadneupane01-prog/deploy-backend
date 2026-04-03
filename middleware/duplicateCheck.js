const { findMany } = require('../utils/fileDB');

async function duplicateCheck(req, res, next) {
  const { patient, appointment } = req.body;
  const { date, timeSlot, branch } = appointment;

  const existing = await findMany('appointments', a =>
    (a.patient.email === patient.email ||
     a.patient.phone.replace(/\D/g,'') === patient.phone.replace(/\D/g,'')) &&
    a.appointment.date     === date     &&
    a.appointment.timeSlot === timeSlot &&
    a.appointment.branch   === branch   &&
    a.status               !== 'cancelled'
  );

  if (existing.length > 0) {
    const appt = existing[0];
    return res.status(409).json({
      success:    false,
      error:      'DUPLICATE_BOOKING',
      existingId: appt.id,
      message:    `An appointment already exists for this contact on ${date} at ${timeSlot} ` +
                  `at the ${branch === 'suryabinayak' ? 'Suryabinayak (Main)' : 'Gatthaghar'} branch. ` +
                  `Please choose a different time slot, or call us at +977 985-1075694 to reschedule.`
    });
  }
  next();
}

module.exports = duplicateCheck;
