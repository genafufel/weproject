import React from 'react';

export function TailSpin({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "h-5 w-5 border-2",
    default: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-solid border-primary border-t-transparent`}></div>
    </div>
  );
}