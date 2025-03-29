import { Switch, Route } from "wouter";
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
import CreateResume from "@/pages/create-resume";
import Messages from "@/pages/messages";
import VerificationPage from "@/pages/verification-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Компонент для маршрутов, требующих верификации
function VerifiedRoute({ component: Component, ...rest }: { component: React.ComponentType, path: string }) {
  const { user } = useAuth();
  
  return (
    <ProtectedRoute 
      {...rest} 
      component={() => {
        if (user && !user.verified) {
          return <VerificationPage />;
        }
        return <Component />;
      }} 
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
      
      {/* Protected Routes с проверкой верификации */}
      <VerifiedRoute path="/dashboard" component={Dashboard} />
      <VerifiedRoute path="/create-project" component={CreateProject} />
      <VerifiedRoute path="/create-resume" component={CreateResume} />
      <VerifiedRoute path="/messages" component={Messages} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
