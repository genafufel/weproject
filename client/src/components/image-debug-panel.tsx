import { useState, useEffect } from "react";
import { X, Loader2, Image, RefreshCw, Maximize2, Minimize2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { imageService } from "@/lib/image-service";
import { AdvancedImagePreloader } from "./advanced-image-preloader";

interface ImageDebugPanelProps {
  onClose: () => void;
}

export function ImageDebugPanel({ onClose }: ImageDebugPanelProps) {
  const [cacheEntries, setCacheEntries] = useState<Array<{ url: string; state: any }>>([]);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [sorting, setSorting] = useState<"url" | "state" | "time">("time");
  const [filter, setFilter] = useState<"all" | "loaded" | "error" | "loading">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [preloadStarted, setPreloadStarted] = useState(false);

  // Получить текущий кэш
  const refreshCache = () => {
    setRefreshing(true);
    
    // Используем setTimeout, чтобы дать возможность UI обновиться до получения кэша
    setTimeout(() => {
      // @ts-ignore - Получаем доступ к protected свойству cache
      const cacheMap = (imageService as any).cache;
      
      if (cacheMap && cacheMap instanceof Map) {
        const entries = Array.from(cacheMap.entries()).map(([url, state]) => ({
          url,
          state
        }));
        
        // Сортировка
        let sortedEntries = [...entries];
        
        if (sorting === "url") {
          sortedEntries.sort((a, b) => a.url.localeCompare(b.url));
        } else if (sorting === "state") {
          sortedEntries.sort((a, b) => {
            if (a.state.loaded && !b.state.loaded) return -1;
            if (!a.state.loaded && b.state.loaded) return 1;
            if (a.state.error && !b.state.error) return -1;
            if (!a.state.error && b.state.error) return 1;
            return 0;
          });
        } else if (sorting === "time") {
          sortedEntries.sort((a, b) => b.state.timestamp - a.state.timestamp);
        }
        
        // Фильтрация
        if (filter !== "all") {
          sortedEntries = sortedEntries.filter(entry => {
            if (filter === "loaded") return entry.state.loaded;
            if (filter === "error") return entry.state.error;
            if (filter === "loading") return !entry.state.loaded && !entry.state.error;
            return true;
          });
        }
        
        setCacheEntries(sortedEntries);
      }
      
      setRefreshing(false);
    }, 0);
  };

  // Форматирование времени
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Форматирование времени прошедшего с момента загрузки
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds} сек. назад`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч. назад`;
    return `${Math.floor(seconds / 86400)} дн. назад`;
  };

  // Очистить старые записи в кэше (старше 30 минут)
  const clearOldEntries = () => {
    imageService.clearOldCache(30 * 60 * 1000); // 30 минут
    refreshCache();
  };

  // Принудительная предзагрузка изображений
  const forcePreload = () => {
    setPreloadStarted(true);
    imageService.preloadFromApi().finally(() => {
      refreshCache();
    });
  };

  // При монтировании компонента
  useEffect(() => {
    refreshCache();
    
    // Периодическое обновление
    const intervalId = setInterval(refreshCache, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [sorting, filter]);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 transition-all ease-in-out duration-300 ${expanded ? "h-[70vh]" : "h-auto"}`}>
      <div className="p-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Отладка изображений</h2>
          <div className="text-xs text-muted-foreground">
            Найдено: {cacheEntries.length} изображений
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshCache}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
      
      <div className="p-2 flex flex-wrap gap-2 items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="filter" className="text-xs">Фильтр:</Label>
            <select 
              id="filter"
              className="text-xs border rounded p-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">Все</option>
              <option value="loaded">Загруженные</option>
              <option value="error">С ошибками</option>
              <option value="loading">Загружаются</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="sorting" className="text-xs">Сортировка:</Label>
            <select 
              id="sorting"
              className="text-xs border rounded p-1"
              value={sorting}
              onChange={(e) => setSorting(e.target.value as any)}
            >
              <option value="time">По времени</option>
              <option value="url">По URL</option>
              <option value="state">По статусу</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7"
            onClick={clearOldEntries}
          >
            Очистить старые
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs h-7"
            onClick={forcePreload}
            disabled={preloadStarted}
          >
            Предзагрузить изображения
          </Button>
        </div>
      </div>
      
      {preloadStarted && (
        <div className="p-2 border-b">
          <AdvancedImagePreloader 
            showDetails={true} 
            onComplete={() => {
              setPreloadStarted(false);
              refreshCache();
            }}
          />
        </div>
      )}
      
      <div className={`overflow-y-auto ${expanded ? "max-h-[calc(70vh-12rem)]" : "max-h-60"}`}>
        <Accordion type="multiple" className="w-full">
          {cacheEntries.map((entry, index) => (
            <AccordionItem value={entry.url} key={index} className="border-b">
              <AccordionTrigger className="py-2 px-4 hover:no-underline">
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-1 text-left">
                  <div className="flex items-center gap-2">
                    {entry.state.loaded ? (
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                    ) : entry.state.error ? (
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                    ) : (
                      <div className="h-2 w-2 border border-yellow-500 rounded-full" />
                    )}
                    <span className="text-xs font-mono truncate max-w-[300px] md:max-w-[500px]">
                      {entry.url}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {entry.state.loaded
                        ? "Загружено" 
                        : entry.state.error 
                        ? "Ошибка" 
                        : "Загружается..."}
                    </span>
                    <span>{getTimeAgo(entry.state.timestamp)}</span>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong>URL:</strong> <span className="font-mono break-all">{entry.url}</span>
                    </div>
                    <div className="text-xs">
                      <strong>Статус:</strong> {
                        entry.state.loaded 
                          ? "Загружено успешно" 
                          : entry.state.error 
                          ? "Ошибка загрузки" 
                          : "В процессе загрузки"
                      }
                    </div>
                    <div className="text-xs">
                      <strong>Время загрузки:</strong> {formatTime(entry.state.timestamp)} ({getTimeAgo(entry.state.timestamp)})
                    </div>
                  </div>
                  
                  {entry.state.loaded && (
                    <div className="flex justify-center items-center border rounded">
                      <img 
                        src={entry.url} 
                        alt="Cached image" 
                        className="max-h-32 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          // Показать ошибку вместо изображения
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = "text-red-500 text-xs flex items-center justify-center h-full w-full";
                            errorDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><span class="ml-1">Ошибка отображения</span>';
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      // Перезагрузить изображение
                      imageService.loadImage(entry.url)
                        .then(() => refreshCache())
                        .catch(() => refreshCache());
                    }}
                  >
                    Перезагрузить
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {cacheEntries.length === 0 && !refreshing && (
          <div className="p-8 text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Нет кэшированных изображений</p>
          </div>
        )}
        
        {refreshing && cacheEntries.length === 0 && (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary/50" />
            <p className="text-muted-foreground">Загрузка данных...</p>
          </div>
        )}
      </div>
      
      <div className="p-2 flex justify-between items-center text-xs text-muted-foreground border-t">
        <div>
          Кэш изображений: {cacheEntries.length} записей
        </div>
        <div>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            refreshCache();
          }} className="underline">Обновить</a>
        </div>
      </div>
    </div>
  );
}