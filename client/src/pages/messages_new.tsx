import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, X, Reply } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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
  
  // Добавляем состояние для подсвечивания оригинального сообщения
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  
  // Реф объекты для каждого сообщения, чтобы можно было прокрутить к ним
  const messageRefs = useRef<{[key: number]: HTMLDivElement}>({});
  
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
  
  // Состояние для прикрепленных файлов
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState<{file: File, preview: string | null}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // Удаляем ID текущего пользователя, если он есть в списке
      contactIdsSet.delete(user?.id || 0);
      
      // Получаем данные о каждом контакте
      const contactPromises = Array.from(contactIdsSet).map(async (contactId) => {
        const res = await fetch(`/api/users/${contactId}`);
        if (!res.ok) return null;
        return res.json();
      });
      
      const contactsData = await Promise.all(contactPromises);
      return contactsData.filter(Boolean);
    },
    enabled: !!userMessages && !!user,
    staleTime: 30000, // Кешируем данные о контактах на 30 секунд
  });
  
  // Mutation для отправки сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      receiverId: number, 
      content: string, 
      attachment?: File,
      replyToId?: number
    }) => {
      let attachmentPath = undefined;
      let attachmentType = undefined;
      
      // Если есть прикрепленный файл, загружаем его
      if (data.attachment) {
        try {
          setAttachmentLoading(true);
          
          const formData = new FormData();
          formData.append("file", data.attachment);
          
          const uploadRes = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
          });
          
          if (!uploadRes.ok) {
            throw new Error("Failed to upload attachment");
          }
          
          const uploadData = await uploadRes.json();
          attachmentPath = uploadData.path;
          
          // Определяем тип прикрепленного файла
          const fileType = data.attachment.type;
          if (fileType.startsWith("image/")) {
            attachmentType = "image";
          } else if (fileType === "application/pdf") {
            attachmentType = "pdf";
          } else if (
            fileType === "application/msword" || 
            fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            fileType === "application/vnd.oasis.opendocument.text"
          ) {
            attachmentType = "document";
          } else {
            attachmentType = "file";
          }
        } catch (error) {
          console.error("Error uploading attachment:", error);
          throw new Error("Failed to upload attachment");
        } finally {
          setAttachmentLoading(false);
        }
      }
      
      // Отправляем сообщение с прикрепленным файлом (если есть)
      const res = await apiRequest("POST", "/api/messages", { 
        receiverId: data.receiverId, 
        content: data.content,
        attachment: attachmentPath,
        attachmentType,
        replyToId: data.replyToId
      });
      
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      setAttachmentFiles([]);
      setAttachmentPreviews([]);
      setReplyToMessage(null);
      
      // Обновляем список сообщений
      refetchMessages();
      
      // Прокручиваем к концу списка сообщений
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка при отправке сообщения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation для отметки сообщения как прочитанного
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("POST", `/api/messages/${messageId}/read`, {});
      if (!res.ok) {
        throw new Error("Failed to mark message as read");
      }
      return res.json();
    },
    onSuccess: () => {
      // Обновляем список сообщений
      refetchMessages();
    },
    onError: (error: any) => {
      // При ошибке отметки сообщения как прочитанного - просто логируем, но не показываем пользователю
      console.error("Error marking message as read:", error);
    },
  });

  // Прокрутка к концу списка сообщений
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Прокрутка к конкретному сообщению с подсветкой
  const scrollToMessage = (messageId: number) => {
    const messageRef = messageRefs.current[messageId];
    if (messageRef) {
      // Устанавливаем ID для подсветки сообщения
      setHighlightedMessageId(messageId);
      
      // Прокручиваем к сообщению, но более плавно и предсказуемо
      setTimeout(() => {
        messageRef.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
        
        // Убираем подсветку через 2 секунды
        setTimeout(() => {
          setHighlightedMessageId(null);
        }, 2000);
      }, 100); // Небольшая задержка для более стабильной прокрутки
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if ((!messageText.trim() && attachmentFiles.length === 0) || !activeContactId) return;
    
    try {
      // Если есть прикрепленные файлы, отправляем их по одному
      if (attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          await sendMessageMutation.mutateAsync({
            receiverId: activeContactId,
            content: messageText || `Прикрепленный файл: ${file.name}`,
            attachment: file,
            replyToId: replyToMessage?.id
          });
        }
      } else {
        // Если нет прикрепленных файлов, отправляем только текст
        await sendMessageMutation.mutateAsync({
          receiverId: activeContactId,
          content: messageText,
          replyToId: replyToMessage?.id
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Ошибка при отправке сообщения",
        description: "Попробуйте еще раз",
        variant: "destructive",
      });
    }
  };

  // Обработчик нажатия Enter для отправки сообщения
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Функция для выделения и стилизации ссылок в тексте сообщения
  const linkifyText = (text: string, isOwnMessage: boolean) => {
    if (!text) return null;
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`underline ${isOwnMessage ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Обработчик клика на кнопку прикрепления файлов
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Обработчик изменения выбранных файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Добавляем новые файлы к существующим
      setAttachmentFiles(prev => [...prev, ...newFiles]);
      
      // Создаем превью для каждого файла
      const newPreviews = newFiles.map(file => {
        let preview: string | null = null;
        
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }
        
        return { file, preview };
      });
      
      setAttachmentPreviews(prev => [...prev, ...newPreviews]);
      
      // Сбрасываем значение input, чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    }
  };

  // Обработчик удаления прикрепленного файла
  const handleRemoveAttachment = (file: File) => {
    setAttachmentFiles(prev => prev.filter(f => f !== file));
    setAttachmentPreviews(prev => {
      // Очищаем URL объекты, чтобы избежать утечек памяти
      const itemToRemove = prev.find(item => item.file === file);
      if (itemToRemove && itemToRemove.preview) {
        URL.revokeObjectURL(itemToRemove.preview);
      }
      return prev.filter(item => item.file !== file);
    });
  };

  // Функция для отображения превью прикрепленных файлов
  const renderAttachmentPreviews = () => {
    return attachmentPreviews.map((item, index) => (
      <div key={index} className="relative mr-2 mb-2">
        {item.preview ? (
          <div className="group relative">
            <img 
              src={item.preview} 
              alt={item.file.name} 
              className="h-16 w-auto rounded border border-gray-300 dark:border-gray-600"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemoveAttachment(item.file)}
                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative h-16 px-3 flex items-center rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <span className="text-xs truncate max-w-[100px]">{item.file.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveAttachment(item.file)}
              className="ml-2 opacity-50 group-hover:opacity-100 text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    ));
  };

  // Обработчик перетаскивания файлов
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setAttachmentFiles(prev => [...prev, ...newFiles]);
      
      // Создаем превью для каждого файла
      const newPreviews = newFiles.map(file => {
        let preview: string | null = null;
        
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }
        
        return { file, preview };
      });
      
      setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Отмечаем непрочитанные сообщения как прочитанные при активации контакта
  useEffect(() => {
    if (activeContactId && userMessages && userMessages.length > 0) {
      // Находим все непрочитанные сообщения от активного контакта
      const unreadMessages = userMessages.filter((message: any) => 
        message.senderId === activeContactId && 
        message.receiverId === user?.id && 
        !message.read
      );
      
      // Отмечаем каждое сообщение как прочитанное
      unreadMessages.forEach((message: any) => {
        markAsReadMutation.mutate(message.id);
      });
    }
  }, [activeContactId, userMessages, user?.id]);

  // Прокручиваем к концу списка сообщений при загрузке и при изменении активного контакта
  useEffect(() => {
    if (!messagesDataLoading && activeContactId) {
      scrollToBottom();
    }
  }, [messagesDataLoading, activeContactId]);

  // Получаем сообщения для текущего активного контакта
  const conversationMessages = userMessages && activeContactId
    ? userMessages.filter((message: any) => 
        (message.senderId === user?.id && message.receiverId === activeContactId) ||
        (message.senderId === activeContactId && message.receiverId === user?.id)
      ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Получаем данные об активном контакте
  const activeContact = contacts && activeContactId
    ? contacts.find((contact: any) => contact.id === activeContactId)
    : null;

  // Функции форматирования времени
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return formatMessageTime(date);
    } else if (days === 1) {
      return "Вчера";
    } else if (days < 7) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
      return date.toLocaleDateString(undefined, options);
    } else {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return date.toLocaleDateString(undefined, options);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 container max-w-screen-xl mx-auto my-4 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-[300px_1fr] h-[calc(100vh-12rem)] border dark:border-gray-700 rounded-lg">
            {/* Sidebar - список контактов */}
            <div className="border-r dark:border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b dark:border-gray-700">
                <div className="text-lg font-semibold">Сообщения</div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                {contactsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : contacts && contacts.length > 0 ? (
                  <div>
                    {contacts.map((contact: any) => {
                      // Находим последнее сообщение в переписке
                      const lastMessage = userMessages
                        ? userMessages
                            .filter((m: any) => 
                              (m.senderId === user?.id && m.receiverId === contact.id) ||
                              (m.senderId === contact.id && m.receiverId === user?.id)
                            )
                            .sort((a: any, b: any) => 
                              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            )[0]
                        : null;
                      
                      // Считаем количество непрочитанных сообщений
                      const unreadCount = userMessages
                        ? userMessages.filter((m: any) => 
                            m.senderId === contact.id && 
                            m.receiverId === user?.id && 
                            !m.read
                          ).length
                        : 0;
                      
                      return (
                        <div
                          key={contact.id}
                          className={`p-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            activeContactId === contact.id ? "bg-gray-100 dark:bg-gray-700" : ""
                          }`}
                          onClick={() => setActiveContactId(contact.id)}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            {contact.profilePicture ? (
                              <AvatarImage src={contact.profilePicture} alt={contact.fullName} />
                            ) : (
                              <AvatarFallback>
                                {contact.fullName?.charAt(0) || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <div className="font-medium truncate">{contact.fullName}</div>
                              {lastMessage && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatConversationTime(new Date(lastMessage.createdAt))}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {lastMessage ? (
                                  lastMessage.attachment ? (
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                      </svg>
                                      Вложение
                                    </span>
                                  ) : (
                                    lastMessage.content
                                  )
                                ) : "Нет сообщений"}
                              </div>
                              {unreadCount > 0 && (
                                <div className="ml-2 bg-primary text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                                  {unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    У вас пока нет сообщений
                  </div>
                )}
              </div>
            </div>
            
            {/* Main chat area */}
            <div className="flex flex-col h-full">
              {!activeContactId ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="text-xl font-medium mb-2">Выберите контакт</div>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Выберите чат из списка слева или найдите новый контакт
                  </p>
                </div>
              ) : (
                <>
                  {/* Заголовок чата */}
                  <div className="p-3 border-b dark:border-gray-700 flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      {activeContact?.profilePicture ? (
                        <AvatarImage src={activeContact.profilePicture} alt={activeContact.fullName} />
                      ) : (
                        <AvatarFallback>
                          {activeContact?.fullName?.charAt(0) || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="font-medium ml-1">{activeContact?.fullName}</div>
                  </div>
                  
                  {/* Область сообщений */}
                  <div 
                    className="flex-1 overflow-hidden flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                  >
                    <div className="flex-1 p-4 overflow-y-auto message-container">
                      {messagesDataLoading ? (
                        <div className="flex items-center justify-center h-full p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : conversationMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-64 text-gray-500 dark:text-gray-400">
                          Сообщений пока нет. Начните диалог!<br/>
                          <span className="text-sm mt-2 block">Вы можете перетащить файлы сюда для загрузки</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conversationMessages.map((message: any) => (
                            <div key={message.id}>
                              <ContextMenu>
                                <ContextMenuTrigger>
                                  <div
                                    ref={(el) => el && (messageRefs.current[message.id] = el)}
                                    className={`flex ${
                                      message.senderId === user?.id ? "justify-end" : "justify-start"
                                    } ${highlightedMessageId === message.id ? "animate-pulse bg-yellow-50 dark:bg-yellow-900/20 rounded-lg" : ""}`}
                                  >
                                    <div
                                      className={`group max-w-[75%] rounded-lg px-4 py-2 ${
                                        message.senderId === user?.id
                                          ? "bg-primary text-white"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                      }`}
                                    >
                                      {/* Если это ответ на другое сообщение, показываем цитату */}
                                      {message.replyToId && (
                                        <div 
                                          className={`text-xs border-l-2 pl-2 mb-2 cursor-pointer ${
                                            message.senderId === user?.id
                                              ? "border-blue-300 text-blue-100"
                                              : "border-gray-400 text-gray-500 dark:text-gray-400"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation(); // Останавливаем всплытие события
                                            scrollToMessage(message.replyToId);
                                          }}
                                        >
                                          {/* Находим сообщение, на которое отвечаем */}
                                          {conversationMessages.find((msg: any) => msg.id === message.replyToId)?.content || "Исходное сообщение удалено"}
                                        </div>
                                      )}
                                      
                                      <p className="break-words">
                                        {linkifyText(
                                          message.content?.replace(/Прикрепленный файл:.*$/, '') || '',
                                          message.senderId === user?.id // Передаем true, если это наше сообщение
                                        )}
                                      </p>
                                      
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
                                              {message.attachment.split('/').pop()}
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      
                                      <div
                                        className={`text-xs mt-1 ${
                                          message.senderId === user?.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 justify-end">
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
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem onClick={() => {
                                    setReplyToMessage({
                                      id: message.id,
                                      content: message.content,
                                      senderId: message.senderId,
                                      senderName: message.senderId === user?.id 
                                        ? user?.fullName || 'Вы'
                                        : activeContact?.fullName || 'Собеседник'
                                    });
                                  }}>
                                    <Reply className="mr-2 h-4 w-4" />
                                    <span>Ответить</span>
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                  
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
                      
                      {/* Поле ввода сообщения */}
                      <div className="flex-1 mr-2">
                        <Input
                          type="text"
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-10"
                        />
                      </div>
                      
                      {/* Кнопка отправки */}
                      <Button
                        type="button"
                        onClick={sendMessage}
                        size="icon"
                        disabled={(!messageText.trim() && attachmentFiles.length === 0) || !activeContactId || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal для полноразмерного просмотра изображений */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl w-auto p-0 bg-transparent border-none shadow-none">
          {currentImageUrl && (
            <img 
              src={currentImageUrl} 
              alt="Полный размер" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}