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
    <Link href="/">
      <a className="flex items-center">
        <svg
          className={`w-auto ${sizeClasses[size]}`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="20" fill="currentColor" className="text-primary" />
          <path
            d="M30 30H70M30 50H70M30 70H50"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={`ml-2 ${textSizes[size]} font-bold text-primary`}>StartupMatch</span>
      </a>
    </Link>
  );
}
