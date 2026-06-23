import JWT from "jsonwebtoken";
import userModel from "../modules/user.module.js";
import {
  hashPassword,
  compareHashPassword,
  generateSecureToken,
  hashToken,
} from "../utils/auth.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/email.service.js";
import { auditLog } from "../utils/audit.logger.js";
import { AppError } from "../utils/app.error.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;

const signToken = (userId) =>
  JWT.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const handleFailedLogin = async (user) => {
  const willLock = user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS;
  const update = { $inc: { loginAttempts: 1 } };

  if (willLock) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  await userModel.updateOne({ _id: user._id }, update);
  return willLock;
};

const resetLoginAttempts = (userId) =>
  userModel.updateOne(
    { _id: userId },
    { $set: { loginAttempts: 0, lockUntil: null } }
  );

const sendEmailSafely = (sendFn) => {
  sendFn().catch((err) => console.error("Email send failed:", err.message));
};

export const signup = async (data, req) => {
  const { first_name, last_name, email, phone, address, password } = data;

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const hashedPassword = await hashPassword(password);
  const { rawToken, hashedToken } = generateSecureToken();

  const user = await userModel.create({
    first_name,
    last_name,
    email,
    phone,
    address,
    password: hashedPassword,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  sendEmailSafely(() => sendVerificationEmail(email, rawToken));
  await auditLog(req, "SIGNUP", { userId: user._id, email });

  return {
    message:
      "Account created successfully. Please check your email to verify your account.",
  };
};

export const verifyEmail = async (token, req) => {
  if (!token) {
    throw new AppError("Verification token is required.", 400);
  }

  const hashedToken = hashToken(token);

  const user = await userModel.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(
      "Invalid or expired verification token. Please request a new one.",
      400
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  await auditLog(req, "EMAIL_VERIFIED", { userId: user._id, email: user.email });

  return { message: "Email verified successfully. You can now log in." };
};

export const resendVerification = async (email, req) => {
  const user = await userModel.findOne({ email });

  if (user && !user.isEmailVerified) {
    const { rawToken, hashedToken } = generateSecureToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendEmailSafely(() => sendVerificationEmail(email, rawToken));
    await auditLog(req, "VERIFICATION_EMAIL_RESENT", { userId: user._id, email });
  }

  return {
    message:
      "If that email is registered and unverified, a new verification link has been sent.",
  };
};

export const login = async ({ email, password }, req) => {
  const user = await userModel.findOne({ email });

  if (!user) {
    await auditLog(req, "LOGIN_FAILED", { email, meta: { reason: "email not found" } });
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    await auditLog(req, "LOGIN_BLOCKED_LOCKED", {
      userId: user._id,
      email,
      meta: { minutesLeft },
    });
    throw new AppError(
      `Account is temporarily locked. Please try again in ${minutesLeft} minute(s), or reset your password.`,
      423
    );
  }

  const match = await compareHashPassword(password, user.password);

  if (!match) {
    const justLocked = await handleFailedLogin(user);

    if (justLocked) {
      await auditLog(req, "ACCOUNT_LOCKED", {
        userId: user._id,
        email,
        meta: { reason: "max attempts reached", lockDurationMs: LOCK_DURATION_MS },
      });
      throw new AppError(
        "Your account has been locked after too many failed attempts. Please try again in 30 minutes or reset your password.",
        423
      );
    }

    const attemptsLeft = MAX_LOGIN_ATTEMPTS - (user.loginAttempts + 1);
    await auditLog(req, "LOGIN_FAILED", {
      userId: user._id,
      email,
      meta: { reason: "wrong password", attemptsLeft },
    });

    throw new AppError(
      `Invalid email or password. ${attemptsLeft} attempt(s) remaining before lockout.`,
      401
    );
  }

  if (!user.isEmailVerified) {
    await auditLog(req, "LOGIN_BLOCKED_UNVERIFIED", { userId: user._id, email });
    throw new AppError(
      "Please verify your email address before logging in. Check your inbox or resend the verification email.",
      403
    );
  }

  await resetLoginAttempts(user._id);
  const token = signToken(user._id);
  await auditLog(req, "LOGIN_SUCCESS", { userId: user._id, email });

  return {
    message: "Logged in successfully.",
    token,
    user: {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
    },
  };
};

export const forgotPassword = async (email, req) => {
  const user = await userModel.findOne({ email });

  if (user) {
    const { rawToken, hashedToken } = generateSecureToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    sendEmailSafely(() => sendPasswordResetEmail(email, rawToken));
    await auditLog(req, "PASSWORD_RESET_REQUESTED", { userId: user._id, email });
  }

  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };
};

export const resetPassword = async ({ token, password }, req) => {
  const hashedToken = hashToken(token);

  const user = await userModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(
      "Invalid or expired password reset token. Please request a new one.",
      400
    );
  }

  user.password = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await auditLog(req, "PASSWORD_RESET_SUCCESS", {
    userId: user._id,
    email: user.email,
  });

  return {
    message: "Password reset successfully. You can now log in with your new password.",
  };
};
