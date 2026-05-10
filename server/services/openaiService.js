const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';

const HEALTHCARE_ASSISTANT_INSTRUCTIONS = `
You are Beyond5's healthcare app assistant.

Your job:
- Help users understand how to use the app: marketplace, practitioner search, bookings, chat, reviews, profiles, and verification.
- Offer general wellness navigation and explain when a practitioner type may be relevant.
- Recommend using verified practitioners in the app when the user needs care.
- Keep answers concise, warm, and practical.

Safety rules:
- Do not diagnose conditions.
- Do not prescribe medication or treatment.
- Do not claim a medical emergency is safe.
- For urgent symptoms, tell the user to contact emergency services or a qualified clinician immediately.
- Make it clear that app guidance is not a substitute for professional medical advice.
`;

const toOpenAiInput = (messages) => messages.map((message) => ({
  role: message.role === 'assistant' ? 'assistant' : 'user',
  content: message.content
}));

const extractOutputText = (response) => {
  if (response.output_text) return response.output_text;

  const messageOutput = response.output?.find((item) => item.type === 'message');
  const textPart = messageOutput?.content?.find((item) => item.type === 'output_text');
  return textPart?.text || '';
};

const callOpenAi = async ({ messages, summary, recommendations }) => {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.code = 'OPENAI_KEY_MISSING';
    throw error;
  }

  const recommendationContext = recommendations.length > 0
    ? `Relevant verified practitioners from the app:\n${recommendations.map((item) => (
      `- ${item.name}, ${item.discipline}, rating ${item.rating || 0}, fee $${item.fee}; reasons: ${item.reasons.join(', ')}`
    )).join('\n')}`
    : 'No specific practitioner recommendation was found for this message.';

  const input = [
    {
      role: 'developer',
      content: [
        HEALTHCARE_ASSISTANT_INSTRUCTIONS,
        summary ? `Conversation memory summary: ${summary}` : 'No stored conversation summary yet.',
        recommendationContext
      ].join('\n\n')
    },
    ...toOpenAiInput(messages)
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input,
      max_output_tokens: 700
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error?.message || 'OpenAI request failed');
    error.status = response.status;
    error.details = payload.error;
    throw error;
  }

  return {
    responseId: payload.id,
    model: payload.model || DEFAULT_MODEL,
    content: extractOutputText(payload).trim(),
    usage: payload.usage || {}
  };
};

const summarizeConversation = async ({ summary, messages }) => {
  if (!process.env.OPENAI_API_KEY || messages.length < 10) return summary || '';

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL || DEFAULT_MODEL,
      instructions: 'Summarize this healthcare app support conversation for future context. Preserve user goals, preferences, booking needs, and safety-relevant constraints. Do not include diagnosis.',
      input: [
        summary ? `Existing summary: ${summary}` : 'No existing summary.',
        messages.map((message) => `${message.role}: ${message.content}`).join('\n')
      ].join('\n\n'),
      max_output_tokens: 220
    })
  });

  if (!response.ok) return summary || '';

  const payload = await response.json();
  return extractOutputText(payload).trim() || summary || '';
};

const buildFallbackReply = (message, recommendations) => {
  const lower = message.toLowerCase();

  if (lower.includes('emergency') || lower.includes('chest pain') || lower.includes('suicide')) {
    return 'I cannot assess emergencies. Please contact local emergency services immediately or speak with a qualified clinician now. If you want help using Beyond5 after that, I can help you find a verified practitioner.';
  }

  if (recommendations.length > 0) {
    const names = recommendations.map((item) => `${item.name} (${item.discipline})`).join(', ');
    return `Based on what you wrote, these verified practitioners may be relevant: ${names}. I cannot diagnose or choose treatment for you, but you can review their profiles, fees, and availability before booking.`;
  }

  if (lower.includes('book')) {
    return 'To book a session, open Marketplace, choose a verified practitioner, select an available time, and confirm the booking. For care decisions, consult a verified practitioner.';
  }

  if (lower.includes('chat') || lower.includes('message')) {
    return 'You can use chat after a booking relationship exists. The chat screen supports online status, typing, unread messages, and seen/delivered indicators.';
  }

  return 'I can help with finding practitioners, booking sessions, app chat, reviews, and profile questions. I cannot provide diagnosis or medical treatment advice, so please consult a verified practitioner for care decisions.';
};

module.exports = {
  callOpenAi,
  summarizeConversation,
  buildFallbackReply,
  HEALTHCARE_ASSISTANT_INSTRUCTIONS
};
