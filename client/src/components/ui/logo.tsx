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
        <img 
          src="/assets/logo.png" 
          alt="weproject logo"
          className={`w-auto ${sizeClasses[size]}`}
        />
        <span className={`ml-2 ${textSizes[size]} font-bold text-primary dark:text-primary animate-[slideInFromLeft_1.2s_cubic-bezier(0.25,0.1,0.25,1.0)_forwards] origin-left`}>weproject</span>
    </Link>
  );
}
