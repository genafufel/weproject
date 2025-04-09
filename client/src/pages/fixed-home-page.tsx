import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { setupScrollAnimations } from "@/lib/scroll-animation";
import useEmblaCarousel from 'embla-carousel-react';

// Fields for categories section
const fields = [
  {
    title: "IT и технологии",
    description: "Веб-разработка, мобильные приложения, программная инженерия и многое другое.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E1F5FE'/%3E%3Cpath d='M140,100 L100,140 L140,180 M260,100 L300,140 L260,180 M220,60 L180,180' stroke='%232196F3' stroke-width='10' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
    count: 287,
  },
  {
    title: "Дизайн",
    description: "UI/UX, графический дизайн, иллюстрации, брендинг, 3D-моделирование.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23FFEBEE'/%3E%3Ccircle cx='150' cy='100' r='40' fill='%23E91E63'/%3E%3Crect x='210' y='60' width='80' height='80' fill='%239C27B0'/%3E%3Cpath d='M150,60 L150,140 M130,100 L170,100' stroke='white' stroke-width='6'/%3E%3Cpath d='M210,60 L290,140 M210,140 L290,60' stroke='white' stroke-width='6'/%3E%3C/svg%3E",
    count: 164,
  },
  {
    title: "Маркетинг",
    description: "Цифровой маркетинг, SMM, контент-маркетинг, SEO, аналитика.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E8F5E9'/%3E%3Cpath d='M100,140 L100,180 L140,180 L140,120 L180,120 L180,180 L220,180 L220,100 L260,100 L260,180 L300,180 L300,60' stroke='%234CAF50' stroke-width='10' fill='none'/%3E%3C/svg%3E",
    count: 126,
  },
  {
    title: "Бизнес",
    description: "Стартапы, управление проектами, финансы, бизнес-аналитика.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23FFF3E0'/%3E%3Crect x='100' y='120' width='40' height='60' fill='%23FF9800'/%3E%3Crect x='160' y='80' width='40' height='100' fill='%23FF9800'/%3E%3Crect x='220' y='60' width='40' height='120' fill='%23FF9800'/%3E%3Crect x='280' y='100' width='40' height='80' fill='%23FF9800'/%3E%3Cpath d='M100,80 L300,80' stroke='%23FF9800' stroke-width='4' stroke-dasharray='10,5'/%3E%3C/svg%3E",
    count: 98,
  },
  {
    title: "Образование",
    description: "Онлайн-курсы, обучающие платформы, менторство, образовательные технологии.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E3F2FD'/%3E%3Cpath d='M200,60 L280,100 L200,140 L120,100 Z' fill='%232962FF'/%3E%3Cpath d='M150,120 L150,160 L250,160 L250,120' stroke='%232962FF' stroke-width='8' fill='none'/%3E%3Cpath d='M200,140 L200,160' stroke='%232962FF' stroke-width='8'/%3E%3C/svg%3E",
    count: 112,
  },
  {
    title: "Исследования",
    description: "Научные исследования, R&D проекты, инновации, ИИ и машинное обучение.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23EDE7F6'/%3E%3Ccircle cx='200' cy='90' r='30' fill='none' stroke='%236200EA' stroke-width='6'/%3E%3Ccircle cx='150' cy='140' r='20' fill='none' stroke='%236200EA' stroke-width='6'/%3E%3Ccircle cx='250' cy='140' r='20' fill='none' stroke='%236200EA' stroke-width='6'/%3E%3Cpath d='M200,120 L200,140 M250,140 L170,140 M150,140 L130,140' stroke='%236200EA' stroke-width='6'/%3E%3C/svg%3E",
    count: 73,
  },
  {
    title: "Медицина",
    description: "Здравоохранение, медицинские технологии, телемедицина, биотехнологии.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E1F5FE'/%3E%3Ccircle cx='200' cy='100' r='60' fill='none' stroke='%2300B0FF' stroke-width='8'/%3E%3Cpath d='M200,70 L200,130 M170,100 L230,100' stroke='%2300B0FF' stroke-width='8'/%3E%3C/svg%3E",
    count: 86,
  },
  {
    title: "Архитектура",
    description: "Архитектурное проектирование, городское планирование, дизайн интерьеров.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23FAFAFA'/%3E%3Cpath d='M150,160 L200,70 L250,160 Z' fill='none' stroke='%23607D8B' stroke-width='6'/%3E%3Cpath d='M130,160 L270,160' stroke='%23607D8B' stroke-width='6'/%3E%3Crect x='190' y='130' width='20' height='30' fill='%23607D8B'/%3E%3C/svg%3E",
    count: 59,
  }
];

