import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Проверяет успешность ответа и выбрасывает исключение если ответ не успешный
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Универсальная функция для отправки API запросов
 * Оптимизирована для работы с TanStack Query
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: HeadersInit,
    signal?: AbortSignal,
    cache?: RequestCache
  }
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    signal: options?.signal,
    cache: options?.cache || "default"
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Функция для получения данных через TanStack Query 
 * Автоматически обрабатывает исключения и ответы 401 Unauthorized
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  cacheStrategy?: "force-cache" | "no-cache" | "default"; // Добавляем стратегию кэширования
}) => QueryFunction<T | null> =
  ({ on401: unauthorizedBehavior, cacheStrategy = "default" }) =>
  async ({ queryKey, signal }) => {
    const queryUrl = queryKey[0] as string;
    
    // Добавляем параметры к URL для предотвращения кэширования в режиме разработки
    // только если явно указана опция no-cache
    const url = cacheStrategy === "no-cache" && import.meta.env.DEV 
      ? `${queryUrl}${queryUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
      : queryUrl;
    
    const res = await fetch(url, {
      credentials: "include",
      cache: cacheStrategy,
      signal, // Используем AbortSignal для отмены запроса при необходимости
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw",
        cacheStrategy: "default"
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false, // Отключаем автоматическое обновление при фокусе окна
      refetchOnMount: true,        // Включаем обновление при монтировании для важных компонентов
      staleTime: 5 * 60 * 1000,    // Данные считаются свежими в течение 5 минут
      gcTime: 10 * 60 * 1000,      // Очищаем неиспользуемые данные после 10 минут
      retry: 1,                   // Делаем одну повторную попытку при ошибке
      refetchOnReconnect: true,    // Включаем обновление при восстановлении соединения
      // Добавляем структурированную обработку ошибок
      useErrorBoundary: (error) => {
        // Перехватываем критические ошибки, остальные обрабатываем локально
        return error instanceof Error && (
          error.message.includes('500') || 
          error.message.includes('503') ||
          error.message.includes('ECONNABORTED')
        );
      },
    },
    mutations: {
      retry: 1,  // Делаем одну повторную попытку для мутаций
    },
  },
});
