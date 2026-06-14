import userModule from "../modules/userModule.js";
import {
  hashPassword,
  compareHashPassword,
  generateSecureToken,
  hashToken,
} from "../utils/auth.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";
import { auditLog } from "../utils/auditLogger.js";
import JWT from "jsonwebtoken";

// ─── Account Lockout Config ────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;          // Lock after this many consecutive failures
const LOCK_DURATION_MS   = 30 * 60 * 1000; // Locked for 30 minutes

// ─── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  JWT.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Increments loginAttempts. Locks the account once MAX_LOGIN_ATTEMPTS is hit.
 * Returns true if the account just became locked on this call.
 */
const handleFailedLogin = async (user) => {
  const willLock = user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS;

  const update = {
    $inc: { loginAttempts: 1 },
  };

  if (willLock) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  await userModule.updateOne({ _id: user._id }, update);
  return willLock;
};

/** Resets lockout state after a successful login. */
const resetLoginAttempts = (userId) =>
  userModule.updateOne(
    { _id: userId },
    { $set: { loginAttempts: 0, lockUntil: null } }
  );

// ─── Signup ────────────────────────────────────────────────────────────────────

export const signupController = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, password } = req.body;

    const existingUser = await userModule.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    // generateSecureToken() returns { rawToken, hashedToken }
    // Raw token  → sent in email link (user clicks it)
    // Hashed token → stored in DB (so a DB dump can't be used to verify emails)
    const { rawToken, hashedToken } = generateSecureToken();

    const user = await new userModule({
      first_name,
      last_name,
      email,
      phone,
      address,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }).save();

    sendVerificationEmail(email, rawToken).catch((err) =>
      console.error("Failed to send verification email:", err)
    );

    await auditLog(req, "SIGNUP", { userId: user._id, email });

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("signupController error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating account. Please try again.",
    });
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────────

export const verifyEmailController = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    // Hash the incoming raw token, then look up that hash in the DB
    const hashedToken = hashToken(token);

    const user = await userModule.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please request a new one.",
      });
    }

    user.isEmailVerified        = true;
    user.emailVerificationToken  = null;
    user.emailVerificationExpires = null;
    await user.save();

    await auditLog(req, "EMAIL_VERIFIED", { userId: user._id, email: user.email });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("verifyEmailController error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying email. Please try again.",
    });
  }
};

// ─── Resend Verification Email ─────────────────────────────────────────────────

export const resendVerificationController = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModule.findOne({ email });

    if (user && !user.isEmailVerified) {
      const { rawToken, hashedToken } = generateSecureToken();

      user.emailVerificationToken   = hashedToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();

      sendVerificationEmail(email, rawToken).catch((err) =>
        console.error("Failed to resend verification email:", err)
      );

      await auditLog(req, "VERIFICATION_EMAIL_RESENT", { userId: user._id, email });
    }

    // Always 200 — prevents email enumeration
    return res.status(200).json({
      success: true,
      message:
        "If that email is registered and unverified, a new verification link has been sent.",
    });
  } catch (error) {
    console.error("resendVerificationController error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModule.findOne({ email });

    if (!user) {
      // No account — log and return generic message (prevents enumeration)
      await auditLog(req, "LOGIN_FAILED", {
        email,
        meta: { reason: "email not found" },
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Account lockout check ──────────────────────────────────────────────────
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await auditLog(req, "LOGIN_BLOCKED_LOCKED", {
        userId: user._id,
        email,
        meta: { minutesLeft },
      });
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${minutesLeft} minute(s), or reset your password.`,
      });
    }

    // ── Password check ─────────────────────────────────────────────────────────
    const match = await compareHashPassword(password, user.password);

    if (!match) {
      const justLocked = await handleFailedLogin(user);

      if (justLocked) {
        await auditLog(req, "ACCOUNT_LOCKED", {
          userId: user._id,
          email,
          meta: { reason: "max attempts reached", lockDurationMs: LOCK_DURATION_MS },
        });
        return res.status(423).json({
          success: false,
          message:
            "Your account has been locked after too many failed attempts. Please try again in 30 minutes or reset your password.",
        });
      }

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - (user.loginAttempts + 1);
      await auditLog(req, "LOGIN_FAILED", {
        userId: user._id,
        email,
        meta: { reason: "wrong password", attemptsLeft },
      });

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining before lockout.`,
      });
    }

    // ── Email verification check ───────────────────────────────────────────────
    if (!user.isEmailVerified) {
      await auditLog(req, "LOGIN_BLOCKED_UNVERIFIED", { userId: user._id, email });
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email address before logging in. Check your inbox or resend the verification email.",
      });
    }

    // ── Success ────────────────────────────────────────────────────────────────
    await resetLoginAttempts(user._id);

    const token = signToken(user._id);

    await auditLog(req, "LOGIN_SUCCESS", { userId: user._id, email });

    return res.status(200).json({
      success: true,
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
    });
  } catch (error) {
    console.error("loginController error:", error);
    return res.status(500).json({
      success: false,
      message: "Error logging in. Please try again.",
    });
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────────

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModule.findOne({ email });

    if (user) {
      const { rawToken, hashedToken } = generateSecureToken();

      user.passwordResetToken   = hashedToken; // Only the hash is stored
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      sendPasswordResetEmail(email, rawToken).catch((err) =>
        console.error("Failed to send password reset email:", err)
      );

      await auditLog(req, "PASSWORD_RESET_REQUESTED", { userId: user._id, email });
    }

    // Always 200 — prevents email enumeration
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("forgotPasswordController error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────

export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the incoming raw token, find matching hash in DB
    const hashedToken = hashToken(token);

    const user = await userModule.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token. Please request a new one.",
      });
    }

    user.password          = await hashPassword(password);
    user.passwordResetToken   = null;
    user.passwordResetExpires  = null;

    // Unlock account if it was locked (password reset = identity proven)
    user.loginAttempts = 0;
    user.lockUntil     = null;

    await user.save();

    await auditLog(req, "PASSWORD_RESET_SUCCESS", {
      userId: user._id,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("resetPasswordController error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};