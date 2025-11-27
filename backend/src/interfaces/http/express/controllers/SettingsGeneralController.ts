// src/interfaces/http/express/controllers/SettingsGeneralController.ts

import { Request, Response, NextFunction } from "express";
import { GetGeneralSettings } from "../../../../application/settings/usecases/GetGeneralSettings";
import { UpdateGeneralSettings } from "../../../../application/settings/usecases/UpdateGeneralSettings";
import { UploadImage } from "../../../../application/uploads/usecases/UploadImage";

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
          const uploadResult = await uc.upload.execute({
            data: req.file.buffer,
            mimetype: req.file.mimetype,
          });
          newLogoUrl = uploadResult.url;
        }

        const patch = {
          websiteName: body.website_name ?? undefined,
          phone: body.phone ?? undefined,
          email: body.email ?? undefined,
          address: body.address ?? undefined,
          copyright: body.copyright ?? undefined,
          logo: newLogoUrl !== undefined ? newLogoUrl : undefined,
        };

        const updated = await uc.update.execute(patch);

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
