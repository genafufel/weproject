import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Утилиты для работы с URL перенаправления
export function saveReturnUrl(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('returnUrl', url);
  }
}

export function getReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('returnUrl');
}

export function clearReturnUrl() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('returnUrl');
  }
}
