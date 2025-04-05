import { useState } from "react";
import { ImageDebugPanel } from "@/components/image-debug-panel";
import { ApiErrorDebugPanel } from "@/components/api-error-debug";
import { Button } from "@/components/ui/button";
import { Image, AlertTriangle, Wrench, X } from "lucide-react";
import { AdvancedImagePreloader } from "@/components/advanced-image-preloader";

// Проверяем, находимся ли мы в режиме разработки или в отладочном режиме
const isDevelopment = import.meta.env.DEV;
const isDebugEnabled = isDevelopment || localStorage.getItem('debug_mode') === 'true';

interface DebugPanelProps {
  children: React.ReactNode;
}

export function DebugLayout({ children }: DebugPanelProps) {
  const [showImageDebug, setShowImageDebug] = useState(false);
  const [showApiErrorDebug, setShowApiErrorDebug] = useState(false);
  const [showDebugBar, setShowDebugBar] = useState(true);
  
  // Если не в режиме разработки и не в отладочном режиме, просто возвращаем дочерние компоненты
  if (!isDebugEnabled) {
    return <>{children}</>;
  }
  
  return (
    <>
      {children}
      
      {/* Верхняя полоса статуса предзагрузки изображений */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdvancedImagePreloader 
          autoStart={false} 
          showDetails={false} 
        />
      </div>
      
      {/* Панель отладки изображений (если открыта) */}
      {showImageDebug && (
        <ImageDebugPanel onClose={() => setShowImageDebug(false)} />
      )}
      
      {/* Панель отладки API ошибок (если открыта) */}
      {showApiErrorDebug && (
        <ApiErrorDebugPanel onClose={() => setShowApiErrorDebug(false)} />
      )}
      
      {/* Панель инструментов отладки */}
      {showDebugBar && (
        <div className="fixed bottom-0 right-0 mb-4 mr-4 z-50 flex flex-col items-end space-y-2">
          <div className="bg-background border border-border shadow-lg rounded-lg p-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowImageDebug(prev => !prev)}
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowApiErrorDebug(prev => !prev)}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1"></div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowDebugBar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Кнопка возврата панели отладки, если она была скрыта */}
      {!showDebugBar && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-0 right-0 mb-4 mr-4 z-50 h-8 w-8 rounded-full shadow-lg"
          onClick={() => setShowDebugBar(true)}
        >
          <Wrench className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}