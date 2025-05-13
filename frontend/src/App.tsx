import React, { useState, useCallback } from 'react';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import ChatPromptEditor from './components/ChatPromptEditor';
import styles from './App.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatType {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  systemPrompt?: string;
}

const App: React.FC = () => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userName, _setUserName] = useState('Smith');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatPromptOpen, setIsChatPromptOpen] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState(
    'You are a helpful AI assistant. Answer as concisely as possible.'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with a new chat if none exists
  React.useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  const createNewChat = () => {
    const newChat: ChatType = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId);
  };

  const updateChat = (updatedChat: ChatType) => {
    setChats(prev => prev.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ));
  };

  const updateChatTitle = (chat: ChatType, messages: Message[]) => {
    if (messages.length === 1) {
      const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      updateChat({ ...chat, title });
    }
  };

  const handleSaveGlobalPrompt = async (prompt: string) => {
    setGlobalPrompt(prompt);
    // You might want to save this to localStorage or your backend
  };

  const handleSaveChatPrompt = async (chatId: string, prompt: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      updateChat({
        ...chat,
        systemPrompt: prompt,
      });
    }
  };

  const getCurrentPrompt = () => {
    const currentChat = getCurrentChat();
    const combinedSystemPrompt = currentChat?.systemPrompt
      ? `${globalPrompt}\n\nChat-specific instructions:\n${currentChat.systemPrompt}`
      : globalPrompt;
    return combinedSystemPrompt;
  };

  const validatePrompt = (prompt: string) => {
    const MAX_PROMPT_LENGTH = 4096; // Adjust based on your model's limits
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    }
    return prompt.trim();
  };

  const handleSubmit = useCallback(async (content: string) => {
    const currentChat = getCurrentChat();
    if (!currentChat) return;

    const userMessage: Message = { role: 'user', content };
    const updatedMessages = [...currentChat.messages, userMessage];
    
    updateChatTitle(currentChat, updatedMessages);
    updateChat({
      ...currentChat,
      messages: updatedMessages,
      timestamp: new Date(),
    });
    
    setIsLoading(true);

    try {
      // Separate system messages for better context management
      const systemMessages = [
        { role: 'system', content: validatePrompt(globalPrompt) },
        ...(currentChat.systemPrompt ? [{ role: 'system', content: validatePrompt(currentChat.systemPrompt) }] : [])
      ];

      const response = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...systemMessages,
            ...updatedMessages
          ],
          model: 'mistral',
          temperature: 0.7,
          max_tokens: 2048
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      const assistantMessage: Message = data.choices[0].message;
      updateChat({
        ...currentChat,
        messages: [...updatedMessages, assistantMessage],
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Prompt validation error:', error);
      updateChat({
        ...currentChat,
        messages: [...updatedMessages, {
          role: 'assistant',
          content: 'Error: The prompt is too long or contains invalid content. Please try a shorter prompt.'
        }],
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentChat, globalPrompt, updateChat, setIsLoading]);

  return (
    <div className={`${styles.layout} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        userName={userName}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className={styles.main}>
        <Chat
          currentChat={getCurrentChat()}
          onEditChatPrompt={() => setIsChatPromptOpen(true)}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        globalPrompt={globalPrompt}
        onSaveGlobalPrompt={handleSaveGlobalPrompt}
      />

      {currentChatId && (
        <ChatPromptEditor
          isOpen={isChatPromptOpen}
          onClose={() => setIsChatPromptOpen(false)}
          chatId={currentChatId}
          currentPrompt={getCurrentPrompt()}
          onSavePrompt={handleSaveChatPrompt}
        />
      )}
    </div>
  );
};

export default App; 