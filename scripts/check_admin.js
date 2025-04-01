/**
 * Скрипт для проверки статуса администратора у пользователя
 * 
 * Использование:
 * node scripts/check_admin.js <email>
 * 
 * Пример:
 * node scripts/check_admin.js admin@example.com
 */

const { execSync } = require('child_process');

async function checkUserAdmin(email) {
  try {
    console.log(`Проверка статуса администратора для пользователя: ${email}`);
    
    // SQL запрос для проверки
    const selectCommand = `SELECT username, email, is_admin FROM users WHERE email = '${email}';`;
    
    // Выполняем запрос
    const result = execSync(`psql ${process.env.DATABASE_URL} -c "${selectCommand}"`).toString();
    
    if (result.includes(email)) {
      console.log(`Информация о пользователе:\n${result}`);
    } else {
      console.error(`Пользователь с почтой ${email} не найден!`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Произошла ошибка:', error.message);
    process.exit(1);
  }
}

// Получаем email из аргументов командной строки или используем по умолчанию
const email = process.argv[2] || 'genafufel@mail.ru';
checkUserAdmin(email);