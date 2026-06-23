import nodemailer from "nodemailer";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "../templates/email.templates.js";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const appName = process.env.APP_NAME || "Our Store";

  await sendEmail({
    to,
    subject: "Verify your email address",
    html: verificationEmailTemplate({ verifyUrl, appName }),
  });
};

export const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const appName = process.env.APP_NAME || "Our Store";

  await sendEmail({
    to,
    subject: "Reset your password",
    html: passwordResetEmailTemplate({ resetUrl, appName }),
  });
};
