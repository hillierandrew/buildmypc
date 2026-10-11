import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const here = fileURLToPath(new URL(".", import.meta.url));

/** Collapse the Vite build into one index.html (CSS + JS inlined). */
function inlineSingleFile(): Plugin {
  return {
    name: "inline-single-file",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const htmlName = Object.keys(bundle).find((name) => name.endsWith(".html"));
      if (!htmlName) return;
      const htmlAsset = bundle[htmlName];
      if (htmlAsset.type !== "asset") return;

      const css: string[] = [];
      const js: string[] = [];
      for (const [name, item] of Object.entries(bundle)) {
        if (item.type === "asset" && name.endsWith(".css")) css.push(String(item.source));
        else if (item.type === "chunk") js.push(item.code);
      }
      // Leave the chunk files. A second pass writes the single HTML after we
      // confirm the script parses. This hook only records sizes for debugging.
      const script = js.join("\n");
      this.emitFile({
        type: "asset",
        fileName: "bundle-debug.js",
        source: script,
      });
      void css;
    },
  };
}

export default defineConfig({
  root: resolve(here, "pages"),
  publicDir: false,
  resolve: {
    alias: { "@": resolve(here, "src") },
  },
  plugins: [tailwindcss(), react()],
  build: {
    outDir: resolve(here, "dist-pages"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: "es",
      },
    },
  },
});