// Steps for how it works section
const steps = [
  {
    number: "1",
    title: "Создайте профиль",
    description: "Зарегистрируйте аккаунт и заполните свой профиль, указав навыки, опыт и интересы. Загрузите портфолио для большей привлекательности."
  },
  {
    number: "2",
    title: "Разместите проект",
    description: "Создайте описание вашего проекта, укажите требуемые навыки и условия сотрудничества. Или найдите интересный проект среди опубликованных."
  },
  {
    number: "3",
    title: "Подберите команду",
    description: "Получайте отклики от заинтересованных специалистов или отправляйте заявки на участие в интересующих вас проектах."
  },
  {
    number: "4",
    title: "Начните сотрудничество",
    description: "Общайтесь с выбранными кандидатами, обсуждайте детали и начинайте совместную работу над проектом."
  }
];

export default function HomePage() {
  const { user } = useAuth();
  
  // Переменная для отслеживания времени последней прокрутки
  const [lastWheelTime, setLastWheelTime] = useState(0);
  
  // Карусель для категорий с улучшенной плавностью при зацикливании
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true, // Включаем зацикливание
    duration: 30, // Длительность анимации для плавного перемещения (30мс для быстрого отклика)
    align: 'start', // Выравнивание слайдов с левой стороны
    skipSnaps: false, // Включаем привязку к слайдам для более плавного скролла
    dragFree: false, // Отключаем свободную прокрутку для привязки к слайдам
    watchDrag: false, // Отключаем наблюдение за перетаскиванием для плавного зацикливания
    slidesToScroll: 1, // Прокручиваем только по одному слайду для плавности
    inViewThreshold: 0.5 // Половина видимости слайда для определения активности
  });
  
  // Функции для карусели
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  // Функция для обработки прокрутки колесиком с троттлингом
  const handleWheel = useCallback((e: WheelEvent) => {
    const now = Date.now();
    
    if (now - lastWheelTime > 500) {
      // Получаем текущую секцию
      const sections = document.querySelectorAll('section.fullscreen-section');
      let currentSectionIndex = -1;
      
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSectionIndex = index;
        }
      });
      
      if (currentSectionIndex !== -1) {
        // Определяем следующую секцию в зависимости от направления прокрутки
        let targetIndex = currentSectionIndex;
        
        if (e.deltaY > 0 && currentSectionIndex < sections.length - 1) {
          targetIndex = currentSectionIndex + 1;
        } else if (e.deltaY < 0 && currentSectionIndex > 0) {
          targetIndex = currentSectionIndex - 1;
        }
        
        if (targetIndex !== currentSectionIndex) {
          e.preventDefault();
          sections[targetIndex].scrollIntoView({ behavior: 'smooth' });
          setLastWheelTime(now);
        }
      }
    }
  }, [lastWheelTime]);
  
  useEffect(() => {
    // Инициализируем анимации при скролле
    const cleanup = setupScrollAnimations();
    
    // Добавляем обработчик прокрутки колесиком
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      cleanup();
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden bg-gray-50 fullscreen-section">
          {/* Видео-фон с наложением градиента для темной темы */}
          <div className="absolute inset-0 bg-cover bg-center bg-opacity-50 dark:bg-opacity-30 overflow-hidden">
            <div className="w-full h-full">
              {/* Видео-фон с уменьшенной яркостью для светлой темы */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover dark:opacity-70 light:opacity-30"
                style={{ filter: 'brightness(0.9) contrast(1.1)' }}
              >
                <source src="/uploads/White gray topographic texture wave background animation in 4K _ Unwind Free Stock Video.mp4" type="video/mp4" />
              </video>
              {/* Градиентное наложение для улучшения контраста с контентом */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/20 to-black/10 animate-[slowFade_8s_ease-in-out_infinite]"></div>
            </div>
          </div>
          
          {/* Основной контент героя */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="min-h-screen flex flex-col items-center justify-center text-center relative z-10 py-28">
              <div className="animate-appear">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                  <span className="inline-block text-gray-900 dark:text-white">
                    Современная платформа<br />для поиска
                  </span>
                  <span className="inline-block mt-3 animate-gradient-text text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary to-blue-600 dark:from-white dark:via-blue-300 dark:to-primary">
                    талантов и проектов
                  </span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-600 dark:text-gray-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Находите идеальные проекты для развития своих навыков
                  или талантливых специалистов для реализации ваших идей
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
                  <div className="rounded-md shadow cta-element">
                    <Link href="/projects">
                      <Button variant="default" size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto animate-button-pulse">
                        Найти проект
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 cta-element">
                    <Link href="/talent">
                      <Button variant="secondary" size="lg" className="font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto animate-button-pulse">
                        Найти таланты
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Индикатор прокрутки */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <ChevronDownIcon className="h-8 w-8 text-primary opacity-70" />
              </div>
            </div>
          </div>
        </section>
        
        <div className="h-4 bg-blue-500/40 backdrop-blur-md shadow-md relative z-20"></div>
        
        {/* Concept Section */}
        <section id="concept" className="bg-white dark:bg-gray-900 py-20 relative fullscreen-section section-animate overflow-hidden">
          {/* Декоративные элементы для фона */}
          <div className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Наши преимущества</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl">
                <span className="inline-block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary to-blue-600 dark:from-white dark:via-blue-300 dark:to-primary">
                  Эффективная платформа для совместной работы
                </span>
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
                Мы облегчаем взаимодействие между талантами и инновационными проектами
              </p>
            </div>
            
            <div className="mt-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              {/* Иллюстрация (визуализация концепции платформы) */}
              <div className="relative animate-float-slow">
                <div className="relative lg:aspect-w-16 lg:aspect-h-9">
                  {/* Эффектная карточка с подсветкой */}
                  <div className="p-4 md:p-6 backdrop-blur-md rounded-2xl">
                    <div className="relative">
                      {/* Gradient blur effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-lg blur-xl opacity-70"></div>
                      {/* Terminal-like UI */}
                      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Terminal header */}
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center">
                          <div className="flex space-x-2 mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Карьерные возможности</div>
                        </div>
                        {/* Terminal content */}
                        <div className="p-4 text-sm">
                          <div className="animate-fade-in space-y-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">S</div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Студент</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Ищет первый опыт</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="animate-fade-in delay-150 space-y-4">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-sm">W</div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">weproject</div>
                                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Соединяет таланты и идеи</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="animate-fade-in delay-300 space-y-4">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-500/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold shadow-sm">P</div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">Проект</div>
                                  <div className="text-xs font-medium text-green-600 dark:text-green-400">Нуждается в талантах</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Текстовое описание и особенности */}
              <div className="mt-10 -mx-4 lg:mt-0">
                <div className="space-y-6 sm:space-y-8">
                  {/* Feature 1 */}
                  <div className="animate-fade-in-up">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 dark:bg-primary/20 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Прямое взаимодействие</h3>
                        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                          Мгновенная связь между талантами и проектами через встроенную систему сообщений. Прямое общение без посредников.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="animate-fade-in-up delay-150">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 dark:bg-primary/20 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Безопасность и надежность</h3>
                        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                          Проверенные проекты и пользователи. Безопасные сделки и прозрачные условия сотрудничества.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="animate-fade-in-up delay-300">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 dark:bg-primary/20 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Быстрый старт</h3>
                        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                          Удобный интерфейс и интуитивный процесс поиска. Начните сотрудничество за считанные минуты.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section id="categories" className="bg-white dark:bg-gray-900 py-8 fullscreen-section section-animate relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Сферы деятельности</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl">
                <span className="inline-block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary to-blue-600 dark:from-white dark:via-blue-300 dark:to-primary">
                  Откройте мир возможностей
                </span>
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
                Исследуйте разнообразные проекты и найдите именно то, что соответствует вашим интересам.
              </p>
            </div>
            
            <div className="mt-6 relative">
              {/* Кнопки навигации */}
              <div className="flex justify-end mb-4 gap-2">
                <button 
                  onClick={scrollPrev}
                  className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                  aria-label="Предыдущий слайд"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={scrollNext}
                  className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                  aria-label="Следующий слайд"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Карусель с маскированием для скрытия переходящих элементов */}
              <div className="relative">
                {/* Маска слева - более широкая для уверенного маскирования переходящих карточек */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/90 dark:from-gray-900 dark:via-gray-900/90 to-transparent z-10 pointer-events-none"></div>
                {/* Маска справа - более широкая для уверенного маскирования переходящих карточек */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/90 dark:from-gray-900 dark:via-gray-900/90 to-transparent z-10 pointer-events-none"></div>
                
                {/* Карусель */}
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {fields.map((field, index) => (
                      <div 
                        key={field.title} 
                        className="flex-[0_0_calc(100%-1rem)] sm:flex-[0_0_calc(45%-1rem)] md:flex-[0_0_calc(30%-1rem)] xl:flex-[0_0_calc(23%-1rem)] group relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-blue-900 hover:border-primary/60 dark:hover:border-primary/60 rounded-xl shadow-md hover:shadow-lg overflow-hidden hover-card transition-all duration-300 mx-2"
                      >
                        <div className="aspect-w-3 aspect-h-2 overflow-hidden">
                          <img 
                            src={field.image} 
                            alt={field.title} 
                            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Синее выделение по краям и снизу вместо затемнения */}
                          <div className="absolute inset-0 border-b-2 border-primary/0 group-hover:border-primary/80 transition-all duration-300"></div>
                        </div>
                        <div className="p-4 relative">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            <Link href={`/projects?field=${encodeURIComponent(field.title)}`} className="focus:outline-none gradient-border inline-block">
                              {field.title}
                            </Link>
                          </h3>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {field.description}
                          </p>
                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm font-medium text-primary">
                              {field.count} активных проектов
                            </span>
                            <Link 
                              href={`/projects?field=${encodeURIComponent(field.title)}`}
                              className="text-sm font-medium text-primary hover:text-blue-700 transition-all duration-300 hover:translate-x-1 group flex items-center"
                            >
                              Показать все <span aria-hidden="true" className="ml-1 transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="steps" className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative section-animate overflow-hidden py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
            {/* Заголовок слева */}
            <div className="flex flex-col items-start text-left">
              <div className="max-w-md">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Путь к успеху</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl whitespace-nowrap">
                  <span className="inline-block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-primary to-blue-600 dark:from-white dark:via-blue-300 dark:to-primary">
                    Четыре шага к цели
                  </span>
                </p>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 leading-snug">
                  Начните своё путешествие прямо сейчас - будь вы талантливый специалист или создатель проекта.
                </p>
              </div>
            </div>
            
            {/* Новый дизайн с горизонтальной "рекой" прогресса */}
            <div className="mt-16 relative">
              {/* Линия прогресса */}
              <div className="hidden md:block absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-blue-200 via-primary to-blue-400 dark:from-blue-900 dark:via-primary dark:to-blue-700 opacity-60 rounded-full"></div>
              
              {/* Карточки */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
                {steps.map((step, index) => (
                  <div 
                    key={step.number}
                    className="relative animate-fade-in"
                    style={{ animationDelay: `${200 + index * 150}ms` }}
                  >
                    {/* Соединительные линии между шагами (только между карточками) */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-300 dark:from-blue-700 dark:to-blue-600 z-10"></div>
                    )}
                    
                    {/* Карточка шага */}
                    <div className={`
                      bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl 
                      border border-blue-100 dark:border-blue-800/30 p-6
                      transform transition-all duration-300 hover:-translate-y-1
                      relative overflow-hidden flex flex-col h-full group
                      ${index === 0 || index === 2 ? 'md:mt-0' : 'md:mt-24'} pb-4
                    `}>
                      {/* Карточки без декоративных элементов в углах */}
                      
                      <div className="flex items-center mb-4">
                        {/* Круг с номером */}
                        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-primary text-white font-bold text-xl shadow-md">
                          {step.number}
                        </div>
                        
                        {/* Заголовок шага */}
                        <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                      </div>
                      
                      {/* Изображение под заголовком */}
                      <div className="w-full h-56 mb-4 rounded-md overflow-hidden shadow-md">
                        {index === 0 && <img src="/uploads/step1-portfolio.jpg" alt={step.title} className="w-full h-full object-cover object-center" />}
                        {index === 1 && <img src="/uploads/step2-artisan-work.jpg" alt={step.title} className="w-full h-full object-cover object-center" />}
                        {index === 2 && <img src="/uploads/step3-architects.jpg" alt={step.title} className="w-full h-full object-cover object-center" />}
                        {index === 3 && <img src="/uploads/step4-team-collaboration.jpg" alt={step.title} className="w-full h-full object-cover object-center" />}
                      </div>
                      
                      {/* Описание шага */}
                      <p className="text-gray-600 dark:text-gray-300 mt-2 flex-grow text-base">
                        {step.description}
                      </p>
                      
                      {/* Декоративный элемент внизу карточки с анимацией при наведении */}
                      <div className="h-1 w-1/3 bg-gradient-to-r from-primary to-blue-400 dark:from-primary dark:to-blue-600 rounded-full mt-6 transition-all duration-300 group-hover:w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Отступ для раздела */}
            <div className="mt-16"></div>
          </div>
        </section>
        
        {/* CTA Section - Always blue gradient background */}
        <section id="cta" className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 relative overflow-hidden py-0 section-animate fullscreen-section h-screen min-h-screen flex items-center justify-center">
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-20 left-[10%] w-40 h-40 rounded-full bg-white animate-float-slow"></div>
            <div className="absolute bottom-20 right-[10%] w-60 h-60 rounded-full bg-white animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white animate-pulse"></div>
            <div className="absolute top-[30%] right-[20%] w-28 h-28 rounded-lg bg-white/30 backdrop-blur-sm rotate-12 animate-rotate"></div>
            <div className="absolute bottom-[30%] left-[20%] w-24 h-24 rounded-full border-4 border-white/30 animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Градиентные тени */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-600/50 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-primary/70 to-transparent pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto py-28 px-4 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between relative z-10">
            <div className="cta-element">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="block">Ваше будущее начинается здесь</span>
                <span className="block text-blue-100">Станьте частью сообщества<br />профессионалов и новаторов</span>
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl">
                Присоединяйтесь к сотням студентов и проектов уже сегодня для создания успешных историй сотрудничества.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:mt-0 lg:flex-shrink-0 cta-element">
              <div className="inline-flex rounded-md shadow">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button variant="secondary" size="lg" className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white/100 transform transition-all duration-300 hover:scale-105 animate-button-pulse">
                    {user ? "В личный кабинет" : "Создать аккаунт"}
                  </Button>
                </Link>
              </div>
              <div className="inline-flex rounded-md shadow">
                <Link href="/projects">
                  <Button variant="default" size="lg" className="bg-blue-600/60 backdrop-blur-sm border-2 border-white/30 hover:bg-blue-700/80 hover:border-white/60 transform transition-all duration-300 hover:scale-105 animate-button-pulse">
                    Узнать больше
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}