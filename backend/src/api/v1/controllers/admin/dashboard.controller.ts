import { Request, Response } from "express";

// GET /api/v1/admin/dashboard
export const dashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Sau này bạn sẽ gọi service hoặc query DB để lấy dữ liệu thật
    const data = {
      title: "Dashboard",
      widgets: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
      },
      charts: {
        revenue7d: [
          // Ví dụ:
          // { date: "2025-10-01", revenue: 120000 },
          // { date: "2025-10-02", revenue: 145000 },
        ],
        orders7d: [
          // { date: "2025-10-01", count: 10 },
          // { date: "2025-10-02", count: 15 },
        ],
      },
    };

    res.status(200).json({
      success: true,
      data,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in admin dashboard controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
