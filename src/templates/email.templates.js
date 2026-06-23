const baseLayout = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px" />
    <p style="color:#999;font-size:12px;margin:0">
      &copy; ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Store"}. All rights reserved.
    </p>
  </div>
`;

const actionButton = (url, label, color) => `
  <a href="${url}"
     style="display:inline-block;padding:12px 24px;background:${color};color:#fff;
            text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0">
    ${label}
  </a>
`;

export const verificationEmailTemplate = ({ verifyUrl, appName }) =>
  baseLayout(`
    <h2 style="margin-top:0">Welcome to ${appName}!</h2>
    <p>Thanks for signing up. Please verify your email address to activate your account.</p>
    <p>This link expires in <strong>24 hours</strong>.</p>
    ${actionButton(verifyUrl, "Verify Email", "#4F46E5")}
    <p style="color:#666;font-size:14px">
      Or copy this link into your browser:<br/>
      <a href="${verifyUrl}">${verifyUrl}</a>
    </p>
    <p style="color:#999;font-size:12px">
      If you did not create an account, you can safely ignore this email.
    </p>
  `);

export const passwordResetEmailTemplate = ({ resetUrl, appName }) =>
  baseLayout(`
    <h2 style="margin-top:0">Password Reset — ${appName}</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <p>This link expires in <strong>1 hour</strong>.</p>
    ${actionButton(resetUrl, "Reset Password", "#DC2626")}
    <p style="color:#666;font-size:14px">
      Or copy this link into your browser:<br/>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>
    <p style="color:#999;font-size:12px">
      If you did not request a password reset, please ignore this email. Your password will not change.
    </p>
  `);
