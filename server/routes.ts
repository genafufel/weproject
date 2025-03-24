import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertProjectSchema, insertResumeSchema, insertApplicationSchema, insertMessageSchema } from "@shared/schema";
import { askForSMSAPIKey, sendSMS } from "./sms"; // Сервис для отправки SMS
import { askForEmailAPIKey, sendEmail } from "./email"; // Сервис для отправки email

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Resume Routes
  app.get("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    if (userId) {
      const resumes = await storage.getResumesByUserId(userId);
      res.json(resumes);
    } else if (req.user) {
      // If no userId is provided, return the current user's resumes
      const resumes = await storage.getResumesByUserId(req.user.id);
      res.json(resumes);
    } else {
      res.status(400).json({ message: "Missing userId parameter" });
    }
  });

  app.get("/api/resumes/:id", async (req, res) => {
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    res.json(resume);
  });

  app.post("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertResumeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const resume = await storage.createResume(validatedData);
      res.status(201).json(resume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to update this resume" });
    }
    
    try {
      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.json(updatedResume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/resumes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to delete this resume" });
    }
    
    const success = await storage.deleteResume(resumeId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to delete resume" });
    }
  });

  // Project Routes
  app.get("/api/projects", async (req, res) => {
    const field = req.query.field as string | undefined;
    const remote = req.query.remote !== undefined ? req.query.remote === "true" : undefined;
    const search = req.query.search as string | undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    if (userId) {
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } else {
      const projects = await storage.getProjects({ field, remote, search });
      res.json(projects);
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to update this project" });
    }
    
    try {
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to delete this project" });
    }
    
    const success = await storage.deleteProject(projectId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Application Routes
  app.get("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    
    if (projectId) {
      // First check if user owns the project
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to view these applications" });
      }
      
      const applications = await storage.getApplicationsByProjectId(projectId);
      res.json(applications);
    } else {
      // Return the current user's applications
      const applications = await storage.getApplicationsByUserId(req.user.id);
      res.json(applications);
    }
  });

  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: "pending" // Force status to be pending for new applications
      });
      
      // Check if the resume belongs to the applicant
      const resume = await storage.getResume(validatedData.resumeId);
      if (!resume || resume.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to use this resume" });
      }
      
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const applicationId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const application = await storage.getApplication(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Only the project owner can update the application status
    const project = await storage.getProject(application.projectId);
    if (!project || project.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to update this application" });
    }
    
    const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
    res.json(updatedApplication);
  });

  // Message Routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const otherUserId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    if (otherUserId) {
      // Get conversation between current user and specified user
      const conversation = await storage.getConversation(req.user.id, otherUserId);
      res.json(conversation);
    } else {
      // Get all messages for the current user
      const messages = await storage.getMessagesByUserId(req.user.id);
      res.json(messages);
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
        read: false
      });
      
      // Verify receiver exists
      const receiver = await storage.getUser(validatedData.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const messageId = parseInt(req.params.id);
    const message = await storage.getMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Only the receiver can mark a message as read
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to mark this message as read" });
    }
    
    const success = await storage.markMessageAsRead(messageId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Маршруты для верификации пользователя
  
  // Запрос на отправку кода верификации
  app.post("/api/send-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Генерируем код верификации
      const verificationCode = await storage.createVerificationCode(req.user.id);
      
      // Определяем метод отправки в зависимости от типа аутентификации пользователя
      if (req.user.authType === 'email' && req.user.email) {
        // Отправляем код по email
        const emailSent = await sendEmail(
          req.user.email,
          "Подтверждение аккаунта weproject",
          `Ваш код подтверждения: ${verificationCode}`
        );
        
        if (emailSent) {
          res.status(200).json({ message: "Код подтверждения отправлен на вашу почту" });
        } else {
          res.status(500).json({ message: "Не удалось отправить код подтверждения" });
        }
      } 
      else if (req.user.authType === 'phone' && req.user.phone) {
        // Отправляем код по SMS
        const smsSent = await sendSMS(
          req.user.phone,
          `Ваш код подтверждения weproject: ${verificationCode}`
        );
        
        if (smsSent) {
          res.status(200).json({ message: "Код подтверждения отправлен на ваш телефон" });
        } else {
          res.status(500).json({ message: "Не удалось отправить код подтверждения" });
        }
      } 
      else {
        res.status(400).json({ message: "Не указан метод для отправки кода подтверждения" });
      }
    } catch (error) {
      console.error("Ошибка при отправке кода верификации:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });
  
  // Подтверждение кода верификации
  app.post("/api/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Код подтверждения обязателен" });
    }
    
    try {
      const verified = await storage.verifyUser(req.user.id, code);
      
      if (verified) {
        // Обновляем пользователя в сессии
        const updatedUser = await storage.getUser(req.user.id);
        if (updatedUser) {
          req.login(updatedUser, (err) => {
            if (err) throw err;
            
            // Удаляем пароль из ответа
            const { password, ...userWithoutPassword } = updatedUser;
            res.status(200).json({ 
              message: "Аккаунт успешно подтвержден", 
              user: userWithoutPassword 
            });
          });
        } else {
          throw new Error("Пользователь не найден");
        }
      } else {
        res.status(400).json({ message: "Неверный код подтверждения или срок его действия истек" });
      }
    } catch (error) {
      console.error("Ошибка при проверке кода верификации:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
