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
        {/* Новый SVG-логотип в стиле "We", основанный на предоставленном изображении */}
        <svg
          className={`w-auto ${sizeClasses[size]}`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="20" fill="#0093FF" />
          <g transform="translate(15, 20) scale(0.7)">
            <path
              d="M0 10 L20 80 L35 80 L45 30 L55 80 L70 80 L90 10 L75 10 L65 60 L55 10 L35 10 L25 60 L15 10 Z"
              fill="white"
            />
            <circle cx="85" cy="60" r="15" fill="white" />
            <path
              d="M75 60 L95 60"
              stroke="#0093FF"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className={`ml-2 ${textSizes[size]} font-bold text-blue-600 dark:text-blue-400`}>weproject</span>
    </Link>
  );
}
