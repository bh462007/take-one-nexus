/**
 * Cyberpunk-themed verification email template for Take One Nexus.
 * Rendered as HTML, delivered via Resend.
 */

export interface VerifyEmailTemplateProps {
  userName: string;
  verificationUrl: string;
  expiresInHours?: number;
}

export function buildVerifyEmailTemplate({
  userName,
  verificationUrl,
  expiresInHours = 24,
}: VerifyEmailTemplateProps): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your TAKE ONE Account</title>
</head>
<body style="margin:0;padding:0;background:#06080A;font-family:'Courier New',Courier,monospace;">

  <!-- Scan-line spacer -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px 0;">

        <!-- Outer card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0E1218;border:1px solid rgba(255,77,26,0.25);border-radius:2px;">

          <!-- Neon top bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(to right,#FF4D1A,#FF7A1A,#00D4FF);border-radius:2px 2px 0 0;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 40px 24px;">
              <div style="font-size:10px;letter-spacing:0.4em;color:#6B7A8D;text-transform:uppercase;margin-bottom:12px;">TRANSMISSION INCOMING</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.1em;color:#FF4D1A;line-height:1;font-family:Arial Black,Arial,sans-serif;">TAKE ONE</div>
              <div style="width:60px;height:2px;background:#FF4D1A;margin:12px auto;"></div>
              <div style="font-size:10px;letter-spacing:0.3em;color:#6B7A8D;text-transform:uppercase;">Film Crew Connect · Nexus Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 32px;">

              <!-- Kicker -->
              <div style="background:rgba(255,77,26,0.06);border-left:3px solid #FF4D1A;padding:12px 16px;margin-bottom:28px;">
                <div style="font-size:9px;letter-spacing:0.35em;color:#FF4D1A;text-transform:uppercase;margin-bottom:4px;">ACTION REQUIRED</div>
                <div style="font-size:11px;color:#6B7A8D;letter-spacing:0.1em;">Verify your signal to activate your account</div>
              </div>

              <!-- Greeting -->
              <p style="color:#E8DFC8;font-size:14px;line-height:1.7;margin:0 0 16px;letter-spacing:0.05em;">
                Hello, <span style="color:#FF4D1A;font-weight:bold;">${escapeHtml(userName)}</span> —
              </p>
              <p style="color:#6B7A8D;font-size:13px;line-height:1.8;margin:0 0 28px;letter-spacing:0.05em;">
                You have successfully registered on the <strong style="color:#E8DFC8;">TAKE ONE Nexus</strong> platform — 
                where scripts become films and student filmmakers connect across campuses.
              </p>
              <p style="color:#6B7A8D;font-size:13px;line-height:1.8;margin:0 0 36px;letter-spacing:0.05em;">
                To activate your creator profile and unlock all platform features, you must verify your email address. 
                Click the button below to confirm your signal.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 36px;">
                <a href="${verificationUrl}"
                   style="display:inline-block;background:#FF4D1A;color:#06080A;text-decoration:none;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;border-radius:1px;font-family:Arial Black,Arial,sans-serif;">
                  VERIFY MY ACCOUNT →
                </a>
              </div>

              <!-- Expiry notice -->
              <div style="background:#0A0D12;border:1px solid rgba(0,212,255,0.12);padding:14px 18px;margin-bottom:28px;border-radius:1px;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#00D4FF;text-transform:uppercase;margin-bottom:6px;">⏱ SIGNAL EXPIRES IN</div>
                <div style="font-size:20px;color:#E8DFC8;font-weight:bold;letter-spacing:0.1em;">${expiresInHours} HOURS</div>
                <div style="font-size:10px;color:#3A4556;margin-top:4px;letter-spacing:0.1em;">After expiry, request a new verification link from your profile</div>
              </div>

              <!-- Raw link fallback -->
              <div style="background:#060A0E;border:1px solid #1C2330;padding:14px 18px;margin-bottom:28px;border-radius:1px;word-break:break-all;">
                <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:8px;">If button doesn't work, copy this link:</div>
                <a href="${verificationUrl}" style="color:#FF7A1A;font-size:11px;text-decoration:none;">${verificationUrl}</a>
              </div>

              <!-- What you unlock -->
              <div style="margin-bottom:28px;">
                <div style="font-size:9px;letter-spacing:0.35em;color:#6B7A8D;text-transform:uppercase;margin-bottom:14px;">After verification you can:</div>
                ${['Send and receive messages', 'Create projects & scripts', 'Assign and complete tasks', 'Climb the leaderboard', 'Access your full creator profile'].map(item => `
                <div style="display:flex;align-items:center;margin-bottom:8px;">
                  <span style="color:#FF4D1A;margin-right:10px;font-size:12px;">✦</span>
                  <span style="color:#6B7A8D;font-size:12px;letter-spacing:0.05em;">${item}</span>
                </div>`).join('')}
              </div>

              <!-- Didn't register note -->
              <p style="color:#3A4556;font-size:11px;line-height:1.6;margin:0;letter-spacing:0.05em;">
                If you didn't create a TAKE ONE account, please ignore this email. 
                No action is required and your email address will not be used.
              </p>

            </td>
          </tr>

          <!-- Social Footer -->
          <tr>
            <td style="padding:24px 40px 0;border-top:1px solid #1C2330;text-align:center;">
              <div style="font-size:9px;letter-spacing:0.3em;color:#3A4556;text-transform:uppercase;margin-bottom:16px;">Join The Community</div>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.linkedin.com/company/take-one-nexus" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(0,212,255,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#00D4FF;text-transform:uppercase;">
                      &#9656;&nbsp;LinkedIn
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://www.instagram.com/__take__one" target="_blank" rel="noopener"
                       style="display:inline-block;background:#0E1218;border:1px solid rgba(255,77,26,0.2);padding:10px 18px;text-decoration:none;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.15em;color:#FF4D1A;text-transform:uppercase;">
                      &#9656;&nbsp;Instagram
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <div style="font-size:9px;color:#3A4556;letter-spacing:0.25em;text-transform:uppercase;text-align:center;line-height:1.8;">
                TAKE ONE NEXUS · Film Crew Connect<br/>
                takeone-nexus.net.in · © ${year} TAKE ONE<br/>
                <span style="color:#1C2330;">This is an automated system message. Do not reply.</span>
              </div>
            </td>
          </tr>

          <!-- Neon bottom bar -->
          <tr>
            <td style="height:2px;background:linear-gradient(to right,#1C2330,#FF4D1A,#1C2330);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
