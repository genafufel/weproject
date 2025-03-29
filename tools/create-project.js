// Скрипт для создания проекта
import fetch from 'node-fetch';

async function createProject() {
  try {
    // Шаг 1: Авторизуемся
    console.log('1. Авторизация...');
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      }),
      credentials: 'include'
    });

    if (!loginRes.ok) {
      throw new Error(`Ошибка авторизации: ${loginRes.status} ${await loginRes.text()}`);
    }
    
    const user = await loginRes.json();
    console.log('Успешная авторизация:', user.username);
    
    // Получаем куки из ответа
    const cookies = loginRes.headers.raw()['set-cookie'];
    console.log('Получены куки:', cookies);
    
    // Шаг 2: Проверяем аутентификацию
    console.log('\n2. Проверка аутентификации...');
    const authCheckRes = await fetch('http://localhost:5000/api/auth-check', {
      headers: {
        Cookie: cookies
      }
    });
    
    const authData = await authCheckRes.json();
    console.log('Статус аутентификации:', authData);
    
    // Шаг 3: Создаем проект
    console.log('\n3. Создание проекта...');
    const projectData = {
      title: 'Тестовый проект',
      description: 'Это тестовый проект, созданный с помощью скрипта',
      field: 'IT',
      positions: ['Разработчик', 'Дизайнер'],
      requirements: ['JavaScript', 'React'],
      remote: true
    };
    
    const createProjectRes = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify(projectData)
    });
    
    if (!createProjectRes.ok) {
      throw new Error(`Ошибка создания проекта: ${createProjectRes.status} ${await createProjectRes.text()}`);
    }
    
    const project = await createProjectRes.json();
    console.log('Проект успешно создан:', project);
    
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
}

createProject();