import express from "express";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.post("/verifyCode", authController.verifyCode);

export default router;
