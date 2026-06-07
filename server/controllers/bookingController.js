const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');
const User = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');

const OFFER_CODE = process.env.MEDICARE_OFFER_CODE || 'MEDICARE_ACCESS';
const DEFAULT_CURRENCY = 'AUD';
const PAYMENT_HOLD_MINUTES = Number(process.env.PAYMENT_HOLD_MINUTES || 15);

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

    // Get already-booked slots for this date (confirmed or reserved payment-pending only)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Booking.find({
      practitionerId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { status: 'confirmed' },
        { status: 'pending_approval' },
        { status: 'pending', paymentExpiresAt: { $gt: new Date() } }
      ]
    }).select('startTime');

    const bookedTimes = new Set(bookedSlots.map(b => b.startTime));
    const available = (practitioner.availableSlots || []).filter(slot => !bookedTimes.has(slot));

    res.status(200).json({
      success: true,
      date,
      practitionerId,
      available,
      fee: practitioner.fee,
      currency: DEFAULT_CURRENCY
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
      notes,
      applyMedicareOffer = false
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

    if (serviceType === 'telehealth' && !practitioner.telehealth) {
      return res.status(400).json({ message: 'This practitioner does not offer telehealth sessions' });
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
      $or: [
        { status: 'confirmed' },
        { status: 'pending_approval' },
        { status: 'pending', paymentExpiresAt: { $gt: new Date() } }
      ]
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another.' });
    }

    const client = await User.findById(req.user.id).select('medicareCard role');
    const pricing = buildPricing(practitioner.fee, client, Boolean(applyMedicareOffer));
    const telehealthRoom = serviceType === 'telehealth' ? createTelehealthRoom() : undefined;
    const paymentExpiresAt = new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000);

    // 3. Create pending reservation. It becomes confirmed only after verified payment.
    const booking = await Booking.create({
      clientId: req.user.id,
      practitionerId,
      appointmentDate: new Date(resolvedDate),
      startTime: resolvedTime,
      endTime: calculateEndTime(resolvedTime),
      serviceType,
      notes,
      status: 'pending',
      pricing,
      paymentStatus: 'pending',
      paymentExpiresAt,
      telehealthRoom
    });

    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    res.status(201).json({
      success: true,
      message: 'Booking reserved pending payment',
      data: populated,
      requiresPayment: true,
      paymentExpiresAt
    });
  } catch (err) {
    console.error('Booking creation failed:', {
      message: err.message,
      code: err.code,
      userId: req.user?.id,
      practitionerId: req.body?.practitionerId
    });

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

    // Client/practitioner dashboards should show confirmed, completed, and pending approval sessions.
    query.status = { $in: ['confirmed', 'completed', 'pending_approval'] };

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

// @desc    Get secure telehealth room details
// @route   GET /api/bookings/telehealth/:roomId
// @access  Private (booking client or practitioner)
exports.getTelehealthRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: 'roomId is required' });

    const booking = await Booking.findOne({
      'telehealthRoom.roomId': roomId,
      serviceType: 'telehealth',
      status: { $ne: 'cancelled' }
    })
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Telehealth room not found' });
    }

    const userId = req.user.id.toString();
    const isClient = booking.clientId?._id?.toString() === userId;
    let isPractitioner = false;

    if (req.user.role === 'practitioner') {
      const practitioner = await Practitioner.findOne({ userId: req.user.id }).select('_id');
      isPractitioner = practitioner?._id?.toString() === booking.practitionerId?._id?.toString();
    }

    if (!isClient && !isPractitioner) {
      return res.status(403).json({ message: 'Not authorized to join this telehealth room' });
    }

    res.status(200).json({
      success: true,
      data: {
        roomId,
        booking,
        joinUrl: booking.telehealthRoom.joinUrl,
        provider: booking.telehealthRoom.provider || 'inbuilt',
        canJoin: booking.status === 'confirmed',
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load telehealth room', error: err.message });
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
    booking.cancellationReason = 'requested_by_customer';
    booking.cancelReason = 'requested_by_customer';
    booking.refundReason = 'requested_by_customer';
    booking.reason = 'requested_by_customer';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
};

// @desc    Accept a booking request (Practitioner only)
// @route   PATCH /api/bookings/:id/accept
// @access  Private (Practitioner)
exports.acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Verify current user is the practitioner of the booking
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner || booking.practitionerId.toString() !== practitioner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this booking' });
    }

    if (booking.status !== 'pending_approval') {
      return res.status(400).json({ message: `Booking status is ${booking.status}, cannot accept` });
    }

    booking.status = 'confirmed';
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    res.status(200).json({ success: true, message: 'Booking accepted successfully', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Accept failed', error: err.message });
  }
};

// @desc    Reject/Cancel a booking request (Practitioner only)
// @route   PATCH /api/bookings/:id/reject
// @access  Private (Practitioner)
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify current user is the practitioner of the booking
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner || booking.practitionerId.toString() !== practitioner._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = 'rejected_by_practitioner';
    booking.cancelReason = 'rejected_by_practitioner';
    booking.refundReason = 'rejected_by_practitioner';
    booking.reason = 'rejected_by_practitioner';
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    res.status(200).json({ success: true, message: 'Booking rejected successfully', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Reject failed', error: err.message });
  }
};

// @desc    Reschedule a booking (Client or Practitioner)
// @route   PATCH /api/bookings/:id/reschedule
// @access  Private (Client or Practitioner)
exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required for rescheduling' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking id' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isClient = booking.clientId.toString() === req.user.id.toString();
    let isPractitioner = false;

    if (req.user.role === 'practitioner') {
      const practitioner = await Practitioner.findOne({ userId: req.user.id });
      isPractitioner = practitioner && booking.practitionerId.toString() === practitioner._id.toString();
    }

    if (!isClient && !isPractitioner) {
      return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ message: `Cannot reschedule a ${booking.status} booking` });
    }

    // Check if new slot is available (ignore the current booking's slot in the availability check!)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const collision = await Booking.findOne({
      _id: { $ne: booking._id }, // exclude this booking
      practitionerId: booking.practitionerId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      startTime: time,
      $or: [
        { status: 'confirmed' },
        { status: 'pending_approval' },
        { status: 'pending', paymentExpiresAt: { $gt: new Date() } }
      ]
    });

    if (collision) {
      return res.status(409).json({ message: 'The proposed time slot is already booked. Please choose another.' });
    }

    // Update appointment slot
    booking.appointmentDate = new Date(date);
    booking.startTime = time;
    booking.endTime = calculateEndTime(time);

    // Rule: If client reschedules, status goes to 'pending_approval'.
    // If practitioner reschedules, it can go straight to 'confirmed' (since practitioner did it, they accept it).
    if (req.user.role === 'client') {
      booking.status = 'pending_approval';
    } else if (req.user.role === 'practitioner') {
      booking.status = 'confirmed';
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'practitionerId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: populated
    });
  } catch (err) {
    res.status(500).json({ message: 'Reschedule failed', error: err.message });
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
  } catch {
    return startTime;
  }
};

const roundMoney = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const buildPricing = (fee, client, applyMedicareOffer) => {
  const subtotal = roundMoney(fee || 80);
  const medicareCard = client?.medicareCard;
  const hasMedicareOffer = applyMedicareOffer && medicareCard?.status === 'verified' && Number(medicareCard.offerPercent) > 0;
  const discountPercent = hasMedicareOffer ? Number(medicareCard.offerPercent) : 0;
  const discountAmount = roundMoney(subtotal * (discountPercent / 100));
  const total = roundMoney(Math.max(subtotal - discountAmount, 0));

  return {
    currency: DEFAULT_CURRENCY,
    subtotal,
    discountAmount,
    total,
    medicareOfferApplied: hasMedicareOffer,
    discountPercent,
    offerCode: hasMedicareOffer ? (medicareCard.offerCode || OFFER_CODE) : undefined
  };
};

const createTelehealthRoom = () => {
  const roomId = `b5_${crypto.randomBytes(18).toString('hex')}`;
  return {
    provider: 'inbuilt',
    roomId,
    joinUrl: `/telehealth/${roomId}`,
    createdAt: new Date()
  };
};
