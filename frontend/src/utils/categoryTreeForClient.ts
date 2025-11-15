// ⚙️ Tạo tree cho client header (phân cấp cha-con)
export function buildClientCategoryTree(categories: any[]) {
  const map = new Map();
  const roots: any[] = [];

  // 1️⃣ Chuẩn bị map tất cả danh mục
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // 2️⃣ Gắn quan hệ cha - con
  categories.forEach((cat) => {
    const node = map.get(cat.id);
    if (cat.parentId !== null && cat.parentId !== undefined && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 3️⃣ Sắp xếp theo position
  const sortRecursively = (arr: any[]) => {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    arr.forEach((c) => {
      if (c.children && c.children.length > 0) {
        sortRecursively(c.children);
      }
    });
  };
  sortRecursively(roots);

  // 4️⃣ Loại bỏ danh mục bị inactive (nếu có)
  return roots.filter((c) => c.status === "active");
}