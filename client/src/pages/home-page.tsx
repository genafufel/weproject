import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

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
    title: "Создайте профиль",
    description: "Зарегистрируйтесь и создайте подробный профиль, демонстрирующий ваши навыки, опыт и интересы."
  },
  {
    number: "2",
    title: "Ищите возможности",
    description: "Изучайте проекты или таланты с помощью мощных фильтров, чтобы найти идеальное соответствие."
  },
  {
    number: "3",
    title: "Общайтесь и обсуждайте",
    description: "Используйте нашу систему обмена сообщениями для обсуждения деталей и требований проекта."
  },
  {
    number: "4",
    title: "Сотрудничайте и достигайте успеха",
    description: "Работайте вместе, чтобы воплотить ваши проекты в жизнь и пополнить портфолио успешных проектов."
  }
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Объединяйтесь. Создавайте.</span>
                    <span className="block text-primary">Запускайте вместе.</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Присоединяйтесь к платформе, которая объединяет студентов и стартапы. Найдите возможности для приобретения опыта или откройте для себя новые таланты для вашего следующего проекта.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link href="/projects">
                        <Button size="lg" className="w-full">
                          Найти проекты
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link href={user ? "/create-project" : "/auth"}>
                        <Button size="lg" variant="outline" className="w-full">
                          Разместить проект
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop"
              alt="Students collaborating on a project"
            />
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Направления</h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
                Изучайте проекты в разных областях
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Найдите проекты и возможности в различных отраслях.
              </p>
            </div>
            
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field) => (
                  <div key={field.title} className="group relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="aspect-w-3 aspect-h-2">
                      <img 
                        src={field.image} 
                        alt={field.title} 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link href={`/projects?field=${encodeURIComponent(field.title)}`} className="focus:outline-none">
                          {field.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {field.description}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm font-medium text-primary">
                          {field.count} активных проектов
                        </span>
                        <Link 
                          href={`/projects?field=${encodeURIComponent(field.title)}`}
                          className="text-sm font-medium text-primary hover:text-blue-700"
                        >
                          Показать все <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Как это работает</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Простые шаги для начала работы
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Независимо от того, ищете ли вы проекты или набираете таланты, наша платформа делает это простым.
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step) => (
                  <div key={step.number} className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      <span className="text-xl font-bold">{step.number}</span>
                    </div>
                    <div className="ml-16">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-base text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-primary">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Готовы найти свою следующую возможность?</span>
              <span className="block text-blue-100">Присоединяйтесь к тысячам студентов и стартапов уже сегодня.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button variant="secondary" size="lg">
                    {user ? "В личный кабинет" : "Создать аккаунт"}
                  </Button>
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link href="/projects">
                  <Button variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Узнать больше
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
