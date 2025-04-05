import { useEffect, useState } from "react";
import { imageService } from "@/lib/image-service";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ImagePreloaderProps {
  autoStart?: boolean;
  onComplete?: () => void;
  showDetails?: boolean;
  className?: string;
}

type PreloadState = "idle" | "loading" | "success" | "error";

interface PreloadStats {
  total: number;
  loaded: number;
  failed: number;
}

export function AdvancedImagePreloader({ 
  autoStart = true, 
  onComplete,
  showDetails = false,
  className = ""
}: ImagePreloaderProps) {
  const [state, setState] = useState<PreloadState>("idle");
  const [stats, setStats] = useState<PreloadStats>({
    total: 0,
    loaded: 0,
    failed: 0
  });
  const [progress, setProgress] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startPreload = async () => {
    try {
      setState("loading");
      setProgress(0);
      setError(null);
      
      // Запрашиваем список URL для предзагрузки
      const response = await fetch("/api/preload-resources");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки ресурсов: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success || !Array.isArray(data.imageUrls)) {
        throw new Error("Неверный формат данных для предзагрузки");
      }
      
      const imageUrls = data.imageUrls;
      setUrls(imageUrls);
      
      if (imageUrls.length === 0) {
        setState("success");
        setStats({ total: 0, loaded: 0, failed: 0 });
        setProgress(100);
        onComplete?.();
        return;
      }
      
      // Инициализируем статистику
      setStats({
        total: imageUrls.length,
        loaded: 0,
        failed: 0
      });
      
      // Для каждого URL начинаем загрузку
      const loadPromises = imageUrls.map((url: string, index: number) => {
        return new Promise<boolean>((resolve) => {
          // Предзагружаем изображение
          imageService.loadImage(url)
            .then(() => {
              // Обновляем прогресс
              setStats(prev => {
                const newStats = { ...prev, loaded: prev.loaded + 1 };
                const newProgress = ((newStats.loaded + newStats.failed) / newStats.total) * 100;
                setProgress(newProgress);
                return newStats;
              });
              resolve(true);
            })
            .catch(() => {
              // Обновляем счетчик ошибок
              setStats(prev => {
                const newStats = { ...prev, failed: prev.failed + 1 };
                const newProgress = ((newStats.loaded + newStats.failed) / newStats.total) * 100;
                setProgress(newProgress);
                return newStats;
              });
              resolve(false);
            });
        });
      });
      
      // Ждем завершения всех загрузок
      await Promise.all(loadPromises);
      
      // Предзагрузка завершена
      setState("success");
      setProgress(100);
      onComplete?.();
      
    } catch (err) {
      console.error("Ошибка предзагрузки изображений:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    }
  };
  
  // Автоматически начинаем предзагрузку
  useEffect(() => {
    if (autoStart) {
      startPreload();
    }
  }, [autoStart]);

  return (
    <div className={`w-full ${className}`}>
      {/* Индикатор прогресса */}
      <Progress 
        value={progress} 
        className={`w-full h-1.5 ${
          state === "error" ? "bg-red-200" : 
          state === "success" ? "bg-green-200" : "bg-gray-200"
        }`} 
      />
      
      {/* Дополнительная информация */}
      {showDetails && (
        <div className="text-xs mt-1 flex items-center space-x-1">
          {state === "loading" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">
                Загружено: {stats.loaded}/{stats.total} (Ошибок: {stats.failed})
              </span>
            </>
          )}
          
          {state === "success" && (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">
                Загружено {stats.loaded} ресурсов {stats.failed > 0 && `(ошибок: ${stats.failed})`}
              </span>
            </>
          )}
          
          {state === "error" && (
            <>
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-red-600">
                {error || "Ошибка загрузки"}
              </span>
            </>
          )}
        </div>
      )}
      
      {/* Отладочная информация в режиме разработки */}
      {import.meta.env.DEV && showDetails && state === "success" && (
        <details className="text-xs mt-1 text-muted-foreground">
          <summary className="cursor-pointer">Загруженные URL ({urls.length})</summary>
          <ul className="text-xs mt-1 max-h-24 overflow-y-auto">
            {urls.map((url: string, idx: number) => (
              <li key={idx} className="truncate">{url}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}