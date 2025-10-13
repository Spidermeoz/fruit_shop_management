import { Request, Response, Router } from "express";
const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    // Giả sử sau này ta sẽ fetch dữ liệu từ DB
    const data = {
      message: "Welcome to Fruit Shop ",
      version: "1.0",
      endpoints: {
        products: "/api/v1/routes/client/product",
        categories: "/api/v1/routes/client/category",
        orders: "/api/v1/routes/client/order",
      },
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in home route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export const homeRoutes: Router = router;
