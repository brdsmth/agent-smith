import React, { useState, useRef, useEffect } from 'react';
import { Send as SendIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import ChatHistory, { ChatHistoryItem } from './ChatHistory';
import styles from './Chat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  messages: Message[];
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      messages: [],
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentChatId) return;

    const userMessage = input.trim();
    setInput('');

    // Update chat with new message
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { role: 'user', content: userMessage }],
          lastMessage: userMessage,
          timestamp: new Date(),
        };
      }
      return chat;
    }));

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...chats.find(chat => chat.id === currentChatId)?.messages || [],
            { role: 'user', content: userMessage }
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Update chat with assistant's response
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { role: 'assistant', content: assistantMessage }],
            lastMessage: assistantMessage,
            timestamp: new Date(),
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('Error:', error);
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, { 
              role: 'assistant', 
              content: 'Sorry, I encountered an error. Please try again.' 
            }],
            lastMessage: 'Error occurred',
            timestamp: new Date(),
          };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <ChatHistory
          histories={chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            lastMessage: chat.lastMessage,
            timestamp: chat.timestamp,
          }))}
          selectedChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={createNewChat}
        />
        <div className={styles.chatContainer}>
          <div className={styles.header}>
            <svg className={styles.headerIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
            </svg>
            {currentChat?.title || 'New Chat'}
          </div>
          <div className={styles.messagesContainer}>
            {currentChat?.messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.messageUser : styles.messageAssistant
                }`}
              >
                <div className={styles.messageContent}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDot}></div>
                <div className={styles.loadingDot}></div>
                <div className={styles.loadingDot}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className={styles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading || !currentChatId}
              className={styles.input}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !currentChatId}
              className={styles.sendButton}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat; 