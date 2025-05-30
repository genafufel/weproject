import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/fixed-home-page";
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
import ImageTestPage from "@/pages/image-test-page";
import DirectImageTest from "@/pages/direct-image-test";
import DebugProject from "@/pages/debug-project";
import ImageDebug from "@/pages/image-debug";
import DebugProjects from "@/pages/debug-projects";
import ImageTest from "@/pages/image-test";
import DebugBombardiro from "@/pages/debug-bombardiro";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { HelmetProvider } from "react-helmet-async";
import { DebugLayout } from "@/components/debug-layout";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/projects" component={Projects} />
      <Route path="/talent" component={Talent} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/talent/:id" component={TalentDetail} />
      
      {/* Тестовые страницы для изображений */}
      <Route path="/image-test-page" component={ImageTestPage} />
      <Route path="/direct-image-test" component={DirectImageTest} />
      <Route path="/debug-project/:id" component={DebugProject} />
      <Route path="/image-debug" component={ImageDebug} />
      <Route path="/debug-projects" component={DebugProjects} />
      <Route path="/image-test" component={ImageTest} />
      <Route path="/debug-bombardiro" component={DebugBombardiro} />
      
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
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <HelmetProvider>
            <DebugLayout>
              <div className="app-container">
                <Router />
                <Toaster />
              </div>
            </DebugLayout>
          </HelmetProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
