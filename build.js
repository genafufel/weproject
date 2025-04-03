import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

/**
 * Эта функция добавляет специальный файл в проект, который отключит
 * автоматическую перезагрузку страницы в режиме разработки
 */
function createNoHmrFile() {
  console.log('Создание файла для отключения HMR...');
  
  const content = `
// Отключение Hot Module Replacement
if (import.meta.hot) {
  // Полностью отключаем HMR
  import.meta.hot.decline();
}

// Активируем обработку ошибок загрузки ресурсов
window.addEventListener('error', function(event) {
  if (event.target && 
     (event.target.tagName === 'IMG' || 
      event.target.tagName === 'SCRIPT' || 
      event.target.tagName === 'LINK')) {
    // Предотвращаем действия по умолчанию
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  return true;
}, true);

// Отключаем перезагрузку страницы при ошибках
window.addEventListener('unhandledrejection', function(event) {
  event.preventDefault();
  return false;
});
`;

  // Записываем файл в директорию client/public
  writeFileSync('client/public/no-hmr.js', content);
  console.log('Файл client/public/no-hmr.js создан');

  // Добавляем инъекцию скрипта в index.html
  const htmlInjection = `
  <!-- Скрипт отключения HMR -->
  <script src="/no-hmr.js"></script>
`;

  try {
    // Добавляем скрипт в index.html
    execSync(`sed -i '/<head>/a\\${htmlInjection}' client/index.html`);
    console.log('Скрипт добавлен в index.html');
  } catch (error) {
    console.error('Ошибка при добавлении скрипта в index.html:', error);
  }
}

// Выполняем модификацию проекта
createNoHmrFile();

// Попытка создания production-сборки
console.log('Запуск создания production-сборки...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Production-сборка успешно создана');
} catch (error) {
  console.error('Ошибка при создании production-сборки:', error);
}