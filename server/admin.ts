import { Request, Response, NextFunction, Express } from "express";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { applications, messages, projects, resumes, users } from "@shared/schema";
import { db } from "./db";

// Middleware для проверки прав админа
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin rights required" });
  }
  
  next();
}

export function setupAdminRoutes(app: Express) {
  // Получение всех пользователей (для администратора)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        fullName: users.fullName,
        userType: users.userType,
        authType: users.authType,
        verified: users.verified,
        createdAt: users.createdAt,
        bio: users.bio,
        avatar: users.avatar,
        isAdmin: users.isAdmin
      }).from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Редактирование пользователя (для администратора)
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const { password, ...updateData } = req.body;
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Не возвращаем конфиденциальные данные
      const { password: pwd, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Удаление пользователя (для администратора)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // Проверяем, существует ли пользователь
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Удаляем все связанные данные (резюме, проекты, заявки, сообщения)
      await db.delete(resumes).where(eq(resumes.userId, userId));
      await db.delete(projects).where(eq(projects.userId, userId));
      await db.delete(applications).where(eq(applications.userId, userId));
      await db.delete(messages).where(eq(messages.senderId, userId));
      await db.delete(messages).where(eq(messages.receiverId, userId));
      
      // Удаляем пользователя
      await db.delete(users).where(eq(users.id, userId));
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Получение всех проектов (для администратора)
  app.get("/api/admin/projects", requireAdmin, async (req, res) => {
    try {
      const allProjects = await db.select().from(projects);
      res.json(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Редактирование проекта (для администратора)
  app.put("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    try {
      const updatedProject = await storage.updateProject(projectId, req.body);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Удаление проекта (для администратора)
  app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    try {
      // Удаляем все связанные заявки
      await db.delete(applications).where(eq(applications.projectId, projectId));
      
      // Удаляем проект
      const success = await storage.deleteProject(projectId);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Получение всех резюме (для администратора)
  app.get("/api/admin/resumes", requireAdmin, async (req, res) => {
    try {
      const allResumes = await db.select().from(resumes);
      res.json(allResumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Редактирование резюме (для администратора)
  app.put("/api/admin/resumes/:id", requireAdmin, async (req, res) => {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }
    
    try {
      const updatedResume = await storage.updateResume(resumeId, req.body);
      
      if (!updatedResume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json(updatedResume);
    } catch (error) {
      console.error("Error updating resume:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Удаление резюме (для администратора)
  app.delete("/api/admin/resumes/:id", requireAdmin, async (req, res) => {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }
    
    try {
      // Удаляем все связанные заявки
      await db.delete(applications).where(eq(applications.resumeId, resumeId));
      
      // Удаляем резюме
      const success = await storage.deleteResume(resumeId);
      
      if (!success) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.status(200).json({ message: "Resume deleted successfully" });
    } catch (error) {
      console.error("Error deleting resume:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Получение всех заявок (для администратора)
  app.get("/api/admin/applications", requireAdmin, async (req, res) => {
    try {
      const allApplications = await db.select().from(applications);
      res.json(allApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Редактирование статуса заявки (для администратора)
  app.put("/api/admin/applications/:id", requireAdmin, async (req, res) => {
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    
    try {
      if (!req.body.status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(
        applicationId, 
        req.body.status
      );
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Удаление заявки (для администратора)
  app.delete("/api/admin/applications/:id", requireAdmin, async (req, res) => {
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    
    try {
      await db.delete(applications).where(eq(applications.id, applicationId));
      res.status(200).json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Получение всех сообщений (для администратора)
  app.get("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const allMessages = await db.select().from(messages);
      res.json(allMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Удаление сообщения (для администратора)
  app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    const messageId = parseInt(req.params.id);
    
    if (isNaN(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }
    
    try {
      await db.delete(messages).where(eq(messages.id, messageId));
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Получение статистики по платформе
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const usersCount = await db.select({ count: users.id }).from(users);
      const projectsCount = await db.select({ count: projects.id }).from(projects);
      const resumesCount = await db.select({ count: resumes.id }).from(resumes);
      const applicationsCount = await db.select({ count: applications.id }).from(applications);
      const messagesCount = await db.select({ count: messages.id }).from(messages);
      
      // Пользователи по типу аутентификации
      const usersByAuthType = await db
        .select({ 
          authType: users.authType,
          count: users.id
        })
        .from(users)
        .groupBy(users.authType);
      
      // Проекты по области
      const projectsByField = await db
        .select({ 
          field: projects.field,
          count: projects.id
        })
        .from(projects)
        .groupBy(projects.field);
      
      // Заявки по статусу
      const applicationsByStatus = await db
        .select({ 
          status: applications.status,
          count: applications.id
        })
        .from(applications)
        .groupBy(applications.status);
      
      res.json({
        counts: {
          users: usersCount[0]?.count || 0,
          projects: projectsCount[0]?.count || 0,
          resumes: resumesCount[0]?.count || 0,
          applications: applicationsCount[0]?.count || 0,
          messages: messagesCount[0]?.count || 0
        },
        usersByAuthType,
        projectsByField,
        applicationsByStatus
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}