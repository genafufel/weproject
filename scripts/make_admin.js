/**
 * Скрипт для предоставления пользователю прав администратора
 * 
 * Использование:
 * node scripts/make_admin.js <email>
 * 
 * Пример:
 * node scripts/make_admin.js admin@example.com
 */

const { execSync } = require('child_process');

async function makeUserAdmin(email) {
  try {
    console.log(`Предоставление прав администратора пользователю с почтой: ${email}`);
    
    // Выполняем SQL-запрос через командную строку
    const sqlCommand = `UPDATE users SET is_admin = true WHERE email = '${email}';`;
    const selectCommand = `SELECT username, email, is_admin FROM users WHERE email = '${email}';`;
    
    // Выполняем обновление
    execSync(`psql ${process.env.DATABASE_URL} -c "${sqlCommand}"`);
    
    // Проверяем результат
    const result = execSync(`psql ${process.env.DATABASE_URL} -c "${selectCommand}" -t`).toString();
    
    if (result.trim()) {
      console.log(`Пользователь успешно сделан администратором: ${result}`);
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
const email = process.argv[2] || 'admin@example.com';
makeUserAdmin(email);