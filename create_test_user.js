import { createHash } from 'crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from './shared/schema';
import ws from 'ws';

// Функция для хеширования пароля
async function hashPassword(password) {
  // Простое хеширование для тестирования
  return createHash('sha256').update(password).digest('hex');
}

async function createTestUser() {
  neonConfig.webSocketConstructor = ws;
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL must be set');
    return;
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  
  const hashedPassword = await hashPassword('test');
  
  try {
    // Проверяем, существует ли уже пользователь test
    const existingUsers = await db.select().from(schema.users).where(eq(schema.users.username, 'test'));
    
    if (existingUsers.length > 0) {
      console.log('Пользователь test уже существует');
      process.exit(0);
    }
    
    const result = await db.insert(schema.users).values({
      fullName: 'Тестовый Пользователь',
      username: 'test',
      password: hashedPassword,
      email: 'test@example.com',
      phone: '+7 (900) 123-4567',
      authType: 'email',
      userType: 'general',
      bio: 'Тестовая учетная запись для разработки',
      avatar: '/uploads/default-avatar-test.jpg',
      verified: true,
      createdAt: new Date(),
      verificationCode: null,
      verificationCodeExpires: null
    }).returning();
    
    console.log('Создан тестовый пользователь:', result[0].username);
    console.log('ID пользователя:', result[0].id);
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    process.exit(1);
  }
}

createTestUser();
