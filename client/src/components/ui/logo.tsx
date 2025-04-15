import { Link } from "wouter";
import { useEffect, useState } from "react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "h-6",
    default: "h-8",
    large: "h-10"
  };

  const textSizes = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl"
  };

  // Используем изображение из импорта для надежности
  // Добавляем эффект анимации и улучшенный стиль
  return (
    <Link href="/" className="flex items-center">
        <div 
          className={`w-auto ${sizeClasses[size]} overflow-hidden transition-transform duration-300 hover:scale-105 flex items-center justify-center`}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M23 11L16 7L9 11V21L16 25L23 21V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 14L16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 14L20 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 14L12 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className={`ml-2 ${textSizes[size]} font-bold text-primary dark:text-primary animate-[slideInFromLeft_1.2s_cubic-bezier(0.25,0.1,0.25,1.0)_forwards] origin-left`}>weproject</span>
    </Link>
  );
}
