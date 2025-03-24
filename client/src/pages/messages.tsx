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
  
  // Fetch user's contacts - in a real implementation, this would be an API call
  // to get users the current user has messaged with
  const {
    data: contacts,
    isLoading: contactsLoading,
  } = useQuery({
    queryKey: ["/api/messages/contacts"],
    enabled: false, // Disabled since we don't have this endpoint
  });
  
  // Mock contacts data
  const mockContacts = [
    {
      id: 101,
      fullName: "Alex Johnson",
      avatar: null,
      lastMessage: "Thanks for your interest in my project!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      unread: 2,
    },
    {
      id: 102,
      fullName: "Maya Rodriguez",
      avatar: null,
      lastMessage: "When can you start working on this?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unread: 0,
    },
    {
      id: 103,
      fullName: "Kai Zhang",
      avatar: null,
      lastMessage: "I'll send you the project details soon",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unread: 0,
    },
  ];
  
  // Fetch messages for the current conversation
  const {
    data: messages,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: [`/api/messages?userId=${activeContactId}`],
    enabled: !!activeContactId && !!user,
  });
  
  // Mock messages data
  const mockMessages = activeContactId ? [
    {
      id: 1,
      senderId: user?.id || 1,
      receiverId: activeContactId,
      content: "Hi there! I'm interested in your project.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
    },
    {
      id: 2,
      senderId: activeContactId,
      receiverId: user?.id || 1,
      content: "Thanks for reaching out! What specific aspects of the project interest you?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      read: true,
    },
    {
      id: 3,
      senderId: user?.id || 1,
      receiverId: activeContactId,
      content: "I'm particularly interested in the UI/UX part of the project. I have experience in Figma and Adobe XD.",
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
      read: true,
    },
    {
      id: 4,
      senderId: activeContactId,
      receiverId: user?.id || 1,
      content: "That's great! We're definitely looking for someone with those skills. Can you tell me a bit more about your previous experience?",
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      read: true,
    },
  ] : [];
  
  // Send message mutation
  const sendMessage = async () => {
    if (!messageText.trim() || !activeContactId) return;
    
    try {
      // In a real implementation, this would be an API call
      // await apiRequest("POST", "/api/messages", {
      //   receiverId: activeContactId,
      //   content: messageText,
      // });
      
      // For now, we'll just add the message to our mock data
      mockMessages.push({
        id: Math.random(),
        senderId: user?.id || 1,
        receiverId: activeContactId,
        content: messageText,
        createdAt: new Date(),
        read: false,
      });
      
      // Clear the input
      setMessageText("");
      
      // Scroll to bottom
      scrollToBottom();
      
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
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
  }, [mockMessages]);
  
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
                  {contactsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : mockContacts.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      No conversations yet
                    </div>
                  ) : (
                    <div>
                      {mockContacts.map((contact) => (
                        <div key={contact.id}>
                          <button
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                              activeContactId === contact.id ? "bg-blue-50" : ""
                            }`}
                            onClick={() => setActiveContactId(contact.id)}
                          >
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={contact.avatar || undefined} alt={contact.fullName} />
                                <AvatarFallback>
                                  {contact.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                          src={mockContacts.find(c => c.id === activeContactId)?.avatar || undefined}
                          alt={mockContacts.find(c => c.id === activeContactId)?.fullName || "Contact"}
                        />
                        <AvatarFallback>
                          {mockContacts.find(c => c.id === activeContactId)?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {mockContacts.find(c => c.id === activeContactId)?.fullName || "Contact"}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 h-[436px]">
                      {messagesLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : mockMessages.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mockMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderId === user.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                  message.senderId === user.id
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                <div
                                  className={`text-xs mt-1 ${
                                    message.senderId === user.id ? "text-blue-100" : "text-gray-500"
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
