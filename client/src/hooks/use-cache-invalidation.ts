import { useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Хук для удобной инвалидации кеша React Query
 * Используется после успешных мутаций для обновления данных на всех страницах
 */
export function useCacheInvalidation() {
  /**
   * Инвалидирует кеш резюме
   * @param id - ID резюме для точечной инвалидации или undefined для инвалидации всех резюме
   */
  const invalidateResumes = useCallback((id?: number) => {
    if (id) {
      // Инвалидируем конкретное резюме
      queryClient.invalidateQueries({ queryKey: [`/api/resumes/${id}`] });
    }
    // Инвалидируем все списки резюме
    queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
    queryClient.invalidateQueries({ queryKey: ['/api/resumes/all'] });
  }, []);

  /**
   * Инвалидирует кеш проектов
   * @param id - ID проекта для точечной инвалидации или undefined для инвалидации всех проектов
   */
  const invalidateProjects = useCallback((id?: number) => {
    if (id) {
      // Инвалидируем конкретный проект
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
    }
    // Инвалидируем все списки проектов
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  }, []);

  /**
   * Инвалидирует кеш заявок
   */
  const invalidateApplications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
  }, []);

  /**
   * Инвалидирует кеш сообщений
   */
  const invalidateMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
  }, []);

  /**
   * Инвалидирует кеш пользователя
   * @param id - ID пользователя для точечной инвалидации
   */
  const invalidateUser = useCallback((id?: number) => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  }, []);

  return {
    invalidateResumes,
    invalidateProjects,
    invalidateApplications,
    invalidateMessages,
    invalidateUser,
  };
}