// src/types/express.d.ts
import { Request as ExpressRequest } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { File } from "multer";

declare global {
  namespace Express {
    // Extend the Request interface with proper generic types
    interface Request<
      P = ParamsDictionary,
      ResBody = any,
      ReqBody = any,
      ReqQuery = ParsedQs,
      Locals extends Record<string, any> = Record<string, any>
    > {
      user?: {
        id: number;
        email?: string;
        roleId?: number | null;
        payload?: any;
      } | null;
      file?: File;
      files?:
        | {
            [fieldname: string]: File[];
          }
        | File[];
    }
  }
}

export {};
