/**
 * Cinematic email templates ported to plain JS for legacy Express server compatibility.
 * These match the futuristic design system of TAKE ONE Nexus.
 */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const buildVerifyEmailTemplate = ({ userName, verificationUrl, expiresInHours = 24 }) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your TAKE ONE Account</title>
</head>
<body style="margin:0;padding:0;background:#06080A;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0E1218;border:1px solid rgba(255,77,26,0.25);border-radius:2px;">
          <tr>
            <td style="height:3px;background:linear-gradient(to right,#FF4D1A,#FF7A1A,#00D4FF);border-radius:2px 2px 0 0;"></td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 40px 24px;">
              <div style="font-size:10px;letter-spacing:0.4em;color:#6B7A8D;text-transform:uppercase;margin-bottom:12px;">TRANSMISSION INCOMING</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.1em;color:#FF4D1A;line-height:1;font-family:Arial Black,Arial,sans-serif;">TAKE ONE</div>
              <div style="width:60px;height:2px;background:#FF4D1A;margin:12px auto;"></div>
              <div style="font-size:10px;letter-spacing:0.3em;color:#6B7A8D;text-transform:uppercase;">Film Crew Connect · Nexus Platform</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:rgba(255,77,26,0.06);border-left:3px solid #FF4D1A;padding:12px 16px;margin-bottom:28px;">
                <div style="font-size:9px;letter-spacing:0.35em;color:#FF4D1A;text-transform:uppercase;margin-bottom:4px;">ACTION REQUIRED</div>
                <div style="font-size:11px;color:#6B7A8D;letter-spacing:0.1em;">Verify your signal to activate your account</div>
              </div>
              <p style="color:#E8DFC8;font-size:14px;line-height:1.7;margin:0 0 16px;letter-spacing:0.05em;">
                Hello, <span style="color:#FF4D1A;font-weight:bold;">${escapeHtml(userName)}</span> —
              </p>
              <p style="color:#6B7A8D;font-size:13px;line-height:1.8;margin:0 0 28px;letter-spacing:0.05em;">
                You have successfully registered on the <strong style="color:#E8DFC8;">TAKE ONE Nexus</strong> platform.
                To activate your profile and unlock all features, please verify your email address.
              </p>
              <div style="text-align:center;margin:0 0 36px;">
                <a href="${verificationUrl}"
                   style="display:inline-block;background:#FF4D1A;color:#06080A;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;border-radius:1px;font-family:Arial Black,Arial,sans-serif;">
                  VERIFY MY ACCOUNT →
                </a>
              </div>
              <div style="background:#0A0D12;border:1px solid rgba(0,212,255,0.12);padding:14px 18px;margin-bottom:28px;border-radius:1px;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#00D4FF;text-transform:uppercase;margin-bottom:6px;">⏱ SIGNAL EXPIRES IN</div>
                <div style="font-size:20px;color:#E8DFC8;font-weight:bold;letter-spacing:0.1em;">${expiresInHours} HOURS</div>
              </div>
              <div style="background:#060A0E;border:1px solid #1C2330;padding:14px 18px;margin-bottom:28px;border-radius:1px;word-break:break-all;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:8px;">If button doesn't work, copy this link:</div>
                <a href="${verificationUrl}" style="color:#FF7A1A;font-size:11px;text-decoration:none;">${verificationUrl}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;border-top:1px solid #1C2330;text-align:center;">
              <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:16px;">Join The Community</div>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.linkedin.com/company/take-one-nexus" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(0,212,255,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#00D4FF;text-transform:uppercase;">&#9656;&nbsp;LinkedIn</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/__take__one" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(255,77,26,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#FF4D1A;text-transform:uppercase;">&#9656;&nbsp;Instagram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <div style="font-size:9px;color:#3A4556;letter-spacing:0.25em;text-transform:uppercase;text-align:center;line-height:1.8;">
                TAKE ONE NEXUS · Film Crew Connect<br/>
                takeone-nexus.net.in · © ${year} TAKE ONE
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildResetPasswordTemplate = ({ userName, resetUrl, expiresInMinutes = 60 }) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your TAKE ONE Password</title>
</head>
<body style="margin:0;padding:0;background:#06080A;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0E1218;border:1px solid rgba(255,77,26,0.25);border-radius:2px;">
          <tr>
            <td style="height:3px;background:linear-gradient(to right,#00D4FF,#FF4D1A,#FFA620);border-radius:2px 2px 0 0;"></td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 40px 24px;">
              <div style="font-size:10px;letter-spacing:0.4em;color:#6B7A8D;text-transform:uppercase;margin-bottom:12px;">SECURITY PROTOCOL</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.1em;color:#FF4D1A;line-height:1;font-family:Arial Black,Arial,sans-serif;">TAKE ONE</div>
              <div style="width:60px;height:2px;background:#00D4FF;margin:12px auto;"></div>
              <div style="font-size:10px;letter-spacing:0.3em;color:#6B7A8D;text-transform:uppercase;">Password Reset Request</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:rgba(0,212,255,0.05);border-left:3px solid #00D4FF;padding:12px 16px;">
                <div style="font-size:9px;letter-spacing:0.35em;color:#00D4FF;text-transform:uppercase;margin-bottom:4px;">⚠ SECURITY NOTICE</div>
                <div style="font-size:11px;color:#6B7A8D;letter-spacing:0.1em;">If you did not request this, ignore this email.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="color:#E8DFC8;font-size:14px;line-height:1.7;margin:0 0 16px;letter-spacing:0.05em;">
                Hello, <span style="color:#FF4D1A;font-weight:bold;">${escapeHtml(userName)}</span> —
              </p>
              <p style="color:#6B7A8D;font-size:13px;line-height:1.8;margin:0 0 28px;letter-spacing:0.05em;">
                We received a request to reset your password. Click the button below to create a new one.
              </p>
              <div style="text-align:center;margin:0 0 36px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#00D4FF;color:#06080A;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;border-radius:1px;font-family:Arial Black,Arial,sans-serif;">
                  RESET MY PASSWORD →
                </a>
              </div>
              <div style="background:#0A0D12;border:1px solid rgba(255,77,26,0.15);padding:14px 18px;margin-bottom:28px;border-radius:1px;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#FF4D1A;text-transform:uppercase;margin-bottom:6px;">⏱ LINK EXPIRES IN</div>
                <div style="font-size:20px;color:#E8DFC8;font-weight:bold;letter-spacing:0.1em;">${expiresInMinutes} MINUTES</div>
              </div>
              <div style="background:#060A0E;border:1px solid #1C2330;padding:14px 18px;margin-bottom:28px;border-radius:1px;word-break:break-all;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:8px;">If button doesn't work, copy this link:</div>
                <a href="${resetUrl}" style="color:#00D4FF;font-size:11px;text-decoration:none;">${resetUrl}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;border-top:1px solid #1C2330;text-align:center;">
              <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:16px;">Join The Community</div>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.linkedin.com/company/take-one-nexus" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(0,212,255,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#00D4FF;text-transform:uppercase;">&#9656;&nbsp;LinkedIn</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/__take__one" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(255,77,26,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#FF4D1A;text-transform:uppercase;">&#9656;&nbsp;Instagram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <div style="font-size:9px;color:#3A4556;letter-spacing:0.25em;text-transform:uppercase;text-align:center;line-height:1.8;">
                TAKE ONE NEXUS · Film Crew Connect<br/>
                takeone-nexus.net.in · © ${year} TAKE ONE
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = {
  buildVerifyEmailTemplate,
  buildResetPasswordTemplate
};
