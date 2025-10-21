export const uploadImagesInContent = async (htmlContent: string): Promise<string> => {
  if (!htmlContent) return htmlContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  for (const img of images) {
    const src = img.getAttribute("src");
    if (src && src.startsWith("blob:")) {
      const blob = await fetch(src).then((r) => r.blob());
      const formData = new FormData();
      formData.append("file", blob);

      try {
        const res = await fetch("/api/v1/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success && data.url) {
          img.setAttribute("src", data.url);
        } else {
          console.warn("❌ Không thể upload ảnh blob:", data.message || src);
        }
      } catch (err) {
        console.error("Upload blob image error:", err);
      }
    }
  }

  return doc.body.innerHTML;
};