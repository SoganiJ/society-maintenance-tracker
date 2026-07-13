const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn(`SMTP credentials not set — skipping email to ${to} ("${subject}")`);
    return;
  }

  try {
    console.log(`[DEBUG] Attempting to send email to ${to} with subject: "${subject}"...`);
    console.log(`[DEBUG] Using SMTP_USER: ${process.env.SMTP_USER}, EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"Society Maintenance" <noreply@society.com>',
      to,
      subject,
      html,
    });
    
    console.log(`[DEBUG] Email successfully sent to ${to}! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Email send failed to ${to}:`, error);
  }
};

const wrapEmailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f6f6f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #f0f0f0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111111;">Society Maintenance Tracker</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #333333; font-size: 16px; line-height: 1.6;">
              <h2 style="margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #111111;">${title}</h2>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #888888;">
                You're receiving this email because you're a registered resident of our society.
                <br />
                <a href="${process.env.CLIENT_URL}" style="color: #b8722e; text-decoration: none;">Go to Dashboard</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendPasswordResetEmail = async (user, resetUrl) => {
  const content = `
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your password. This link expires in 30 minutes.</p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px; margin-bottom: 24px;">
      <tr>
        <td>
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 15px;">Reset your password</a>
        </td>
      </tr>
    </table>
    <p>If you didn't request this, you can safely ignore this email and your password will remain unchanged.</p>
  `;
  await sendEmail({
    to: user.email,
    subject: 'Reset your Society Maintenance Tracker password',
    html: wrapEmailTemplate('Password Reset Request', content),
  });
};

const sendComplaintCreatedEmail = async (user, complaint) => {
  const content = `
    <p>Hi ${user.name},</p>
    <p>We've logged your new complaint regarding <strong>${complaint.title}</strong>.</p>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Category:</strong> ${complaint.category}</p>
      <p style="margin: 0;"><strong>Status:</strong> ${complaint.status}</p>
    </div>
    <p>Our maintenance team has been notified and will look into this shortly.</p>
  `;
  await sendEmail({
    to: user.email,
    subject: `Complaint Logged: ${complaint.title}`,
    html: wrapEmailTemplate('Complaint Received', content),
  });
};

const sendComplaintUpdatedEmail = async (user, complaint, note) => {
  const content = `
    <p>Hi ${user.name},</p>
    <p>There is an update regarding your complaint: <strong>${complaint.title}</strong>.</p>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 ${note ? '12px' : '0'} 0;"><strong>New Status:</strong> ${complaint.status}</p>
      ${note ? `<p style="margin: 0; color: #555; border-left: 3px solid #b8722e; padding-left: 12px; font-style: italic;">"${note}"</p>` : ''}
    </div>
    <p>You can check the full history on your dashboard.</p>
  `;
  await sendEmail({
    to: user.email,
    subject: `Update on Complaint: ${complaint.title}`,
    html: wrapEmailTemplate('Complaint Updated', content),
  });
};

const sendComplaintResolvedEmail = async (user, complaint) => {
  const content = `
    <p>Hi ${user.name},</p>
    <p>Good news! Your complaint <strong>${complaint.title}</strong> has been marked as resolved by the admin team.</p>
    <p>If you face any further issues regarding this, please feel free to raise a new complaint or contact the administration directly.</p>
  `;
  await sendEmail({
    to: user.email,
    subject: `Resolved: ${complaint.title}`,
    html: wrapEmailTemplate('Complaint Resolved 🎉', content),
  });
};

const sendNoticeEmail = async (user, notice) => {
  const isImportant = notice.type === 'important' || notice.isPinned;
  const content = `
    <p>Hi ${user.name},</p>
    <p>A new notice has been posted by the society administration.</p>
    <div style="background-color: ${isImportant ? '#fff4eb' : '#f9f9f9'}; border: 1px solid ${isImportant ? '#f2d6bd' : '#efefef'}; padding: 24px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: #111;">${notice.title}</h3>
      <p style="margin: 0; color: #444; white-space: pre-wrap;">${notice.content}</p>
    </div>
  `;
  await sendEmail({
    to: user.email,
    subject: `${isImportant ? 'Important ' : ''}Notice: ${notice.title}`,
    html: wrapEmailTemplate('Society Notice', content),
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendComplaintCreatedEmail,
  sendComplaintUpdatedEmail,
  sendComplaintResolvedEmail,
  sendNoticeEmail,
};
