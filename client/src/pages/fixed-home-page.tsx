import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useEffect } from "react";
import { setupScrollAnimations } from "@/lib/scroll-animation";

// Fields for categories section
const fields = [
  {
    title: "IT и технологии",
    description: "Веб-разработка, мобильные приложения, программная инженерия и многое другое.",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 287,
  },
  {
    title: "Искусство и дизайн",
    description: "Графический дизайн, UX/UI, анимация, иллюстрация и визуальное искусство.",
    image: "https://images.unsplash.com/photo-1526289034009-0240ddb68ce3?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 145,
  },
  {
    title: "Организация мероприятий",
    description: "Планирование мероприятий, координация, маркетинг и продюсирование.",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 89,
  },
  {
    title: "Финансы и бизнес",
    description: "Бизнес-анализ, финансовое планирование, бухгалтерский учет и консалтинг.",
    image: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?ixlib=rb-1.2.1&auto=format&fit=crop",
    count: 124,
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
            
            {/* Современные декоративные элементы - геометрические формы */}
            <div className="absolute inset-0 opacity-30">
              {/* Сетка диагональных линий */}
              <div className="absolute inset-0 overflow-hidden opacity-15">
                <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                  {[...Array(20)].map((_, i) => (
                    <line 
                      key={`line-1-${i}`}
                      x1={i * 50}
                      y1="0"
                      x2={i * 50 + 500}
                      y2="1000"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-blue-500/60"
                    />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <line 
                      key={`line-2-${i}`}
                      x1="1000"
                      y1={i * 50}
                      x2="0"
                      y2={i * 50 + 500}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-purple-500/60"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Геометрические фигуры вместо размытых кругов */}
              <div className="absolute top-10 left-10 w-64 h-64 border border-blue-500/40 transform rotate-12 animate-float-slow"></div>
              <div className="absolute top-1/3 right-10 w-80 h-40 bg-gradient-to-r from-purple-500/20 to-transparent animate-float" style={{animationDelay: '0.8s'}}></div>
              <div className="absolute bottom-10 left-1/4 w-40 h-40 border-4 border-indigo-500/30 transform -rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
              
              {/* Сетка из точек в углу */}
              <div className="absolute bottom-0 right-0 grid grid-cols-10 gap-4 w-80 h-80">
                {[...Array(100)].map((_, i) => (
                  <div 
                    key={`dot-${i}`} 
                    className="w-1 h-1 bg-white rounded-full"
                    style={{ 
                      opacity: Math.random() * 0.6 + 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Контейнер для контента */}
          <div className="relative flex items-center h-full z-10">
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
            <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-fade-in animate-delay-500">
              <button 
                onClick={() => scrollToNextSection('categories')}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
            </div>
          </div>
        </section>
        
        {/* Новый декоративный разделитель - острые углы */}
        <div className="relative z-10 h-16 transform -translate-y-16 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-black/30 to-blue-100/80 dark:from-black/50 dark:to-blue-950/80">
            <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path 
                d="M1200 0L0 0 892.25 114.72 1200 0z" 
                className="fill-blue-100 dark:fill-blue-950 opacity-90"
              />
              <path 
                d="M0 0L0 120 1200 120 1200 0 307.75 114.72 0 0z" 
                className="fill-blue-100 dark:fill-blue-950 opacity-80"
              />
            </svg>
          </div>
        </div>
        
        {/* Categories Section */}
        <section id="categories" className="bg-gradient-to-b from-blue-100 to-white dark:bg-gradient-to-b dark:from-blue-950 dark:to-gray-900 py-12 fullscreen-section section-animate relative overflow-hidden -mt-16">
          {/* Декоративный элемент градиентной тени сверху */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-200/90 dark:from-blue-900/80 to-transparent pointer-events-none"></div>
          
          {/* Декоративные элементы - новый дизайн */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent"></div>
          
          {/* Топографические линии в качестве декора */}
          <div className="absolute bottom-0 right-0 w-96 h-60 opacity-10 dark:opacity-20 overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {[...Array(10)].map((_, i) => (
                <path 
                  key={i}
                  d={`M0,${20 + i * 18} Q${50 + i * 10},${10 + i * 15} ${100 + i * 5},${30 + i * 10} T200,${40 + i * 12}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                />
              ))}
            </svg>
          </div>
          
          {/* Сетка из точек */}
          <div className="absolute top-20 left-20 w-80 h-80 opacity-20 dark:opacity-30">
            <div className="grid grid-cols-8 gap-4">
              {[...Array(64)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 bg-primary rounded-full"
                  style={{ 
                    opacity: Math.random() * 0.8 + 0.2,
                    transform: `scale(${Math.random() * 0.8 + 0.5})`
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Современные геометрические фигуры */}
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-primary/30 transform skew-x-12 skew-y-12 animate-float" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-20 h-4 bg-primary/20 animate-pulse" style={{animationDelay: '1.2s'}}></div>
          
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
            
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field, index) => (
                  <div 
                    key={field.title} 
                    className={`group relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-blue-900 rounded-xl shadow-md overflow-hidden hover-card animate-fade-in`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-w-3 aspect-h-2 overflow-hidden">
                      <img 
                        src={field.image} 
                        alt={field.title} 
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-6 relative">
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
            
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
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
        <section id="steps" className="bg-gradient-to-b from-white to-blue-100 dark:bg-gradient-to-b dark:from-gray-900 dark:to-blue-950 py-16 relative fullscreen-section section-animate overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent"></div>
          
          {/* Новый декоративный дизайн с линиями и геометрическими элементами */}
          
          {/* Диагональные линии в фоне */}
          <div className="absolute top-0 right-0 w-full h-full opacity-5 dark:opacity-10 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 800" preserveAspectRatio="none">
              {[...Array(20)].map((_, i) => (
                <line 
                  key={i}
                  x1={i * 40}
                  y1="0"
                  x2={i * 40 + 800}
                  y2="800"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary"
                />
              ))}
            </svg>
          </div>
          
          {/* Геометрические фигуры */}
          <div className="absolute top-20 right-20 flex space-x-4">
            <div className="w-24 h-24 border border-primary/20 rotate-45 animate-float-slow"></div>
            <div className="w-16 h-16 border-2 border-primary/30 rotate-12 animate-float" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Линейные полосы */}
          <div className="absolute bottom-40 left-10 space-y-2">
            <div className="w-32 h-1 bg-primary/20 animate-pulse"></div>
            <div className="w-40 h-1 bg-primary/15 animate-pulse" style={{animationDelay: '0.7s'}}></div>
            <div className="w-24 h-1 bg-primary/25 animate-pulse" style={{animationDelay: '1.4s'}}></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Путь к успеху</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl gradient-text inline-block">
                Четыре простых шага к достижению цели
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
                Начните своё путешествие прямо сейчас - будь вы талантливый специалист или создатель проекта.
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <div 
                    key={step.number} 
                    className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-md p-6 hover-card animate-fade-in border border-blue-100 dark:border-blue-900"
                    style={{ animationDelay: `${300 + index * 150}ms` }}
                  >
                    <div className="flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-primary/10 text-primary mx-auto animate-pulse">
                      <span className="text-2xl font-bold">{step.number}</span>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 text-center mb-3">{step.title}</h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 text-center">
                      {step.description}
                    </p>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-12 left-full w-12 h-2 border-t-2 border-dashed border-primary/50 transform -translate-x-6"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button 
                onClick={() => scrollToNextSection('cta')}
                className="bg-blue-500/40 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 border border-blue-200/30"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
            </div>
          </div>
        </section>

        {/* Новый декоративный разделитель - зигзагообразная линия */}
        <div className="relative z-10 h-16 transform -translate-y-16 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-blue-100/50 to-primary/60 dark:from-blue-950/70 dark:to-primary/70">
            <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path 
                d="M0,0 L120,20 L240,0 L360,20 L480,0 L600,20 L720,0 L840,20 L960,0 L1080,20 L1200,0 V120 H0 V0 Z" 
                className="fill-primary dark:fill-primary opacity-90"
              />
            </svg>
          </div>
        </div>
        
        {/* CTA Section */}
        <section id="cta" className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 relative overflow-hidden py-32 section-animate -mt-16 fullscreen-section">
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