import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
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

    // 🟢 Chỉ dùng proxy khi chạy local
    ...(isDev && {
      server: {
        proxy: {
          "/api": {
            target: "https://backend-fruit-shop.onrender.com",
            changeOrigin: true,
            secure: false,
          },
        },
      },
    }),

    build: {
      outDir: "dist",
    },
  };
});
