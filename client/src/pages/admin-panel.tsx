import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute, Link, Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Users,
  FolderKanban,
  BookOpen,
  FileText,
  MessageSquare,
  AlertTriangle,
  Settings,
  UserCog,
  Trash,
  Check,
  Ban,
  Plus,
  Eye,
  Edit,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { TailSpin } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";

// Типы данных
interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  userType: string;
  authType: string;
  verified: boolean;
  createdAt: string;
  avatar: string | null;
  bio: string | null;
  isAdmin: boolean;
}

interface Project {
  id: number;
  userId: number;
  title: string;
  description: string;
  field: string;
  remote: boolean;
  dateFrom: string;
  dateTo: string;
  photos: string[];
  positions: any[];
  requirements: any[];
  createdAt: string;
}

interface Resume {
  id: number;
  userId: number;
  title: string;
  education: any;
  experience: any;
  skills: any;
  direction: string;
  talents: string[];
  photos: string[];
  about: string;
  isPublic: boolean;
  createdAt: string;
}

interface Application {
  id: number;
  userId: number;
  projectId: number;
  resumeId: number;
  position: string;
  cover: string;
  status: string;
  createdAt: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
  read: boolean;
}

// Компонент для административной панели
export default function AdminPanel() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Состояния для хранения данных
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Состояния для отображения шаблонов редактирования
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Проверка прав администратора
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/check-admin");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Загрузка данных в зависимости от активной вкладки
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        switch(activeTab) {
          case "dashboard":
            const statsResponse = await fetch("/api/admin/stats");
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setStats(statsData);
            }
            break;
            
          case "users":
            const usersResponse = await fetch("/api/admin/users");
            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              setUsers(usersData);
            }
            break;
            
          case "projects":
            const projectsResponse = await fetch("/api/admin/projects");
            if (projectsResponse.ok) {
              const projectsData = await projectsResponse.json();
              setProjects(projectsData);
            }
            break;
            
          case "resumes":
            const resumesResponse = await fetch("/api/admin/resumes");
            if (resumesResponse.ok) {
              const resumesData = await resumesResponse.json();
              setResumes(resumesData);
            }
            break;
            
          case "applications":
            const applicationsResponse = await fetch("/api/admin/applications");
            if (applicationsResponse.ok) {
              const applicationsData = await applicationsResponse.json();
              setApplications(applicationsData);
            }
            break;
            
          case "messages":
            const messagesResponse = await fetch("/api/admin/messages");
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              setMessages(messagesData);
            }
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error(`Error fetching data for ${activeTab}:`, error);
        toast({
          title: "Ошибка загрузки данных",
          description: `Не удалось загрузить данные для вкладки ${activeTab}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, isAdmin, toast]);
  
  // Обработчики удаления
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Пользователь удален",
          description: "Пользователь был успешно удален из системы"
        });
        
        // Обновляем список пользователей
        setUsers(users.filter(user => user.id !== userId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при удалении",
          description: errorData.message || "Не удалось удалить пользователя",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при удалении пользователя",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Проект удален",
          description: "Проект был успешно удален из системы"
        });
        
        // Обновляем список проектов
        setProjects(projects.filter(project => project.id !== projectId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при удалении",
          description: errorData.message || "Не удалось удалить проект",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при удалении проекта",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteResume = async (resumeId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это резюме? Это действие нельзя отменить.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/resumes/${resumeId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Резюме удалено",
          description: "Резюме было успешно удалено из системы"
        });
        
        // Обновляем список резюме
        setResumes(resumes.filter(resume => resume.id !== resumeId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при удалении",
          description: errorData.message || "Не удалось удалить резюме",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при удалении резюме",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteApplication = async (applicationId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Заявка удалена",
          description: "Заявка была успешно удалена из системы"
        });
        
        // Обновляем список заявок
        setApplications(applications.filter(app => app.id !== applicationId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при удалении",
          description: errorData.message || "Не удалось удалить заявку",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при удалении заявки",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast({
          title: "Сообщение удалено",
          description: "Сообщение было успешно удалено из системы"
        });
        
        // Обновляем список сообщений
        setMessages(messages.filter(msg => msg.id !== messageId));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при удалении",
          description: errorData.message || "Не удалось удалить сообщение",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при удалении сообщения",
        variant: "destructive"
      });
    }
  };
  
  // Обработчик изменения статуса заявки
  const handleUpdateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const updatedApplication = await response.json();
        
        toast({
          title: "Статус обновлен",
          description: `Статус заявки изменен на "${status}"`
        });
        
        // Обновляем список заявок
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status } : app
        ));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при обновлении",
          description: errorData.message || "Не удалось обновить статус заявки",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при обновлении статуса заявки",
        variant: "destructive"
      });
    }
  };
  
  // Обработчик изменения прав администратора пользователя
  const handleToggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        
        toast({
          title: "Права обновлены",
          description: !currentStatus 
            ? "Пользователю предоставлены права администратора" 
            : "Права администратора отозваны"
        });
        
        // Обновляем список пользователей
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isAdmin: !currentStatus } : user
        ));
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка при обновлении",
          description: errorData.message || "Не удалось обновить права пользователя",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Ошибка сервера",
        description: "Произошла ошибка при обновлении прав пользователя",
        variant: "destructive"
      });
    }
  };
  
  // Отправляем на главную, если не администратор
  if (!isLoading && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <TailSpin />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <p className="text-muted-foreground">Управление пользователями и контентом платформы</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            Вернуться на сайт
          </Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Статистика</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            <span>Проекты</span>
          </TabsTrigger>
          <TabsTrigger value="resumes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Резюме</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Заявки</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Сообщения</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Общая статистика</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab("dashboard")}
                      title="Обновить"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Пользователей:</span>
                      <span className="font-medium">{stats.counts.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Проектов:</span>
                      <span className="font-medium">{stats.counts.projects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Резюме:</span>
                      <span className="font-medium">{stats.counts.resumes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Заявок:</span>
                      <span className="font-medium">{stats.counts.applications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Сообщений:</span>
                      <span className="font-medium">{stats.counts.messages}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Пользователи по типу</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.usersByAuthType.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.authType || "Не указан"}:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Проекты по областям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.projectsByField.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.field || "Не указана"}:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Заявки по статусам</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.applicationsByStatus.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.status || "Не указан"}:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <TailSpin />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Управление пользователями</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("users")}
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя пользователя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Верификация</TableHead>
                      <TableHead>Админ</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback>{user.fullName?.substring(0, 2) || user.username.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {user.fullName || user.username}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.userType || "Не указан"}</TableCell>
                        <TableCell>
                          {user.verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Подтвержден
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Не подтвержден
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="bg-blue-500">Администратор</Badge>
                          ) : (
                            <Badge variant="outline">Пользователь</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleAdminStatus(user.id, user.isAdmin)}
                              title={user.isAdmin ? "Снять права администратора" : "Сделать администратором"}
                            >
                              {user.isAdmin ? <Ban className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Удалить пользователя"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Пользователи не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Управление проектами</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("projects")}
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Область</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead>Удаленка</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.id}</TableCell>
                        <TableCell>{project.title}</TableCell>
                        <TableCell>{project.field || "Не указана"}</TableCell>
                        <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {project.remote ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Да
                            </Badge>
                          ) : (
                            <Badge variant="outline">Нет</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/projects/${project.id}`, "_blank")}
                              title="Просмотреть проект"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                              title="Удалить проект"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Проекты не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resumes">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Управление резюме</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("resumes")}
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Заголовок</TableHead>
                      <TableHead>Направление</TableHead>
                      <TableHead>Создано</TableHead>
                      <TableHead>Публичное</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell>{resume.id}</TableCell>
                        <TableCell>{resume.title}</TableCell>
                        <TableCell>{resume.direction || "Не указано"}</TableCell>
                        <TableCell>{new Date(resume.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {resume.isPublic ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Да
                            </Badge>
                          ) : (
                            <Badge variant="outline">Нет</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/talent/${resume.id}`, "_blank")}
                              title="Просмотреть резюме"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteResume(resume.id)}
                              title="Удалить резюме"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Резюме не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Управление заявками</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("applications")}
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Проект</TableHead>
                      <TableHead>Позиция</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>{application.id}</TableCell>
                        <TableCell>ID: {application.projectId}</TableCell>
                        <TableCell>{application.position || "Не указана"}</TableCell>
                        <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              application.status === "accepted" 
                                ? "bg-green-50 text-green-700 border-green-200"
                                : application.status === "rejected"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {application.status === "pending" && "В рассмотрении"}
                            {application.status === "accepted" && "Принята"}
                            {application.status === "rejected" && "Отклонена"}
                            {!["pending", "accepted", "rejected"].includes(application.status) && application.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  title="Изменить статус"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </SheetTrigger>
                              <SheetContent>
                                <SheetHeader>
                                  <SheetTitle>Изменить статус заявки</SheetTitle>
                                  <SheetDescription>
                                    Выберите новый статус для заявки #{application.id}
                                  </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-4">
                                    <Button 
                                      className="w-full"
                                      variant={application.status === "pending" ? "default" : "outline"}
                                      onClick={() => handleUpdateApplicationStatus(application.id, "pending")}
                                    >
                                      В рассмотрении
                                    </Button>
                                    <Button 
                                      className="w-full"
                                      variant={application.status === "accepted" ? "default" : "outline"}
                                      onClick={() => handleUpdateApplicationStatus(application.id, "accepted")}
                                    >
                                      Принята
                                    </Button>
                                    <Button 
                                      className="w-full"
                                      variant={application.status === "rejected" ? "default" : "outline"}
                                      onClick={() => handleUpdateApplicationStatus(application.id, "rejected")}
                                    >
                                      Отклонена
                                    </Button>
                                  </div>
                                </div>
                                <SheetFooter>
                                  <SheetClose asChild>
                                    <Button variant="outline">Закрыть</Button>
                                  </SheetClose>
                                </SheetFooter>
                              </SheetContent>
                            </Sheet>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteApplication(application.id)}
                              title="Удалить заявку"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Заявки не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Управление сообщениями</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("messages")}
                  title="Обновить"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>От кого</TableHead>
                      <TableHead>Кому</TableHead>
                      <TableHead>Текст</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Прочитано</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.id}</TableCell>
                        <TableCell>ID: {message.senderId}</TableCell>
                        <TableCell>ID: {message.receiverId}</TableCell>
                        <TableCell className="max-w-xs truncate">{message.text}</TableCell>
                        <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          {message.read ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Да
                            </Badge>
                          ) : (
                            <Badge variant="outline">Нет</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            title="Удалить сообщение"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  Сообщения не найдены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}