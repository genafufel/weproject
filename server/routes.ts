import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupAdminRoutes } from "./admin";
import { z } from "zod";
import { insertProjectSchema, insertResumeSchema, insertApplicationSchema, insertMessageSchema, insertNotificationSchema } from "@shared/schema";
import { askForSMSAPIKey, sendSMS } from "./sms"; // Сервис для отправки SMS
import { askForEmailAPIKey, sendEmail } from "./email"; // Сервис для отправки email

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Endpoint для проверки состояния аутентификации
  app.get("/api/auth-check", (req, res) => {
    console.log("Auth check request received");
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("User:", req.user);
    
    if (req.isAuthenticated()) {
      res.json({
        isAuthenticated: true,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasUser: !!req.user,
        userId: req.user?.id
      });
    } else {
      res.status(401).json({
        isAuthenticated: false,
        message: "Пользователь не аутентифицирован"
      });
    }
  });

  // Resume Routes
  // Публичный маршрут для получения всех резюме (для поиска талантов)
  app.get("/api/public/resumes", async (req, res) => {
    try {
      // Получение всех резюме для страницы талантов
      const allResumes = await storage.getAllResumes();
      
      // Отображаем все резюме без фильтрации (по запросу пользователя)
      const approvedResumes = allResumes;
    
      // Убедимся, что photos и talents всегда массивы
      const formattedResumes = approvedResumes.map(resume => {
        // Создаем копию резюме для безопасного изменения
        const formattedResume = { ...resume };
        
        // Проверяем и преобразуем photos
        if (!formattedResume.photos) {
          formattedResume.photos = [];
        } else if (!Array.isArray(formattedResume.photos)) {
          try {
            formattedResume.photos = JSON.parse(formattedResume.photos as any);
          } catch {
            formattedResume.photos = [];
          }
        }
        
        // Проверяем и преобразуем talents
        if (!formattedResume.talents) {
          formattedResume.talents = [];
        } else if (!Array.isArray(formattedResume.talents)) {
          try {
            formattedResume.talents = JSON.parse(formattedResume.talents as any);
          } catch {
            formattedResume.talents = [];
          }
        }
        
        return formattedResume;
      });
      
      res.json(formattedResumes);
    } catch (error) {
      console.error("Error fetching public resumes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/resumes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const all = req.query.all === "true";
    
    if (all) {
      try {
        // Получение всех резюме для страницы талантов
        const allResumes = await storage.getAllResumes();
        
        // Фильтрация: администраторы видят все, обычные пользователи - только одобренные
        let filteredResumes = allResumes;
        if (!req.user.isAdmin) {
          filteredResumes = allResumes.filter(resume => 
            resume.isPublic && resume.moderationStatus === 'approved'
          );
        }
      
        // Убедимся, что photos и talents всегда массивы
        const formattedResumes = filteredResumes.map(resume => {
          // Создаем копию резюме для безопасного изменения
          const formattedResume = { ...resume };
        
        // Проверяем и преобразуем photos
        if (!formattedResume.photos) {
          formattedResume.photos = [];
        } else if (!Array.isArray(formattedResume.photos)) {
          try {
            formattedResume.photos = JSON.parse(formattedResume.photos as any);
          } catch {
            formattedResume.photos = [];
          }
        }
        
        // Проверяем и преобразуем talents
        if (!formattedResume.talents) {
          formattedResume.talents = [];
        } else if (!Array.isArray(formattedResume.talents)) {
          try {
            formattedResume.talents = JSON.parse(formattedResume.talents as any);
          } catch {
            formattedResume.talents = [];
          }
        }
        
        return formattedResume;
      });
      
      res.json(formattedResumes);
      } catch (error) {
        console.error("Error fetching all resumes:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    } else if (userId) {
      // Получение резюме конкретного пользователя
      const resumes = await storage.getResumesByUserId(userId);
      
      // Форматируем резюме перед отправкой
      const formattedResumes = resumes.map(resume => {
        const formattedResume = { ...resume };
        
        // Проверяем и преобразуем photos
        if (!formattedResume.photos) {
          formattedResume.photos = [];
        } else if (!Array.isArray(formattedResume.photos)) {
          try {
            formattedResume.photos = JSON.parse(formattedResume.photos as any);
          } catch {
            formattedResume.photos = [];
          }
        }
        
        // Проверяем и преобразуем talents
        if (!formattedResume.talents) {
          formattedResume.talents = [];
        } else if (!Array.isArray(formattedResume.talents)) {
          try {
            formattedResume.talents = JSON.parse(formattedResume.talents as any);
          } catch {
            formattedResume.talents = [];
          }
        }
        
        return formattedResume;
      });
      
      res.json(formattedResumes);
    } else if (req.user) {
      // Если userId не указан, возвращаем резюме текущего пользователя
      const resumes = await storage.getResumesByUserId(req.user.id);
      
      // Форматируем резюме перед отправкой
      const formattedResumes = resumes.map(resume => {
        const formattedResume = { ...resume };
        
        // Проверяем и преобразуем photos
        if (!formattedResume.photos) {
          formattedResume.photos = [];
        } else if (!Array.isArray(formattedResume.photos)) {
          try {
            formattedResume.photos = JSON.parse(formattedResume.photos as any);
          } catch {
            formattedResume.photos = [];
          }
        }
        
        // Проверяем и преобразуем talents
        if (!formattedResume.talents) {
          formattedResume.talents = [];
        } else if (!Array.isArray(formattedResume.talents)) {
          try {
            formattedResume.talents = JSON.parse(formattedResume.talents as any);
          } catch {
            formattedResume.talents = [];
          }
        }
        
        return formattedResume;
      });
      
      res.json(formattedResumes);
    } else {
      res.status(400).json({ message: "Missing userId parameter" });
    }
  });

  // Публичный маршрут для получения конкретного резюме по ID
  app.get("/api/public/resumes/:id", async (req, res) => {
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    // Отображаем все резюме без ограничений (по запросу пользователя)
    
    // Форматируем resume перед отправкой
    const formattedResume = { ...resume };
    
    // Проверяем и преобразуем photos
    if (!formattedResume.photos) {
      formattedResume.photos = [];
    } else if (!Array.isArray(formattedResume.photos)) {
      try {
        formattedResume.photos = JSON.parse(formattedResume.photos as any);
      } catch {
        formattedResume.photos = [];
      }
    }
    
    // Проверяем и преобразуем talents
    if (!formattedResume.talents) {
      formattedResume.talents = [];
    } else if (!Array.isArray(formattedResume.talents)) {
      try {
        formattedResume.talents = JSON.parse(formattedResume.talents as any);
      } catch {
        formattedResume.talents = [];
      }
    }
    
    res.json(formattedResume);
  });

  app.get("/api/resumes/:id", async (req, res) => {
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    // Форматируем resume перед отправкой
    const formattedResume = { ...resume };
    
    // Проверяем и преобразуем photos
    if (!formattedResume.photos) {
      formattedResume.photos = [];
    } else if (!Array.isArray(formattedResume.photos)) {
      try {
        formattedResume.photos = JSON.parse(formattedResume.photos as any);
      } catch {
        formattedResume.photos = [];
      }
    }
    
    // Проверяем и преобразуем talents
    if (!formattedResume.talents) {
      formattedResume.talents = [];
    } else if (!Array.isArray(formattedResume.talents)) {
      try {
        formattedResume.talents = JSON.parse(formattedResume.talents as any);
      } catch {
        formattedResume.talents = [];
      }
    }
    
    res.json(formattedResume);
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
      // Устанавливаем статус модерации на "pending" при обновлении
      const updateData = {
        ...req.body,
        moderationStatus: 'pending',
        moderationComment: null // Сбрасываем комментарий модератора
      };
      
      const updatedResume = await storage.updateResume(resumeId, updateData);
      res.json(updatedResume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  // Добавляем PATCH маршрут для резюме для частичного обновления (используется при редактировании)
  app.patch("/api/resumes/:id", async (req, res) => {
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
      // Проверяем правильность формата для массивов
      if (req.body.talents && !Array.isArray(req.body.talents)) {
        req.body.talents = [];
      }
      
      if (req.body.photos && !Array.isArray(req.body.photos)) {
        req.body.photos = [];
      }
      
      console.log("PATCH resume data:", req.body);
      
      // Устанавливаем статус модерации на "pending" при обновлении
      const updateData = {
        ...req.body,
        moderationStatus: 'pending', // Возвращаем на модерацию при обновлении
        moderationComment: null // Сбрасываем комментарий модератора
      };
      
      const updatedResume = await storage.updateResume(resumeId, updateData);
      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  // API-эндпоинт для переключения видимости резюме
  app.patch("/api/resumes/:id/toggle-visibility", async (req, res) => {
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
      // Инвертируем текущее значение видимости
      const isPublic = resume.isPublic === false ? true : false;
      
      const updatedResume = await storage.updateResume(resumeId, { isPublic });
      res.json(updatedResume);
    } catch (error) {
      console.error("Error toggling resume visibility:", error);
      res.status(500).json({ message: "Internal server error" });
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
    // Добавляем фильтрацию по статусу модерации
    const field = req.query.field as string | undefined;
    const remote = req.query.remote !== undefined ? req.query.remote === "true" : undefined;
    const search = req.query.search as string | undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    
    try {
      if (userId) {
        const projects = await storage.getProjectsByUserId(userId);
        
        // Фильтрация проектов для обычных пользователей (не владельцев и не админов)
        let filteredProjects = projects;
        if (req.isAuthenticated()) {
          if (!req.user.isAdmin && userId !== req.user.id) {
            // Если не админ и не владелец, показываем только одобренные
            filteredProjects = projects.filter(project => project.moderationStatus === 'approved');
          }
        } else {
          // Неавторизованным пользователям только одобренные проекты
          filteredProjects = projects.filter(project => project.moderationStatus === 'approved');
        }
      
        // Форматируем проекты перед отправкой
        const formattedProjects = filteredProjects.map(project => {
        const formatted = { ...project };
        
        // Форматируем photos
        if (!formatted.photos) {
          formatted.photos = [];
        } else if (!Array.isArray(formatted.photos)) {
          try {
            formatted.photos = JSON.parse(formatted.photos as any);
          } catch {
            formatted.photos = [];
          }
        }
        
        // Форматируем positions
        if (!formatted.positions) {
          formatted.positions = [];
        } else if (!Array.isArray(formatted.positions)) {
          try {
            formatted.positions = JSON.parse(formatted.positions as any);
          } catch {
            formatted.positions = [];
          }
        }
        
        // Форматируем requirements
        if (!formatted.requirements) {
          formatted.requirements = [];
        } else if (!Array.isArray(formatted.requirements)) {
          try {
            formatted.requirements = JSON.parse(formatted.requirements as any);
          } catch {
            formatted.requirements = [];
          }
        }
        
        return formatted;
      });
      
      res.json(formattedProjects);
    } else {
      const projects = await storage.getProjects({ field, remote, search, dateFrom, dateTo });
      
      // Фильтрация для неадминов - только одобренные проекты
      let filteredProjects = projects;
      if (req.isAuthenticated()) {
        if (!req.user.isAdmin) {
          // Не админам показываем только одобренные проекты других пользователей
          // и все свои проекты (в любом статусе модерации)
          filteredProjects = projects.filter(project => 
            project.moderationStatus === 'approved' || project.userId === req.user.id
          );
        }
      } else {
        // Неавторизованным пользователям только одобренные проекты
        filteredProjects = projects.filter(project => project.moderationStatus === 'approved');
      }
      
      // Форматируем проекты перед отправкой
      const formattedProjects = filteredProjects.map(project => {
        const formatted = { ...project };
        
        // Форматируем photos
        if (!formatted.photos) {
          formatted.photos = [];
        } else if (!Array.isArray(formatted.photos)) {
          try {
            formatted.photos = JSON.parse(formatted.photos as any);
          } catch {
            formatted.photos = [];
          }
        }
        
        // Форматируем positions
        if (!formatted.positions) {
          formatted.positions = [];
        } else if (!Array.isArray(formatted.positions)) {
          try {
            formatted.positions = JSON.parse(formatted.positions as any);
          } catch {
            formatted.positions = [];
          }
        }
        
        // Форматируем requirements
        if (!formatted.requirements) {
          formatted.requirements = [];
        } else if (!Array.isArray(formatted.requirements)) {
          try {
            formatted.requirements = JSON.parse(formatted.requirements as any);
          } catch {
            formatted.requirements = [];
          }
        }
        
        return formatted;
      });
      
      res.json(formattedProjects);
    }
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Проверяем, доступен ли проект для просмотра
    const isOwner = req.isAuthenticated() && req.user.id === project.userId;
    const isAdmin = req.isAuthenticated() && req.user.isAdmin;
    
    // Если это не владелец и не админ, проверяем модерацию
    if (!isOwner && !isAdmin && project.moderationStatus !== 'approved') {
      return res.status(403).json({ 
        message: "This project is under moderation or has been rejected."
      });
    }
    
    // Форматируем проект перед отправкой
    const formattedProject = { ...project };
    
    // Проверяем и преобразуем photos
    if (!formattedProject.photos) {
      formattedProject.photos = [];
    } else if (!Array.isArray(formattedProject.photos)) {
      try {
        formattedProject.photos = JSON.parse(formattedProject.photos as any);
      } catch {
        formattedProject.photos = [];
      }
    }
    
    // Проверяем и преобразуем positions
    if (!formattedProject.positions) {
      formattedProject.positions = [];
    } else if (!Array.isArray(formattedProject.positions)) {
      try {
        formattedProject.positions = JSON.parse(formattedProject.positions as any);
      } catch {
        formattedProject.positions = [];
      }
    }
    
    // Проверяем и преобразуем requirements
    if (!formattedProject.requirements) {
      formattedProject.requirements = [];
    } else if (!Array.isArray(formattedProject.requirements)) {
      try {
        formattedProject.requirements = JSON.parse(formattedProject.requirements as any);
      } catch {
        formattedProject.requirements = [];
      }
    }
    
    res.json(formattedProject);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Предварительно обрабатываем даты, преобразуя строки в объекты Date
      const projectData = {
        ...req.body,
        userId: req.user.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      // Валидируем данные с помощью Zod схемы
      const validatedData = insertProjectSchema.parse(projectData);
      
      // Создаем проект через хранилище
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
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
      // Предварительно обрабатываем даты, преобразуя строки в объекты Date
      const projectData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        moderationStatus: 'pending', // Возвращаем на модерацию при обновлении
        moderationComment: null // Сбрасываем комментарий модератора
      };
      
      const updatedProject = await storage.updateProject(projectId, projectData);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
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
    // Проверка авторизации не требуется для запросов проверки существования заявок
    // if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const mode = req.query.mode as string | undefined;
    
    if (projectId && userId) {
      // Checking if user has applied to a specific project
      // This is used on project detail page to check if current user has already applied
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Пользователь не аутентифицирован - возвращаем пустой массив
      if (!req.isAuthenticated()) {
        return res.json([]);
      }
      
      // Get all applications by the user
      const userApps = await storage.getApplicationsByUserId(userId);
      // Filter only applications for the specified project
      const projectApplications = userApps.filter(app => app.projectId === projectId);
      res.json(projectApplications);
    } else if (projectId) {
      // Проверяем авторизацию для других запросов
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      // First check if user owns the project
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to view these applications" });
      }
      
      const applications = await storage.getApplicationsByProjectId(projectId);
      res.json(applications);
    } else if (mode === 'received') {
      // Проверяем авторизацию 
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      // Get applications for projects owned by current user (user is the project owner)
      const userProjects = await storage.getProjectsByUserId(req.user!.id);
      const projectIds = userProjects.map(project => project.id);
      
      let receivedApplications: any[] = [];
      for (const id of projectIds) {
        const projectApplications = await storage.getApplicationsByProjectId(id);
        receivedApplications = [...receivedApplications, ...projectApplications];
      }
      
      // Обогащаем данные заявок информацией о пользователях и их резюме
      const enrichedApplications = await Promise.all(receivedApplications.map(async (app) => {
        // Получаем данные пользователя
        const user = await storage.getUser(app.userId);
        
        // Получаем данные резюме
        const resume = await storage.getResume(app.resumeId);
        
        // Возвращаем обогащенную заявку
        return {
          ...app,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone
          } : null,
          resume: resume || null
        };
      }));
      
      res.json(enrichedApplications);
    } else if (mode === 'sent') {
      // Проверяем авторизацию
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      // Return the current user's applications (applications they've sent)
      const applications = await storage.getApplicationsByUserId(req.user!.id);
      
      // Обогащаем данные заявок информацией о проектах и резюме
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        // Получаем данные проекта
        const project = await storage.getProject(app.projectId);
        
        // Получаем данные резюме
        const resume = await storage.getResume(app.resumeId);
        
        // Возвращаем обогащенную заявку
        return {
          ...app,
          project: project || null,
          resume: resume || null
        };
      }));
      
      res.json(enrichedApplications);
    } else {
      // Проверяем авторизацию для других запросов
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      // Return the current user's applications
      const applications = await storage.getApplicationsByUserId(req.user!.id);
      
      // Обогащаем данные заявок информацией о проектах и резюме
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        // Получаем данные проекта
        const project = await storage.getProject(app.projectId);
        
        // Получаем данные резюме
        const resume = await storage.getResume(app.resumeId);
        
        // Возвращаем обогащенную заявку
        return {
          ...app,
          project: project || null,
          resume: resume || null
        };
      }));
      
      res.json(enrichedApplications);
    }
  });

  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user!.id,
        status: "pending" // Force status to be pending for new applications
      });
      
      // Check if the resume belongs to the applicant
      const resume = await storage.getResume(validatedData.resumeId);
      if (!resume || resume.userId !== req.user!.id) {
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
    if (!project || project.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to update this application" });
    }
    
    const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
    res.json(updatedApplication);
  });

  // Message Routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const otherUserId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const requestType = req.query.type || 'all'; // Добавляем дополнительный параметр для стабильности запросов
    
    if (otherUserId) {
      // Get conversation between current user and specified user
      const conversation = await storage.getConversation(req.user!.id, otherUserId);
      
      // Автоматически помечаем сообщения как прочитанные
      for (const message of conversation) {
        if (message.receiverId === req.user!.id && !message.read) {
          await storage.markMessageAsRead(message.id);
        }
      }
      
      res.json(conversation);
    } else if (requestType === 'contacts') {
      // Возвращаем только список контактов
      const messages = await storage.getMessagesByUserId(req.user!.id);
      res.json(messages);
    } else {
      // Get all messages for the current user
      const messages = await storage.getMessagesByUserId(req.user!.id);
      res.json(messages);
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
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
    if (message.receiverId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden: You don't have permission to mark this message as read" });
    }
    
    const success = await storage.markMessageAsRead(messageId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  // Эндпоинт для получения списка контактов пользователя
  app.get("/api/messages/contacts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Получаем все сообщения текущего пользователя
    const userMessages = await storage.getMessagesByUserId(req.user!.id);
    
    // Извлекаем уникальные ID контактов
    const contactIdsSet = new Set<number>();
    
    userMessages.forEach(message => {
      if (message.senderId !== req.user!.id) {
        contactIdsSet.add(message.senderId);
      }
      if (message.receiverId !== req.user!.id) {
        contactIdsSet.add(message.receiverId);
      }
    });
    
    // Убираем ID самого пользователя, если он есть в списке
    contactIdsSet.delete(req.user!.id);
    
    // Преобразуем Set в массив
    const contactIds = Array.from(contactIdsSet);
    
    // Список контактов с данными
    const contactsList = [];
    
    // Для каждого ID получаем информацию о пользователе и последнем сообщении
    for (const contactId of contactIds) {
      const contactUser = await storage.getUser(contactId);
      
      if (!contactUser) continue;
      
      // Находим сообщения между текущим пользователем и контактом
      const conversationMessages = userMessages.filter(msg => 
        (msg.senderId === req.user!.id && msg.receiverId === contactId) || 
        (msg.senderId === contactId && msg.receiverId === req.user!.id)
      );
      
      // Если сообщений нет, пропускаем
      if (conversationMessages.length === 0) continue;
      
      // Сортируем по времени создания (от нового к старому)
      conversationMessages.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      // Берём последнее сообщение
      const lastMessage = conversationMessages[0];
      
      // Считаем непрочитанные сообщения (только те, где пользователь - получатель)
      const unreadCount = conversationMessages.filter(msg => 
        msg.receiverId === req.user!.id && msg.senderId === contactId && !msg.read
      ).length;
      
      // Формируем контакт
      const contact = {
        id: contactId,
        fullName: contactUser.fullName,
        avatar: contactUser.avatar,
        lastMessage: lastMessage.content || "",
        lastMessageTime: lastMessage.createdAt,
        unread: unreadCount,
      };
      
      contactsList.push(contact);
    }
    
    // Сортируем контакты по времени последнего сообщения (от нового к старому)
    contactsList.sort((a, b) => {
      const dateA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date();
      const dateB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
    
    res.json(contactsList);
  });

  // Маршруты для верификации пользователя
  
  // Запрос на отправку кода верификации
  app.post("/api/send-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      // Генерируем код верификации
      const verificationCode = await storage.createVerificationCode(req.user!.id);
      
      // Определяем метод отправки в зависимости от типа аутентификации пользователя
      if (req.user!.authType === 'email' && req.user!.email) {
        // Отправляем код по email
        const emailSent = await sendEmail(
          req.user!.email,
          "Подтверждение аккаунта weproject",
          `Ваш код подтверждения: ${verificationCode}`
        );
        
        if (emailSent) {
          res.status(200).json({ message: "Код подтверждения отправлен на вашу почту" });
        } else {
          res.status(500).json({ message: "Не удалось отправить код подтверждения" });
        }
      } 
      else if (req.user!.authType === 'phone' && req.user!.phone) {
        // Отправляем код по SMS
        const smsSent = await sendSMS(
          req.user!.phone,
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
      const verified = await storage.verifyUser(req.user!.id, code);
      
      if (verified) {
        // Обновляем пользователя в сессии
        const updatedUser = await storage.getUser(req.user!.id);
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
  
  // Маршрут для обновления профиля пользователя
  app.patch("/api/user/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const userId = parseInt(req.params.id);
    
    // Проверяем, имеет ли пользователь право обновлять этот профиль
    if (userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden: Вы не можете редактировать чужой профиль" });
    }
    
    try {
      // Разрешаем обновлять только определенные поля профиля
      const allowedFields = ['fullName', 'email', 'phone', 'avatar'];
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );
      
      // Обновляем данные пользователя
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      // Обновляем пользователя в сессии
      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Ошибка при обновлении пользователя в сессии:", err);
          return res.status(500).json({ message: "Внутренняя ошибка сервера" });
        }
        
        // Удаляем пароль из ответа
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  });
  
  // User Routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Не отправляем пароль и другие чувствительные данные
    const { password, verificationCode, ...userData } = user;
    
    res.json(userData);
  });

  // Notifications Routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/notifications/unread/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const notificationId = parseInt(req.params.id);
    
    try {
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't have permission to mark this notification as read" });
      }
      
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to mark notification as read" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const success = await storage.markAllNotificationsAsRead(req.user.id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: "No unread notifications found" });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Подключаем административные маршруты
  setupAdminRoutes(app);
  
  const httpServer = createServer(app);
  return httpServer;
}
