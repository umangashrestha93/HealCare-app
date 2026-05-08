const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Client)
exports.createBooking = async (req, res) => {
  try {
    const { practitionerId, appointmentDate, startTime, serviceType } = req.body;

    // 1. Check if practitioner exists and is verified
    const practitioner = await Practitioner.findById(practitionerId);
    if (!practitioner || !practitioner.isVerified) {
      return res.status(400).json({ message: 'Practitioner not available for booking' });
    }

    // 2. Prevent Double Booking (Validation Logic)
    const existingBooking = await Booking.findOne({
      practitionerId,
      appointmentDate,
      startTime,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // 3. Create Booking (Minimal Friction)
    const booking = await Booking.create({
      clientId: req.user.id,
      practitionerId,
      appointmentDate,
      startTime,
      endTime: calculateEndTime(startTime), // Helper to auto-set 1hr or 30min
      serviceType
    });

    // 4. Trigger Notification (Architecture)
    // sendNotification(req.user.email, 'Booking Confirmed');

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (err) {
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
      // Find practitioner doc first
      const practitioner = await Practitioner.findOne({ userId: req.user.id });
      if (!practitioner) return res.status(404).json({ message: 'Practitioner profile not found' });
      query.practitionerId = practitioner._id;
    }

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort('-appointmentDate');

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve bookings', error: err.message });
  }
};

// Helper: Standard 60-min session
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
