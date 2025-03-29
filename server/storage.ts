import { users, type User, type InsertUser, resumes, type Resume, type InsertResume, projects, type Project, type InsertProject, applications, type Application, type InsertApplication, messages, type Message, type InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByVerificationCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Verification operations
  createVerificationCode(userId: number): Promise<string>;
  verifyUser(userId: number, code: string): Promise<boolean>;
  
  // Resume operations
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resume: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(filters?: {
    field?: string;
    remote?: boolean;
    search?: string;
  }): Promise<Project[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByProjectId(projectId: number): Promise<Application[]>;
  getApplicationsByUserId(userId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private projects: Map<number, Project>;
  private applications: Map<number, Application>;
  private messages: Map<number, Message>;
  
  sessionStore: any;
  
  currentUserId: number;
  currentResumeId: number;
  currentProjectId: number;
  currentApplicationId: number;
  currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.projects = new Map();
    this.applications = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentResumeId = 1;
    this.currentProjectId = 1;
    this.currentApplicationId = 1;
    this.currentMessageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Создаем тестового пользователя при инициализации
    this.createTestUserData();
  }
  
  // Метод для создания тестовых данных
  private async createTestUserData() {
    try {
      // Проверяем, существует ли уже пользователь с именем "test"
      const existingUser = await this.getUserByUsername("test");
      if (existingUser) {
        console.log("Тестовый пользователь уже существует:", existingUser.username);
        return;
      }
      
      // Создаем тестового пользователя
      const hashedPassword = await hashPassword("test");
      const testUser: InsertUser = {
        fullName: "Тестовый Пользователь",
        username: "test",
        password: hashedPassword,
        email: "test@example.com",
        phone: "+7 (900) 123-4567",
        authType: "email", // Добавляем обязательное поле authType
        userType: "general",
        bio: "Тестовая учетная запись для разработки",
        verified: true
      };
      
      const user = await this.createUser(testUser);
      console.log("Создан тестовый пользователь:", user.username);
      console.log("Логин: test");
      console.log("Пароль: test");
      
      // Создаем тестовое резюме
      const testResume: InsertResume = {
        userId: user.id,
        title: "Full Stack Разработчик",
        direction: "Computer Science",
        skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express"],
        experience: [
          {
            position: "Junior Developer",
            company: "Tech Solutions",
            startDate: "2022-01-01",
            endDate: "2023-01-01",
            description: "Разработка и поддержка веб-приложений"
          }
        ],
        education: [
          {
            institution: "Технический Университет",
            degree: "Бакалавр",
            fieldOfStudy: "Компьютерные науки",
            startDate: "2018-09-01",
            endDate: "2022-06-01"
          }
        ],
        talents: {}
      };
      
      const resume = await this.createResume(testResume);
      console.log("Создано тестовое резюме:", resume.title);
      
      // Создаем тестовый проект
      const testProject: InsertProject = {
        userId: user.id,
        title: "Маркетплейс услуг",
        description: "Платформа для поиска и предложения услуг фрилансеров",
        field: "Information Technology",
        positions: [
          {
            title: "UX/UI Дизайнер",
            description: "Разработка интерфейса и пользовательского опыта",
            requirements: ["Figma", "Adobe XD", "UI/UX", "Прототипирование"]
          },
          {
            title: "Frontend Разработчик",
            description: "Реализация пользовательского интерфейса",
            requirements: ["React", "TypeScript", "CSS", "Responsive Design"]
          }
        ],
        requirements: ["Опыт работы с веб-технологиями", "Ответственность", "Работа в команде"],
        location: "Москва (удаленно)",
        remote: true
      };
      
      const project = await this.createProject(testProject);
      console.log("Создан тестовый проект:", project.title);
    } catch (error) {
      console.error("Ошибка при создании тестовых данных:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Проверяем, является ли username именем пользователя, email или телефоном
    return Array.from(this.users.values()).find(
      (user) => 
        user.username === username || 
        user.email === username || 
        user.phone === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }
  
  async getUserByVerificationCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationCode === code && 
      user.verificationCodeExpires && 
      user.verificationCodeExpires > new Date()
    );
  }
  
  async createVerificationCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("Пользователь не найден");
    
    // Генерируем случайный 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Устанавливаем срок действия кода (1 час)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    // Обновляем пользователя
    await this.updateUser(userId, {
      verificationCode: code,
      verificationCodeExpires: expires
    });
    
    return code;
  }
  
  async verifyUser(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Проверяем, что код совпадает и не истек
    if (
      user.verificationCode === code && 
      user.verificationCodeExpires && 
      user.verificationCodeExpires > new Date()
    ) {
      // Помечаем пользователя как верифицированного и очищаем код
      await this.updateUser(userId, {
        verified: true,
        verificationCode: null,
        verificationCodeExpires: null
      });
      return true;
    }
    
    return false;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      bio: insertUser.bio ?? null,
      avatar: insertUser.avatar ?? null,
      userType: insertUser.userType ?? "general", // Устанавливаем значение по умолчанию для userType
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      verified: true, // Временно устанавливаем verified = true, чтобы не требовалась верификация
      verificationCode: null,
      verificationCodeExpires: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updateData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Resume operations
  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }
  
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId,
    );
  }
  
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const now = new Date();
    const resume: Resume = { 
      ...insertResume, 
      id, 
      createdAt: now, 
      updatedAt: now,
      talents: insertResume.talents || ({} as any)
    };
    this.resumes.set(id, resume);
    return resume;
  }
  
  async updateResume(id: number, updateData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = await this.getResume(id);
    if (!resume) return undefined;
    
    const now = new Date();
    const updatedResume = { ...resume, ...updateData, updatedAt: now };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }
  
  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjects(filters?: {
    field?: string;
    remote?: boolean;
    search?: string;
  }): Promise<Project[]> {
    let projects = Array.from(this.projects.values());
    
    if (filters) {
      if (filters.field) {
        projects = projects.filter(project => project.field === filters.field);
      }
      
      if (filters.remote !== undefined) {
        projects = projects.filter(project => project.remote === filters.remote);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        projects = projects.filter(project => 
          project.title.toLowerCase().includes(searchLower) || 
          project.description.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return projects;
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now, 
      updatedAt: now,
      location: insertProject.location ?? null,
      remote: insertProject.remote ?? null
    };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: number, updateData: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const now = new Date();
    const updatedProject = { ...project, ...updateData, updatedAt: now };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getApplicationsByProjectId(projectId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.projectId === projectId,
    );
  }
  
  async getApplicationsByUserId(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === userId,
    );
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const now = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      createdAt: now,
      message: insertApplication.message ?? null
    };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId,
    );
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
    ).sort((a, b) => {
      // Проверки на null, чтобы избежать ошибок
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeA - timeB;
    });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: now,
      read: insertMessage.read ?? false
    };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;
    
    message.read = true;
    this.messages.set(id, message);
    return true;
  }
}

export const storage = new MemStorage();
