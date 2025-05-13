import React, { useState, useRef } from 'react';
import MessageList from './MessageList';
import styles from './Chat.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

interface ChatProps {
  currentChat: Chat | undefined;
  onEditChatPrompt: () => void;
  isLoading: boolean;
  onSubmit: (content: string) => Promise<void>;
}

const ChatInput: React.FC<{
  onSubmit: (content: string) => void;
  isLoading: boolean;
}> = React.memo(({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className={styles.textarea}
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={styles.sendButton}
          aria-label="Send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

const Chat: React.FC<ChatProps> = ({ 
  currentChat, 
  onEditChatPrompt, 
  isLoading,
  onSubmit
}) => {
  if (!currentChat) {
    return null;
  }

  return (
    <div className={styles.container}>
      {currentChat.id && (
        <button 
          onClick={onEditChatPrompt}
          className={styles.editPromptButton}
          aria-label="Edit chat prompt"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit Prompt</span>
        </button>
      )}
      <MessageList 
        messages={currentChat.messages}
        isLoading={isLoading}
      />
      <ChatInput 
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Chat; 