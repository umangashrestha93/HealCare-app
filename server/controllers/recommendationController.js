const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const tokenize = (value) => normalize(value)
  .split(/[^a-z0-9]+/)
  .filter((token) => token.length > 2);

const unique = (items) => [...new Set(items.filter(Boolean))];

const getPractitionerText = (practitioner) => [
  practitioner.discipline,
  practitioner.bio,
  ...(practitioner.specializations || []),
].join(' ');

const buildPreferenceProfile = async (userId, query) => {
  const recentBookings = await Booking.find({ clientId: userId })
    .populate('practitionerId', 'discipline specializations telehealth afterHours weekends location averageRating totalReviews')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const bookedPractitioners = recentBookings
    .map((booking) => booking.practitionerId)
    .filter(Boolean);

  const preferredDisciplines = unique([
    query.discipline,
    ...bookedPractitioners.map((practitioner) => practitioner.discipline),
  ].map(normalize));

  const preferredSpecializations = unique([
    query.concern,
    query.goal,
    ...bookedPractitioners.flatMap((practitioner) => practitioner.specializations || []),
  ].flatMap(tokenize));

  const preferredServiceType = normalize(query.serviceType)
    || normalize(recentBookings[0]?.serviceType);

  return {
    preferredDisciplines,
    preferredSpecializations,
    preferredServiceType,
    location: normalize(query.location),
    wantsAfterHours: query.afterHours === 'true' || query.availability === 'after-hours',
    wantsWeekends: query.weekends === 'true' || query.availability === 'weekends',
    hasHistory: recentBookings.length > 0,
  };
};

const scorePractitioner = (practitioner, profile) => {
  let score = 0;
  const reasons = [];
  const discipline = normalize(practitioner.discipline);
  const practitionerText = getPractitionerText(practitioner);
  const practitionerTokens = tokenize(practitionerText);
  const tokenSet = new Set(practitionerTokens);

  if (profile.preferredDisciplines.includes(discipline)) {
    score += 35;
    reasons.push(`Matches ${practitioner.discipline}`);
  }

  const matchedTerms = profile.preferredSpecializations.filter((term) => (
    tokenSet.has(term) || normalize(practitionerText).includes(term)
  ));

  if (matchedTerms.length > 0) {
    score += Math.min(30, matchedTerms.length * 10);
    reasons.push(`Relevant for ${matchedTerms.slice(0, 2).join(', ')}`);
  }

  if (profile.preferredServiceType === 'telehealth' && practitioner.telehealth) {
    score += 12;
    reasons.push('Offers telehealth');
  }

  if (profile.preferredServiceType === 'in-person' && !practitioner.telehealth) {
    score += 8;
    reasons.push('Available in person');
  }

  if (profile.wantsAfterHours && practitioner.afterHours) {
    score += 12;
    reasons.push('After-hours availability');
  }

  if (profile.wantsWeekends && practitioner.weekends) {
    score += 12;
    reasons.push('Weekend availability');
  }

  const practitionerLocation = normalize(practitioner.location || practitioner.userId?.location);
  if (profile.location && practitionerLocation.includes(profile.location)) {
    score += 10;
    reasons.push('Nearby location match');
  }

  if (practitioner.averageRating > 0) {
    score += Math.min(15, practitioner.averageRating * 3);
    reasons.push(`${practitioner.averageRating.toFixed(1)} star rating`);
  }

  if (practitioner.totalReviews > 0) {
    score += Math.min(8, practitioner.totalReviews);
  }

  if (practitioner.isVerified || practitioner.verificationStatus === 'approved') {
    score += 8;
  }

  if (reasons.length === 0) {
    reasons.push(profile.hasHistory ? 'Similar to your care history' : 'Highly rated verified provider');
  }

  return { score, reasons: reasons.slice(0, 3) };
};

exports.getRecommendedPractitioners = async (req, res) => {
  try {
    const profile = await buildPreferenceProfile(req.user.id || req.user._id, req.query);

    const practitioners = await Practitioner.find({
      verificationStatus: 'approved',
    })
      .populate('userId', 'firstName lastName avatar location')
      .limit(80)
      .lean();

    const ranked = practitioners
      .map((practitioner) => {
        const { score, reasons } = scorePractitioner(practitioner, profile);
        return {
          ...practitioner,
          recommendationScore: Math.round(score),
          matchReasons: reasons,
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore || b.averageRating - a.averageRating)
      .slice(0, Math.min(Number(req.query.limit) || 6, 12));

    res.status(200).json({
      success: true,
      data: ranked,
      profile: {
        hasHistory: profile.hasHistory,
        preferredDisciplines: profile.preferredDisciplines,
        preferredServiceType: profile.preferredServiceType || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Recommendations failed', error: err.message });
  }
};
