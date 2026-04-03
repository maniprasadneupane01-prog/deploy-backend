const { findMany } = require('./fileDB');

const ALL_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM',  '2:00 PM',
  '3:00 PM',  '4:00 PM',  '5:00 PM'
];

function getBookedSlots(date, branch) {
  const booked = findMany('appointments', a =>
    a.appointment.date   === date   &&
    a.appointment.branch === branch &&
    a.status             !== 'cancelled'
  );
  return booked.map(a => a.appointment.timeSlot);
}

function isSlotAvailable(date, branch, timeSlot) {
  const booked = getBookedSlots(date, branch);
  return !booked.includes(timeSlot);
}

function getSlotStatus(date, branch) {
  const bookedSlots = getBookedSlots(date, branch);
  return {
    date, branch,
    available: ALL_SLOTS.filter(s => !bookedSlots.includes(s)),
    booked:    bookedSlots,
    total:     ALL_SLOTS.length
  };
}

module.exports = { ALL_SLOTS, getBookedSlots, isSlotAvailable, getSlotStatus };
