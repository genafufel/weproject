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
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E6F0FB'/%3E%3Cpath d='M140,100 L100,140 L140,180 M260,100 L300,140 L260,180 M220,60 L180,180' stroke='%234A89DC' stroke-width='8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
    count: 287,
  },
  {
    title: "Искусство и дизайн",
    description: "Графический дизайн, UX/UI, анимация, иллюстрация и визуальное искусство.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E6F0FB'/%3E%3Ccircle cx='120' cy='100' r='40' fill='%234A89DC' opacity='0.6'/%3E%3Ccircle cx='200' cy='100' r='40' fill='%234A89DC' opacity='0.4'/%3E%3Ccircle cx='280' cy='100' r='40' fill='%234A89DC' opacity='0.2'/%3E%3C/svg%3E",
    count: 145,
  },
  {
    title: "Организация мероприятий",
    description: "Планирование мероприятий, координация, маркетинг и продюсирование.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E6F0FB'/%3E%3Cpath d='M100,150 L170,90 L230,120 L300,70' stroke='%234A89DC' stroke-width='4' fill='none'/%3E%3Ccircle cx='100' cy='150' r='6' fill='%234A89DC'/%3E%3Ccircle cx='170' cy='90' r='6' fill='%234A89DC'/%3E%3Ccircle cx='230' cy='120' r='6' fill='%234A89DC'/%3E%3Ccircle cx='300' cy='70' r='6' fill='%234A89DC'/%3E%3C/svg%3E",
    count: 89,
  },
  {
    title: "Финансы и бизнес",
    description: "Бизнес-анализ, финансовое планирование, бухгалтерский учет и консалтинг.",
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23E6F0FB'/%3E%3Crect x='100' y='140' width='40' height='40' fill='%234A89DC' opacity='0.2'/%3E%3Crect x='150' y='120' width='40' height='60' fill='%234A89DC' opacity='0.4'/%3E%3Crect x='200' y='100' width='40' height='80' fill='%234A89DC' opacity='0.6'/%3E%3Crect x='250' y='80' width='40' height='100' fill='%234A89DC' opacity='0.8'/%3E%3Cpath d='M100,80 L280,80' stroke='%234A89DC' stroke-width='2' stroke-dasharray='5,5'/%3E%3C/svg%3E",
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
        <div className="h-4 bg-white/70 backdrop-blur-md shadow-md relative z-20"></div>
        
        {/* Categories Section */}
        <section id="categories" className="bg-white dark:bg-gray-900 py-8 fullscreen-section section-animate relative overflow-hidden">
          {/* Декоративный элемент градиентной тени сверху */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-100/80 dark:from-blue-900/30 to-transparent pointer-events-none"></div>
          
          {/* Декоративные элементы */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-50/80 dark:from-gray-900/80 to-transparent"></div>
          
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
            
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field, index) => (
                  <div 
                    key={field.title} 
                    className={`group relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-blue-900 hover:border-primary/60 dark:hover:border-primary/60 rounded-xl shadow-md hover:shadow-lg overflow-hidden hover-card animate-fade-in transition-all duration-300`}
                    style={{ animationDelay: `${index * 100}ms` }}
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
        
        {/* Разделитель между секциями */}
        <div className="h-4 bg-blue-600/70 backdrop-blur-md shadow-md relative z-20"></div>
            
        {/* How It Works Section */}
        <section id="steps" className="bg-gray-50 dark:bg-gray-900 py-20 relative fullscreen-section section-animate overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/80 dark:from-gray-900/80 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-100/80 dark:from-gray-800/50 to-transparent"></div>
          
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
            
            <div className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {steps.map((step, index) => (
                  <div 
                    key={step.number} 
                    className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg p-4 hover-card animate-fade-in border border-blue-100 dark:border-blue-900 hover:border-primary/60 dark:hover:border-primary/60 transition-all duration-300"
                    style={{ animationDelay: `${300 + index * 150}ms` }}
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full mb-4 bg-primary/10 text-primary mx-auto animate-pulse">
                      <span className="text-xl font-bold">{step.number}</span>
                    </div>
                    <h3 className="text-base leading-6 font-medium text-gray-900 dark:text-gray-100 text-center mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={() => scrollToNextSection('cta')}
                className="bg-blue-500/40 backdrop-blur-md hover:bg-blue-500/60 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 border border-blue-200/30"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
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