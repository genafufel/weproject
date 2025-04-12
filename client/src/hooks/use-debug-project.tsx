import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Интерфейс для отладочных проектов
interface DebugProject {
  id: number;
  title: string;
  description: string;
  field: string;
  images: any; // Различные форматы для отладки
  testCase: string; // Описание тестового случая
}

/**
 * Хук для получения отладочных проектов
 */
export function useDebugProjects() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugProjects, setDebugProjects] = useState<DebugProject[]>([]);

  useEffect(() => {
    const fetchDebugProjects = async () => {
      try {
        setIsLoading(true);
        
        // Создаем отладочные проекты с разными форматами данных для изображений
        const testProjects: DebugProject[] = [
          {
            id: 1,
            title: 'Проект с массивом строк',
            description: 'Этот проект хранит изображения в виде массива строк, который является стандартным форматом.',
            field: 'IT',
            images: ['/uploads/1744408001371-521291339.png', '/uploads/1744408008480-122786513.png'],
            testCase: 'Массив строк'
          },
          {
            id: 2,
            title: 'Проект с JSON-строкой',
            description: 'Этот проект хранит изображения в виде JSON-строки, которая должна быть сначала распарсена.',
            field: 'Дизайн',
            images: JSON.stringify(['/uploads/1744408001371-521291339.png', '/uploads/1744408008480-122786513.png']),
            testCase: 'JSON-строка'
          },
          {
            id: 3,
            title: 'Проект с одиночной строкой',
            description: 'Этот проект хранит изображение как одиночную строку.',
            field: 'Маркетинг',
            images: '/uploads/1744408001371-521291339.png',
            testCase: 'Одиночная строка'
          },
          {
            id: 4,
            title: 'Проект с пустым массивом',
            description: 'Этот проект имеет пустой массив изображений.',
            field: 'Финансы',
            images: [],
            testCase: 'Пустой массив'
          },
          {
            id: 5,
            title: 'Проект без изображений',
            description: 'Этот проект имеет null вместо изображений.',
            field: 'Образование',
            images: null,
            testCase: 'Null'
          },
          {
            id: 6,
            title: 'Проект с дефолтным изображением',
            description: 'Этот проект использует дефолтное изображение проекта.',
            field: 'Прочее',
            images: ['/uploads/default-project.jpg'],
            testCase: 'Дефолтное изображение'
          }
        ];
        
        setDebugProjects(testProjects);
        setIsLoading(false);
        
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
        setIsLoading(false);
      }
    };

    fetchDebugProjects();
  }, []);

  return { debugProjects, isLoading, error };
}

/**
 * Хук для получения отдельного отладочного проекта
 */
export function useDebugProject(id: number) {
  const { debugProjects, isLoading, error } = useDebugProjects();
  const [project, setProject] = useState<DebugProject | null>(null);

  useEffect(() => {
    if (!isLoading && debugProjects.length > 0) {
      const foundProject = debugProjects.find(p => p.id === id);
      setProject(foundProject || null);
    }
  }, [id, debugProjects, isLoading]);

  return { project, isLoading, error };
}