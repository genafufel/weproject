import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { sendEmail } from "./email";
import { sendSMS } from "./sms";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // Проверяем, содержит ли хеш соль (разделитель точка)
  if (stored.includes(".")) {
    // Старый формат с солью
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } else {
    // Простой SHA-256 хеш без соли (для тестового пользователя)
    const hashedSupplied = createHash('sha256').update(supplied).digest('hex');
    return hashedSupplied === stored;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "startup-match-secret-key",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Отключаем secure для разработки
      path: "/"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Имя пользователя уже существует" });
      }
      
      // Проверяем тип авторизации
      if (req.body.authType === 'email') {
        // Проверка, существует ли уже такой email
        if (!req.body.email) {
          return res.status(400).json({ message: "Email обязателен для этого типа регистрации" });
        }
        
        const existingUserByEmail = await storage.getUserByEmail(req.body.email);
        if (existingUserByEmail) {
          return res.status(400).json({ message: "Email уже используется" });
        }
      } 
      else if (req.body.authType === 'phone') {
        // Проверка, существует ли уже такой телефон
        if (!req.body.phone) {
          return res.status(400).json({ message: "Номер телефона обязателен для этого типа регистрации" });
        }
        
        // Проверка, существует ли пользователь с таким же телефоном
        const existingUserByPhone = await storage.getUserByPhone(req.body.phone);
        if (existingUserByPhone) {
          return res.status(400).json({ message: "Номер телефона уже используется" });
        }
      }
      else {
        return res.status(400).json({ message: "Некорректный тип аутентификации" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // После создания пользователя генерируем код верификации
      let verificationSent = false;
      let verificationMessage = "";
      
      try {
        const verificationCode = await storage.createVerificationCode(user.id);
        
        // Отправляем код в зависимости от метода аутентификации
        if (user.authType === 'email' && user.email) {
          const emailSent = await sendEmail(
            user.email,
            "Подтверждение аккаунта weproject",
            `Ваш код подтверждения: ${verificationCode}`
          );
          
          verificationSent = emailSent;
          verificationMessage = emailSent 
            ? "Код подтверждения отправлен на вашу почту"
            : "Не удалось отправить код подтверждения на почту";
        } 
        else if (user.authType === 'phone' && user.phone) {
          const smsSent = await sendSMS(
            user.phone,
            `Ваш код подтверждения weproject: ${verificationCode}`
          );
          
          verificationSent = smsSent;
          verificationMessage = smsSent 
            ? "Код подтверждения отправлен на ваш телефон"
            : "Не удалось отправить код подтверждения на телефон";
        }
      } catch (error) {
        console.error("Ошибка при отправке кода верификации:", error);
      }

      // Remove password from the response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        
        res.status(201).json({
          ...userWithoutPassword,
          verificationSent,
          verificationMessage
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Проверка, является ли пользователь администратором
  app.get("/api/check-admin", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Проверяем флаг администратора
    const isAdmin = req.user.isAdmin === true;
    res.json({ isAdmin });
  });
  
  // Получение пользователя по ID
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Не возвращаем конфиденциальные данные
      const { password, verificationCode, verificationCodeExpires, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
