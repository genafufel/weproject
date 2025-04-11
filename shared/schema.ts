import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Перечисление для типов уведомлений
export const notificationTypeEnum = pgEnum('notification_type', ['message', 'application', 'application_response', 'moderation_sent', 'moderation_approved', 'investment_request', 'investment_accepted']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"), // URL аватара пользователя
  userType: text("user_type").default("general").notNull(), // общий тип пользователя
  isApplicant: boolean("is_applicant").default(true), // Флаг соискателя
  isProject: boolean("is_project").default(false), // Флаг создателя проектов
  isInvestor: boolean("is_investor").default(false), // Флаг инвестора
  authType: text("auth_type").notNull(), // "email" или "phone"
  verified: boolean("verified").default(false).notNull(), // Статус верификации
  verificationCode: text("verification_code"), // Код верификации
  verificationCodeExpires: timestamp("verification_code_expires"), // Время истечения кода
  isAdmin: boolean("is_admin").default(false).notNull(), // Флаг администратора
  createdAt: timestamp("created_at").defaultNow(),
});

// Resume model
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  education: jsonb("education").notNull(),  // Array of education entries
  experience: jsonb("experience").notNull(), // Array of experience entries
  skills: jsonb("skills").notNull(),        // Array of skills
  direction: text("direction").notNull(),   // Field/direction of study
  talents: jsonb("talents"),                // Special talents or abilities
  photos: jsonb("photos"),                 // Array of photo urls
  about: text("about"),                    // О себе и интересующих проектах
  isPublic: boolean("is_public").default(true), // Флаг видимости резюме в поиске
  moderationStatus: text("moderation_status").default("pending").notNull(), // pending, approved, rejected
  moderationComment: text("moderation_comment"), // Комментарий модератора при отклонении
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Owner of the project
  title: text("title").notNull(),
  description: text("description").notNull(),
  field: text("field").notNull(), // IT, Art, Event Management, etc.
  positions: jsonb("positions").notNull(), // Array of required positions
  requirements: jsonb("requirements").notNull(), // Array of requirements
  location: text("location"),
  remote: boolean("remote").default(false),
  photos: jsonb("photos"), // Array of photo URLs
  startDate: timestamp("start_date"), // Project start date
  endDate: timestamp("end_date"), // Project end date
  // Информация о финансировании
  needsInvestment: boolean("needs_investment").default(false), // Нужно ли финансирование
  investmentAmount: numeric("investment_amount"), // Требуемая сумма инвестиций
  investmentCurrency: text("investment_currency").default("RUB"), // Валюта инвестиций
  investmentConditions: text("investment_conditions"), // Условия инвестирования
  investmentDetails: jsonb("investment_details"), // Детальная информация о инвестициях в JSON
  moderationStatus: text("moderation_status").default("pending").notNull(), // pending, approved, rejected
  moderationComment: text("moderation_comment"), // Комментарий модератора при отклонении
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application model (when an applicant applies to a project)
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(), // Applicant ID
  resumeId: integer("resume_id").notNull(), // Resume ID
  status: text("status").notNull(), // "pending", "accepted", "rejected"
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  replyToId: integer("reply_to_id"), // ID сообщения, на которое отвечают
  attachment: text("attachment"), // URL прикрепленного файла (устаревшее, оставлено для обратной совместимости)
  attachmentType: text("attachment_type"), // Тип прикрепленного файла (устаревшее)
  attachmentName: text("attachment_name"), // Оригинальное имя файла (устаревшее)
  attachments: jsonb("attachments"), // Массив вложений в JSON формате [{url, type, name}, ...]
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investment request model (когда инвестор хочет вложиться в проект)
export const investmentRequests = pgTable("investment_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  investorId: integer("investor_id").notNull(), // ID инвестора
  amount: numeric("amount"), // Предлагаемая сумма инвестиций
  currency: text("currency").default("RUB"), // Валюта инвестиций
  conditions: text("conditions"), // Предлагаемые условия инвестирования
  details: jsonb("details"), // Дополнительная информация в JSON
  status: text("status").default("pending").notNull(), // "pending", "accepted", "rejected"
  message: text("message"), // Сообщение от инвестора
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id").notNull(), // ID связанного объекта (сообщения, заявки, и т.д.)
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertResumeSchema = createInsertSchema(resumes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertApplicationSchema = createInsertSchema(applications).omit({ 
  id: true, 
  createdAt: true 
});

export const insertInvestmentRequestSchema = createInsertSchema(investmentRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type InvestmentRequest = typeof investmentRequests.$inferSelect;
export type InsertInvestmentRequest = z.infer<typeof insertInvestmentRequestSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
