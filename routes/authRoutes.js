import express from "express";
import {
  signupController,
  loginController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn, requireVerifiedEmail } from "../middlewares/authMiddlewares.js";
import validate from "../middlewares/validate.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/Authvalidator.js";

const router = express.Router();

// ─── Public Auth Routes ────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), signupController);

// POST /api/auth/login
router.post("/login", validate(loginSchema), loginController);

// GET  /api/auth/verify-email?token=<token>
router.get("/verify-email", verifyEmailController);

// POST /api/auth/resend-verification  { email }
router.post("/resend-verification", resendVerificationController);

// POST /api/auth/forgot-password  { email }
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordController);

// POST /api/auth/reset-password  { token, password }
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

// ─── Protected Routes (examples) ──────────────────────────────────────────────

// Any authenticated + verified user
router.get("/profile", requireSignIn, requireVerifiedEmail, (req, res) => {
  res.status(200).json({ success: true, userId: req.user._id });
});

// Admin only
router.get("/admin/test", requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ success: true, message: "Welcome, admin." });
});

export default router;