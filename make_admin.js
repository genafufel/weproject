// Используем CommonJS синтаксис, так как запускаем без транспиляции
const { db } = require('./server/db');
const { users } = require('./shared/schema');
const { eq } = require('drizzle-orm');

// Мы не используем dotenv, так как переменные окружения уже доступны

async function makeUserAdmin(email) {
  try {
    console.log(`Ищем пользователя с почтой: ${email}...`);
    
    // Получаем пользователя по email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      console.error(`Пользователь с почтой ${email} не найден!`);
      process.exit(1);
    }
    
    console.log(`Пользователь найден: ${user.username} (ID: ${user.id})`);
    
    // Проверяем, является ли пользователь уже администратором
    if (user.isAdmin) {
      console.log(`Пользователь ${user.username} уже является администратором.`);
      process.exit(0);
    }
    
    // Обновляем статус пользователя до администратора
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, user.id))
      .returning();
    
    console.log(`Пользователь ${updatedUser.username} успешно назначен администратором!`);
    console.log(`Данные пользователя: 
      ID: ${updatedUser.id}
      Имя: ${updatedUser.username}
      Email: ${updatedUser.email}
      Admin: ${updatedUser.isAdmin}`);
      
  } catch (error) {
    console.error('Произошла ошибка:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Запускаем функцию с email из аргументов командной строки или используем предоставленный
const email = process.argv[2] || 'genafufel@mail.ru';
makeUserAdmin(email);