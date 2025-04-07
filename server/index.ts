import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupUploads } from "./uploads";
import { storage } from "./storage";
import { setupStaticFiles } from "./static";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Запускаем миграции базы данных, если используется PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      console.log("Инициализация базы данных...");
      
      // Для NeonDB используем импортированные функции из db.ts
      const { db } = await import("./db");
      
      try {
        // Выполняем миграции
        await migrate(db, { migrationsFolder: 'migrations' });
        console.log("Миграции выполнены успешно");
      } catch (migrateError: any) {
        // Игнорируем ошибку о существующих таблицах
        if (migrateError.code === '42P07') {
          console.log("Таблицы уже существуют, пропускаем миграцию");
        } else {
          // Другие ошибки миграции выводим в консоль
          console.error("Ошибка миграции:", migrateError);
        }
      }
      
      // Вызываем метод createTestUserData в DatabaseStorage напрямую
      if (typeof storage === 'object' && 'createTestUserData' in storage) {
        // @ts-ignore
        await storage.createTestUserData();
      }
    } catch (error) {
      console.error("Ошибка при инициализации базы данных:", error);
    }
  }
  
  // Настраиваем обработку загрузок файлов
  setupUploads(app);
  
  // Настраиваем обслуживание статических файлов
  setupStaticFiles(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
