import { Link } from "wouter";
import { useEffect, useState } from "react";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "h-6",
    default: "h-8",
    large: "h-12"
  };

  const textSizes = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl"
  };

  // Используем новый логотип
  return (
    <Link href="/" className="flex items-center">
      <div 
        className={`${sizeClasses[size]} overflow-hidden transition-transform duration-300 hover:scale-105 flex items-center justify-center`}
      >
        <svg 
          className="h-full w-auto text-gray-900 dark:text-white" 
          viewBox="0 0 640 640" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 150 430 L 50 150 L 150 150 L 220 350 L 320 150 L 420 350 L 490 150 L 590 150 L 490 430 L 390 230 L 320 430 L 220 230 L 150 430 Z" fill="currentColor"/>
          <circle cx="590" cy="150" r="50" fill="#0095ff"/>
        </svg>
      </div>
      <span className={`ml-2 ${textSizes[size]} font-bold text-gray-900 dark:text-white animate-[slideInFromLeft_1.2s_cubic-bezier(0.25,0.1,0.25,1.0)_forwards] origin-left`}>project</span>
    </Link>
  );
}
