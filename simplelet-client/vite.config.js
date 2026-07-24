// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync("./localhost-key.pem"),
      cert: fs.readFileSync("./localhost.pem"),
    },
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Backend is HTTP (not HTTPS)
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      },
    },
  },
});
