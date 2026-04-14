import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { File } from "multer";

type RequestPermissionMap = Record<string, string[]>;

declare global {
  namespace Express {
    interface Request<
      P = ParamsDictionary,
      ResBody = any,
      ReqBody = any,
      ReqQuery = ParsedQs,
      Locals extends Record<string, any> = Record<string, any>,
    > {
      user?: {
        id: number;
        email?: string;
        roleId?: number | null;
        roleCode?: string | null;
        roleName?: string | null;
        roleScope?: "system" | "branch" | "client" | null;
        roleLevel?: number | null;
        isRoleAssignable?: boolean;
        isRoleProtected?: boolean;
        isSuperAdmin?: boolean;
        permissions?: RequestPermissionMap;
        branchIds?: number[];
        primaryBranchId?: number | null;
        currentBranchId?: number | null;
        branches?: Array<{
          id: number;
          name?: string | null;
          code?: string | null;
          status?: string | null;
          isPrimary?: boolean;
        }>;
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
