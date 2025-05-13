import React from 'react';
import styles from './Sidebar.module.css';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName?: string;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
  userName = 'User',
  onOpenSettings
}) => {
  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.greeting}>
        {!isCollapsed && <span>Hey {userName}</span>}
      </div>
      <div className={styles.sidebarHeader}>
        <button className={styles.newChatButton} onClick={onNewChat}>
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!isCollapsed && <span>New chat</span>}
        </button>
      </div>

      <div className={styles.chatList}>
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`${styles.chatButton} ${
              chat.id === currentChatId ? styles.active : ''
            }`}
            onClick={() => onSelectChat(chat.id)}
            title={isCollapsed ? chat.title : undefined}
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {!isCollapsed && <span className={styles.chatTitle}>{chat.title}</span>}
          </button>
        ))}
      </div>

      <div className={styles.sidebarFooter}>
        <button className={styles.footerButton} onClick={onOpenSettings}>
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Always visible collapse toggle button */}
      <button 
        className={`${styles.collapseButton} ${isCollapsed ? styles.collapsed : ''}`} 
        onClick={onToggleCollapse} 
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;