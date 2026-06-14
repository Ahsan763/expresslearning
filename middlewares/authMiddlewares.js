import JWT from "jsonwebtoken";
import userModule from "../modules/userModule.js";

/**
 * Validates the Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 *
 * Expected header: Authorization: Bearer <token>
 */
export const requireSignIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Distinguish between expired and invalid tokens for better UX
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

/**
 * Ensures the authenticated user is an admin (role === 1).
 * Must be used after requireSignIn.
 *
 * Also enforces that only verified accounts can access admin routes.
 */
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModule.findById(req.user._id).select("role isEmailVerified");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before accessing this resource.",
      });
    }

    if (user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};

/**
 * Ensures the authenticated user has a verified email.
 * Use on any route that requires a confirmed account.
 */
export const requireVerifiedEmail = async (req, res, next) => {
  try {
    const user = await userModule.findById(req.user._id).select("isEmailVerified");

    if (!user || !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address to access this resource.",
      });
    }

    next();
  } catch (error) {
    console.error("requireVerifiedEmail error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};