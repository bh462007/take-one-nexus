let nodemailer = null;

try {
  nodemailer = require('nodemailer');
} catch (error) {
  nodemailer = null;
}

function emailEnabled() {
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();

  return Boolean(
    nodemailer &&
    process.env.SMTP_HOST &&
    user &&
    pass &&
    from &&
    !user.includes('your_email') &&
    !pass.includes('app_password') &&
    !from.includes('your_email')
  );
}

function getEmailStatus() {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || '';

  return {
    enabled: emailEnabled(),
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    sender: from,
    user_configured: Boolean(process.env.SMTP_USER && !String(process.env.SMTP_USER).includes('your_email')),
    password_configured: Boolean(process.env.SMTP_PASS && !String(process.env.SMTP_PASS).includes('app_password')),
    verified_sender_needed: !from || String(from).includes('your_email')
  };
}

function getTransporter() {
  if (!emailEnabled()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendCollaborationRequestEmail({ owner, requester, script, message }) {
  if (!owner?.email) {
    return { sent: false, reason: 'Project owner has no email address' };
  }

  const transporter = getTransporter();

  if (!transporter) {
    return { sent: false, reason: 'Email is not configured yet' };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const requesterLine = `${requester.name || 'A crew member'}${requester.role ? ` (${requester.role})` : ''}`;
  const subject = `TAKE ONE request for ${script.title}`;
  const text = [
    `Hi ${owner.name || 'there'},`,
    '',
    `${requesterLine} wants to join your project "${script.title}".`,
    requester.email ? `Reply email: ${requester.email}` : '',
    requester.city ? `City: ${requester.city}` : '',
    '',
    message ? `Message: ${message}` : '',
    '',
    'Open your TAKE ONE profile to review this collaboration request.'
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>New TAKE ONE collaboration request</h2>
      <p>Hi ${owner.name || 'there'},</p>
      <p><strong>${requesterLine}</strong> wants to join your project <strong>${script.title}</strong>.</p>
      <p><strong>Reply email:</strong> ${requester.email || 'Not available'}</p>
      ${requester.city ? `<p><strong>City:</strong> ${requester.city}</p>` : ''}
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p>Open your TAKE ONE profile to review this request.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: owner.email,
    replyTo: requester.email || from,
    subject,
    text,
    html
  });

  return { sent: true };
}

async function verifyEmailConnection() {
  const transporter = getTransporter();

  if (!transporter) {
    return {
      success: false,
      reason: 'Email is not configured yet'
    };
  }

  await transporter.verify();

  return {
    success: true
  };
}

async function sendSmtpTestEmail({ to, name }) {
  if (!to) {
    return {
      sent: false,
      reason: 'Test recipient email is required'
    };
  }

  const transporter = getTransporter();

  if (!transporter) {
    return {
      sent: false,
      reason: 'Email is not configured yet'
    };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  await transporter.verify();
  await transporter.sendMail({
    from,
    to,
    subject: 'TAKE ONE SMTP test',
    text: [
      `Hi ${name || 'there'},`,
      '',
      'This is a real SMTP test from TAKE ONE.',
      'If you received this, your verified sender and SMTP credentials are working.'
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>TAKE ONE SMTP test</h2>
        <p>Hi ${name || 'there'},</p>
        <p>This is a real SMTP test from TAKE ONE.</p>
        <p>If you received this, your verified sender and SMTP credentials are working.</p>
      </div>
    `
  });

  return {
    sent: true
  };
}

module.exports = {
  getEmailStatus,
  sendSmtpTestEmail,
  verifyEmailConnection,
  sendCollaborationRequestEmail
};
