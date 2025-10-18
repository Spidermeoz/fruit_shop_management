import { Request, Response } from "express";
import cloudinary from "../../../../config/cloudinary";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file"); // field name: file

export const uploadImage = async (req: Request, res: Response) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ success: false, message: "Upload failed" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(fileStr, {
        folder: "fruitshop/products", // tùy chọn
        resource_type: "image",
      });

      return res.status(200).json({
        success: true,
        url: result.secure_url,
      });
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
