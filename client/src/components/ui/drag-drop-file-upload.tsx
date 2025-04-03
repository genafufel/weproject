import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DragDropFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  clickToUpload?: boolean;
}

export function DragDropFileUpload({
  onFilesSelected,
  multiple = false,
  accept,
  className,
  children,
  disabled = false,
  clickToUpload = false,
}: DragDropFileUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Обработка перетаскивания
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const filesToUpload = multiple ? droppedFiles : [droppedFiles[0]];
      onFilesSelected(filesToUpload);
      
      // Сброс значения input для возможности перезагрузки тех же файлов
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Обработка клика по области - только если clickToUpload = true
  const handleClick = () => {
    if (clickToUpload && !disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Обработка выбора файлов через input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const filesToUpload = multiple ? selectedFiles : [selectedFiles[0]];
      onFilesSelected(filesToUpload);
      
      // Сброс значения input для возможности перезагрузки тех же файлов
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Глобальные обработчики событий перетаскивания
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    
    if (!dropArea) return;
    
    const preventDefaultHandler = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Добавляем глобальные обработчики
    document.addEventListener('dragover', preventDefaultHandler);
    document.addEventListener('drop', preventDefaultHandler);
    
    return () => {
      // Удаляем глобальные обработчики при удалении компонента
      document.removeEventListener('dragover', preventDefaultHandler);
      document.removeEventListener('drop', preventDefaultHandler);
    };
  }, []);

  return (
    <div
      ref={dropAreaRef}
      className={cn(
        "relative", 
        clickToUpload ? "cursor-pointer" : "",
        isDragging ? "border-primary" : "border-dashed", 
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple={multiple}
        accept={accept}
        disabled={disabled}
      />
      {children}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-md border-2 border-primary">
          <div className="text-primary font-medium">
            Отпустите файл{multiple ? 'ы' : ''} для загрузки
          </div>
        </div>
      )}
    </div>
  );
}