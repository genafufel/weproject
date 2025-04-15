import { Link } from "wouter";
import { useEffect, useState } from "react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "h-8",
    default: "h-10",
    large: "h-16"
  };

  const textSizes = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl"
  };

  // Используем оригинальный логотип из JPG файла
  return (
    <Link href="/" className="flex items-center">
      <div 
        className={`${sizeClasses[size]} overflow-hidden transition-transform duration-300 hover:scale-105 flex items-center justify-center`}
      >
        <img 
          src="/images/w-logo-original.jpg" 
          alt="W Project Logo" 
          className="h-full w-auto object-contain"
        />
      </div>
      <span className={`ml-2 ${textSizes[size]} font-bold text-gray-900 dark:text-white animate-[slideInFromLeft_1.2s_cubic-bezier(0.25,0.1,0.25,1.0)_forwards] origin-left`}>project</span>
    </Link>
  );
}
