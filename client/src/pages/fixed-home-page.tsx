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
    title: "Искусство и дизайн",
    description: "Графический дизайн, UX/UI, анимация, иллюстрация и визуальное искусство.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E1F8F8'/%3E%3Ccircle cx='120' cy='100' r='40' fill='%2300BCD4' opacity='0.8'/%3E%3Ccircle cx='200' cy='100' r='40' fill='%2300BCD4' opacity='0.6'/%3E%3Ccircle cx='280' cy='100' r='40' fill='%2300BCD4' opacity='0.4'/%3E%3C/svg%3E",
    count: 145,
  },
  {
    title: "Организация мероприятий",
    description: "Планирование мероприятий, координация, маркетинг и продюсирование.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23F3E5F5'/%3E%3Cpath d='M100,150 L170,90 L230,120 L300,70' stroke='%239C27B0' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='100' cy='150' r='8' fill='%239C27B0'/%3E%3Ccircle cx='170' cy='90' r='8' fill='%239C27B0'/%3E%3Ccircle cx='230' cy='120' r='8' fill='%239C27B0'/%3E%3Ccircle cx='300' cy='70' r='8' fill='%239C27B0'/%3E%3C/svg%3E",
    count: 89,
  },
  {
    title: "Финансы и бизнес",
    description: "Бизнес-анализ, финансовое планирование, бухгалтерский учет и консалтинг.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23FFF8E1'/%3E%3Crect x='100' y='140' width='40' height='40' fill='%23FFA000' opacity='0.2'/%3E%3Crect x='150' y='120' width='40' height='60' fill='%23FFA000' opacity='0.4'/%3E%3Crect x='200' y='100' width='40' height='80' fill='%23FFA000' opacity='0.6'/%3E%3Crect x='250' y='80' width='40' height='100' fill='%23FFA000' opacity='0.8'/%3E%3Cpath d='M100,80 L280,80' stroke='%23FFA000' stroke-width='2' stroke-dasharray='5,5'/%3E%3C/svg%3E",
    count: 124,
  },
  {
    title: "Маркетинг и реклама",
    description: "SMM, контент-маркетинг, PR, таргетированная и контекстная реклама.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23FFEBEE'/%3E%3Cpath d='M200,60 L200,140 M150,90 L250,90' stroke='%23F44336' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='200' cy='170' r='10' fill='%23F44336'/%3E%3Cpath d='M130,60 A70,70 0 0 1 270,60' stroke='%23F44336' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
    count: 112,
  },
  {
    title: "Образование и наука",
    description: "Обучающие проекты, исследования, педагогика, воркшопы и тренинги.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E8F5E9'/%3E%3Crect x='120' y='80' width='160' height='100' fill='%234CAF50' opacity='0.1' rx='5'/%3E%3Cpath d='M150,80 L150,40 L250,40 L250,80' stroke='%234CAF50' stroke-width='4' fill='none'/%3E%3Cpath d='M130,60 L270,60' stroke='%234CAF50' stroke-width='2' stroke-dasharray='5,5'/%3E%3Ccircle cx='200' cy='130' r='25' fill='%234CAF50' opacity='0.3'/%3E%3C/svg%3E",
    count: 95,
  },
  {
    title: "Музыка и аудио",
    description: "Создание музыки, звукозапись, подкасты, аранжировка и звуковой дизайн.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23EDE7F6'/%3E%3Cpath d='M140,60 L140,140 M160,70 L160,130 M180,90 L180,110 M220,80 L220,120 M240,70 L240,130 M260,60 L260,140' stroke='%239C27B0' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='140' cy='150' r='10' fill='%239C27B0' opacity='0.2'/%3E%3Ccircle cx='260' cy='150' r='10' fill='%239C27B0' opacity='0.2'/%3E%3C/svg%3E",
    count: 78,
  },
  {
    title: "Медиа и журналистика",
    description: "Создание контента, журналистика, блоггинг, социальные медиа.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E3F2FD'/%3E%3Crect x='120' y='70' width='160' height='100' rx='5' fill='%23039BE5' opacity='0.1'/%3E%3Cpath d='M140,90 L260,90 M140,110 L200,110 M140,130 L220,130' stroke='%23039BE5' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='230' cy='50' r='15' fill='%23039BE5' opacity='0.3'/%3E%3C/svg%3E",
    count: 67,
  },
];

// Steps for How It Works section
const steps = [
  {
    number: "1",
    title: "Расскажите о себе",
    description: "Создайте яркий профиль, который выделит ваши таланты, достижения и стремления."
  },
  {
    number: "2",
    title: "Найдите свой путь",
    description: "Используйте удобный поиск, чтобы найти проекты или специалистов, идеально соответствующих вашим требованиям."
  },
  {
    number: "3",
    title: "Начните диалог",
    description: "Обсудите детали, задайте вопросы и определите условия сотрудничества через встроенный мессенджер."
  },
  {
    number: "4",
    title: "Реализуйте потенциал",
    description: "Совместными усилиями воплотите идеи в реальность, развивая свои навыки и расширяя портфолио."
  }
];

