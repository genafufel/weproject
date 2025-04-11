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
        {/* Точная SVG-копия логотипа "лого второоой.png" с буквами "We" */}
        <svg
          className={`w-auto ${sizeClasses[size]}`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Голубой фон с закругленными углами */}
          <rect width="100" height="100" rx="20" fill="#0093FF" />
          
          {/* Белый прямоугольник с тенью */}
          <rect x="15" y="15" width="70" height="70" rx="10" fill="white" />
          <rect x="16" y="18" width="67" height="65" rx="9" fill="#F5F5F5" opacity="0.3" /> {/* Тень справа */}
          
          {/* Буква W - точно как на логотипе */}
          <path
            d="M20 30 L28 70 L33 70 L40 40 L47 70 L52 70 L60 30"
            fill="#222222"
          />
          
          {/* Буква e - как на логотипе */}
          <path
            d="M75 52 A12 12 0 0 0 63 64 A12 12 0 0 0 75 76 L75 72 A8 8 0 0 1 67 64 A8 8 0 0 1 75 56 Z"
            fill="#222222"
          />
          <path 
            d="M75 64 L63 64" 
            stroke="#222222" 
            strokeWidth="6"
            strokeLinecap="round" 
          />
        </svg>
        <span className={`ml-2 ${textSizes[size]} font-bold text-blue-600 dark:text-blue-400`}>weproject</span>
    </Link>
  );
}
