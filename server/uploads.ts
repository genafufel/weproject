import * as path from 'path';
import * as fs from 'fs-extra';
import multer from 'multer';
import { Express, Request, Response } from 'express';
import { storage } from './storage';

// Создаем директорию для загрузок в публичной папке клиента
const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');

// Убедимся, что директория существует
try {
  fs.ensureDirSync(uploadDir);
  console.log(`Директория для загрузок создана: ${uploadDir}`);
} catch (error) {
  console.error('Ошибка при создании директории для загрузок:', error);
}

// Настройка хранилища для multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Директория, куда будут загружаться файлы
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла на основе текущей даты и оригинального имени
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Фильтр файлов по типу
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Проверяем путь запроса - для сообщений разрешаем больше типов файлов
  if (req.path === '/api/upload/message-attachment') {
    // Для сообщений разрешаем изображения, документы, PDF и т.д.
    const allowedMimeTypes = [
      'image/', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedMimeTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else {
    // Для других загрузок (аватары, фото проектов) только изображения
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
};

// Настройка multer
export const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  }
});

// Функция для регистрации маршрутов загрузки файлов
export function setupUploads(app: Express) {
  // Маршрут для загрузки фотографии профиля
  app.post('/api/upload/avatar', upload.single('avatar'), async (req, res) => {
    try {
      // Получаем ID пользователя из параметров запроса или из body
      const userId = req.query.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({ message: 'ID пользователя не предоставлен' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Не удалось загрузить файл' });
      }

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Обновляем аватар пользователя в БД
      const updatedUser = await storage.updateUser(Number(userId), {
        avatar: fileUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        success: true,
        fileUrl,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      res.status(500).json({ message: 'Не удалось обработать загрузку файла', error: String(error) });
    }
  });

  // Маршрут для загрузки фотографий проекта
  app.post('/api/upload/project-photo', upload.single('photo'), async (req, res) => {
    // Убираем проверку аутентификации пока что для тестирования
    // В будущем можно будет добавить проверку через req.user или cookie сессии
    
    try {
      if (!req.file) {
        console.log('Ошибка: файл не был загружен');
        return res.status(400).json({ message: 'Не удалось загрузить файл' });
      }

      console.log('Файл успешно загружен:', req.file);

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('Сгенерирован URL:', fileUrl);

      res.json({
        success: true,
        fileUrl
      });
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      res.status(500).json({ message: 'Не удалось обработать загрузку файла', error: String(error) });
    }
  });

  // Маршрут для загрузки фотографий резюме
  app.post('/api/upload/resume-photo', upload.single('photo'), async (req, res) => {
    // Убираем проверку аутентификации пока что для тестирования
    // В будущем можно будет добавить проверку через req.user или cookie сессии
    
    try {
      if (!req.file) {
        console.log('Ошибка: файл не был загружен');
        return res.status(400).json({ message: 'Не удалось загрузить файл' });
      }

      console.log('Файл резюме успешно загружен:', req.file);

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('Сгенерирован URL:', fileUrl);

      res.json({
        success: true,
        fileUrl
      });
    } catch (error) {
      console.error('Ошибка при загрузке файла резюме:', error);
      res.status(500).json({ message: 'Не удалось обработать загрузку файла', error: String(error) });
    }
  });

  // Маршрут для загрузки прикрепляемых к сообщениям файлов (одиночных)
  app.post('/api/upload/message-attachment', upload.single('attachment'), async (req, res) => {
    try {
      if (!req.file) {
        console.log('Ошибка: файл не был загружен');
        return res.status(400).json({ message: 'Не удалось загрузить файл' });
      }

      console.log('Файл сообщения успешно загружен:', req.file);

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('Сгенерирован URL:', fileUrl);

      // Определяем тип файла
      const fileType = req.file.mimetype.startsWith('image/') 
        ? 'image' 
        : req.file.mimetype.includes('pdf') 
          ? 'pdf' 
          : req.file.mimetype.includes('word') 
            ? 'document' 
            : req.file.mimetype.includes('excel') 
              ? 'spreadsheet' 
              : 'file';

      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        fileType
      });
    } catch (error) {
      console.error('Ошибка при загрузке файла сообщения:', error);
      res.status(500).json({ message: 'Не удалось обработать загрузку файла', error: String(error) });
    }
  });
  
  // Маршрут для загрузки нескольких файлов для сообщений
  app.post('/api/upload/message-attachments', upload.array('attachments', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        console.log('Ошибка: файлы не были загружены');
        return res.status(400).json({ message: 'Не удалось загрузить файлы' });
      }

      console.log(`Успешно загружено ${req.files.length} файлов`);
      
      // Обрабатываем каждый загруженный файл
      const filesInfo = Array.isArray(req.files) ? req.files.map(file => {
        // Создаем URL для доступа к файлу
        const fileUrl = `/uploads/${file.filename}`;
        
        // Определяем тип файла
        const fileType = file.mimetype.startsWith('image/') 
          ? 'image' 
          : file.mimetype.includes('pdf') 
            ? 'pdf' 
            : file.mimetype.includes('word') 
              ? 'document' 
              : file.mimetype.includes('excel') 
                ? 'spreadsheet' 
                : 'file';
                
        return {
          url: fileUrl,
          name: file.originalname,
          type: fileType
        };
      }) : [];

      res.json({
        success: true,
        files: filesInfo
      });
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      res.status(500).json({ message: 'Не удалось обработать загрузку файлов', error: String(error) });
    }
  });

  // Vite в режиме разработки автоматически обслуживает файлы из client/public
  // В продакшене это делается через express.static в index.ts
  // Нам не нужно настраивать статический доступ к файлам
}