export default function HomePage() {
  const { user } = useAuth();
  
  // Переменная для отслеживания времени последней прокрутки
  const [lastWheelTime, setLastWheelTime] = useState(0);
  
  // Карусель для категорий
  // Явно указываем тип align как 'start' вместо строки для корректной типизации
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true, // Включаем зацикливание
    duration: 30, // Длительность анимации для плавного перемещения (но зацикливание будет мгновенным)
    skipSnaps: false, // Включаем привязку к слайдам для более плавного скролла
    dragFree: true // Включаем свободную прокрутку для плавности
  });
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
    setLastWheelTime(Date.now());
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
    setLastWheelTime(Date.now());
  }, [emblaApi]);
  
  // Инициализируем анимации при прокрутке
  useEffect(() => {
    const cleanup = setupScrollAnimations();
    return cleanup;
  }, []);

  // Функция для плавной прокрутки к следующей секции
  const scrollToNextSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Используем простую функцию прокрутки без перехвата событий колеса мыши
  useEffect(() => {
    // Обработка хэша URL для прокрутки к секции при загрузке страницы
    const handleInitialScroll = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const section = document.getElementById(hash);
        if (section) {
          setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };
    
    // Выполняем начальную прокрутку
    handleInitialScroll();
  }, []);
  
  // Упрощенный обработчик для карусели без анимации зацикливания
  useEffect(() => {
    if (!emblaApi) return;
    
    // Сделаем автоматическую адаптацию под количество видимых слайдов
    const onResize = () => {
      emblaApi.reInit();
    };

    // Обнаруживаем момент перехода через границу при зацикливании и отключаем анимацию
    const disableLoopAnimation = () => {
      // Проверяем, находимся ли мы на границе (первый или последний слайд)
      const index = emblaApi.selectedScrollSnap();
      const count = emblaApi.slideNodes().length;
      const isAtBoundary = index === 0 || index === count - 1;
      
      // Если мы на границе, отключаем анимацию для мгновенного перехода
      if (isAtBoundary) {
        const container = emblaApi.containerNode();
        container.style.transition = 'none';
        
        // Только для границы отключаем анимацию, чтобы обычная прокрутка оставалась плавной
        const slideNodes = emblaApi.slideNodes();
        slideNodes.forEach(node => {
          node.style.transition = 'none';
        });
        
        // Через небольшую задержку восстанавливаем плавную анимацию
        setTimeout(() => {
          container.style.transition = '';
          slideNodes.forEach(node => {
            node.style.transition = '';
          });
        }, 50);
      }
    };
    
    // Настраиваем карусель при инициализации
    const setupCarousel = () => {
      disableLoopAnimation();
      
      // Настраиваем моментальный переход при достижении границы
      emblaApi.on('select', () => {
        disableLoopAnimation();
      });
    };
    
    // Инициализируем настройки
    setupCarousel();
    emblaApi.on('reInit', setupCarousel);
    
    window.addEventListener('resize', onResize);
    
    return () => {
      window.removeEventListener('resize', onResize);
      emblaApi.off('reInit', setupCarousel);
      emblaApi.off('select', disableLoopAnimation);
    };
  }, [emblaApi]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden bg-gray-50 fullscreen-section">
          {/* Анимированный фон */}
          <div className="absolute inset-0 overflow-hidden animate-fade-in">
            <img 
              src="/images/hero-background-new.jpeg" 
              alt="Фоновое изображение" 
              className="w-full h-full object-cover animate-[zoomPan_30s_ease-in-out_infinite]"
              style={{ transformOrigin: 'center center' }}
            />
            {/* Затемнение с эффектом пульсации */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-black/20 to-black/10 animate-[slowFade_8s_ease-in-out_infinite]"></div>
            
            {/* Только затемняющий градиент для фона, без декоративных элементов */}
          </div>
          
          {/* Контейнер для контента */}
          <div className="relative h-full z-10 pt-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="bg-white/50 backdrop-blur-md rounded-lg shadow-xl overflow-hidden py-10 px-12 max-w-2xl animate-[scaleIn_0.7s_ease-out_forwards] origin-bottom-left">
                <div className="text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl animate-fade-in">
                    <span className="block gradient-text">Соедини идею</span>
                    <span className="block gradient-text">и реализацию</span>
                  </h1>
                  <p className="mt-6 text-lg text-gray-600 animate-fade-in animate-delay-200">
                    Раскройте свой потенциал на платформе, соединяющей талантливых людей и инновационные проекты. Получите ценный опыт или найдите единомышленников для воплощения самых смелых идей.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in animate-delay-300">
                    <Link href="/projects">
                      <Button size="lg" className="px-8 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                        Проекты
                      </Button>
                    </Link>
                    <Link href={user ? "/create-project" : "/auth"}>
                      <Button size="lg" variant="outline" className="px-8 bg-white/80 backdrop-blur-sm hover:bg-white/100 text-gray-800 border-gray-300 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                        Разместить проект
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center animate-fade-in animate-delay-500">
              <button 
                onClick={() => scrollToNextSection('categories')}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
            </div>
          </div>
        </section>
        
        {/* Разделитель между секциями */}
        <div className="h-4 bg-blue-500/40 backdrop-blur-md shadow-md relative z-20"></div>
        
        {/* Concept Section - Секция с описанием концепции */}
        <section id="concept" className="bg-white dark:bg-gray-900 py-20 relative fullscreen-section section-animate overflow-hidden">
          {/* Добавляем кнопку прокрутки к следующему разделу */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <button 
              onClick={() => scrollToNextSection('categories')}
              className="bg-blue-500/40 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 border border-blue-200/30"
            >
              <ChevronDownIcon className="h-6 w-6 animate-bounce" />
            </button>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Наша миссия</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Соединяем таланты и возможности
                </p>
                <div className="mt-6 prose prose-lg dark:prose-invert">
                  <p>
                    Платформа <span className="font-semibold text-primary">weproject</span> создана для решения двух ключевых проблем:
                  </p>
                  <ul>
                    <li className="dark:text-gray-300">
                      <span className="font-medium">Для студентов и специалистов без опыта</span> — возможность получить реальный опыт работы, создать портфолио и развить навыки в реальных проектах.
                    </li>
                    <li className="dark:text-gray-300">
                      <span className="font-medium">Для стартапов и проектов с ограниченным бюджетом</span> — возможность найти талантливых сотрудников и собрать команду единомышленников для реализации идей.
                    </li>
                  </ul>
                  <p className="dark:text-gray-300">
                    Мы верим, что каждый начинающий специалист заслуживает шанса проявить себя, а каждый инновационный проект — найти свою команду. Наша задача — создать экосистему, где энтузиазм и креативность встречаются с возможностями и идеями.
                  </p>
                </div>
                <div className="mt-8">
                  <Link href="/projects" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors">
                    Найти проект
                  </Link>
                  <Link href="/talent" className="ml-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white border-primary hover:bg-gray-50 transition-colors">
                    Найти таланты
                  </Link>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-lg blur-xl opacity-70"></div>
                  <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Карьерные возможности</div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">S</div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Студент</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Ищет первый опыт</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                        </svg>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">W</div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">weproject</div>
                            <div className="text-xs text-primary">Соединяет таланты и идеи</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                        </svg>
                      </div>
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-600 font-bold">P</div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Проект</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Нуждается в талантах</div>
                          </div>
                        </div>
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
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl gradient-text inline-block">
                Откройте мир возможностей
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
            
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={() => scrollToNextSection('steps')}
                className="bg-blue-500/40 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 border border-blue-200/30"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
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
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl gradient-text inline-block whitespace-nowrap">Четыре шага к цели</p>
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
                        {index === 1 && <img src="/uploads/step2-font-design.jpg" alt={step.title} className="w-full h-full object-cover object-center" />}
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
            
            {/* Отступ для раздела кнопок */}
            <div className="mt-16"></div>
            
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={() => scrollToNextSection('cta')}
                className="bg-blue-500/40 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-full p-2 shadow-lg transition-all hover:shadow-xl hover:scale-110 border border-blue-200/30"
              >
                <ChevronDownIcon className="h-5 w-5 animate-bounce" />
              </button>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section id="cta" className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 relative overflow-hidden py-0 section-animate fullscreen-section h-screen min-h-screen flex items-center justify-center">
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
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
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="block">Ваше будущее начинается здесь</span>
                <span className="block text-blue-100">Станьте частью сообщества профессионалов и новаторов</span>
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl">
                Присоединяйтесь к сотням студентов и проектов уже сегодня для создания успешных историй сотрудничества.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:mt-0 lg:flex-shrink-0 animate-fade-in animate-delay-200">
              <div className="inline-flex rounded-md shadow">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button variant="secondary" size="lg" className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white/100 transform transition-all duration-300 hover:scale-105">
                    {user ? "В личный кабинет" : "Создать аккаунт"}
                  </Button>
                </Link>
              </div>
              <div className="inline-flex rounded-md shadow">
                <Link href="/projects">
                  <Button variant="default" size="lg" className="bg-blue-600/60 backdrop-blur-sm border-2 border-white/30 hover:bg-blue-700/80 hover:border-white/60 transform transition-all duration-300 hover:scale-105">
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