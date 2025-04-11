import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Menu, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveReturnUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <nav className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700/20 sticky top-0 z-50">
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
                      ? "border-primary text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
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
                      ? "border-primary text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
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
                  className="text-gray-700 dark:text-gray-300"
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
                  className="text-gray-700 dark:text-gray-300"
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
                
                <Link href="/messages">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    aria-label="Сообщения"
                    className="relative h-8 w-8 rounded-md text-gray-700 dark:text-gray-300 mr-1"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>
                
                <NotificationDropdown />
                
                <div className="relative group">
                  <Link href="/dashboard">
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600 p-0 border-2 border-gray-200 dark:border-gray-500">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user.avatar || undefined} 
                          alt={user.fullName || "Аватар пользователя"} 
                        />
                        <AvatarFallback>
                          {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </Link>
                  <div className="invisible group-hover:visible absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:delay-0 delay-200">
                    <div className="py-1">
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none dark:text-gray-200">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Личный кабинет
                      </Link>
                      <Link href="/messages" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span>Сообщения</span>
                        </div>
                      </Link>

                      {user?.isAdmin && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Админ-панель
                        </Link>
                      )}
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      >
                        {logoutMutation.isPending ? "Выход..." : "Выйти"}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Переключатель темы */}
                <div className="ml-2">
                  <ThemeToggle />
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
                  className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                  onClick={() => navigateToAuth()}
                >
                  Регистрация
                </Button>
                {/* Переключатель темы для неавторизованного пользователя */}
                <div className="ml-2">
                  <ThemeToggle />
                </div>
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
              className="text-gray-500 dark:text-gray-400"
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
        <div className="sm:hidden bg-white dark:bg-gray-800">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                href={link.href} 
                key={link.href}
                className={`${
                  (link.exact ? location === link.href : location.startsWith(link.href))
                    ? "bg-primary-50 dark:bg-primary/20 border-primary text-primary dark:text-primary-foreground"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
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
                    ? "bg-primary-50 dark:bg-primary/20 border-primary text-primary dark:text-primary-foreground"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <div className="rounded-full dark:bg-gray-700 p-1 border-2 border-gray-200 dark:border-gray-500">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={user.avatar || undefined} 
                            alt={user.fullName || "Аватар пользователя"} 
                          />
                          <AvatarFallback>
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </Link>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.fullName}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link 
                    href="/dashboard"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Личный кабинет
                  </Link>
                  <button 
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    href="/messages"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      <span>Сообщения</span>
                    </div>
                  </Link>

                  {user?.isAdmin && (
                    <Link 
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Админ-панель
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {logoutMutation.isPending ? "Выход..." : "Выйти"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-4">
                <button 
                  className="block w-full text-left py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToAuth();
                  }}
                >
                  Войти
                </button>
                <button 
                  className="block w-full text-left py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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