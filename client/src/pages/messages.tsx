import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user ID from URL if present
  const params = new URLSearchParams(location.split("?")[1]);
  const initialContactId = params.get("userId") ? parseInt(params.get("userId")!) : null;
  
  // State for the active conversation
  const [activeContactId, setActiveContactId] = useState<number | null>(initialContactId);
  const [messageText, setMessageText] = useState("");
  
  // Получаем все сообщения текущего пользователя
  const {
    data: userMessages,
    isLoading: messagesDataLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["/api/messages", "all"],
    queryFn: async () => {
      const res = await fetch("/api/messages?type=all");
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
    enabled: !!user,
    // Обновляем данные каждые 5 секунд
    refetchInterval: 5000,
  });
  
  // Получаем данные контактов, с которыми есть переписка
  const {
    data: contacts,
    isLoading: contactsLoading,
  } = useQuery({
    queryKey: ["/api/messages/contacts"],
    queryFn: async () => {
      // Если у нас есть все сообщения пользователя, мы можем сформировать список контактов
      if (!userMessages) return [];
      
      // Получаем уникальные ID пользователей, с которыми общался текущий пользователь
      const contactIdsSet = new Set<number>();
      
      userMessages.forEach((message: any) => {
        if (message.senderId !== user?.id) {
          contactIdsSet.add(message.senderId);
        }
        if (message.receiverId !== user?.id) {
          contactIdsSet.add(message.receiverId);
        }
      });
      
      const contactsList = [];
      const contactIds = Array.from(contactIdsSet);
      
      // Для каждого контакта получаем последнее сообщение
      for (const contactId of contactIds) {
        // Пропускаем самого себя (если такие сообщения есть)
        if (contactId === user?.id) continue;
        
        try {
          const userRes = await fetch(`/api/users/${contactId}`);
          if (!userRes.ok) continue;
          
          const contactUser = await userRes.json();
          
          // Находим последнее сообщение в диалоге
          const conversationMessages = userMessages.filter((msg: any) => 
            (msg.senderId === user?.id && msg.receiverId === contactId) || 
            (msg.senderId === contactId && msg.receiverId === user?.id)
          );
          
          // Сортируем по времени создания (от нового к старому)
          conversationMessages.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          const lastMessage = conversationMessages[0];
          
          // Считаем количество непрочитанных сообщений
          const unreadCount = conversationMessages.filter((msg: any) => 
            msg.receiverId === user?.id && msg.senderId === contactId && !msg.read
          ).length;
          
          contactsList.push({
            id: contactId,
            fullName: contactUser.fullName,
            avatar: contactUser.avatar,
            lastMessage: lastMessage.content || "",
            lastMessageTime: new Date(lastMessage.createdAt),
            unread: unreadCount,
          });
        } catch (error) {
          console.error(`Failed to fetch contact ${contactId}:`, error);
        }
      }
      
      // Сортируем контакты по времени последнего сообщения (от нового к старому)
      return contactsList.sort((a, b) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
    },
    enabled: !!user && !!userMessages,
  });
  
  // Получаем сообщения для текущего диалога
  const {
    data: conversationMessages,
    isLoading: messagesLoading,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ['/api/messages', activeContactId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?userId=${activeContactId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch conversation messages");
      }
      return res.json();
    },
    enabled: !!activeContactId && !!user,
    // Обновляем диалог каждые 3 секунды
    refetchInterval: 3000,
  });
  
  // Состояние для прикрепленного файла
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Открыть диалог выбора файла
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Обработка выбора файла
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentLoading(true);

    try {
      // Если это изображение, создаем превью
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Для других типов файлов показываем только имя
        setAttachmentPreview(null);
      }

      setAttachmentFile(file);
    } catch (error) {
      console.error('Ошибка при обработке файла:', error);
      toast({
        title: "Ошибка при обработке файла",
        description: "Не удалось обработать выбранный файл",
        variant: "destructive",
      });
    } finally {
      setAttachmentLoading(false);
    }
  };

  // Удаление прикрепленного файла
  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if ((!messageText.trim() && !attachmentFile) || !activeContactId) return;
    
    try {
      let attachmentData = null;

      // Если есть прикрепленный файл, загружаем его сначала
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('attachment', attachmentFile);

        const uploadRes = await fetch('/api/upload/message-attachment', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Не удалось загрузить файл");
        }

        attachmentData = await uploadRes.json();
      }

      // Отправляем сообщение с прикрепленным файлом (если есть)
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: activeContactId,
          content: messageText.trim() || (attachmentFile ? `Прикрепленный файл: ${attachmentFile.name}` : ""),
          attachment: attachmentData?.fileUrl || null,
          attachmentType: attachmentData?.fileType || null,
          attachmentName: attachmentData?.fileName || null,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Неизвестная ошибка" }));
        throw new Error(errorData.message || "Failed to send message");
      }
      
      // Очищаем поле ввода, убираем прикрепленный файл и обновляем данные
      setMessageText("");
      handleRemoveAttachment();
      
      // Инвалидируем кэш запросов сообщений
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeContactId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/contacts'] });
      
      // Немедленно запрашиваем обновленные данные
      await Promise.all([
        refetchMessages(),
        refetchConversation()
      ]);
      
      // Убираем автоматическую прокрутку после отправки сообщения
      // scrollToBottom();
      
    } catch (error: any) {
      console.error("Ошибка отправки сообщения:", error);
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить сообщение. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    }
  };
  
  // Format date for display
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // If same day, show time
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Format date for conversation list
  const formatConversationTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return "Just now";
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return days === 1 ? "Yesterday" : `${days}d ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Уже не автопрокручиваем при изменении сообщений
  // useEffect(() => {
  //   scrollToBottom();
  // }, [conversationMessages]);
  
  // Handle send on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // If user is not logged in, show message to login
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sign in to access Messages</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be signed in to view and send messages to project owners and applicants.
            </p>
            <Button asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Messages</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[700px]">
              {/* Contacts sidebar */}
              <div className="border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    className="bg-gray-50 dark:bg-gray-700 dark:placeholder-gray-400"
                  />
                </div>
                
                <ScrollArea className="h-[640px]">
                  {contactsLoading || messagesDataLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : contacts && contacts.length === 0 ? (
                    <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                      У вас пока нет сообщений
                    </div>
                  ) : (
                    <div>
                      {contacts && contacts.map((contact: any) => (
                        <div key={contact.id}>
                          <button
                            className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                              activeContactId === contact.id ? "bg-blue-50 dark:bg-gray-600" : ""
                            }`}
                            onClick={() => setActiveContactId(contact.id)}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage 
                                  src={contact.avatar?.startsWith('/uploads') ? contact.avatar : (contact.avatar ? `/uploads/${contact.avatar.split('/').pop()}` : undefined)} 
                                  alt={contact.fullName}
                                  onError={(e) => {
                                    console.log("Ошибка загрузки аватара:", contact.avatar);
                                    e.currentTarget.src = '/uploads/default.jpg';
                                  }}
                                />
                                <AvatarFallback>
                                  {contact.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {contact.fullName}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatConversationTime(contact.lastMessageTime)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {contact.lastMessage}
                                </p>
                              </div>
                              {contact.unread > 0 && (
                                <span className="ml-2 bg-primary text-white text-xs font-medium rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                  {contact.unread}
                                </span>
                              )}
                            </div>
                          </button>
                          <Separator className="dark:bg-gray-700" />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Messages area */}
              <div className="col-span-2 flex flex-col">
                {!activeContactId ? (
                  <div className="flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                    Select a conversation to start messaging
                  </div>
                ) : (
                  <>
                    {/* Conversation header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage
                          src={(() => {
                            const contact = contacts?.find((c: any) => c.id === activeContactId);
                            const avatar = contact?.avatar;
                            if (!avatar) return undefined;
                            return avatar.startsWith('/uploads') ? avatar : `/uploads/${avatar.split('/').pop()}`;
                          })()}
                          alt={contacts?.find((c: any) => c.id === activeContactId)?.fullName || "Контакт"}
                          onError={(e) => {
                            console.log("Ошибка загрузки аватара активного контакта");
                            e.currentTarget.src = '/uploads/default.jpg';
                          }}
                        />
                        <AvatarFallback>
                          {contacts?.find((c: any) => c.id === activeContactId)?.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {contacts?.find((c: any) => c.id === activeContactId)?.fullName || "Контакт"}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 h-[536px]">
                      {messagesLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : !conversationMessages || conversationMessages.length === 0 ? (
                        <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                          Сообщений пока нет. Начните диалог!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conversationMessages.map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderId === user?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                  message.senderId === user?.id
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                
                                {/* Отображение прикрепленного файла */}
                                {message.attachment && (
                                  <div className="mt-2">
                                    {message.attachmentType === 'image' ? (
                                      <a href={message.attachment} target="_blank" rel="noopener noreferrer" className="block">
                                        <img 
                                          src={message.attachment} 
                                          alt="Прикрепленное изображение" 
                                          className="max-w-full max-h-[200px] rounded-md"
                                          onError={(e) => {
                                            console.log("Ошибка загрузки изображения");
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      </a>
                                    ) : (
                                      <a 
                                        href={message.attachment} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 p-2 rounded-md ${
                                          message.senderId === user?.id 
                                            ? "bg-blue-700 text-blue-50 hover:bg-blue-600" 
                                            : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500"
                                        }`}
                                      >
                                        {message.attachmentType === 'pdf' ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                            <path d="M9 15v-2h6v2"/>
                                            <path d="M9 18v-2h6v2"/>
                                            <path d="M9 12v-2h2v2"/>
                                          </svg>
                                        ) : message.attachmentType === 'document' ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                          </svg>
                                        )}
                                        <span className="text-sm truncate max-w-[150px]">
                                          {message.attachmentName || "Прикрепленный файл"}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                
                                <div
                                  className={`text-xs mt-1 ${
                                    message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {formatMessageTime(new Date(message.createdAt))}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    
                    {/* Message input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Предпросмотр прикрепленного файла */}
                      {attachmentFile && (
                        <div className="mb-2 p-2 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
                          <div className="flex items-center overflow-hidden">
                            {attachmentPreview ? (
                              <img 
                                src={attachmentPreview} 
                                alt="Preview" 
                                className="h-10 w-10 rounded object-cover mr-2" 
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                </svg>
                              </div>
                            )}
                            <span className="text-sm truncate max-w-[200px]">
                              {attachmentFile.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAttachment}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex">
                        {/* Скрытый input для файла */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        
                        {/* Кнопка прикрепления файла */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleAttachmentClick}
                          className="mr-2"
                          disabled={attachmentLoading}
                        >
                          {attachmentLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                          )}
                        </Button>
                        
                        <Input
                          type="text"
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 mr-2"
                        />
                        <Button
                          type="button"
                          onClick={sendMessage}
                          disabled={(!messageText.trim() && !attachmentFile) || attachmentLoading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
