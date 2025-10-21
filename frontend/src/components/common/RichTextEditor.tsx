import React from "react";
import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange?: (content: string) => void;
}

// ✅ Đọc API key từ .env
const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || "";

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  return (
    <Editor
      apiKey={apiKey}
      init={{
        height: 450,
        menubar: true,
        branding: false,
        promotion: false,
        plugins:
          "advlist autolink lists link image charmap preview anchor " +
          "searchreplace visualblocks code fullscreen " +
          "insertdatetime media table help wordcount",
        toolbar:
          "undo redo | blocks | bold italic underline forecolor | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | link image | removeformat | help",
        automatic_uploads: false,
        file_picker_types: "image",

        // ✅ Chỉ tạo preview local, không upload lên server
        file_picker_callback: (callback, _value, meta) => {
          if (meta.filetype === "image") {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                const localUrl = URL.createObjectURL(file);
                callback(localUrl, { title: file.name });
              }
            };

            input.click();
          }
        },
      }}
      value={value}
      onEditorChange={(content) => onChange?.(content)}
    />
  );
};

export default RichTextEditor;
