import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Chat.module.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const LoadingDots = () => (
  <div className={styles.loadingDots}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const MessageList: React.FC<MessageListProps> = React.memo(({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <div className={styles.messagesContainer} />;
  }

  return (
    <div className={styles.messagesContainer}>
      {messages.filter(msg => msg.role !== 'system').map((message, index) => (
        <div
          key={index}
          className={`${styles.message} ${
            message.role === 'user' ? styles.userMessage : styles.assistantMessage
          }`}
        >
          <div className={styles.messageContent}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <LoadingDots />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList; 