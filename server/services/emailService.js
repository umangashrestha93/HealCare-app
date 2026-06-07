const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('WARNING: Email SMTP settings are incomplete. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    // Optional: add timeout settings to prevent hanging connections
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
  });
};

/**
 * Sends a welcome / account created email notification to the user.
 * @param {string} toEmail - The recipient's email address
 * @param {string} firstName - The recipient's first name
 * @param {string} role - The role of the user (e.g., 'client', 'practitioner')
 */
exports.sendAccountCreatedEmail = async (toEmail, firstName, role) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn(`[Email Service] SMTP transporter not configured. Skipping registration email to ${toEmail}.`);
      return null;
    }

    const fromAddress = process.env.EMAIL_FROM || `"Beyond5" <${process.env.SMTP_USER}>`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Format role for display (capitalize first letter)
    const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: 'Welcome to Beyond5 - Account Created',
      text: `Hello ${firstName},\n\nYour account has been successfully created as a ${formattedRole} on Beyond5.\n\nWe are thrilled to have you join our platform!\n\nYou can log in to your account here: ${clientUrl}/login\n\nBest regards,\nThe Beyond5 Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #4f46e5; color: #ffffff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to Beyond5!</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; margin-top: 0;">Hello <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px;">Your account has been successfully created as a <strong>${formattedRole}</strong> on the Beyond5 Healthcare platform.</p>
            <p style="font-size: 15px;">We are thrilled to welcome you to our community! You can now access your dashboard, update your profile, and start using our services.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${clientUrl}/login" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">Log In to Your Dashboard</a>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin-bottom: 0;">If you did not create this account, please ignore this email or reach out to our support team.</p>
            
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
            
            <div style="text-align: center;">
              <p style="font-size: 14px; font-weight: 600; color: #4f46e5; margin: 0 0 5px 0;">Beyond5 Healthcare Marketplace</p>
              <p style="font-size: 12px; color: #999999; margin: 0;">Connecting clients with premium practitioners.</p>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #999999; margin: 0;">&copy; ${new Date().getFullYear()} Beyond5. All rights reserved.</p>
          </div>
        </div>
      `
    };

    console.log(`[Email Service] Sending registration email to ${toEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[Email Service] Error sending registration email:', error);
    // Return null rather than throwing to avoid breaking the core registration transaction
    return null;
  }
};
