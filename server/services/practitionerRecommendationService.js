const Practitioner = require('../models/Practitioner');

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const tokenize = (value) => normalize(value)
  .split(/[^a-z0-9]+/)
  .filter((token) => token.length > 2);

const disciplineAliases = [
  { discipline: 'Physiotherapy', terms: ['physio', 'physical', 'back', 'neck', 'shoulder', 'knee', 'mobility', 'sports', 'pain'] },
  { discipline: 'Psychology', terms: ['psychology', 'anxiety', 'stress', 'depression', 'mood', 'mental', 'therapy', 'counselling'] },
  { discipline: 'Occupational Therapy', terms: ['occupational', 'daily', 'living', 'sensory', 'workplace', 'independence', 'ndis'] },
  { discipline: 'Speech Pathology', terms: ['speech', 'language', 'voice', 'swallow', 'communication', 'stutter'] }
];

const inferDisciplines = (message) => {
  const tokens = new Set(tokenize(message));
  return disciplineAliases
    .filter((item) => item.terms.some((term) => tokens.has(term)))
    .map((item) => item.discipline);
};

const practitionerText = (practitioner) => [
  practitioner.discipline,
  practitioner.bio,
  ...(practitioner.specializations || []),
].join(' ');

const scorePractitioner = (practitioner, message, inferredDisciplines) => {
  let score = 0;
  const reasons = [];
  const tokens = tokenize(message);
  const text = normalize(practitionerText(practitioner));

  if (inferredDisciplines.includes(practitioner.discipline)) {
    score += 35;
    reasons.push(`Matches ${practitioner.discipline}`);
  }

  const matchedTerms = tokens.filter((token) => text.includes(token));
  if (matchedTerms.length > 0) {
    score += Math.min(30, matchedTerms.length * 6);
    reasons.push(`Relevant to ${matchedTerms.slice(0, 2).join(', ')}`);
  }

  if (normalize(message).includes('online') || normalize(message).includes('telehealth')) {
    if (practitioner.telehealth) {
      score += 12;
      reasons.push('Offers telehealth');
    }
  }

  if (normalize(message).includes('weekend') && practitioner.weekends) {
    score += 12;
    reasons.push('Weekend availability');
  }

  if ((normalize(message).includes('after hour') || normalize(message).includes('evening')) && practitioner.afterHours) {
    score += 12;
    reasons.push('After-hours availability');
  }

  score += Math.min(18, (practitioner.averageRating || 0) * 3);
  score += Math.min(8, practitioner.totalReviews || 0);

  if (practitioner.verificationStatus === 'approved' || practitioner.isVerified) {
    score += 8;
  }

  if (reasons.length === 0) reasons.push('Verified practitioner on Beyond5');

  return { score, reasons: reasons.slice(0, 3) };
};

const findPractitionerRecommendations = async (message, limit = 3) => {
  const inferredDisciplines = inferDisciplines(message);
  const query = { verificationStatus: 'approved' };

  const practitioners = await Practitioner.find(query)
    .populate('userId', 'firstName lastName avatar location')
    .limit(60)
    .lean();

  return practitioners
    .map((practitioner) => {
      const { score, reasons } = scorePractitioner(practitioner, message, inferredDisciplines);
      return {
        practitioner,
        score,
        reasons
      };
    })
    .filter((item) => item.score > 8)
    .sort((a, b) => b.score - a.score || (b.practitioner.averageRating || 0) - (a.practitioner.averageRating || 0))
    .slice(0, limit)
    .map(({ practitioner, score, reasons }) => ({
      practitionerId: practitioner._id,
      name: `${practitioner.userId?.firstName || ''} ${practitioner.userId?.lastName || ''}`.trim() || 'Verified practitioner',
      discipline: practitioner.discipline,
      rating: practitioner.averageRating || 0,
      fee: practitioner.fee || 80,
      reasons,
      score
    }));
};

module.exports = {
  findPractitionerRecommendations
};
