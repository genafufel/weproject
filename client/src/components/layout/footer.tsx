import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: "Платформа",
      links: [
        { label: "Все проекты", href: "/projects" },
        { label: "Найти таланты", href: "/talent" },
        { label: "Разместить проект", href: "/create-project" },
        { label: "Создать резюме", href: "/create-resume" },
      ],
    },
    {
      title: "Ресурсы",
      links: [
        { label: "Блог", href: "#" },
        { label: "Истории успеха", href: "#" },
        { label: "Руководства", href: "#" },
        { label: "События", href: "#" },
      ],
    },
    {
      title: "Компания",
      links: [
        { label: "О нас", href: "#" },
        { label: "Контакты", href: "#" },
        { label: "Политика конфиденциальности", href: "#" },
        { label: "Условия использования", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center">
              <Logo />
            </div>
            <p className="mt-4 text-base text-gray-600">
              Объединяем талантливых студентов с интересными стартап-возможностями.
              Создавайте портфолио, расширяйте сеть контактов и начинайте карьеру.
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <FacebookIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <TwitterIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <LinkedinIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-base text-gray-600 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {currentYear} weproject. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
