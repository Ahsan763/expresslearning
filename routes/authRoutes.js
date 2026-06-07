import express from "express"
import {loignController, signupController} from "../controllers/authController.js"
const router = express.Router();
// signup
router.post("/signup", signupController)
router.post("/login", loignController)
export default router