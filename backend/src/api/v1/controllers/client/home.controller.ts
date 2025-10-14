import { Request, Response } from "express";

// GET /
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sau này có thể thay bằng dữ liệu thật từ DB
    const data = {
      message: "Welcome to Fruit Shop",
      version: "1.0"
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in home controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
