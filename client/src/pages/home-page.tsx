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
            
            {/* Декоративные элементы с анимацией плавания */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-float-slow"></div>
              <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-float"></div>
              <div className="absolute -bottom-10 left-1/4 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl animate-float-slow"></div>
            </div>
            
            {/* Добавляем геометрические фигуры для дополнительной анимации */}
            <div className="absolute inset-0 opacity-20 overflow-hidden">
              <div className="absolute top-20 right-[10%] w-16 h-16 border-4 border-white/30 rounded-lg animate-rotate origin-center"></div>
              <div className="absolute bottom-32 left-[15%] w-24 h-24 border-2 border-white/20 rounded-full animate-float-slow"></div>
              <div className="absolute top-1/4 left-[30%] w-12 h-12 bg-blue-500/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1/3 right-[20%] w-20 h-20 border-4 border-dashed border-white/30 rounded-full animate-rotate" style={{ animationDuration: '15s' }}></div>
              <div className="absolute top-[40%] right-[40%] w-10 h-10 bg-indigo-500/20 rounded-md animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
          
          {/* Контейнер для контента */}
          <div className="relative flex items-center h-full z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="bg-white/50 backdrop-blur-md rounded-lg shadow-xl overflow-hidden py-10 px-12 max-w-2xl animate-[scaleIn_0.7s_ease-out_forwards] origin-bottom-left relative">
                {/* Добавляем подсветку вокруг карточки */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-md animate-pulse"></div>
                <div className="relative bg-white/80 backdrop-blur-md rounded-lg p-10">
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
                        <Button size="lg" className="px-8 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 animate-pulse">
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
            </div>
            {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-fade-in animate-delay-500">
              <button 
                onClick={() => scrollToNextSection('categories')}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 animate-float"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section id="categories" className="bg-white dark:bg-gray-800 py-12 fullscreen-section section-animate relative">
          {/* Фоновые декоративные элементы */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-8 border-dashed border-primary/30 animate-rotate" style={{ animationDuration: '20s' }}></div>
            <div className="absolute bottom-40 right-20 w-40 h-40 rounded-full border-4 border-primary/20 animate-float-slow"></div>
            <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-primary/10 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase animate-fade-in">Сферы деятельности</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl gradient-text inline-block animate-fade-in-scale animate-delay-200">
                Откройте мир возможностей
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto animate-fade-in animate-delay-300">
                Исследуйте разнообразные проекты и найдите именно то, что соответствует вашим интересам.
              </p>
            </div>
            
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field, index) => {
                  // Чередуем направление анимации для карточек
                  const animationClass = index % 2 === 0 ? 'animate-fade-in-left' : 'animate-fade-in-right';
                  return (
                    <div 
                      key={field.title} 
                      className={`group relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-hidden hover-card ${animationClass}`}
                      style={{ animationDelay: `${index * 150}ms` }}
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
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        
        {/* Кнопка прокрутки к следующему разделу */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button 
                onClick={() => scrollToNextSection('steps')}
                className="bg-primary/30 backdrop-blur-md hover:bg-primary/40 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110"
              >
                <ChevronDownIcon className="h-6 w-6 animate-bounce" />
              </button>
            </div>
            
        {/* How It Works Section */}
        <section id="steps" className="bg-gray-50 dark:bg-gray-900 py-16 relative fullscreen-section section-animate">
          {/* Декоративный элемент */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white dark:from-gray-800 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase animate-fade-in">Путь к успеху</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl gradient-text inline-block animate-fade-in-scale animate-delay-200">
                Четыре простых шага к достижению цели
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto animate-fade-in animate-delay-300">
                Начните своё путешествие прямо сейчас - будь вы талантливый специалист или создатель проекта.
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                  <div 
                    key={step.number} 
                    className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover-card animate-fade-in"
                    style={{ animationDelay: `${300 + index * 150}ms` }}
                  >
                    <div className="flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-primary/10 text-primary mx-auto animate-bounce-custom">
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
          </div>
        </section>
        
        {/* Кнопка прокрутки к следующему разделу */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button 
            onClick={() => scrollToNextSection('cta')}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-110 animate-float"
          >
            <ChevronDownIcon className="h-6 w-6 animate-bounce" />
          </button>
        </div>

        {/* CTA Section */}
        <section id="cta" className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 relative overflow-hidden fullscreen-section section-animate">
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white animate-float-slow"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white animate-float"></div>
            <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white animate-pulse"></div>
            {/* Добавляем анимированные декоративные элементы */}
            <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-lg border-4 border-white/80 animate-rotate" style={{ animationDuration: '12s' }}></div>
            <div className="absolute top-1/4 right-1/5 w-24 h-24 border-dashed border-4 border-white/60 rounded-full animate-rotate" style={{ animationDuration: '18s' }}></div>
          </div>
          
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between relative z-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="block animate-fade-in-left">Ваше будущее начинается здесь</span>
                <span className="block text-blue-100 animate-fade-in-right animate-delay-200">Станьте частью сообщества профессионалов и новаторов</span>
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl animate-fade-in animate-delay-300">
                Присоединяйтесь к сотням студентов и проектов уже сегодня для создания успешных историй сотрудничества.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:mt-0 lg:flex-shrink-0 animate-fade-in-scale animate-delay-200">
              <div className="inline-flex rounded-md shadow">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button variant="secondary" size="lg" className="bg-white/95 backdrop-blur-sm text-gray-800 hover:bg-white/100 transform transition-all duration-300 hover:scale-105 animate-pulse">
                    {user ? "В личный кабинет" : "Создать аккаунт"}
                  </Button>
                </Link>
              </div>
              <div className="inline-flex rounded-md shadow">
                <Link href="/projects">
                  <Button variant="default" size="lg" className="bg-blue-600/60 backdrop-blur-sm border-2 border-white/30 hover:bg-blue-700/80 hover:border-white/60 transform transition-all duration-300 hover:scale-105 animate-shake">
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
