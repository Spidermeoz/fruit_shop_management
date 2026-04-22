// src/interfaces/http/express/controllers/SettingsGeneralController.ts

import { Request, Response, NextFunction } from "express";
import { GetGeneralSettings } from "../../../../application/settings/usecases/GetGeneralSettings";
import { UpdateGeneralSettings } from "../../../../application/settings/usecases/UpdateGeneralSettings";
import { UploadImage } from "../../../../application/uploads/usecases/UploadImage";



const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.adminId ?? user?.sub ?? null;

  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildActor = (req: Request) => ({
  id: getActorId(req),
  roleId:
    (req as any)?.user?.roleId ??
    (req as any)?.authUser?.roleId ??
    null,
  roleCode:
    (req as any)?.user?.roleCode ??
    (req as any)?.authUser?.roleCode ??
    null,
  roleLevel:
    (req as any)?.user?.roleLevel ??
    (req as any)?.authUser?.roleLevel ??
    null,
  isSuperAdmin:
    (req as any)?.user?.isSuperAdmin === true ||
    (req as any)?.authUser?.isSuperAdmin === true,
  branchIds:
    (req as any)?.user?.branchIds ??
    (req as any)?.authUser?.branchIds ??
    [],
  requestId: (req as any)?.requestId ?? null,
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});

export const makeSettingsGeneralController = (uc: {
  get: GetGeneralSettings;
  update: UpdateGeneralSettings;
  upload: UploadImage; // dùng để upload logo
}) => {
  return {
    /**
     * Admin / Client: GET general settings
     */
    getGeneral: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await uc.get.execute();
        return res.json({
          success: true,
          data,
          meta: { total: 1, page: 1, limit: 1 },
        });
      } catch (err) {
        next(err);
      }
    },

    /**
     * Admin: PATCH general settings
     * Hỗ trợ upload logo (multipart/form-data)
     */
    updateGeneral: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as any;

        let newLogoUrl: string | null | undefined = undefined;

        // Nếu có file upload thì upload qua Cloudinary
        if (req.file) {
          const uploadResult = await (uc.upload.execute as any)({
            data: req.file.buffer,
            mimetype: req.file.mimetype,
          }, buildActor(req));
          newLogoUrl = uploadResult.url;
        }

        const patch = {
          websiteName: body.website_name ?? undefined,
          phone: body.phone ?? undefined,
          email: body.email ?? undefined,
          facebook: body.facebook ?? undefined,
          zalo: body.zalo ?? undefined,
          address: body.address ?? undefined,
          copyright: body.copyright ?? undefined,
          logo: newLogoUrl !== undefined ? newLogoUrl : undefined,
        };

        const updated = await (uc.update.execute as any)(patch, buildActor(req));

        return res.json({
          success: true,
          data: updated,
          meta: { total: 1, page: 1, limit: 1 },
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type SettingsGeneralController = ReturnType<
  typeof makeSettingsGeneralController
>;
