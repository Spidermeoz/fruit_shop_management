export const uploadImagesInContent = async (htmlContent: string): Promise<string> => {
  if (!htmlContent) return htmlContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  // upload song song
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src) return;

      // Bỏ qua nếu đã là URL HTTP(S)
      if (/^https?:\/\//i.test(src)) return;

      try {
        let uploadUrl: string | null = null;

        if (src.startsWith("blob:")) {
          // case: blob:
          const blob = await fetch(src).then((r) => r.blob());
          const formData = new FormData();
          // đặt tên file cho đẹp (optional)
          formData.append("file", blob, `content.${(blob.type.split("/")[1] || "png")}`);
          formData.append("folder", "fruitshop/content"); // tuỳ chọn

          const res = await fetch("/api/v1/admin/upload", { method: "POST", body: formData });
          const json = await res.json();
          uploadUrl = json?.data?.url || json?.url || null;
        } else if (src.startsWith("data:image/")) {
          // case: data:image;base64
          const res = await fetch("/api/v1/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: src, folder: "fruitshop/content" }),
          });
          const json = await res.json();
          uploadUrl = json?.data?.url || json?.url || null;
        }

        if (uploadUrl) {
          img.setAttribute("src", uploadUrl);
          // Tránh trình duyệt dùng lại kích thước cũ
          img.removeAttribute("srcset");
        } else {
          console.warn("❌ Không thể upload ảnh trong nội dung:", src);
        }
      } catch (err) {
        console.error("Upload image in content error:", err);
      }
    })
  );

  return doc.body.innerHTML;
};
