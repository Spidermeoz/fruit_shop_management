import { http } from "../../services/http";
import { mapProduct } from "../../utils/mapProduct";

export async function getAllProducts() {
  const res = await http("GET", "/api/v1/admin/products?limit=9999");
  return (res.data || []).map(mapProduct);
}
