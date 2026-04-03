const VALID_SERVICES = [
  'General Checkup & Cleaning',
  'Tooth Extraction',
  'Dental Fillings',
  'Root Canal Treatment',
  'Teeth Whitening',
  'Dental Implants',
  'Orthodontics / Braces',
  'Pediatric Dentistry'
];

const VALID_BRANCHES  = ['suryabinayak', 'gatthaghar'];
const VALID_STATUSES  = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEPAL_PHONE_RE  = /^(\+977[-\s]?)?[9][0-9]{9}$|^0?1[-\s]?[0-9]{6,7}$/;

function isFutureDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const input = new Date(dateStr + 'T00:00:00');
  return input >= today;
}

function validateAppointment(req, res, next) {
  const { patient = {}, appointment = {} } = req.body;
  const errors = {};

  if (!patient.name || patient.name.trim().length < 2)
    errors['patient.name'] = 'Full name must be at least 2 characters.';
  else if (!/^[a-zA-Z\u0900-\u097F\s'.,-]+$/.test(patient.name.trim()))
    errors['patient.name'] = 'Name contains invalid characters.';

  if (!patient.email)
    errors['patient.email'] = 'Email address is required.';
  else if (!EMAIL_RE.test(patient.email))
    errors['patient.email'] = 'Please enter a valid email address.';

  if (!patient.phone)
    errors['patient.phone'] = 'Phone number is required.';
  else if (!NEPAL_PHONE_RE.test(patient.phone.replace(/\s/g, '')))
    errors['patient.phone'] = 'Enter a valid Nepal phone number (+977-9XXXXXXXXX or 01-XXXXXXX).';

  if (patient.age !== undefined && patient.age !== '') {
    const age = parseInt(patient.age, 10);
    if (isNaN(age) || age < 1 || age > 120)
      errors['patient.age'] = 'Please enter a valid age (1–120).';
  }

  if (!appointment.service)
    errors['appointment.service'] = 'Please select a service.';
  else if (!VALID_SERVICES.includes(appointment.service))
    errors['appointment.service'] = 'Invalid service selected.';

  if (!appointment.branch)
    errors['appointment.branch'] = 'Please select a clinic branch.';
  else if (!VALID_BRANCHES.includes(appointment.branch))
    errors['appointment.branch'] = 'Invalid branch selected.';

  if (!appointment.date)
    errors['appointment.date'] = 'Please select an appointment date.';
  else if (!isFutureDate(appointment.date))
    errors['appointment.date'] = 'Appointment date must be today or a future date.';

  if (!appointment.timeSlot)
    errors['appointment.timeSlot'] = 'Please select a time slot.';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error:   'VALIDATION_ERROR',
      message: 'Please correct the following errors:',
      details: errors
    });
  }
  next();
}

module.exports = { validateAppointment, VALID_SERVICES, VALID_BRANCHES, VALID_STATUSES };
