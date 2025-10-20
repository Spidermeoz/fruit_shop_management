import React from "react";
import { Editor } from "@tinymce/tinymce-react";

const RichTextEditor = ({ value, onChange }) => {
  // ✅ Dùng API backend sẵn có
  const uploadImage = async (blobInfo, progress) => {
    const formData = new FormData();
    formData.append("file", blobInfo.blob());

    const res = await fetch("/api/v1/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success || !data.url) {
      throw new Error("Không thể upload ảnh!");
    }

    // ✅ Trả về URL cho TinyMCE tự chèn vào nội dung
    return data.url;
  };

  return (
    <Editor
      tinymceScriptSrc="/node_modules/tinymce/tinymce.min.js"
      init={{
        height: 450,
        menubar: true,
        branding: false,
        license_key: "gpl", // ✅ không cần key, chế độ open-source
        plugins:
          "advlist autolink lists link image charmap preview anchor " +
          "searchreplace visualblocks code fullscreen " +
          "insertdatetime media table help wordcount",
        toolbar:
          "undo redo | blocks | bold italic underline forecolor | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | link image | removeformat | help",
        automatic_uploads: true,
        file_picker_types: "image",
        // ✅ Cho phép chọn ảnh từ máy local
        file_picker_callback: (callback, value, meta) => {
          if (meta.filetype === "image") {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");

            input.onchange = async function () {
              const file = this.files[0];
              const formData = new FormData();
              formData.append("file", file);

              try {
                const res = await fetch("/api/v1/admin/upload", {
                  method: "POST",
                  body: formData,
                });

                const data = await res.json();

                if (data.success && data.url) {
                  callback(data.url, { title: file.name });
                } else {
                  alert("Không thể upload ảnh!");
                }
              } catch (err) {
                console.error("Upload error:", err);
                alert("Lỗi upload ảnh!");
              }
            };

            input.click();
          }
        },
        // ✅ Khi dán hoặc kéo ảnh vào editor
        images_upload_handler: uploadImage,
        content_style: `
          body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #333;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1f2937;
              color: #e5e7eb;
            }
          }
        `,
      }}
      value={value}
      onEditorChange={(content) => onChange?.(content)}
    />
  );
};

export default RichTextEditor;
