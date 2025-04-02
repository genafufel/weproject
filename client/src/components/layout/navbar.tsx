import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveReturnUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Функция для навигации и сохранения текущего URL перед авторизацией
  const navigateToAuth = () => {
    saveReturnUrl(location);
    setLocation("/auth");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation links for both desktop and mobile
  const navLinks = [
    { href: "/projects", label: "Проекты", exact: false },
    { href: "/talent", label: "Сотрудники", exact: false },
  ];

  // Additional links for authenticated users (пустой массив, так как мы убираем эти ссылки из верхней панели)
  const authLinks: { href: string; label: string }[] = [];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link 
                  href={link.href} 
                  key={link.href}
                  className={`${
                    (link.exact ? location === link.href : location.startsWith(link.href))
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.label}
                </Link>
              ))}
              
              {user && authLinks.map((link) => (
                <Link 
                  href={link.href} 
                  key={link.href}
                  className={`${
                    location.startsWith(link.href)
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  className="text-gray-700"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.pathname = "/dashboard";
                    url.searchParams.set('tab', 'resumes');
                    window.history.pushState({}, '', url);
                    
                    if (window.location.pathname === '/dashboard') {
                      // Если уже на странице dashboard, создаем событие для обновления вкладки
                      const event = new CustomEvent('tabchange', { detail: { tab: 'resumes' } });
                      window.dispatchEvent(event);
                    } else {
                      // Иначе переходим на dashboard
                      window.location.href = url.toString();
                    }
                  }}
                >
                  Мои резюме
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-gray-700"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.pathname = "/dashboard";
                    url.searchParams.set('tab', 'projects');
                    window.history.pushState({}, '', url);
                    
                    if (window.location.pathname === '/dashboard') {
                      // Если уже на странице dashboard, создаем событие для обновления вкладки
                      const event = new CustomEvent('tabchange', { detail: { tab: 'projects' } });
                      window.dispatchEvent(event);
                    } else {
                      // Иначе переходим на dashboard
                      window.location.href = url.toString();
                    }
                  }}
                >
                  Мои проекты
                </Button>
                <NotificationDropdown />
                
                <div className="relative group">
                  <Link href="/dashboard">
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.avatar || undefined} 
                          alt={user.fullName || "Аватар пользователя"} 
                        />
                        <AvatarFallback>
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </Link>
                  <div className="invisible group-hover:visible absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:delay-0 delay-200">
                    <div className="py-1">
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Личный кабинет
                      </Link>
                      <Link href="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Сообщения
                      </Link>
                      <Link href="/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Центр уведомлений
                      </Link>
                      <Link href="/simple-create-project" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Создать проект (простая форма)
                      </Link>
                      {user?.isAdmin && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Админ-панель
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      >
                        {logoutMutation.isPending ? "Выход..." : "Выйти"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button 
                  variant="default" 
                  onClick={() => navigateToAuth()}
                >
                  Войти
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
                  onClick={() => navigateToAuth()}
                >
                  Регистрация
                </Button>
              </>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Main menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                href={link.href} 
                key={link.href}
                className={`${
                  (link.exact ? location === link.href : location.startsWith(link.href))
                    ? "bg-primary-50 border-primary text-primary"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {user && authLinks.map((link) => (
              <Link 
                href={link.href} 
                key={link.href}
                className={`${
                  location.startsWith(link.href)
                    ? "bg-primary-50 border-primary text-primary"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.avatar || undefined} 
                          alt={user.fullName || "Аватар пользователя"} 
                        />
                        <AvatarFallback>
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.fullName}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link 
                    href="/dashboard"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Личный кабинет
                  </Link>
                  <button 
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const url = new URL(window.location.href);
                      url.pathname = "/dashboard";
                      url.searchParams.set('tab', 'resumes');
                      window.history.pushState({}, '', url);
                      
                      if (window.location.pathname === '/dashboard') {
                        // Если уже на странице dashboard, создаем событие для обновления вкладки
                        const event = new CustomEvent('tabchange', { detail: { tab: 'resumes' } });
                        window.dispatchEvent(event);
                      } else {
                        // Иначе переходим на dashboard
                        window.location.href = url.toString();
                      }
                    }}
                  >
                    Мои резюме
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const url = new URL(window.location.href);
                      url.pathname = "/dashboard";
                      url.searchParams.set('tab', 'projects');
                      window.history.pushState({}, '', url);
                      
                      if (window.location.pathname === '/dashboard') {
                        // Если уже на странице dashboard, создаем событие для обновления вкладки
                        const event = new CustomEvent('tabchange', { detail: { tab: 'projects' } });
                        window.dispatchEvent(event);
                      } else {
                        // Иначе переходим на dashboard
                        window.location.href = url.toString();
                      }
                    }}
                  >
                    Мои проекты
                  </button>
                  <Link 
                    href="/simple-create-project"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Создать проект (просто)
                  </Link>
                  <Link 
                    href="/messages"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Сообщения
                  </Link>
                  <Link 
                    href="/notifications"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Центр уведомлений
                  </Link>
                  {user?.isAdmin && (
                    <Link 
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Админ-панель
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    {logoutMutation.isPending ? "Выход..." : "Выйти"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-4">
                <button 
                  className="block w-full text-left py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToAuth();
                  }}
                >
                  Войти
                </button>
                <button 
                  className="block w-full text-left py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToAuth();
                  }}
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
