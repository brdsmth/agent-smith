import React from 'react';
import styles from './ChatHistory.module.css';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  histories: ChatHistoryItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
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
            <div className={styles.historyTitle}>{chat.title}</div>
            <div className={styles.historyPreview}>{chat.lastMessage}</div>
            <div className={styles.historyTimestamp}>
              {chat.timestamp.toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory; 