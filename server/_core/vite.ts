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

      // always reload the index.html file from disk incase it changes
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
  }

  app.use(express.static(distPath, { maxAge: 0 }));

  app.use("*", (_req, res, next) => {
    const url = _req.originalUrl || _req.url || "";
    if (url.startsWith("/api/") || url.startsWith("/health")) {
      return next();
    }
    const indexPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(indexPath, "utf-8");

    const assetsDir = path.resolve(distPath, "assets");
    if (fs.existsSync(assetsDir)) {
      const jsFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith("index") && f.endsWith(".js"));
      if (jsFiles.length > 0) {
        const newestBundle = jsFiles.sort((a, b) => {
          const statA = fs.statSync(path.resolve(assetsDir, a));
          const statB = fs.statSync(path.resolve(assetsDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        })[0];
        html = html.replace(/src="\/assets\/index[^"]*\.js"/, `src="/assets/${newestBundle}"`);
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

    res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(html);
  });
}
