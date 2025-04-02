import { users, type User, type InsertUser, resumes, type Resume, type InsertResume, projects, type Project, type InsertProject, applications, type Application, type InsertApplication, messages, type Message, type InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { hashPassword } from "./auth";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, or, like, gte, lte, desc } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  getAllResumes(): Promise<Resume[]>; // Изменён на асинхронный
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
  
  // Initialize database
  initializeDatabase?(): Promise<void>;
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
        avatar: "/uploads/default-avatar-test.jpg",
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
        about: "Интересуюсь проектами в сфере веб-разработки и мобильных приложений. Готов участвовать в стартапах и инновационных проектах. Могу работать в команде как в роли фронтенд, так и бэкенд разработчика. Особенно интересны проекты с социальной значимостью или образовательной направленностью.",
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
        talents: ["Быстрое обучение", "Работа в команде", "Аналитическое мышление"],
        photos: [
          "/uploads/1743276601069-411472408.jpg",
          "/uploads/1743276682526-89808290.jpg",
          "/uploads/1743276867066-38007089.jpg"
        ]
      };
      
      const resume = await this.createResume(testResume);
      console.log("Создано тестовое резюме:", resume.title);
      
      // Создаем тестовый проект
      const testProject: InsertProject = {
        userId: user.id,
        title: "Маркетплейс услуг",
        description: "Платформа для поиска и предложения услуг фрилансеров",
        field: "Information Technology",
        positions: ["UX/UI Дизайнер", "Frontend Разработчик", "Backend Разработчик", "Менеджер проекта"],
        requirements: ["Опыт работы с веб-технологиями", "Ответственность", "Работа в команде", "Креативное мышление", "Проактивность"],
        location: "Москва (удаленно)",
        remote: true,
        photos: [
          "/uploads/1743277298100-741379550.jpg",
          "/uploads/1743277736075-995932721.jpg", 
          "/uploads/1743278401529-839292048.jpg",
          "/uploads/1743335315183-472036694.jpg",
          "/uploads/1743335489304-511313737.jpg"
        ],
        startDate: new Date("2023-04-01"),
        endDate: new Date("2023-08-31")
      };
      
      const project = await this.createProject(testProject);
      console.log("Создан тестовый проект:", project.title);
      
      // Дополнительные тестовые пользователи и их резюме
      
      // Пользователь 2: Дизайнер
      const designerUser: InsertUser = {
        fullName: "Анна Дизайнер",
        username: "designer",
        password: hashedPassword, // используем тот же пароль для простоты
        email: "designer@example.com",
        phone: "+7 (900) 555-1234",
        authType: "email",
        userType: "general",
        bio: "Опытный UX/UI дизайнер с портфолио",
        avatar: "/uploads/default-avatar-designer.jpg",
        verified: true
      };
      
      const designer = await this.createUser(designerUser);
      
      const designerResume: InsertResume = {
        userId: designer.id,
        title: "UX/UI Дизайнер",
        direction: "Graphic Design",
        skills: ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "Прототипирование"],
        experience: [
          {
            position: "UX/UI Дизайнер",
            company: "Креативное Агентство",
            startDate: "2020-03-01",
            endDate: "2023-02-01",
            description: "Создание пользовательских интерфейсов для мобильных и веб-приложений"
          }
        ],
        education: [
          {
            institution: "Школа Дизайна",
            degree: "Бакалавр",
            fieldOfStudy: "Графический дизайн",
            startDate: "2016-09-01",
            endDate: "2020-06-01"
          }
        ],
        talents: ["Креативное мышление", "Работа с цветами", "Внимание к деталям", "Дизайн-мышление"],
        photos: [
          "/uploads/1743335643036-94458471.jpg",
          "/uploads/1743336582653-939041250.jpg",
          "/uploads/1743336662209-133811945.jpg",
          "/uploads/1743336875409-62038655.jpg"
        ]
      };
      
      const designerResumeCreated = await this.createResume(designerResume);
      console.log("Создано тестовое резюме:", designerResumeCreated.title);
      
      // Пользователь 3: Маркетолог
      const marketerUser: InsertUser = {
        fullName: "Иван Маркетолог",
        username: "marketer",
        password: hashedPassword, // используем тот же пароль для простоты
        email: "marketer@example.com",
        phone: "+7 (900) 777-9876",
        authType: "email",
        userType: "general",
        bio: "Специалист по маркетингу с опытом работы в IT-компаниях",
        avatar: "/uploads/default-avatar-marketer.jpg",
        verified: true
      };
      
      const marketer = await this.createUser(marketerUser);
      
      const marketerResume: InsertResume = {
        userId: marketer.id,
        title: "Digital Маркетолог",
        direction: "Marketing",
        skills: ["SEO", "SMM", "Контекстная реклама", "Google Analytics", "Яндекс.Метрика", "Email-маркетинг"],
        experience: [
          {
            position: "Маркетолог",
            company: "Технологический Стартап",
            startDate: "2021-06-01",
            endDate: "2023-01-01",
            description: "Разработка и реализация маркетинговых стратегий для IT-продуктов"
          },
          {
            position: "SMM-специалист",
            company: "Медиа Агентство",
            startDate: "2019-03-01",
            endDate: "2021-05-01",
            description: "Ведение социальных сетей и создание контента для клиентов"
          }
        ],
        education: [
          {
            institution: "Экономический Университет",
            degree: "Магистр",
            fieldOfStudy: "Маркетинг",
            startDate: "2017-09-01",
            endDate: "2019-06-01"
          }
        ],
        talents: ["Стратегическое мышление", "Анализ данных", "Копирайтинг", "Управление проектами", "Нетворкинг"],
        photos: [
          "/uploads/1743337246140-920637777.jpg",
          "/uploads/1743337438110-528023281.jpg",
          "/uploads/1743337454655-181220038.jpg",
          "/uploads/1743337706975-787806863.jpg"
        ]
      };
      
      const marketerResumeCreated = await this.createResume(marketerResume);
      console.log("Создано тестовое резюме:", marketerResumeCreated.title);
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
  
  async getAllResumes(): Promise<Resume[]> {
    // Возвращаем только публичные резюме
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.isPublic !== false
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
      talents: insertResume.talents || ([] as any),
      photos: insertResume.photos || ([] as any),
      about: insertResume.about ?? null,
      isPublic: true // По умолчанию резюме публичное
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
    dateFrom?: Date;
    dateTo?: Date;
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
      
      // Фильтрация по дате начала проекта
      if (filters.dateFrom) {
        projects = projects.filter(project => 
          project.startDate && new Date(project.startDate) >= filters.dateFrom!
        );
      }
      
      // Фильтрация по дате окончания проекта
      if (filters.dateTo) {
        projects = projects.filter(project => 
          project.endDate && new Date(project.endDate) <= filters.dateTo!
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
      remote: insertProject.remote ?? null,
      photos: insertProject.photos || ([] as any),
      startDate: insertProject.startDate ?? null,
      endDate: insertProject.endDate ?? null
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

// Класс для работы с PostgreSQL
export class DatabaseStorage implements IStorage {
  private db: any;
  private pool: Pool;
  sessionStore: any;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable must be set");
    }
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.db = drizzle(this.pool);
    
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      createTableIfMissing: true
    });
  }
  
  // Метод для создания тестовых данных
  async createTestUserData() {
    try {
      // Проверяем, есть ли пользователи в базе
      const result = await this.db.select().from(users);
      
      if (result.length === 0) {
        console.log("Инициализация базы данных тестовыми данными...");
        
        // Создаем тестового пользователя
        const hashedPassword = await hashPassword("test");
        const testUser: InsertUser = {
          fullName: "Тестовый Пользователь",
          username: "test",
          password: hashedPassword,
          email: "test@example.com",
          phone: "+7 (900) 123-4567",
          authType: "email",
          userType: "general",
          bio: "Тестовая учетная запись для разработки",
          avatar: "/uploads/default-avatar-test.jpg",
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
          about: "Интересуюсь проектами в сфере веб-разработки и мобильных приложений. Готов участвовать в стартапах и инновационных проектах. Могу работать в команде как в роли фронтенд, так и бэкенд разработчика. Особенно интересны проекты с социальной значимостью или образовательной направленностью.",
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
          talents: ["Быстрое обучение", "Работа в команде", "Аналитическое мышление"],
          photos: [
            "/uploads/1743276601069-411472408.jpg",
            "/uploads/1743276682526-89808290.jpg",
            "/uploads/1743276867066-38007089.jpg"
          ]
        };
        
        const resume = await this.createResume(testResume);
        console.log("Создано тестовое резюме:", resume.title);
        
        // Создаем тестовый проект
        const testProject: InsertProject = {
          userId: user.id,
          title: "Маркетплейс услуг",
          description: "Платформа для поиска и предложения услуг фрилансеров",
          field: "Information Technology",
          positions: ["UX/UI Дизайнер", "Frontend Разработчик", "Backend Разработчик", "Менеджер проекта"],
          requirements: ["Опыт работы с веб-технологиями", "Ответственность", "Работа в команде", "Креативное мышление", "Проактивность"],
          location: "Москва (удаленно)",
          remote: true,
          photos: [
            "/uploads/1743277298100-741379550.jpg",
            "/uploads/1743277736075-995932721.jpg", 
            "/uploads/1743278401529-839292048.jpg",
            "/uploads/1743335315183-472036694.jpg",
            "/uploads/1743335489304-511313737.jpg"
          ],
          startDate: new Date("2023-04-01"),
          endDate: new Date("2023-08-31")
        };
        
        const project = await this.createProject(testProject);
        console.log("Создан тестовый проект:", project.title);
        
        // Дополнительные тестовые пользователи и их резюме
        
        // Пользователь 2: Дизайнер
        const designerUser: InsertUser = {
          fullName: "Анна Дизайнер",
          username: "designer",
          password: hashedPassword,
          email: "designer@example.com",
          phone: "+7 (900) 555-1234",
          authType: "email",
          userType: "general",
          bio: "Опытный UX/UI дизайнер с портфолио",
          avatar: "/uploads/default-avatar-designer.jpg",
          verified: true
        };
        
        const designer = await this.createUser(designerUser);
        
        const designerResume: InsertResume = {
          userId: designer.id,
          title: "UX/UI Дизайнер",
          direction: "Graphic Design",
          skills: ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "Прототипирование"],
          experience: [
            {
              position: "UX/UI Дизайнер",
              company: "Креативное Агентство",
              startDate: "2020-03-01",
              endDate: "2023-02-01",
              description: "Создание пользовательских интерфейсов для мобильных и веб-приложений"
            }
          ],
          education: [
            {
              institution: "Школа Дизайна",
              degree: "Бакалавр",
              fieldOfStudy: "Графический дизайн",
              startDate: "2016-09-01",
              endDate: "2020-06-01"
            }
          ],
          talents: ["Креативное мышление", "Работа с цветами", "Внимание к деталям", "Дизайн-мышление"],
          photos: [
            "/uploads/1743335643036-94458471.jpg",
            "/uploads/1743336582653-939041250.jpg",
            "/uploads/1743336662209-133811945.jpg",
            "/uploads/1743336875409-62038655.jpg"
          ]
        };
        
        const designerResumeCreated = await this.createResume(designerResume);
        console.log("Создано тестовое резюме:", designerResumeCreated.title);
        
        // Пользователь 3: Маркетолог
        const marketerUser: InsertUser = {
          fullName: "Иван Маркетолог",
          username: "marketer",
          password: hashedPassword,
          email: "marketer@example.com",
          phone: "+7 (900) 777-9876",
          authType: "email",
          userType: "general",
          bio: "Специалист по маркетингу с опытом работы в IT-компаниях",
          avatar: "/uploads/default-avatar-marketer.jpg",
          verified: true
        };
        
        const marketer = await this.createUser(marketerUser);
        
        const marketerResume: InsertResume = {
          userId: marketer.id,
          title: "Digital Маркетолог",
          direction: "Marketing",
          skills: ["SEO", "SMM", "Контекстная реклама", "Google Analytics", "Яндекс.Метрика", "Email-маркетинг"],
          experience: [
            {
              position: "Маркетолог",
              company: "Технологический Стартап",
              startDate: "2021-06-01",
              endDate: "2023-01-01",
              description: "Разработка и реализация маркетинговых стратегий для IT-продуктов"
            },
            {
              position: "SMM-специалист",
              company: "Медиа Агентство",
              startDate: "2019-03-01",
              endDate: "2021-05-01",
              description: "Ведение социальных сетей и создание контента для клиентов"
            }
          ],
          education: [
            {
              institution: "Экономический Университет",
              degree: "Магистр",
              fieldOfStudy: "Маркетинг",
              startDate: "2017-09-01",
              endDate: "2019-06-01"
            }
          ],
          talents: ["Стратегическое мышление", "Анализ данных", "Копирайтинг", "Управление проектами", "Нетворкинг"],
          photos: [
            "/uploads/1743337246140-920637777.jpg",
            "/uploads/1743337438110-528023281.jpg",
            "/uploads/1743337454655-181220038.jpg",
            "/uploads/1743337706975-787806863.jpg"
          ]
        };
        
        const marketerResumeCreated = await this.createResume(marketerResume);
        console.log("Создано тестовое резюме:", marketerResumeCreated.title);
      } else {
        console.log("База данных уже содержит данные. Пропуск инициализации.");
      }
    } catch (error) {
      console.error("Ошибка при создании тестовых данных:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(
      or(
        eq(users.username, username),
        eq(users.email, username),
        eq(users.phone, username)
      )
    );
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.phone, phone));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserByVerificationCode(code: string): Promise<User | undefined> {
    const now = new Date();
    const result = await this.db.select().from(users).where(
      and(
        eq(users.verificationCode, code),
        gte(users.verificationCodeExpires as any, now)
      )
    );
    return result.length > 0 ? result[0] : undefined;
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
    await this.db.update(users)
      .set({
        verificationCode: code,
        verificationCodeExpires: expires
      })
      .where(eq(users.id, userId));
    
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
      await this.db.update(users)
        .set({
          verified: true,
          verificationCode: null,
          verificationCodeExpires: null
        })
        .where(eq(users.id, userId));
      
      return true;
    }
    
    return false;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = {
      ...insertUser,
      createdAt: new Date(),
      bio: insertUser.bio ?? null,
      avatar: insertUser.avatar ?? null,
      userType: insertUser.userType ?? "general",
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      verified: true, // Временно устанавливаем verified = true, чтобы не требовалась верификация
      verificationCode: null,
      verificationCodeExpires: null
    };
    
    const result = await this.db.insert(users).values(user).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create user');
    }
    
    return result[0];
  }
  
  async updateUser(id: number, updateData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const result = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Resume operations
  async getResume(id: number): Promise<Resume | undefined> {
    const result = await this.db.select().from(resumes).where(eq(resumes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return await this.db.select().from(resumes).where(eq(resumes.userId, userId));
  }
  
  async getAllResumes(): Promise<Resume[]> {
    try {
      return await this.db.select().from(resumes).where(eq(resumes.isPublic as any, true));
    } catch (error) {
      console.error("Ошибка при получении списка резюме:", error);
      return [];
    }
  }
  
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const resume = {
      ...insertResume,
      createdAt: new Date(),
      updatedAt: new Date(),
      talents: insertResume.talents || [],
      photos: insertResume.photos || [],
      about: insertResume.about ?? null,
      isPublic: true, // По умолчанию резюме публичное
      moderationStatus: 'pending', // Отправляем на модерацию
      moderationComment: null
    };
    
    const result = await this.db.insert(resumes).values(resume).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create resume');
    }
    
    return result[0];
  }
  
  async updateResume(id: number, updateData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = await this.getResume(id);
    if (!resume) return undefined;
    
    updateData.updatedAt = new Date();
    
    const result = await this.db.update(resumes)
      .set(updateData)
      .where(eq(resumes.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteResume(id: number): Promise<boolean> {
    const result = await this.db.delete(resumes).where(eq(resumes.id, id)).returning();
    return result.length > 0;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getProjects(filters?: {
    field?: string;
    remote?: boolean;
    search?: string;
  }): Promise<Project[]> {
    let query = this.db.select().from(projects);
    
    if (filters) {
      const conditions = [];
      
      if (filters.field) {
        conditions.push(eq(projects.field, filters.field));
      }
      
      if (filters.remote !== undefined) {
        conditions.push(eq(projects.remote, filters.remote));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(projects.title, `%${filters.search}%`),
            like(projects.description, `%${filters.search}%`),
            like(projects.requirements as any, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Сортируем по дате создания (сначала новые)
    return await query.orderBy(desc(projects.createdAt));
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await this.db.select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const project = {
      ...insertProject,
      createdAt: new Date(),
      updatedAt: new Date(),
      moderationStatus: 'pending', // Отправляем на модерацию
      moderationComment: null
    };
    
    const result = await this.db.insert(projects).values(project).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create project');
    }
    
    return result[0];
  }
  
  async updateProject(id: number, updateData: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    updateData.updatedAt = new Date();
    
    const result = await this.db.update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const result = await this.db.select().from(applications).where(eq(applications.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getApplicationsByProjectId(projectId: number): Promise<Application[]> {
    return await this.db.select()
      .from(applications)
      .where(eq(applications.projectId, projectId))
      .orderBy(desc(applications.createdAt));
  }
  
  async getApplicationsByUserId(userId: number): Promise<Application[]> {
    return await this.db.select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const application = {
      ...insertApplication,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.insert(applications).values(application).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create application');
    }
    
    return result[0];
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const result = await this.db.update(applications)
      .set({ 
        status: status,
        updatedAt: new Date()
      })
      .where(eq(applications.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await this.db.select().from(messages).where(eq(messages.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await this.db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await this.db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageData = {
      ...insertMessage,
      read: false,
      createdAt: new Date()
    };
    
    const result = await this.db.insert(messages).values(messageData).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create message');
    }
    
    return result[0];
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await this.db.update(messages)
      .set({ 
        read: true
      })
      .where(eq(messages.id, id))
      .returning();
    
    return result.length > 0;
  }
}

// Используем PostgreSQL, если есть переменная окружения DATABASE_URL, иначе используем MemStorage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
