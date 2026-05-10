const APP_KNOWLEDGE = [
  {
    keywords: ['book', 'appointment', 'session', 'schedule', 'availability'],
    title: 'Booking appointments',
    answer: 'To book care, open Marketplace, choose a verified practitioner, pick an available date and time, then confirm the session. You can manage upcoming and past bookings from your dashboard.',
    actions: [{ label: 'Open Marketplace', path: '/marketplace' }, { label: 'View Dashboard', path: '/dashboard' }],
  },
  {
    keywords: ['recommend', 'match', 'best', 'specialist', 'provider', 'practitioner', 'therapist'],
    title: 'Finding the right practitioner',
    answer: 'Use recommendations to match by discipline, concern, rating, location, telehealth, after-hours, and weekend availability. Marketplace filters are best when you already know what discipline or service type you need.',
    actions: [{ label: 'See Recommendations', path: '/dashboard' }, { label: 'Browse Marketplace', path: '/marketplace' }],
  },
  {
    keywords: ['chat', 'message', 'online', 'offline', 'last seen', 'typing'],
    title: 'Chat and presence',
    answer: 'Chat works after a booking relationship exists. The chat screen shows online/offline status, last seen, typing indicators, unread counts, and sent/delivered/seen ticks so conversations behave like a production messaging app.',
    actions: [{ label: 'Open Chat', path: '/chat' }],
  },
  {
    keywords: ['profile', 'account', 'name', 'phone', 'location', 'password'],
    title: 'Account and profile',
    answer: 'Your account details are used for bookings, recommendations, and practitioner discovery. Keep your location and contact details current so sessions and recommendations are more relevant.',
    actions: [{ label: 'Open Dashboard', path: '/dashboard' }],
  },
  {
    keywords: ['verify', 'verification', 'document', 'compliance', 'approved', 'practitioner profile'],
    title: 'Practitioner verification',
    answer: 'Practitioners complete a profile and upload compliance documents. Admins review submissions before a practitioner appears in Marketplace as an approved provider.',
    actions: [{ label: 'Practitioner Dashboard', path: '/dashboard/practitioner' }],
  },
  {
    keywords: ['cancel', 'reschedule', 'change booking'],
    title: 'Changing bookings',
    answer: 'Upcoming sessions can be managed from the dashboard. If cancellation is available for the booking, use the cancel action there, then book a new time from Marketplace.',
    actions: [{ label: 'View Dashboard', path: '/dashboard' }, { label: 'Book Again', path: '/marketplace' }],
  },
  {
    keywords: ['review', 'rating', 'feedback', 'stars'],
    title: 'Reviews and ratings',
    answer: 'After a completed session, clients can leave a rating and comment from the dashboard. Ratings improve Marketplace quality and help future recommendations.',
    actions: [{ label: 'View Dashboard', path: '/dashboard' }],
  },
  {
    keywords: ['price', 'cost', 'fee', 'payment', 'pay'],
    title: 'Pricing and payment',
    answer: 'Practitioner cards show the session fee before booking. Payment status is tracked on bookings so you can see whether a session is unpaid or paid.',
    actions: [{ label: 'Browse Fees', path: '/marketplace' }],
  },
];

const normalize = (value) => (value || '').toString().toLowerCase();

const scoreTopic = (message, topic) => topic.keywords.reduce((score, keyword) => (
  message.includes(keyword) ? score + keyword.length : score
), 0);

const getGreeting = (user) => {
  if (!user?.firstName) return '';
  return ` ${user.firstName}`;
};

exports.chatWithAssistant = async (req, res) => {
  try {
    const message = normalize(req.body.message);

    if (!message || message.length < 2) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const offTopicMedical = ['diagnose', 'symptom', 'medicine', 'medication', 'emergency', 'pain', 'injury']
      .some((keyword) => message.includes(keyword));

    if (offTopicMedical && !message.includes('book') && !message.includes('app')) {
      return res.status(200).json({
        success: true,
        data: {
          role: 'assistant',
          title: 'Care guidance',
          answer: `I can help${getGreeting(req.user)} with using Beyond5, booking sessions, finding practitioners, and managing app features. I cannot diagnose symptoms or provide medical advice. For urgent health concerns, contact local emergency services or a qualified clinician.`,
          actions: [{ label: 'Find a Practitioner', path: '/marketplace' }],
        },
      });
    }

    const rankedTopics = APP_KNOWLEDGE
      .map((topic) => ({ ...topic, score: scoreTopic(message, topic) }))
      .sort((a, b) => b.score - a.score);

    const topic = rankedTopics[0].score > 0 ? rankedTopics[0] : {
      title: 'Beyond5 assistant',
      answer: `I can help${getGreeting(req.user)} with Marketplace, practitioner recommendations, bookings, chat, reviews, profiles, and verification. Try asking "How do I book a session?", "How are recommendations chosen?", or "Why can’t I message someone?"`,
      actions: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Marketplace', path: '/marketplace' }],
    };

    res.status(200).json({
      success: true,
      data: {
        role: 'assistant',
        title: topic.title,
        answer: topic.answer,
        actions: topic.actions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Assistant failed', error: err.message });
  }
};
