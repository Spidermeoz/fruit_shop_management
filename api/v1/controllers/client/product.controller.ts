import { Request, Response } from "express";
import Product from "../../models/product.model";

// GET /products
export const index = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      where: { deleted: 0 },
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /products/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, deleted: 0 },
      raw: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};