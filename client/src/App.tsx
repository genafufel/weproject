import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Talent from "@/pages/talent";
import ProjectDetail from "@/pages/project-detail";
import TalentDetail from "@/pages/talent-detail";
import CreateProject from "@/pages/create-project";
import EditProject from "@/pages/edit-project";
import SimpleCreateProject from "@/pages/simple-create-project";
import CreateResume from "@/pages/create-resume";
import Messages from "@/pages/messages";
import VerificationPage from "@/pages/verification-page";
import EditProfile from "@/pages/edit-profile";
import AdminPanel from "@/pages/admin-panel";
import Notifications from "@/pages/notifications";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { HelmetProvider } from "react-helmet-async";
import { imagePreloader } from "@/lib/image-preloader";
import { useEffect, useState } from "react";

// Компонент для маршрутов, требующих верификации (временно отключена проверка верификации)
function VerifiedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  // Преобразуем Component в функцию, возвращающую JSX.Element
  const ComponentWrapper = () => <Component />;
  
  // Используем обычный ProtectedRoute без проверки статуса верификации
  return (
    <ProtectedRoute 
      {...rest} 
      component={ComponentWrapper}
    />
  );
}

// Компонент для предзагрузки изображений
function ImagePreloader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  
  // Инициализация предзагрузки при первом монтировании компонента
  useEffect(() => {
    if (!initialized) {
      // Выполняем глобальную предзагрузку для ускорения загрузки сайта
      imagePreloader.preloadGlobalImages();
      setInitialized(true);
    }
  }, [initialized]);
  
  // Предзагружаем изображения при изменении маршрута
  useEffect(() => {
    // Предзагружаем изображения DOM после монтирования или смены маршрута
    imagePreloader.preloadImagesFromPage();
    
    // Логика предзагрузки по маршрутам
    const preloadRouteImages = async () => {
      try {
        // Общие предзагрузки
        if (user?.avatar) {
          imagePreloader.preloadAvatars([user]);
        }
        
        // Предзагрузки для конкретных маршрутов
        if (location.startsWith('/projects')) {
          // Предзагрузка проектов
          const projectsResponse = await fetch('/api/projects');
          if (projectsResponse.ok) {
            const projects = await projectsResponse.json();
            imagePreloader.preloadProjectImages(projects);
          }
        } 
        else if (location.startsWith('/talent')) {
          // Предзагрузка резюме
          const resumesResponse = await fetch('/api/resumes');
          if (resumesResponse.ok) {
            const resumes = await resumesResponse.json();
            imagePreloader.preloadResumeImages(resumes);
          }
        }
        else if (location.startsWith('/messages')) {
          // Предзагрузка аватаров пользователей (приоритетная)
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            imagePreloader.preloadAvatars(users);
          }
          
          // Предзагрузка сообщений
          if (user?.id) {
            const messagesResponse = await fetch('/api/messages');
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              imagePreloader.preloadFromMessages(messages);
            }
          }
        }
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };
    
    preloadRouteImages();
  }, [location, user]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/projects" component={Projects} />
      <Route path="/talent" component={Talent} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/talent/:id" component={TalentDetail} />
      
      {/* Страница верификации (доступна только для авторизованных пользователей) */}
      <ProtectedRoute path="/verification" component={VerificationPage} />
      
      {/* Protected Routes с проверкой верификации */}
      <VerifiedRoute path="/dashboard" component={Dashboard} />
      <VerifiedRoute path="/create-project" component={CreateProject} />
      <VerifiedRoute path="/projects/:id/edit" component={EditProject} />
      <VerifiedRoute path="/edit-profile" component={EditProfile} />
      
      {/* Упрощенная форма создания проекта */}
      <VerifiedRoute path="/simple-create-project" component={SimpleCreateProject} />
      
      <VerifiedRoute path="/create-resume" component={CreateResume} />
      <VerifiedRoute path="/resumes/:id/edit" component={CreateResume} />
      <VerifiedRoute path="/messages" component={Messages} />
      
      {/* Страница уведомлений */}
      <VerifiedRoute path="/notifications" component={Notifications} />
      
      {/* Административная панель */}
      <VerifiedRoute path="/admin" component={AdminPanel} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider>
          <div className="app-container">
            <ImagePreloader />
            <Router />
            <Toaster />
          </div>
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
