import React from 'react';
import styles from './ChatHistory.module.css';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  model: string;
  baseModel: string;
}

interface ChatHistoryProps {
  histories: ChatHistoryItem[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  histories,
  selectedChatId,
  onSelectChat,
  onNewChat,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Chat History</h2>
        <button onClick={onNewChat} className={styles.newChatButton}>
          New Chat
        </button>
      </div>
      <div className={styles.historyList}>
        {histories.map((chat) => (
          <div
            key={chat.id}
            className={`${styles.historyItem} ${
              selectedChatId === chat.id ? styles.selected : ''
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className={styles.chatInfo}>
              <div className={styles.title}>{chat.title}</div>
              <div className={styles.modelInfo}>
                <span className={styles.modelName}>{chat.model}</span>
                {chat.baseModel && chat.baseModel !== chat.model && (
                  <span className={styles.baseModel}>({chat.baseModel})</span>
                )}
              </div>
              <div className={styles.lastMessage}>{chat.lastMessage}</div>
            </div>
            <div className={styles.timestamp}>
              {new Date(chat.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory; 