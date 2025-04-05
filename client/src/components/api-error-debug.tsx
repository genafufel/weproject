import { useState, useEffect } from "react";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiError {
  timestamp: number;
  url: string;
  method: string;
  status?: number;
  message: string;
  retried: boolean;
}

interface ApiErrorDebugPanelProps {
  onClose: () => void;
}

// Глобальное хранилище ошибок API
class ApiErrorStore {
  private static instance: ApiErrorStore;
  private errors: ApiError[] = [];
  private listeners: Set<(errors: ApiError[]) => void> = new Set();

  private constructor() {
    // Приватный конструктор, чтобы обеспечить синглтон
  }

  public static getInstance(): ApiErrorStore {
    if (!ApiErrorStore.instance) {
      ApiErrorStore.instance = new ApiErrorStore();
    }
    return ApiErrorStore.instance;
  }

  public addError(error: Omit<ApiError, "timestamp" | "retried">): void {
    const newError: ApiError = {
      ...error,
      timestamp: Date.now(),
      retried: false
    };
    this.errors = [newError, ...this.errors].slice(0, 50); // Ограничиваем количество ошибок
    this.notifyListeners();
  }

  public markAsRetried(index: number): void {
    if (index >= 0 && index < this.errors.length) {
      this.errors[index].retried = true;
      this.notifyListeners();
    }
  }

  public clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  public getErrors(): ApiError[] {
    return [...this.errors];
  }

  public subscribe(listener: (errors: ApiError[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getErrors()));
  }
}

export const apiErrorStore = ApiErrorStore.getInstance();

// Функция-перехватчик для fetch
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const response = await originalFetch(input, init);
    
    // Если ответ не успешный, записываем ошибку
    if (!response.ok && response.status !== 401) { // Игнорируем 401 для авторизации
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      apiErrorStore.addError({
        url,
        method: init?.method || 'GET',
        status: response.status,
        message: `HTTP Error: ${response.status} ${response.statusText}`
      });
    }
    
    return response;
  } catch (error) {
    // В случае сетевой ошибки
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    apiErrorStore.addError({
      url,
      method: init?.method || 'GET',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка сети'
    });
    
    throw error;
  }
};

export function ApiErrorDebugPanel({ onClose }: ApiErrorDebugPanelProps) {
  const [errors, setErrors] = useState<ApiError[]>([]);
  
  useEffect(() => {
    // Подписываемся на обновления ошибок
    const unsubscribe = apiErrorStore.subscribe(newErrors => {
      setErrors(newErrors);
    });
    
    // Получаем текущие ошибки при монтировании
    setErrors(apiErrorStore.getErrors());
    
    return unsubscribe;
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const retryRequest = async (error: ApiError, index: number) => {
    try {
      await fetch(error.url, { method: error.method });
      apiErrorStore.markAsRetried(index);
    } catch (e) {
      console.error("Failed to retry:", e);
    }
  };

  const clearErrors = () => {
    apiErrorStore.clearErrors();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 max-h-80">
      <div className="p-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-sm font-semibold">Ошибки API запросов</h2>
          <div className="text-xs text-muted-foreground">
            {errors.length > 0 ? `${errors.length} ошибок` : 'Нет ошибок'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearErrors}
            disabled={errors.length === 0}
          >
            Очистить
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-64">
        <div className="p-2">
          {errors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mb-2 opacity-20" />
              <p>Нет ошибок API</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className={`p-3 rounded-lg border ${error.retried ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'}`}>
                  <div className="flex justify-between">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {error.retried ? (
                        <span className="text-green-600">✓ Повторено</span>
                      ) : (
                        <span className="text-red-600">✗ Ошибка</span>
                      )}
                      <span>{error.method}</span>
                      {error.status && <span>({error.status})</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(error.timestamp)}
                    </div>
                  </div>
                  
                  <div className="mt-1 text-xs font-mono truncate">
                    {error.url}
                  </div>
                  
                  <div className="mt-1 text-sm">
                    {error.message}
                  </div>
                  
                  <div className="mt-2 flex justify-end">
                    {!error.retried && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => retryRequest(error, index)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Повторить запрос
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}