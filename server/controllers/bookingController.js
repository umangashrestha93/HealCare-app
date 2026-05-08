const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');
const mongoose = require('mongoose');

// @desc    Get available time slots for a practitioner on a given date
// @route   GET /api/bookings/availability?practitionerId=X&date=Y
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { practitionerId, date } = req.query;

    if (!practitionerId || !date) {
      return res.status(400).json({ message: 'practitionerId and date are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(practitionerId)) {
      return res.status(400).json({ message: 'Invalid practitionerId' });
    }

    const practitioner = await Practitioner.findOne({
      _id: practitionerId,
      verificationStatus: 'approved',
      isVerified: true
    });

    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner not available for booking' });
    }

    // Parse the date and check day-of-week availability
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !practitioner.weekends) {
      return res.status(200).json({ success: true, available: [], message: 'Practitioner is not available on weekends' });
    }

    // Get already-booked slots for this date (confirmed only)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Booking.find({
      practitionerId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: 'confirmed'
    }).select('startTime');

    const bookedTimes = new Set(bookedSlots.map(b => b.startTime));
    const available = (practitioner.availableSlots || []).filter(slot => !bookedTimes.has(slot));

    res.status(200).json({
      success: true,
      date,
      practitionerId,
      available,
      fee: practitioner.fee
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch available slots', error: err.message });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Client)
exports.createBooking = async (req, res) => {
  try {
    // Accept both naming conventions for backwards compatibility
    const {
      practitionerId,
      appointmentDate,
      date,          // frontend alias
      startTime,
      time,          // frontend alias
      serviceType = 'telehealth',
      notes
    } = req.body;

    const resolvedDate = appointmentDate || date;
    const resolvedTime = startTime || time;

    if (!practitionerId || !resolvedDate || !resolvedTime) {
      return res.status(400).json({ message: 'practitionerId, date, and time are required' });
    }

    // 1. Check if practitioner exists and is verified
    const practitioner = await Practitioner.findOne({
      _id: practitionerId,
      verificationStatus: 'approved',
      isVerified: true
    });

    if (!practitioner) {
      return res.status(400).json({ message: 'Practitioner not available for booking' });
    }

    // 2. Prevent Double Booking
    const startOfDay = new Date(resolvedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(resolvedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBooking = await Booking.findOne({
      practitionerId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      startTime: resolvedTime,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another.' });
    }

    // 3. Create Booking
    const booking = await Booking.create({
      clientId: req.user.id,
      practitionerId,
      appointmentDate: new Date(resolvedDate),
      startTime: resolvedTime,
      endTime: calculateEndTime(resolvedTime),
      serviceType,
      notes
    });

    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: populated
    });
  } catch (err) {
    // Unique index violation (race condition safeguard)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This time slot was just booked. Please choose another.' });
    }
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
};

// @desc    Get bookings for logged in user (Client or Practitioner)
// @route   GET /api/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'client') {
      query.clientId = req.user.id;
    } else if (req.user.role === 'practitioner') {
      const practitioner = await Practitioner.findOne({ userId: req.user.id });
      if (!practitioner) return res.status(404).json({ message: 'Practitioner profile not found' });
      query.practitionerId = practitioner._id;
    }

    // Exclude cancelled bookings from the default view
    query.status = { $ne: 'cancelled' };

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ appointmentDate: 1 }); // upcoming first

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve bookings', error: err.message });
  }
};

// @desc    Cancel a booking (sets status to cancelled, preserves audit trail)
// @route   DELETE /api/bookings/:id
// @access  Private (Client who owns the booking)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: only the client who made the booking can cancel
    if (booking.clientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
};

// Helper: Standard 60-min session end time
const calculateEndTime = (startTime) => {
  if (!startTime) return '';
  try {
    const [time, modifier] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const endHours = hours + 1;
    const finalHours = endHours > 12 ? endHours - 12 : endHours;
    const finalModifier = endHours >= 12 ? 'PM' : 'AM';
    
    return `${finalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${finalModifier}`;
  } catch (e) {
    return startTime;
  }
};
