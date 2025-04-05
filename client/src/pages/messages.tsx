import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, X, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DragDropFileUpload } from "@/components/ui/drag-drop-file-upload";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  
  // State for image preview modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  // State for message replies
  const [replyToMessage, setReplyToMessage] = useState<{
    id: number;
    content: string;
    senderId: number;
    senderName?: string;
  } | null>(null);
  
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
    // Обновляем данные каждые 10 секунд, чтобы снизить нагрузку
    refetchInterval: 10000,
    staleTime: 8000, // Кешируем данные на 8 секунд
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
            lastMessageAttachmentType: lastMessage.attachmentType || null,
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
      
      // После получения сообщений проверим наличие непрочитанных
      const messages = await res.json();
      
      // Если есть непрочитанные сообщения в этом диалоге, инвалидируем кэш списка контактов
      const hasUnreadMessages = messages.some((msg: any) => 
        msg.receiverId === user?.id && !msg.read
      );
      
      if (hasUnreadMessages) {
        // Обновим список всех сообщений, чтобы обновить счетчики непрочитанных
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/messages/contacts'] });
        }, 500);
      }
      
      return messages;
    },
    enabled: !!activeContactId && !!user,
    // Увеличиваем интервал обновления до 8 секунд для улучшения производительности
    refetchInterval: 8000,
    staleTime: 6000, // Кешируем данные на 6 секунд
  });
  
  // Мутация для отметки сообщения как прочитанного
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to mark message as read");
      }
      
      return true;
    },
    onSuccess: () => {
      // Обновляем списки сообщений
      refetchConversation();
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/contacts'] });
    },
  });
  
  // Состояние для прикрепленных файлов
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<{file: File, preview: string | null}[]>([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Открыть диалог выбора файла
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Обработка выбора файлов (через input или drag-and-drop)
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setAttachmentLoading(true);

    try {
      // Добавляем новые файлы к существующим
      setAttachmentFiles(prev => [...prev, ...files]);
      
      // Обрабатываем каждый файл для создания превью
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachmentPreviews(prev => [
              ...prev, 
              { file, preview: reader.result as string }
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          // Для других типов файлов добавляем без превью
          setAttachmentPreviews(prev => [
            ...prev, 
            { file, preview: null }
          ]);
        }
      }
    } catch (error) {
      // Сообщаем пользователю об ошибке без избыточного логирования
      toast({
        title: "Ошибка при обработке файлов",
        description: "Не удалось обработать выбранные файлы",
        variant: "destructive",
      });
    } finally {
      setAttachmentLoading(false);
    }
  };
  
  // Обработка выбора файлов через input (для обратной совместимости)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleFilesSelected(Array.from(files));
    
    // Сбрасываем значение input, чтобы можно было выбрать те же файлы снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Удаление прикрепленного файла
  const handleRemoveAttachment = (file: File) => {
    setAttachmentFiles(prev => prev.filter(f => f !== file));
    setAttachmentPreviews(prev => prev.filter(p => p.file !== file));
  };
  
  // Удаление всех прикрепленных файлов
  const handleRemoveAllAttachments = () => {
    setAttachmentFiles([]);
    setAttachmentPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if ((!messageText.trim() && attachmentFiles.length === 0) || !activeContactId) return;
    
    try {
      let attachmentsData = [];

      // Если есть прикрепленные файлы, загружаем их сначала
      if (attachmentFiles.length > 0) {
        setAttachmentLoading(true);
        
        if (attachmentFiles.length === 1) {
          // Для совместимости со старым кодом, если файл один - используем старый API
          const formData = new FormData();
          formData.append('attachment', attachmentFiles[0]);

          const uploadRes = await fetch('/api/upload/message-attachment', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error("Не удалось загрузить файл");
          }

          const data = await uploadRes.json();
          attachmentsData.push({
            url: data.fileUrl,
            type: data.fileType,
            name: data.fileName
          });
        } else {
          // Если файлов несколько, используем новый API для загрузки нескольких файлов
          const formData = new FormData();
          attachmentFiles.forEach(file => {
            formData.append('attachments', file);
          });

          const uploadRes = await fetch('/api/upload/message-attachments', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error("Не удалось загрузить файлы");
          }

          const data = await uploadRes.json();
          attachmentsData = data.files;
        }
      }

      // Отправляем сообщение с прикрепленными файлами
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: activeContactId,
          content: messageText.trim() || "",
          // Добавляем ID сообщения, на которое отвечаем
          replyToId: replyToMessage?.id || null,
          // Поддержка для старой версии API
          attachment: attachmentsData.length > 0 ? attachmentsData[0].url : null,
          attachmentType: attachmentsData.length > 0 ? attachmentsData[0].type : null,
          attachmentName: attachmentsData.length > 0 ? attachmentsData[0].name : null,
          // Новое поле для множественных вложений
          attachments: attachmentsData.length > 0 ? attachmentsData : null,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Неизвестная ошибка" }));
        throw new Error(errorData.message || "Failed to send message");
      }
      
      // Очищаем поле ввода, убираем прикрепленные файлы и сбрасываем состояние ответа
      setMessageText("");
      handleRemoveAllAttachments();
      setReplyToMessage(null);
      
      // Инвалидируем кэш запросов сообщений
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', activeContactId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/contacts'] });
      
      // Немедленно запрашиваем обновленные данные
      await Promise.all([
        refetchMessages(),
        refetchConversation()
      ]);
      
      // Прокручиваем вниз чтобы увидеть отправленное сообщение
      setTimeout(() => {
        scrollToBottom();
        // Дополнительная попытка прокрутки через короткое время для надежности
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }, 100);
      
    } catch (error: any) {
      // Более аккуратная обработка ошибки без избыточного логирования
      toast({
        title: "Ошибка отправки",
        description: error.message || "Не удалось отправить сообщение. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setAttachmentLoading(false);
    }
  };
  
  // Функция для преобразования текста в текст с кликабельными ссылками
  const linkifyText = (text: string, isOwnMessage: boolean = false) => {
    if (!text) return '';
    
    // Регулярное выражение для поиска URL (поддерживает http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    // Разделяем текст на части: текст и ссылки
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Находим все совпадения регулярного выражения
    while ((match = urlRegex.exec(text)) !== null) {
      // Добавляем текст до ссылки
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Формируем полный URL (добавляем http:// если начинается с www.)
      const url = match[0].startsWith('www.') ? `http://${match[0]}` : match[0];
      
      // Определяем цвет ссылки в зависимости от того, чье это сообщение
      const linkClass = isOwnMessage 
        ? "text-white hover:underline" // Белый цвет для собственных сообщений на синем фоне
        : "text-blue-500 hover:underline dark:text-blue-300"; // Синий для сообщений собеседника
      
      // Добавляем ссылку
      parts.push(
        <a 
          key={match.index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={linkClass}
          onClick={(e) => e.stopPropagation()}
        >
          {match[0]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length ? parts : text;
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
  
  // Оптимизированная функция прокрутки вниз (меньше DOM-обращений)
  const scrollToBottom = () => {
    // Используем ref для прокрутки - самый эффективный способ
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    } 
    
    // В качестве запасного варианта используем прямую прокрутку 
    const scrollArea = document.querySelector('.messages-scroll-area [data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
      
      // Оптимизация: устанавливаем прокрутку для родительского контейнера только если он существует
      const parentScrollArea = document.querySelector('.messages-scroll-area');
      if (parentScrollArea) {
        parentScrollArea.scrollTop = parentScrollArea.scrollHeight;
      }
    }
  };
  
  // Состояние для отслеживания, была ли выполнена начальная прокрутка для этого диалога
  const [initialScrollApplied, setInitialScrollApplied] = useState<{[key: number]: boolean}>({});
  
  // Эффект для автоматической отметки сообщений как прочитанные
  useEffect(() => {
    if (activeContactId && conversationMessages && conversationMessages.length > 0 && user) {
      // Находим все непрочитанные сообщения адресованные текущему пользователю 
      const unreadMessages = conversationMessages.filter(
        (msg: any) => msg.receiverId === user.id && !msg.read
      );
      
      // Если есть непрочитанные сообщения, отмечаем их как прочитанные
      if (unreadMessages.length > 0) {
        // Отмечаем каждое сообщение как прочитанное более эффективно
        // Используем Promise.all для параллельной обработки всех запросов
        Promise.all(
          unreadMessages.map((msg: any) => markAsReadMutation.mutate(msg.id))
        );
      }
    }
  }, [activeContactId, conversationMessages, user]);
  
  // Объединенный эффект для прокрутки, оптимизирован для лучшей производительности
  useLayoutEffect(() => {
    if (
      activeContactId && 
      conversationMessages && 
      conversationMessages.length > 0
    ) {
      // Проверяем, первая ли это загрузка диалога
      const isFirstLoad = !initialScrollApplied[activeContactId];
      
      if (isFirstLoad) {
        // Устанавливаем флаг, что начальная прокрутка была выполнена
        setInitialScrollApplied(prev => ({ ...prev, [activeContactId]: true }));
      }
      
      // Немедленная прокрутка
      scrollToBottom();
      
      // Ограниченное количество повторных попыток прокрутки с увеличивающимися интервалами
      // Используем меньше таймеров для снижения нагрузки
      const intervals = isFirstLoad 
        ? [50, 200, 500] // Больше попыток при первой загрузке
        : [100, 300];    // Меньше попыток при обновлении
      
      const timerIds = intervals.map(delay => 
        setTimeout(() => scrollToBottom(), delay)
      );
      
      return () => timerIds.forEach(id => clearTimeout(id));
    }
  }, [activeContactId, conversationMessages, initialScrollApplied]);
  
  // Handle send on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Отображение прикрепленных файлов
  const renderAttachmentPreviews = () => {
    return attachmentPreviews.map((item, index) => (
      <div key={index} className="flex items-center mr-2 bg-gray-100 dark:bg-gray-700 rounded p-1">
        {item.preview ? (
          <img 
            src={item.preview} 
            alt={`Preview ${index}`} 
            className="h-10 w-10 rounded object-cover" 
          />
        ) : (
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
            {item.file.type.includes('pdf') ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            )}
          </div>
        )}
        <div className="mx-2 text-xs truncate max-w-[100px]">
          {item.file.name}
        </div>
        <button
          type="button"
          onClick={() => handleRemoveAttachment(item.file)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    ));
  };

  // If user is not logged in, show message to login
  if (!user) {
    return (
      <div className="flex flex-col h-screen">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden pb-4">
        <div className="h-full flex flex-col max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Messages</h1>
          
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Contacts sidebar */}
              <div className="border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    className="bg-gray-50 dark:bg-gray-700 dark:placeholder-gray-400"
                  />
                </div>
                
                <ScrollArea className="flex-1">
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
                                    // Тихая обработка ошибки без логирования
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
                                  {contact.lastMessageAttachmentType === 'image' && !contact.lastMessage ? 
                                    "Изображение" : 
                                    contact.lastMessageAttachmentType === 'pdf' && !contact.lastMessage ? 
                                    "PDF файл" :
                                    contact.lastMessageAttachmentType && !contact.lastMessage ?
                                    "Файл" :
                                    contact.lastMessage?.replace(/Прикрепленный файл:.*$/, '') || ''
                                  }
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
                            // Тихая обработка ошибки без логирования
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
                    
                    {/* Messages container with flex to fill available space */}
                    <div className="flex flex-col flex-1">
                      {/* Messages list with scrolling - добавлен контейнер для drag-and-drop */}
                      <ScrollArea className="h-[calc(100vh-280px)] p-4 messages-scroll-area">
                        <DragDropFileUpload 
                          onFilesSelected={handleFilesSelected}
                          multiple={true}
                          disabled={attachmentLoading}
                          className="min-h-full w-full"
                          clickToUpload={false}
                        >
                          {messagesLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : !conversationMessages || conversationMessages.length === 0 ? (
                            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                              Сообщений пока нет. Начните диалог!<br/>
                              <span className="text-sm mt-2 block">Вы можете перетащить файлы сюда для загрузки</span>
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
                                  className={`group max-w-[75%] rounded-2xl px-4 py-2 ${
                                    message.senderId === user?.id
                                      ? "bg-primary text-white rounded-tr-sm"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"
                                  }`}
                                >
                                  {/* Если это ответ на другое сообщение, показываем цитату */}
                                  {/* Цитата */}
                                  {message.replyToId && (
                                    <div 
                                      className={`text-xs border-l-2 pl-2 mb-2 ${
                                        message.senderId === user?.id
                                          ? "border-blue-300 text-blue-100"
                                          : "border-gray-400 text-gray-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {/* Находим сообщение, на которое отвечаем */}
                                      {conversationMessages.find((msg: any) => msg.id === message.replyToId)?.content || "Исходное сообщение удалено"}
                                    </div>
                                  )}
                                  
                                  {/* Отображение прикрепленного файла */}
                                  {message.attachment && (
                                    <div className="mt-2">
                                      {message.attachmentType === 'image' ? (
                                        <div className="cursor-pointer" onClick={() => {
                                          setCurrentImageUrl(message.attachment);
                                          setIsImageModalOpen(true);
                                        }}>
                                          <img 
                                            src={message.attachment} 
                                            alt="Прикрепленное изображение" 
                                            className="max-w-full max-h-[200px] rounded-md hover:opacity-90 transition-opacity"
                                            onError={(e) => {
                                              // Тихая обработка ошибки без логирования
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        </div>
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

                                        </a>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Обновленное отображение сообщения - текст идет в одной строке с временем */}
                                  <div className="flex flex-wrap items-end gap-1 justify-between">
                                    {/* Основной контент сообщения */}
                                    <div className="flex-1">
                                      {/* Кнопка ответа - теперь показывается над сообщением */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyToMessage({
                                            id: message.id,
                                            content: message.content || '',
                                            senderId: message.senderId,
                                            senderName: contacts?.find((c: any) => c.id === message.senderId)?.fullName || 'Пользователь'
                                          });
                                        }}
                                        className={`text-xs opacity-0 group-hover:opacity-100 hover:underline transition-opacity block mb-1 ${
                                          message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                        }`}
                                      >
                                        Ответить
                                      </button>
                                      
                                      {/* Добавляем содержимое сообщения */}
                                      <div className="break-words">
                                        {linkifyText(
                                          message.content?.replace(/Прикрепленный файл:.*$/, '') || '',
                                          message.senderId === user?.id // Передаем true, если это наше сообщение
                                        )}
                                      </div>
                                    </div>

                                    {/* Время отправки - теперь сбоку текста */}
                                    <div className={`text-xs flex items-center self-end ml-2 ${
                                      message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                      {formatMessageTime(new Date(message.createdAt))}
                                      {message.senderId === user?.id && (
                                        <span className="inline-flex items-center">
                                          {message.read ? (
                                            <span className="ml-1 text-xs" style={{ letterSpacing: "-0.25em" }}>✓✓</span>
                                          ) : (
                                            <span className="ml-1 text-xs">✓</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                        </DragDropFileUpload>
                      </ScrollArea>
                      
                      {/* Message input - немного приподнимаем от низа */}
                      <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto sticky bottom-0">
                        {/* Показываем информацию о сообщении, на которое отвечаем */}
                        {replyToMessage && (
                          <div className="mb-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border-l-2 border-primary flex items-center justify-between">
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Ответ для {replyToMessage.senderName === user?.fullName ? "себя" : replyToMessage.senderName}
                              </p>
                              <p className="text-sm truncate text-gray-700 dark:text-gray-300">
                                {replyToMessage.content?.slice(0, 50)}
                                {replyToMessage.content?.length > 50 ? "..." : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReplyToMessage(null)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Предпросмотр прикрепленных файлов */}
                        {attachmentPreviews.length > 0 && (
                          <div className="mb-2 p-2 rounded-md bg-gray-100 dark:bg-gray-700 flex flex-wrap items-center">
                            {renderAttachmentPreviews()}
                          </div>
                        )}
                        
                        <div className="flex">
                          {/* Скрытый input для файлов (для обратной совместимости) */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            multiple
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
                          
                          {/* Поле ввода сообщения без drag-and-drop */}
                          <div className="flex-1 mr-2">
                            <Input
                              type="text"
                              placeholder="Type your message..."
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="w-full h-full"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={sendMessage}
                            disabled={(!messageText.trim() && attachmentFiles.length === 0) || attachmentLoading}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Модальное окно для просмотра изображений */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] p-0 overflow-hidden">
          {/* Удалили заголовок и кнопку закрытия по умолчанию */}
          <div className="relative">
            {currentImageUrl && (
              <div className="flex justify-center items-center bg-black/50 backdrop-blur-sm">
                <img 
                  src={currentImageUrl} 
                  alt="Просмотр изображения" 
                  className="max-w-full max-h-[80vh] object-contain"
                  onError={() => {
                    toast({
                      title: "Ошибка загрузки",
                      description: "Не удалось загрузить изображение",
                      variant: "destructive",
                    });
                    setIsImageModalOpen(false);
                  }}
                />
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}