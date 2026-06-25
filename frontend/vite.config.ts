import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/misp": {
        target: "http://localhost",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("proxyRes", (proxyRes) => {
            const location = proxyRes.headers.location

            if (!location) {
              return
            }

            proxyRes.headers.location = location.replace(
              /^https?:\/\/localhost(?::\d+)?\/misp/,
              "/misp"
            )
          })
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
