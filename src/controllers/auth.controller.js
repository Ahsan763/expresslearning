import * as authService from "../services/auth.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const signupController = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body, req);
  res.status(201).json({ success: true, ...result });
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.query.token, req);
  res.status(200).json({ success: true, ...result });
});

export const resendVerificationController = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body.email, req);
  res.status(200).json({ success: true, ...result });
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  res.status(200).json({ success: true, ...result });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email, req);
  res.status(200).json({ success: true, ...result });
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body, req);
  res.status(200).json({ success: true, ...result });
});
