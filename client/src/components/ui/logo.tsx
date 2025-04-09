import { Link } from "wouter";

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

  return (
    <Link href="/" className="flex items-center">
        <svg
          className={`w-auto ${sizeClasses[size]}`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="20" fill="currentColor" className="text-primary" />
          <path
            d="M25 35C25 32.2386 27.2386 30 30 30H70C72.7614 30 75 32.2386 75 35V65C75 67.7614 72.7614 70 70 70H55M25 35V65C25 67.7614 27.2386 70 30 70H40"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="47.5" cy="50" r="10" stroke="white" strokeWidth="6" />
        </svg>
        <span className={`ml-2 ${textSizes[size]} font-bold text-blue-600 dark:text-blue-400`}>weproject</span>
    </Link>
  );
}
