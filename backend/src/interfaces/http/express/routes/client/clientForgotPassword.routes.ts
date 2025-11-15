import { Router } from "express";
import { ClientForgotPasswordController } from "../../controllers/client/ClientForgotPasswordController";
import { ClientVerifyOtpController } from "../../controllers/client/ClientVerifyOtpController";
import { ClientResetPasswordController } from "../../controllers/client/ClientResetPasswordController";

export const clientForgotPasswordRoutes = (
  forgotPasswordCtrl: ClientForgotPasswordController,
  verifyOtpCtrl: ClientVerifyOtpController,
  resetPasswordCtrl: ClientResetPasswordController
) => {
  const r = Router();

  r.post("/request", forgotPasswordCtrl.request);
  r.post("/verify", verifyOtpCtrl.verify);
  r.post("/reset", resetPasswordCtrl.reset);

  return r;
};
