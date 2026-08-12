import { defineConfig } from "vite";
import { qloomVitePlugin } from "create-qloom/vite";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [qloomVitePlugin() as any],
  server: { port: 5173 },
});
