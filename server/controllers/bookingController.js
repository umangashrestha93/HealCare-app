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

// Helper: Standard 60-min session
const calculateEndTime = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 1;
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
