import { Request, Response, NextFunction, Express } from "express";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { applications, messages, projects, resumes, users } from "@shared/schema";
import { db } from "./db";

// Константы для статусов модерации
export const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

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
  
  // Модерация проекта
  app.put("/api/admin/projects/:id/moderate", requireAdmin, async (req, res) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    try {
      const { status, comment } = req.body;
      
      if (!status || !Object.values(MODERATION_STATUS).includes(status)) {
        return res.status(400).json({ 
          message: `Status must be one of: ${Object.values(MODERATION_STATUS).join(', ')}` 
        });
      }
      
      // Обновляем проект со статусом модерации
      const [updatedProject] = await db
        .update(projects)
        .set({ 
          moderationStatus: status,
          moderationComment: comment || null,
          updatedAt: new Date()
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error moderating project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Получение проектов для модерации
  app.get("/api/admin/moderation/projects", requireAdmin, async (req, res) => {
    try {
      const pendingProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.moderationStatus, MODERATION_STATUS.PENDING));
        
      res.json(pendingProjects);
    } catch (error) {
      console.error("Error fetching projects for moderation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Модерация резюме
  app.put("/api/admin/resumes/:id/moderate", requireAdmin, async (req, res) => {
    const resumeId = parseInt(req.params.id);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }
    
    try {
      const { status, comment } = req.body;
      
      if (!status || !Object.values(MODERATION_STATUS).includes(status)) {
        return res.status(400).json({ 
          message: `Status must be one of: ${Object.values(MODERATION_STATUS).join(', ')}` 
        });
      }
      
      // Обновляем резюме со статусом модерации
      const [updatedResume] = await db
        .update(resumes)
        .set({ 
          moderationStatus: status,
          moderationComment: comment || null,
          updatedAt: new Date()
        })
        .where(eq(resumes.id, resumeId))
        .returning();
      
      if (!updatedResume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json(updatedResume);
    } catch (error) {
      console.error("Error moderating resume:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Получение резюме для модерации
  app.get("/api/admin/moderation/resumes", requireAdmin, async (req, res) => {
    try {
      const pendingResumes = await db
        .select()
        .from(resumes)
        .where(eq(resumes.moderationStatus, MODERATION_STATUS.PENDING));
        
      res.json(pendingResumes);
    } catch (error) {
      console.error("Error fetching resumes for moderation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Получение статистики по платформе
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      // Используем SQL-запросы напрямую, чтобы избежать проблем с группировкой
      // Импортируем пул подключений из серверного модуля db.ts
      const { pool } = await import('./db');
      const client = await pool.connect();
      
      try {
        // Получаем количество записей
        const countResult = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM users) as users_count,
            (SELECT COUNT(*) FROM projects) as projects_count,
            (SELECT COUNT(*) FROM resumes) as resumes_count,
            (SELECT COUNT(*) FROM applications) as applications_count,
            (SELECT COUNT(*) FROM messages) as messages_count
        `);
        
        // Пользователи по типу аутентификации
        const usersByAuthTypeResult = await client.query(`
          SELECT auth_type, COUNT(*) as count
          FROM users
          GROUP BY auth_type
        `);
        
        // Проекты по области
        const projectsByFieldResult = await client.query(`
          SELECT field, COUNT(*) as count
          FROM projects
          GROUP BY field
        `);
        
        // Заявки по статусу
        const applicationsByStatusResult = await client.query(`
          SELECT status, COUNT(*) as count
          FROM applications
          GROUP BY status
        `);
        
        const counts = countResult.rows[0];
        
        res.json({
          counts: {
            users: Number(counts.users_count) || 0,
            projects: Number(counts.projects_count) || 0,
            resumes: Number(counts.resumes_count) || 0,
            applications: Number(counts.applications_count) || 0,
            messages: Number(counts.messages_count) || 0
          },
          usersByAuthType: usersByAuthTypeResult.rows.map(item => ({
            authType: item.auth_type,  // Используем snake_case как в базе данных
            count: Number(item.count)
          })),
          projectsByField: projectsByFieldResult.rows.map(item => ({
            field: item.field,
            count: Number(item.count)
          })),
          applicationsByStatus: applicationsByStatusResult.rows.map(item => ({
            status: item.status,
            count: Number(item.count)
          }))
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}