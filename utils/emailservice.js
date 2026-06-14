import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD must be set in environment variables"
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
};

/**
 * Send an email verification link to a new user.
 */
export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await getTransporter().sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email address",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Welcome! Please verify your email</h2>
        <p>Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold">
          Verify Email
        </a>
        <p style="margin-top:16px;color:#666">
          Or copy this link into your browser:<br/>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color:#999;font-size:12px">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send a password-reset link.
 */
export const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click below to set a new one.
           This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#DC2626;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#666">
          Or copy this link into your browser:<br/>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color:#999;font-size:12px">
          If you did not request a password reset, please ignore this email.
          Your password will not be changed.
        </p>
      </div>
    `,
  });
};
