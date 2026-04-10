import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "_app")
      : path.resolve(import.meta.dirname, "_app");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    return;
  }

  const indexPath = path.resolve(distPath, "index.html");
  const assetsDir = path.resolve(distPath, "assets");

  if (!fs.existsSync(indexPath)) {
    console.error(`[Static] index.html not found at ${indexPath}`);
    return;
  }

  let cachedHtml: string | null = null;
  function getSpaHtml(): string {
    if (cachedHtml) return cachedHtml;
    let html = fs.readFileSync(indexPath, "utf-8");

    const hasManusRuntime = html.includes("manus-runtime") || html.includes("__MANUS_HOST");
    if (hasManusRuntime) {
      console.warn("[Static] ⚠ Detected stale Manus runtime in index.html — rebuilding clean HTML");
      const cssFiles = fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir).filter(f => f.startsWith("index") && f.endsWith(".css"))
        : [];
      const jsFiles = fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir).filter(f => f.startsWith("index") && f.endsWith(".js"))
        : [];
      const cssFile = cssFiles[0] || "index.css";
      const jsFile = jsFiles.find(f => f === "index.js") || jsFiles[0] || "index.js";
      const bundleHash = Date.now().toString(36);
      html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>CuraLive — Live Event Intelligence Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script type="module" crossorigin src="/assets/${jsFile}?v=${bundleHash}"></script>
    <link rel="stylesheet" crossorigin href="/assets/${cssFile}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
      console.log("[Static] ✓ Clean HTML generated — Manus runtime stripped");
    }

    if (fs.existsSync(assetsDir)) {
      const jsFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith("index") && f.endsWith(".js"));
      if (jsFiles.length > 0 && !hasManusRuntime) {
        const preferUnhashed = jsFiles.find(f => f === "index.js");
        const newestBundle = preferUnhashed || jsFiles.sort((a, b) => {
          const statA = fs.statSync(path.resolve(assetsDir, a));
          const statB = fs.statSync(path.resolve(assetsDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        })[0];
        const bundleHash = fs.statSync(path.resolve(assetsDir, newestBundle)).mtimeMs.toString(36);
        html = html.replace(/src="\/assets\/index[^"]*"/, `src="/assets/${newestBundle}?v=${bundleHash}"`);
        const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith("index") && f.endsWith(".css"));
        if (cssFiles.length > 0) {
          const newestCss = cssFiles.sort((a, b) => {
            const statA = fs.statSync(path.resolve(assetsDir, a));
            const statB = fs.statSync(path.resolve(assetsDir, b));
            return statB.mtimeMs - statA.mtimeMs;
          })[0];
          html = html.replace(/href="\/assets\/index[^"]*\.css"/, `href="/assets/${newestCss}"`);
        }
      }
    }
    cachedHtml = html;
    console.log(`[Static] SPA HTML prepared from index.html`);
    return html;
  }

  app.use((req, res, next) => {
    const url = req.originalUrl || req.url || "";
    if (url.startsWith("/api/") || url.startsWith("/health")) {
      return next();
    }
    const hasExtension = /\.\w+$/.test(url.split("?")[0]);
    if (hasExtension) {
      return next();
    }
    const html = getSpaHtml();
    res.status(200).set({
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "X-Served-By": "curalive-spa",
    }).end(html);
  });

  app.use(express.static(distPath, {
    maxAge: "1h",
    index: false,
  }));
}
