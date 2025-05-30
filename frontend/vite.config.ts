import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import devtoolsJson from "vite-plugin-devtools-json"

export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
  base: command === "build" ? "/static/" : "/",
  server: {
    proxy: {
      "/api/": {
        target: "http://localhost:8000",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
}))
