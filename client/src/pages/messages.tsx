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
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages");
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
      
      return contactsList;
    },
    enabled: !!user && !!userMessages,
  });
  
  // Получаем сообщения для текущего диалога
  const {
    data: conversationMessages,
    isLoading: messagesLoading,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: [`/api/messages?userId=${activeContactId}`],
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
  
  // Отправка сообщения
  const sendMessage = async () => {
    if (!messageText.trim() || !activeContactId) return;
    
    try {
      // Реальный API запрос
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: activeContactId,
          content: messageText.trim(),
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Неизвестная ошибка" }));
        throw new Error(errorData.message || "Failed to send message");
      }
      
      // Очищаем поле ввода и обновляем данные
      setMessageText("");
      
      // Немедленно запрашиваем обновленные данные
      await Promise.all([
        refetchMessages(),
        refetchConversation()
      ]);
      
      // Прокручиваем в конец списка сообщений
      scrollToBottom();
      
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
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);
  
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
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to access Messages</h1>
            <p className="text-gray-600 mb-6">
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
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Contacts sidebar */}
              <div className="border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    className="bg-gray-50"
                  />
                </div>
                
                <ScrollArea className="h-[540px]">
                  {contactsLoading || messagesDataLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : contacts && contacts.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      У вас пока нет сообщений
                    </div>
                  ) : (
                    <div>
                      {contacts && contacts.map((contact: any) => (
                        <div key={contact.id}>
                          <button
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                              activeContactId === contact.id ? "bg-blue-50" : ""
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
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {contact.fullName}
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    {formatConversationTime(contact.lastMessageTime)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
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
                          <Separator />
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Messages area */}
              <div className="col-span-2 flex flex-col">
                {!activeContactId ? (
                  <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
                    Select a conversation to start messaging
                  </div>
                ) : (
                  <>
                    {/* Conversation header */}
                    <div className="p-4 border-b border-gray-200 flex items-center">
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
                        <h3 className="text-sm font-medium text-gray-900">
                          {contacts?.find((c: any) => c.id === activeContactId)?.fullName || "Контакт"}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 h-[436px]">
                      {messagesLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : !conversationMessages || conversationMessages.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">
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
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                <div
                                  className={`text-xs mt-1 ${
                                    message.senderId === user?.id ? "text-blue-100" : "text-gray-500"
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
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex">
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
                          disabled={!messageText.trim()}
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
