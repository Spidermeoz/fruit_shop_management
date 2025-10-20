import React from "react";
import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange?: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  // ✅ Hàm upload ảnh qua API backend
  const uploadImage = async (
    blobInfo: any,
    _progress: (percent: number) => void
  ): Promise<string> => {
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

    // ✅ Trả về URL ảnh để TinyMCE tự chèn vào nội dung
    return data.url;
  };

  return (
    <Editor
      tinymceScriptSrc="/node_modules/tinymce/tinymce.min.js"
      init={{
        height: 450,
        menubar: true,
        branding: false,
        licenseKey: 'gpl', // ✅ open-source mode, không cần key
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

        // ✅ Cho phép upload ảnh thủ công từ local
        file_picker_callback: (callback, _value, meta) => {
          if (meta.filetype === "image") {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

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