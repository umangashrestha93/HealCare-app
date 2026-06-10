require('./server/server.js');

const emailService = require('./server/services/emailService');

// Test the Resend configuration
console.log('Testing email service with Resend...');
console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY value:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');

// Test sending a simple email
const testEmail = async () => {
  try {
    console.log('Attempting to send test email...');
    const result = await emailService.sendAccountCreatedEmail(
      'test@example.com', 
      'John', 
      'client'
    );
    console.log('Test email result:', result);
  } catch (error) {
    console.error('Test email error:', error);
  }
};

testEmail().catch(console.error);
