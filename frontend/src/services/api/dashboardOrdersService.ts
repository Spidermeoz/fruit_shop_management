import { http } from "../http";
import { mapOrder } from "../../utils/mapOrder";
import dayjs from "dayjs";

export async function getOrdersForMonth() {
  const start = dayjs().startOf("month").format("YYYY-MM-DD");
  const end = dayjs().endOf("month").format("YYYY-MM-DD");

  const res = await http(
    "GET",
    `/api/v1/admin/orders?createdAt_from=${start}&createdAt_to=${end}&limit=9999`
  );

  return (res.data || []).map(mapOrder);
}

export async function getRecentOrders(limit = 5) {
  const res = await http(
    "GET",
    `/api/v1/admin/orders?page=1&limit=${limit}&sortBy=createdAt&order=DESC`
  );

  return (res.data || []).map(mapOrder);
}

// Thêm hàm để lấy thông tin chi tiết người dùng
export async function getUserDetails(userId: number) {
  try {
    const res = await http("GET", `/api/v1/admin/users/detail/${userId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}
