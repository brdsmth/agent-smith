import React, { useState, useRef, useEffect } from 'react';
import { Send as SendIcon, Edit as EditIcon, Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import ChatHistory from './ChatHistory';
import ModelCreator from './ModelCreator';
import ModelPromptEditor from './ModelPromptEditor';
import styles from './Chat.module.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Chat {
  id: string;
  messages: Message[];
  title: string;
  lastMessage: string;
  timestamp: Date;
  model: string;
  baseModel: string;
}

interface Model {
  model_id: string;
  name: string;
  description: string;
  context_window: number;
  max_tokens: number;
  temperature: number;
  base_model: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showModelCreator, setShowModelCreator] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/models`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        console.log('Fetched models:', data);
        console.log('First model details:', data.data[0]);
        setAvailableModels(data.data);
        if (data.data.length > 0) {
          setSelectedModel(data.data[0].model_id);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  useEffect(() => {
    if (chats.length === 0 && availableModels.length > 0) {
      // Default to Mistral model
      const defaultModel = availableModels.find(m => m.model_id === 'mistral') || availableModels[0];
      setSelectedModel(defaultModel.model_id);
      
      const newChat: Chat = {
        id: Date.now().toString(),
        messages: [],
        title: 'New Chat',
        lastMessage: '',
        timestamp: new Date(),
        model: defaultModel.model_id,
        baseModel: defaultModel.base_model || defaultModel.name,
      };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    } else if (!currentChatId && chats.length > 0) {
      const mostRecentChat = chats.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      setCurrentChatId(mostRecentChat.id);
      setSelectedModel(mostRecentChat.model);
    }
  }, [chats.length, currentChatId, availableModels]);

  const handleTitleEdit = () => {
    if (!currentChatId) return;
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (currentChat) {
      setEditingTitle(currentChat.title);
      setIsEditingTitle(true);
      // Focus the input after it's rendered
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const handleTitleSave = () => {
    if (!currentChatId || !editingTitle.trim()) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          title: editingTitle.trim()
        };
      }
      return chat;
    }));
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
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
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...chats.find(chat => chat.id === currentChatId)?.messages || [],
            { role: 'user', content: userMessage }
          ],
          model: selectedModel,
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

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Update the current chat's model if one is selected
    if (currentChatId) {
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            model: newModel
          };
        }
        return chat;
      }));
    }
  };

  const handleModelCreated = async () => {
    setShowModelCreator(false);
    // Refresh the models list
    try {
      const response = await fetch(`${API_URL}/v1/models`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      setAvailableModels(data.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handlePromptChange = (newPrompt: string) => {
    // Optionally handle the prompt change, e.g., refresh the chat or update UI
    console.log('Prompt updated:', newPrompt);
  };

  const createNewChat = () => {
    const selectedModelInfo = availableModels.find(m => m.model_id === selectedModel);
    console.log('Creating new chat with model:', selectedModelInfo);
    const newChat: Chat = {
      id: Date.now().toString(),
      messages: [],
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      model: selectedModel,
      baseModel: selectedModelInfo?.base_model || selectedModelInfo?.name || 'Unknown',
    };
    console.log('New chat object:', newChat);
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
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
            model: chat.model,
            baseModel: chat.baseModel,
          }))}
          selectedChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={createNewChat}
        />
        <div className={styles.chatContainer}>
          <div className={styles.header}>
            {isEditingTitle ? (
              <div className={styles.titleEditContainer}>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleSave}
                  className={styles.titleInput}
                  placeholder="Enter chat title..."
                />
              </div>
            ) : (
              <div className={styles.titleContainer} onClick={handleTitleEdit}>
                {currentChat?.title || 'New Chat'}
                <EditIcon className={styles.editIcon} />
              </div>
            )}
            <div className={styles.modelSelector}>
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className={styles.modelSelect}
                disabled={isLoading}
              >
                {availableModels.map(model => (
                  <option key={model.model_id} value={model.model_id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <button
                className={styles.modelButton}
                onClick={() => setShowPromptEditor(true)}
                title="Edit Model Prompt"
              >
                <SettingsIcon />
              </button>
              <button
                className={styles.modelButton}
                onClick={() => setShowModelCreator(true)}
                title="Create New Model"
              >
                <AddIcon />
              </button>
            </div>
          </div>

          <ModelCreator
            availableModels={availableModels}
            onModelCreated={handleModelCreated}
            isOpen={showModelCreator}
            onClose={() => setShowModelCreator(false)}
          />

          <ModelPromptEditor
            modelId={selectedModel}
            onPromptChange={handlePromptChange}
            isOpen={showPromptEditor}
            onClose={() => setShowPromptEditor(false)}
          />

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