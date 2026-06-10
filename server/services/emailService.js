const { Resend } = require('resend');

// ==========================================
// RESEND EMAIL INTEGRATION & HELPERS
// ==========================================

const isResendConfigured = () => {
  const key = process.env.RESEND_API_KEY;
  return key && !key.includes('your_api_key') && !key.includes('replace') && key.length > 10;
};

let resendClient = null;
const getResendClient = () => {
  if (isResendConfigured()) {
    if (!resendClient) {
      resendClient = new Resend(process.env.RESEND_API_KEY);
      console.log('[Email Service] ✅ Resend client initialized');
    }
    return resendClient;
  }
  console.error('[Email Service] ❌ Resend not configured. Please set RESEND_API_KEY in .env');
  return null;
};

const sendMailViaResend = async ({ to, subject, html, text }) => {
  const client = getResendClient();
  const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';

  if (!client) {
    throw new Error('Resend is not configured. Please set RESEND_API_KEY in your .env file');
  }

  try {
    console.log(`[Email Service] 📧 Sending email via Resend to ${to}...`);
    const response = await client.emails.send({
      from: fromAddress,
      to: [to], // Resend expects an array
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    console.log(`[Email Service] ✅ Email sent successfully! ID: ${response.id}`);
    return { success: true, provider: 'resend', id: response.id, to, subject };
  } catch (err) {
    console.error('[Email Service] ❌ Resend sending failed:', err.message);
    if (err.response) {
      console.error('Resend error details:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
};

/**
 * Sends a welcome / account created email notification using Resend
 * @param {string} toEmail - The recipient's email address
 * @param {string} firstName - The recipient's first name
 * @param {string} role - The role of the user (e.g., 'client', 'practitioner')
 */
exports.sendAccountCreatedEmail = async (toEmail, firstName, role) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginPath = role === 'practitioner' ? '/login/practitioner' : '/login/client';
    
    const subject = role === 'practitioner' 
      ? 'Welcome to Beyond5 - Application Received'
      : 'Welcome to Beyond5 - Account Created Successfully';
    
    const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    
    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #0f3f3c 0%, #1a5c58 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Welcome to Beyond5</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${role === 'practitioner' ? 'Thank you for joining our network' : 'Your healthcare journey begins here'}</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${firstName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">
            ${role === 'practitioner' 
              ? `Thank you for applying to join the Beyond5 practitioner network. We've received your application and credentials for verification.`
              : `Your account has been successfully created! You can now start booking appointments with verified allied health practitioners.`}
          </p>
          
          ${role === 'practitioner' ? `
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0;"><strong>📋 Next Steps:</strong> Your application is under review. Our team will verify your credentials within 2-3 business days. You'll receive an email once your account is approved.</p>
          </div>
          ` : `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 14px; color: #065f46; margin: 0;"><strong>🚀 Getting Started:</strong> Browse allied health practitioners, book appointments, and manage your healthcare journey all in one place.</p>
          </div>
          `}
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; font-size: 15px; color: #111827;">Account Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 120px;"><strong>Email:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${toEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Role:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; text-transform: capitalize;">${formattedRole}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}${loginPath}" style="background-color: #0f3f3c; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(15, 63, 60, 0.2);">🔐 Login to Your Account</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
            © 2024 Beyond5 Healthcare Marketplace. All rights reserved.<br/>
            Need help? Contact our support team at <a href="mailto:support@beyond5.health" style="color: #0f3f3c;">support@beyond5.health</a>
          </p>
        </div>
      </div>
    `;
    
    const text = role === 'practitioner'
      ? `Welcome to Beyond5!\n\nHello ${firstName},\n\nThank you for applying to join the Beyond5 practitioner network. We've received your application and credentials for verification.\n\nNext Steps: Your application is under review. Our team will verify your credentials within 2-3 business days.\n\nLogin to track your application status: ${clientUrl}${loginPath}\n\n© 2024 Beyond5 Healthcare Marketplace`
      : `Welcome to Beyond5!\n\nHello ${firstName},\n\nYour account has been successfully created! You can now start booking appointments with verified allied health practitioners.\n\nLogin to start booking: ${clientUrl}${loginPath}\n\n© 2024 Beyond5 Healthcare Marketplace`;
    
    console.log(`[Email Service] Sending registration email to ${toEmail} via Resend...`);
    
    const result = await sendMailViaResend({
      to: toEmail,
      subject: subject,
      html: html,
      text: text
    });
    
    console.log(`[Email Service] Registration email sent successfully:`, result);
    return result;
    
  } catch (error) {
    console.error('[Email Service] Error sending registration email:', error);
    throw error; // Throw error so it can be caught in the controller
  }
};

/**
 * Sends enquiry email notifications to both the practitioner and client.
 */
exports.sendEnquiryEmail = async ({
  practitionerEmail,
  practitionerName,
  practitionerDiscipline,
  clientName,
  clientEmail,
  clientPhone,
  message,
  fundingOptions,
  preferredPostcode,
  submittedAt
}) => {
  try {
    const fundingList = Array.isArray(fundingOptions) ? fundingOptions.join(', ') : 'Not specified';

    // 1. Email to Practitioner
    const practitionerHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff;">New Enquiry Received</h2>
        </div>
        <div style="padding: 20px;">
          <h3>Client Details</h3>
          <p><strong>Name:</strong> ${clientName}</p>
          <p><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
          <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <h3>Enquiry Details</h3>
          <p><strong>Practitioner:</strong> ${practitionerName} (${practitionerDiscipline})</p>
          <p><strong>Funding Options:</strong> ${fundingList}</p>
          <p><strong>Preferred Postcode:</strong> ${preferredPostcode}</p>
          <p><strong>Submitted:</strong> ${submittedAt}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background-color: #f9f9f9; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0;">
            ${(message || '').replace(/\n/g, '<br>')}
          </blockquote>
          <p style="font-size: 14px; color: #666666;">Please reply directly to this email to respond to the client at <strong>${clientEmail}</strong>.</p>
        </div>
      </div>
    `;

    console.log(`[Email Service] Sending enquiry email to practitioner: ${practitionerEmail}...`);
    await sendMailViaResend({ 
      to: practitionerEmail, 
      subject: `New Enquiry from ${clientName} – Beyond5`, 
      html: practitionerHtml 
    });

    // 2. Confirmation email to Client
    const clientHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff;">Enquiry Sent Successfully</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hi <strong>${clientName}</strong>,</p>
          <p>Thank you for your enquiry! We've forwarded your message to <strong>${practitionerName}</strong> (${practitionerDiscipline}) and they will be in touch shortly.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <h3>Your Enquiry Summary</h3>
          <p><strong>Practitioner:</strong> ${practitionerName}</p>
          <p><strong>Discipline:</strong> ${practitionerDiscipline}</p>
          <p><strong>Funding Options:</strong> ${fundingList}</p>
          <p><strong>Preferred Postcode:</strong> ${preferredPostcode}</p>
          <p><strong>Submitted:</strong> ${submittedAt}</p>
          <p><strong>Your Message:</strong></p>
          <blockquote style="background-color: #f9f9f9; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0;">
            ${(message || '').replace(/\n/g, '<br>')}
          </blockquote>
        </div>
      </div>
    `;

    console.log(`[Email Service] Sending confirmation email to client: ${clientEmail}...`);
    await sendMailViaResend({ 
      to: clientEmail, 
      subject: `Your enquiry to ${practitionerName} has been received – Beyond5`, 
      html: clientHtml 
    });

    console.log('[Email Service] Enquiry emails sent successfully');
    return { practitionerEmailSent: true, clientEmailSent: true };
  } catch (error) {
    console.error('[Email Service] Error sending enquiry email:', error);
    throw error;
  }
};

const formatDate = (dateObj) => {
  if (!dateObj) return 'N/A';
  const d = new Date(dateObj);
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Send new booking request notification to both practitioner and client
 */
exports.sendBookingRequestEmails = async (booking) => {
  try {
    const clientName = booking.clientId ? `${booking.clientId.firstName} ${booking.clientId.lastName}` : 'Client';
    const clientEmail = booking.clientId ? booking.clientId.email : '';
    const clientFirstName = booking.clientId ? booking.clientId.firstName : 'Client';

    const practitionerUser = booking.practitionerId && booking.practitionerId.userId;
    const practitionerName = practitionerUser ? `${practitionerUser.firstName} ${practitionerUser.lastName}` : 'Practitioner';
    const practitionerEmail = practitionerUser ? practitionerUser.email : '';
    const practitionerFirstName = practitionerUser ? practitionerUser.firstName : 'Practitioner';
    const discipline = booking.practitionerId ? booking.practitionerId.discipline : 'Practitioner';

    const apptDateFormatted = formatDate(booking.appointmentDate);
    const timeSlot = `${booking.startTime} - ${booking.endTime}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 1. Email to Practitioner
    const practitionerHtml = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">New Booking Request</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Action Required: Please accept or decline</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>Dr. ${practitionerFirstName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">You have received a new booking request from a client. Below are the appointment details:</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 120px;"><strong>Client:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${clientName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${apptDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Time:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Service Type:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; text-transform: capitalize;">${booking.serviceType}</td>
              </tr>
              ${booking.notes ? `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280; vertical-align: top;"><strong>Notes:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #4b5563; font-style: italic;">"${booking.notes}"</td>
              </tr>` : ''}
            </table>
          </div>

          <p style="font-size: 15px; color: #4b5563;">To respond to this request, please log in to your practitioner dashboard using the button below:</p>
          
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">View Dashboard Requests</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">Beyond5 Healthcare Marketplace. Connecting clients with premium practitioners.</p>
        </div>
      </div>
    `;

    // 2. Email to Client
    const clientHtml = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Booking Request Received</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Pending confirmation from your practitioner</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${clientFirstName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">Thank you for booking with Beyond5. Your appointment request has been sent to the practitioner. We will email you as soon as they accept or decline the booking.</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 120px;"><strong>Practitioner:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${practitionerName} (${discipline})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${apptDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Time:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Service Type:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; text-transform: capitalize;">${booking.serviceType}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 15px; color: #4b5563;">No action is required from you at this time. You can view the status of this request on your dashboard:</p>
          
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #4b5563; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(75, 85, 99, 0.2);">Go to Dashboard</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">Beyond5 Healthcare Marketplace.</p>
        </div>
      </div>
    `;

    // Send emails using Resend
    if (practitionerEmail) {
      await sendMailViaResend({
        to: practitionerEmail,
        subject: `Action Required: New Appointment Request from ${clientName} - Beyond5`,
        html: practitionerHtml
      });
    }

    if (clientEmail) {
      await sendMailViaResend({
        to: clientEmail,
        subject: `Appointment Request Received - Awaiting Practitioner Confirmation`,
        html: clientHtml
      });
    }
    
    console.log('[Email Service] Booking request emails sent successfully');
  } catch (error) {
    console.error('[Email Service] Error in sendBookingRequestEmails:', error);
    throw error;
  }
};

/**
 * Send booking confirmation email to client with practitioner details
 */
exports.sendBookingConfirmedEmail = async (booking) => {
  try {
    const clientEmail = booking.clientId ? booking.clientId.email : '';
    const clientFirstName = booking.clientId ? booking.clientId.firstName : 'Client';

    const practitionerUser = booking.practitionerId && booking.practitionerId.userId;
    const practitionerName = practitionerUser ? `${practitionerUser.firstName} ${practitionerUser.lastName}` : 'Practitioner';
    const practitionerEmail = practitionerUser ? practitionerUser.email : '';
    const discipline = booking.practitionerId ? booking.practitionerId.discipline : 'Practitioner';
    const practitionerBio = booking.practitionerId ? booking.practitionerId.bio : '';
    const practitionerLocation = booking.practitionerId ? booking.practitionerId.location : '';

    const apptDateFormatted = formatDate(booking.appointmentDate);
    const timeSlot = `${booking.startTime} - ${booking.endTime}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const isTelehealth = booking.serviceType === 'telehealth';
    const locationInfo = isTelehealth 
      ? 'Telehealth Video Session' 
      : (practitionerLocation || 'In-Person Clinic');

    const joinUrl = (isTelehealth && booking.telehealthRoom)
      ? `${clientUrl}${booking.telehealthRoom.joinUrl}`
      : `${clientUrl}/dashboard`;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Booking Confirmed!</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your appointment is fully confirmed</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${clientFirstName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">Great news! Your booking request with <strong>${practitionerName}</strong> has been accepted and confirmed.</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; font-size: 15px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 120px;"><strong>Practitioner:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${practitionerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Discipline:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${discipline}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${apptDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Time:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;"><strong>Type/Location:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${locationInfo}</td>
              </tr>
            </table>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; font-size: 15px; color: #111827;">Practitioner Contact Details</h3>
            <p style="font-size: 14px; color: #4b5563; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${practitionerEmail}" style="color: #4f46e5; text-decoration: none;">${practitionerEmail}</a></p>
            ${practitionerBio ? `<p style="font-size: 13px; color: #6b7280; font-style: italic; margin-top: 12px;">"${practitionerBio.substring(0, 150)}..."</p>` : ''}
          </div>

          ${isTelehealth ? `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="font-size: 14px; color: #065f46; margin: 0 0 12px 0;"><strong>Telehealth Session Ready:</strong> You can join the secure video consult room directly at the time of your appointment.</p>
            <a href="${joinUrl}" style="background-color: #10b981; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Join Video Consult</a>
          </div>
          ` : `
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">View in Dashboard</a>
          </div>
          `}

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">Beyond5 Healthcare Marketplace.</p>
        </div>
      </div>
    `;

    if (clientEmail) {
      await sendMailViaResend({
        to: clientEmail,
        subject: `Booking Confirmed with ${practitionerName}! - Beyond5`,
        html
      });
    }
    
    console.log('[Email Service] Booking confirmation email sent successfully');
  } catch (error) {
    console.error('[Email Service] Error in sendBookingConfirmedEmail:', error);
    throw error;
  }
};

/**
 * Send booking decline email to client
 */
exports.sendBookingDeclinedEmail = async (booking) => {
  try {
    const clientEmail = booking.clientId ? booking.clientId.email : '';
    const clientFirstName = booking.clientId ? booking.clientId.firstName : 'Client';

    const practitionerUser = booking.practitionerId && booking.practitionerId.userId;
    const practitionerName = practitionerUser ? `${practitionerUser.firstName} ${practitionerUser.lastName}` : 'Practitioner';

    const apptDateFormatted = formatDate(booking.appointmentDate);
    const timeSlot = `${booking.startTime} - ${booking.endTime}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Booking Request Declined</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Appointment request could not be confirmed</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${clientFirstName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">We are writing to let you know that <strong>${practitionerName}</strong> was unable to accept your appointment request for <strong>${apptDateFormatted}</strong> at <strong>${timeSlot}</strong>.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Refund details:</strong> Since the appointment request was declined, any payment transaction pre-authorization has been cancelled, and you will receive a full refund within 3-5 business days depending on your bank.</p>
          </div>

          <p style="font-size: 15px; color: #4b5563;">You can browse other available timeslots or book another practitioner using the button below:</p>
          
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #ef4444; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">Book a Different Slot</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">Beyond5 Healthcare Marketplace.</p>
        </div>
      </div>
    `;

    if (clientEmail) {
      await sendMailViaResend({
        to: clientEmail,
        subject: `Booking Request Declined - Beyond5`,
        html
      });
    }
    
    console.log('[Email Service] Booking declined email sent successfully');
  } catch (error) {
    console.error('[Email Service] Error in sendBookingDeclinedEmail:', error);
    throw error;
  }
};

/**
 * Send booking rescheduled email to the client or practitioner (notifying the opposite party of who rescheduled)
 */
exports.sendBookingRescheduledEmail = async (booking, initiatorRole) => {
  try {
    const clientName = booking.clientId ? `${booking.clientId.firstName} ${booking.clientId.lastName}` : 'Client';
    const clientEmail = booking.clientId ? booking.clientId.email : '';
    const clientFirstName = booking.clientId ? booking.clientId.firstName : 'Client';

    const practitionerUser = booking.practitionerId && booking.practitionerId.userId;
    const practitionerName = practitionerUser ? `${practitionerUser.firstName} ${practitionerUser.lastName}` : 'Practitioner';
    const practitionerEmail = practitionerUser ? practitionerUser.email : '';
    const practitionerFirstName = practitionerUser ? practitionerUser.firstName : 'Practitioner';
    const discipline = booking.practitionerId ? booking.practitionerId.discipline : 'Practitioner';

    const apptDateFormatted = formatDate(booking.appointmentDate);
    const timeSlot = `${booking.startTime} - ${booking.endTime}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    let toEmail = '';
    let greeting = '';
    let messageText = '';

    if (initiatorRole === 'client') {
      toEmail = practitionerEmail;
      greeting = `Dr. ${practitionerFirstName}`;
      messageText = `Your client, <strong>${clientName}</strong>, has rescheduled their appointment.`;
    } else {
      toEmail = clientEmail;
      greeting = clientFirstName;
      messageText = `Your practitioner, <strong>${practitionerName}</strong>, has rescheduled your appointment.`;
    }

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Appointment Rescheduled</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Updated schedule for your booking</p>
        </div>
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${greeting}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563;">${messageText} The new appointment details are listed below:</p>
          
          <div style="background-color: #fdfaf2; border: 1px solid #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin-top: 0; font-size: 15px; color: #92400e; border-bottom: 1px solid #fde68a; padding-bottom: 8px; margin-bottom: 12px;">New Schedule</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #92400e; width: 120px;"><strong>Date:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${apptDateFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #92400e;"><strong>Time:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #92400e;"><strong>Service Type:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827; text-transform: capitalize;">${booking.serviceType}</td>
              </tr>
              ${initiatorRole === 'client' ? `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #92400e;"><strong>Client:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${clientName}</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #92400e;"><strong>Practitioner:</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #111827;">${practitionerName} (${discipline})<\/td>
              </tr>
              `}
            </table>
          </div>

          ${initiatorRole === 'client' ? `
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px; margin: 24px 0;">
            <p style="font-size: 13px; color: #991b1b; margin: 0;"><strong>Please Note:</strong> Since the client rescheduled the booking, the status has reset to <em>Pending Approval</em>. You will need to Accept or Decline this updated time on your dashboard.</p>
          </div>
          ` : ''}

          <p style="font-size: 15px; color: #4b5563;">You can view and manage your rescheduled appointments on your dashboard:</p>
          
          <div style="text-align: center; margin: 32px 0 24px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #f59e0b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);">Go to Dashboard</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">Beyond5 Healthcare Marketplace.</p>
        </div>
      </div>
    `;

    if (toEmail) {
      await sendMailViaResend({
        to: toEmail,
        subject: `Appointment Rescheduled by ${initiatorRole === 'client' ? 'Client' : 'Practitioner'} - Beyond5`,
        html
      });
    }
    
    console.log('[Email Service] Booking rescheduled email sent successfully');
  } catch (error) {
    console.error('[Email Service] Error in sendBookingRescheduledEmail:', error);
    throw error;
  }
};