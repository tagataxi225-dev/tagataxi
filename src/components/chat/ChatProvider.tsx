import React, { createContext, useContext, useState } from 'react';
import { UniversalChatInterface } from './UniversalChatInterface';

interface ChatContextType {
  openChat: (options: {
    contextType?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
    contextId?: string;
    participantId?: string;
    title?: string;
    quickActions?: { label: string; action: () => void; icon?: any }[];
  }) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOptions, setChatOptions] = useState<{
    contextType?: 'transport' | 'delivery' | 'marketplace' | 'rental' | 'support';
    contextId?: string;
    participantId?: string;
    title?: string;
    quickActions?: { label: string; action: () => void; icon?: any }[];
  }>({});

  const openChat = (options: typeof chatOptions) => {
    setChatOptions(options);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setChatOptions({});
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      {isOpen && (
        <UniversalChatInterface
          isFloating={true}
          onClose={closeChat}
          {...chatOptions}
        />
      )}
    </ChatContext.Provider>
  );
};