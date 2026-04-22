import { NextFunction, Request, Response } from "express";
import { CreateChatSession } from "../../../../../application/chat/usecases/CreateChatSession";
import { GetChatSessionDetail } from "../../../../../application/chat/usecases/GetChatSessionDetail";
import { ListChatMessages } from "../../../../../application/chat/usecases/ListChatMessages";
import { SendChatMessage } from "../../../../../application/chat/usecases/SendChatMessage";

const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.sub ?? null;
  const value = Number(rawId);
  return Number.isInteger(value) && value > 0 ? value : null;
};

const toNum = (value: unknown, fallback?: number) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const makeClientChatController = (uc: {
  createSession: CreateChatSession;
  getSessionDetail: GetChatSessionDetail;
  listMessages: ListChatMessages;
  sendMessage: SendChatMessage;
}) => {
  return {
    createSession: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as {
          sessionToken?: string;
          channel?: string;
          metadataJson?: Record<string, any> | null;
        };
        const session = await uc.createSession.execute({
          userId: getActorId(req),
          sessionToken: body?.sessionToken,
          channel: body?.channel ?? "web",
          metadataJson: body?.metadataJson ?? null,
        });
        return res.status(201).json({ success: true, data: session });
      } catch (error) {
        next(error);
      }
    },

    getSessionDetail: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const sessionId = Number(req.params.sessionId);
        const data = await uc.getSessionDetail.execute({
          sessionId,
          limit: toNum(req.query.limit, 50),
        });
        return res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    listMessages: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionId = Number(req.params.sessionId);
        const page = toNum(req.query.page, 1) ?? 1;
        const limit = toNum(req.query.limit, 50) ?? 50;
        const result = await uc.listMessages.execute({
          sessionId,
          page,
          limit,
        });
        return res.json({
          success: true,
          data: result.rows,
          meta: { total: result.count, page, limit },
        });
      } catch (error) {
        next(error);
      }
    },

    sendMessage: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionId = Number(req.params.sessionId);
        const body = req.body as { content?: string };
        const result = await uc.sendMessage.execute({
          sessionId,
          content: String(body?.content ?? ""),
        });
        return res.status(201).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    },
  };
};

export type ClientChatController = ReturnType<typeof makeClientChatController>;
