import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import devtoolsJson from "vite-plugin-devtools-json"
import dotenv from "dotenv"

dotenv.config({ path: process.env.DOTENV_PATH || ["../.env.local", "../.env"] })
const allowedHostsEnv = process.env.VITE_ALLOWED_HOSTS ?? ""
const allowedHosts = allowedHostsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
  base: command === "build" ? "/static/" : "/",
  server: {
    host: allowedHosts.length ? "0.0.0.0" : undefined,
    allowedHosts: allowedHosts.length ? allowedHosts : undefined,
    proxy: {
      "/api/": {
        target: "http://localhost:8000",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
}))
