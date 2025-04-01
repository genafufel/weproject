import express, { Express } from 'express';
import path from 'path';

// Функция для настройки статических файлов
export function setupStaticFiles(app: Express) {
  // Настраиваем обслуживание статических файлов из директории загрузок
  const uploadsPath = path.join(process.cwd(), 'client', 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  console.log(`Настроено обслуживание статических файлов из ${uploadsPath}`);
}