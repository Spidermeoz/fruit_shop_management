import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      allow: [
        // ✅ Cho phép Vite truy cập các thư mục cần thiết
        path.resolve(__dirname), // 👉 thêm dòng này để cho phép toàn bộ dự án (index.html, public, v.v.)
        path.resolve(__dirname, "node_modules"),
        path.resolve(__dirname, "node_modules/tinymce"),
        path.resolve(__dirname, "src"),
      ],
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
