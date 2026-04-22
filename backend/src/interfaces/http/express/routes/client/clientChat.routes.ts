import { Router } from "express";
import type { ClientChatController } from "../../controllers/client/ClientChatController";

export const clientChatRoutes = (controller: ClientChatController) => {
  const r = Router();
  r.post("/sessions", controller.createSession);
  r.get("/sessions/:sessionId", controller.getSessionDetail);
  r.get("/sessions/:sessionId/messages", controller.listMessages);
  r.post("/sessions/:sessionId/messages", controller.sendMessage);
  return r;
};
